/**
 * DeFiScan — decentralization-maturity reviews (DeFi Collective, MIT).
 * Source of record: github.com/deficollective/defiscan
 *   src/content/protocols/{id}/ethereum.md  → YAML frontmatter:
 *     stage: 0|1|2 (integer; non-stage reviews use a string marker)
 *     risks: ["L","H","H","H","L"]  (order: chain, upgradeability, autonomy,
 *                                    exit_window, accessibility)
 *   src/content/protocols/{id}/data.json    → { protocol, defillama_slug[] }
 * Verbatim mapping — no value translation.
 */
import matter from "gray-matter";
import { fetchJson, fetchText, githubHeaders, sleep } from "@/lib/fetch-util";
import {
  DEFISCAN_DIMENSIONS,
  type DefiscanDatum,
  type FeedSnapshot,
  type ProtocolMeta,
  type RiskLevel,
} from "@/lib/types";

const RAW =
  "https://raw.githubusercontent.com/deficollective/defiscan/main/src/content/protocols";

interface DefiscanDataJson {
  id?: string;
  protocol?: string;
  defillama_slug?: string[];
}

/** js-yaml parses unquoted YAML dates as Date objects; normalize to YYYY-MM-DD. */
function isoDate(v: unknown): string | undefined {
  if (v == null || v === "") return undefined;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

export async function fetchDefiscan(
  protocols: ProtocolMeta[],
): Promise<FeedSnapshot> {
  const fetched_at = new Date().toISOString();
  const data: FeedSnapshot["data"] = {};
  const headers = githubHeaders();

  for (const proto of protocols) {
    const ids = proto.feeds.defiscan?.ids ?? [];
    const datums: DefiscanDatum[] = [];
    for (const id of ids) {
      const md = await fetchText(`${RAW}/${id}/ethereum.md`, { headers });
      if (md === null) continue; // 404 → not reviewed on Ethereum
      const fm = matter(md).data as {
        stage?: number | string;
        risks?: string[];
        reasons?: string[];
        publish_date?: string;
        update_date?: string;
      };
      let meta: DefiscanDataJson = {};
      try {
        meta = await fetchJson<DefiscanDataJson>(`${RAW}/${id}/data.json`, {
          headers,
        });
      } catch {
        /* metadata optional */
      }
      const risks: DefiscanDatum["risks"] = {};
      (fm.risks ?? []).forEach((level, i) => {
        const dim = DEFISCAN_DIMENSIONS[i];
        if (dim && (level === "L" || level === "M" || level === "H"))
          risks[dim] = level as RiskLevel;
      });
      datums.push({
        feed_key: "defiscan",
        defiscan_id: id,
        protocol_label: meta.protocol ?? id,
        covered_llama_slugs: meta.defillama_slug ?? [],
        stage: typeof fm.stage === "number" ? fm.stage : "O",
        risks,
        reasons: Array.isArray(fm.reasons) ? fm.reasons.map(String) : [],
        publish_date: isoDate(fm.publish_date),
        update_date:
          isoDate(fm.update_date) !== "1970-01-01"
            ? isoDate(fm.update_date)
            : undefined,
        source_url: `https://defiscan.info/protocols/${id}`,
        fetched_at,
        provenance: "feed",
      });
      await sleep(80);
    }
    data[proto.slug] = datums;
  }

  return {
    feed_key: "defiscan",
    fetched_at,
    source: RAW,
    ok: true,
    data,
  };
}
