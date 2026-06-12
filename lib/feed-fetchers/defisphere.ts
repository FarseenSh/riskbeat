/**
 * DeFi Sphere (Block Analitica) — quantitative lending-market risk.
 * Keyless REST with `Accept: application/json`. LENDING-MARKET-SCOPED:
 * non-lending protocols render not-applicable; lending protocols absent from
 * its market set are honest not-yet-covered.
 *
 * Live-verified shape (2026-06-12):
 *   GET sphere.data.blockanalitica.com/markets/?page=N
 *   → { data: { pagination: {page, limit, total, pages}, results: Market[] },
 *       status, success }
 *   Market: { protocol: "aave_v3_core"|…, network, name, pool_id,
 *             collateral_risk_score: "58.27…", liquidity_risk_score: "9.22…",
 *             total_supply_usd: "…", underlying_symbol, collateral_symbol }
 *   (scores arrive as strings — parsed, never re-scaled)
 */
import { fetchJson, sleep } from "@/lib/fetch-util";
import type {
  DefiSphereDatum,
  FeedSnapshot,
  ProtocolMeta,
  SphereMarket,
} from "@/lib/types";

const BASE = "https://sphere.data.blockanalitica.com/markets/";
const HEADERS = { Accept: "application/json" };
const MAX_PAGES = 30;
const ARCHIVE_TOP = 12;

interface ApiMarket {
  pool_id?: string;
  name?: string;
  protocol?: string;
  network?: string;
  underlying_symbol?: string | null;
  collateral_symbol?: string | null;
  collateral_risk_score?: string | number | null;
  liquidity_risk_score?: string | number | null;
  total_supply_usd?: string | number | null;
}

interface ApiPage {
  data?: { pagination?: { pages?: number }; results?: ApiMarket[] };
  success?: boolean;
}

const num = (v: string | number | null | undefined): number | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

export async function fetchDefisphere(
  protocols: ProtocolMeta[],
): Promise<FeedSnapshot> {
  const fetched_at = new Date().toISOString();

  const markets: ApiMarket[] = [];
  let pages = 1;
  for (let page = 1; page <= Math.min(pages, MAX_PAGES); page++) {
    const res = await fetchJson<ApiPage>(`${BASE}?page=${page}`, {
      headers: HEADERS,
    });
    pages = res.data?.pagination?.pages ?? 1;
    markets.push(...(res.data?.results ?? []));
    await sleep(250);
  }
  const ethereum = markets.filter(
    (m) => (m.network ?? "ethereum") === "ethereum",
  );

  const data: FeedSnapshot["data"] = {};
  for (const proto of protocols) {
    const prefixes = proto.feeds.defisphere?.sphere_protocols ?? [];
    if (prefixes.length === 0) {
      data[proto.slug] = [];
      continue;
    }
    const matched = ethereum.filter((m) => {
      const p = String(m.protocol ?? "");
      return prefixes.some((pre) => p === pre || p.startsWith(`${pre}_`));
    });
    if (matched.length === 0) {
      data[proto.slug] = [];
      continue;
    }
    const top: SphereMarket[] = matched
      .map((m) => ({
        pool_id: String(m.pool_id ?? ""),
        name: String(m.name ?? ""),
        sphere_protocol: String(m.protocol ?? ""),
        underlying_symbol: m.underlying_symbol ?? null,
        collateral_symbol: m.collateral_symbol ?? null,
        collateral_risk_score: num(m.collateral_risk_score),
        liquidity_risk_score: num(m.liquidity_risk_score),
        total_supply_usd: num(m.total_supply_usd),
      }))
      .sort((a, b) => (b.total_supply_usd ?? 0) - (a.total_supply_usd ?? 0))
      .slice(0, ARCHIVE_TOP);

    const datum: DefiSphereDatum = {
      feed_key: "defisphere",
      sphere_protocols: [...new Set(matched.map((m) => String(m.protocol)))],
      markets: top,
      market_count_total: matched.length,
      source_url: "https://sphere.blockanalitica.com",
      fetched_at,
      provenance: "feed",
    };
    data[proto.slug] = [datum];
  }

  return { feed_key: "defisphere", fetched_at, source: BASE, ok: true, data };
}
