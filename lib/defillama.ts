/**
 * DefiLlama live layer — Ethereum-chain TVL per protocol version, and
 * aggregator volume for volume_only protocols. Used two ways:
 *   · scripts/sync-defillama.ts archives a nightly snapshot (static fallback)
 *   · pages call it inside ISR regeneration for the live number, falling back
 *     to the snapshot with a [stale] badge when the live fetch fails
 */
import type { ProtocolMeta, TvlPoint } from "@/lib/types";

const PROTOCOLS_URL = "https://api.llama.fi/protocols";
const AGG_OVERVIEW_URL =
  "https://api.llama.fi/overview/aggregators/ethereum?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true";

interface LlamaProtocol {
  slug?: string;
  chainTvls?: Record<string, number>;
}

interface AggOverviewProtocol {
  name?: string;
  total24h?: number | null;
  total30d?: number | null;
}

export interface TvlSyncResult {
  as_of: string;
  /** DefiLlama slug → Ethereum-chain TVL. */
  eth_tvl_by_slug: Record<string, number | null>;
  /** Aggregator display name → volumes. */
  volume_by_name: Record<string, { h24: number | null; d30: number | null }>;
}

/** One live pull of everything the site needs from DefiLlama. Throws on failure. */
export async function fetchDefillamaLive(
  protocols: ProtocolMeta[],
): Promise<TvlSyncResult> {
  const wanted = new Set(
    protocols.flatMap((p) => p.defillama.versions.map((v) => v.slug)),
  );
  const volumeNames = new Set(
    protocols.flatMap((p) => p.defillama.volume_names ?? []),
  );

  const res = await fetch(PROTOCOLS_URL);
  if (!res.ok) throw new Error(`defillama /protocols HTTP ${res.status}`);
  const all = (await res.json()) as LlamaProtocol[];

  const eth_tvl_by_slug: TvlSyncResult["eth_tvl_by_slug"] = {};
  for (const p of all) {
    if (p.slug && wanted.has(p.slug)) {
      const v = p.chainTvls?.Ethereum;
      eth_tvl_by_slug[p.slug] = typeof v === "number" ? v : null;
    }
  }
  for (const slug of wanted)
    if (!(slug in eth_tvl_by_slug)) eth_tvl_by_slug[slug] = null;

  const volume_by_name: TvlSyncResult["volume_by_name"] = {};
  if (volumeNames.size > 0) {
    const vres = await fetch(AGG_OVERVIEW_URL);
    if (vres.ok) {
      const overview = (await vres.json()) as {
        protocols?: AggOverviewProtocol[];
      };
      for (const p of overview.protocols ?? []) {
        if (p.name && volumeNames.has(p.name)) {
          volume_by_name[p.name] = {
            h24: typeof p.total24h === "number" ? p.total24h : null,
            d30: typeof p.total30d === "number" ? p.total30d : null,
          };
        }
      }
    }
  }

  return {
    as_of: new Date().toISOString(),
    eth_tvl_by_slug,
    volume_by_name,
  };
}

/** Assemble a per-protocol TvlPoint from a sync result (live or snapshot). */
export function tvlPointFor(
  proto: ProtocolMeta,
  sync: TvlSyncResult,
  is_stale: boolean,
): TvlPoint {
  if (proto.defillama.volume_only) {
    const names = proto.defillama.volume_names ?? [];
    const vols = names
      .map((n) => sync.volume_by_name[n])
      .filter((v): v is NonNullable<typeof v> => Boolean(v));
    const h24 = vols.length ? vols.reduce((s, v) => s + (v.h24 ?? 0), 0) : null;
    const d30 = vols.length
      ? vols.reduce((s, v) => s + (v.d30 ?? 0), 0)
      : null;
    return {
      value: d30 ?? h24,
      kind: d30 !== null ? "volume-30d" : "volume-24h",
      as_of: sync.as_of,
      is_stale,
      per_version: names.map((n) => ({
        label: n,
        slug: n,
        value: sync.volume_by_name[n]?.d30 ?? sync.volume_by_name[n]?.h24 ?? null,
      })),
    };
  }

  const per_version = proto.defillama.versions.map((v) => ({
    label: v.label,
    slug: v.slug,
    value: sync.eth_tvl_by_slug[v.slug] ?? null,
  }));
  const known = per_version.filter((v) => v.value !== null);
  return {
    value: known.length
      ? known.reduce((s, v) => s + (v.value as number), 0)
      : null,
    kind: "tvl",
    as_of: sync.as_of,
    is_stale,
    per_version,
  };
}
