/**
 * Philidor — deterministic vault risk scoring. Keyless public REST.
 *   GET api.philidor.io/v1/vaults?chain=ethereum&protocol={id}&page&limit
 *   → { data: Vault[], meta: { page, limit, total, totalPages } }
 * Field realities (live-verified 2026-06-12): total_score arrives as a STRING
 * ("8.76"), tier field is risk_tier. Rate limit 30 req/60s — paced + capped.
 * We archive the top vaults by TVL; the full count is recorded verbatim.
 */
import { fetchJson, sleep } from "@/lib/fetch-util";
import type {
  FeedSnapshot,
  PhilidorDatum,
  PhilidorVault,
  ProtocolMeta,
} from "@/lib/types";

const BASE = "https://api.philidor.io/v1";
const PAGE_LIMIT = 50;
const MAX_PAGES = 3; // 150 vaults scanned per protocol — top 12 archived
const ARCHIVE_TOP = 12;

interface ApiVault {
  name?: string;
  address?: string;
  total_score?: string | number;
  risk_tier?: string;
  tvl_usd?: number;
  asset_symbol?: string;
  curator_name?: string | null;
  protocol_version?: string | null;
  last_synced_at?: string;
  is_active?: boolean;
  chain_name?: string;
}

interface VaultsResponse {
  data?: ApiVault[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

export async function fetchPhilidor(
  protocols: ProtocolMeta[],
): Promise<FeedSnapshot> {
  const fetched_at = new Date().toISOString();
  const data: FeedSnapshot["data"] = {};

  for (const proto of protocols) {
    const mapping = proto.feeds.philidor;
    if (!mapping) {
      data[proto.slug] = [];
      continue;
    }
    const collected: ApiVault[] = [];
    let total = 0;
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetchJson<VaultsResponse>(
        `${BASE}/vaults?chain=ethereum&protocol=${encodeURIComponent(mapping.protocol_id)}&limit=${PAGE_LIMIT}&page=${page}`,
      );
      collected.push(...(res.data ?? []));
      total = res.meta?.total ?? collected.length;
      if (!res.meta || page >= res.meta.totalPages) break;
      await sleep(2_200); // ≤30 req / 60s
    }
    await sleep(2_200);

    const vaults: PhilidorVault[] = collected
      .filter((v) => v.is_active !== false)
      .map((v) => ({
        name: String(v.name ?? "unnamed"),
        address: String(v.address ?? ""),
        total_score: Number.parseFloat(String(v.total_score ?? "NaN")),
        risk_tier: String(v.risk_tier ?? ""),
        tvl_usd: typeof v.tvl_usd === "number" ? v.tvl_usd : null,
        asset_symbol: v.asset_symbol ?? null,
        curator_name: v.curator_name ?? null,
        protocol_version: v.protocol_version ?? null,
        last_synced_at: v.last_synced_at ?? null,
      }))
      .filter((v) => Number.isFinite(v.total_score))
      .sort((a, b) => (b.tvl_usd ?? 0) - (a.tvl_usd ?? 0))
      .slice(0, ARCHIVE_TOP);

    const datum: PhilidorDatum = {
      feed_key: "philidor",
      protocol_id: mapping.protocol_id,
      vault_count_total: total,
      vaults,
      source_url: `${BASE}/vaults?chain=ethereum&protocol=${mapping.protocol_id}`,
      fetched_at,
      provenance: "feed",
    };
    data[proto.slug] = vaults.length > 0 ? [datum] : [];
  }

  return {
    feed_key: "philidor",
    fetched_at,
    source: BASE,
    ok: true,
    data,
  };
}
