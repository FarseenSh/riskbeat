/**
 * Pharos — real-time stablecoin safety monitoring. REST with a free
 * self-serve key (X-API-Key). STABLECOIN-SCOPED: only protocols with an
 * associated stablecoin are in scope; everything else renders not-applicable.
 *
 * Endpoints (per pharos.watch/openapi.json):
 *   /api/report-cards    → cards[] with overallGrade ("A+".."F"|"NR") +
 *                          per-dimension grades
 *   /api/stress-signals  → DEWS bands (Calm/Watch/Alert/Warning/Danger)
 *   /api/stablecoins     → id registry, used to confirm coin ids
 *
 * GRACEFUL DEGRADATION: without PHAROS_API_KEY (or on 401) the fetcher
 * reports skipped — the orchestrator keeps the last good snapshot and cells
 * render not-yet-covered. No data is ever invented.
 */
import { fetchJson, sleep } from "@/lib/fetch-util";
import type {
  FeedSnapshot,
  PharosDatum,
  PharosDewsBand,
  ProtocolMeta,
} from "@/lib/types";

const BASE = "https://api.pharos.watch";
const DEWS_BANDS = new Set(["Calm", "Watch", "Alert", "Warning", "Danger"]);

interface ReportCard {
  id?: string;
  name?: string;
  symbol?: string;
  overallGrade?: string;
  dimensions?: Record<string, { grade?: string; score?: number }>;
  isDefunct?: boolean;
}

function pickDews(
  signals: unknown,
  coinId: string,
  symbol: string,
): { band: PharosDewsBand | null; score: number | null } {
  // Shape is defensive by design: the DEWS payload is only reachable with a
  // key, so we accept {scores:[]}|{coins:[]}|{signals:[]}|[] and match by
  // id or symbol.
  const list: Record<string, unknown>[] = Array.isArray(signals)
    ? (signals as Record<string, unknown>[])
    : ((signals as Record<string, unknown[]>)?.scores ??
        (signals as Record<string, unknown[]>)?.coins ??
        (signals as Record<string, unknown[]>)?.signals ??
        []) as Record<string, unknown>[];
  const hit = list.find(
    (s) =>
      String(s.id ?? "").toLowerCase() === coinId.toLowerCase() ||
      String(s.symbol ?? "").toLowerCase() === symbol.toLowerCase(),
  );
  if (!hit) return { band: null, score: null };
  const rawBand = String(hit.band ?? hit.dews_band ?? hit.level ?? "");
  const band = (DEWS_BANDS.has(rawBand) ? rawBand : null) as PharosDewsBand | null;
  const rawScore = hit.score ?? hit.dews_score ?? hit.value;
  return { band, score: typeof rawScore === "number" ? rawScore : null };
}

export async function fetchPharos(
  protocols: ProtocolMeta[],
): Promise<FeedSnapshot> {
  const fetched_at = new Date().toISOString();
  const apiKey = process.env.PHAROS_API_KEY;

  if (!apiKey) {
    return {
      feed_key: "pharos",
      fetched_at,
      source: BASE,
      ok: false,
      error:
        "PHAROS_API_KEY not set — skipped (free self-serve key: pharos.watch/api). Cells render not-yet-covered; last good snapshot, if any, is preserved.",
      data: {},
    };
  }

  const headers = { "X-API-Key": apiKey };
  const cardsRes = await fetchJson<{ cards?: ReportCard[] }>(
    `${BASE}/api/report-cards`,
    { headers },
  );
  await sleep(400);
  let signals: unknown = null;
  try {
    signals = await fetchJson(`${BASE}/api/stress-signals`, { headers });
  } catch {
    /* DEWS optional — grades remain verbatim without it */
  }

  const cards = cardsRes.cards ?? [];
  const data: FeedSnapshot["data"] = {};

  for (const proto of protocols) {
    const datums: PharosDatum[] = [];
    for (const coin of proto.stablecoins) {
      if (!coin.pharos_id) continue;
      const card = cards.find(
        (c) =>
          String(c.id ?? "").toLowerCase() === coin.pharos_id!.toLowerCase() ||
          String(c.symbol ?? "").toLowerCase() === coin.symbol.toLowerCase(),
      );
      if (!card?.overallGrade) continue;
      const dews = pickDews(signals, coin.pharos_id, coin.symbol);
      const dimensions: PharosDatum["dimensions"] = {};
      for (const [dim, v] of Object.entries(card.dimensions ?? {})) {
        dimensions[dim] = {
          grade: v?.grade ?? null,
          score: typeof v?.score === "number" ? v.score : null,
        };
      }
      datums.push({
        feed_key: "pharos",
        coin_id: String(card.id ?? coin.pharos_id),
        coin_symbol: String(card.symbol ?? coin.symbol),
        coin_name: String(card.name ?? coin.symbol),
        overall_grade: String(card.overallGrade),
        dimensions,
        dews_band: dews.band,
        dews_score: dews.score,
        is_defunct: Boolean(card.isDefunct),
        source_url: "https://pharos.watch",
        fetched_at,
        provenance: "feed",
      });
    }
    data[proto.slug] = datums;
  }

  return { feed_key: "pharos", fetched_at, source: BASE, ok: true, data };
}
