/**
 * DeFiPunk'd — multi-model LLM consensus assessments (independent project by
 * guil-lambert, MIT). Source of record: github.com/guil-lambert/defipunkd
 *   data/assessments/{slug}/{slice}.json, slices:
 *   control · ability-to-exit · autonomy · open-access · verifiability
 * Some directories carry a stray non-canonical "discovery" slice — skipped by
 * design (only the five canonical slices are part of the published framework).
 * Verbatim mapping; OpenRisk derives no tier from slice counts.
 */
import { fetchJson, githubHeaders, sleep } from "@/lib/fetch-util";
import {
  DEFIPUNKD_SLICES,
  type DefipunkdDatum,
  type DefipunkdSliceAssessment,
  type FeedSnapshot,
  type ProtocolMeta,
} from "@/lib/types";

const RAW =
  "https://raw.githubusercontent.com/guil-lambert/defipunkd/main/data/assessments";

interface SliceJson {
  schema_version?: number;
  slug?: string;
  slice?: string;
  consensus_grade?: string;
  consensus_strength?: string | null;
  short_headline?: string;
  merged_at?: string;
}

const GRADES = new Set(["green", "orange", "red", "unknown"]);

export async function fetchDefipunkd(
  protocols: ProtocolMeta[],
): Promise<FeedSnapshot> {
  const fetched_at = new Date().toISOString();
  const data: FeedSnapshot["data"] = {};
  const headers = githubHeaders();

  for (const proto of protocols) {
    const slugs = proto.feeds.defipunkd?.slugs ?? [];
    const datums: DefipunkdDatum[] = [];
    for (const slug of slugs) {
      const slices: DefipunkdSliceAssessment[] = [];
      for (const slice of DEFIPUNKD_SLICES) {
        let json: SliceJson | null = null;
        try {
          json = await fetchJson<SliceJson>(`${RAW}/${slug}/${slice}.json`, {
            headers,
          });
        } catch (err) {
          if ((err as { status?: number }).status === 404) continue; // slice absent
          throw err;
        }
        const grade = String(json.consensus_grade ?? "unknown");
        slices.push({
          slice,
          consensus_grade: (GRADES.has(grade) ? grade : "unknown") as DefipunkdSliceAssessment["consensus_grade"],
          consensus_strength:
            json.consensus_strength === "weak" || json.consensus_strength === "strong"
              ? json.consensus_strength
              : null,
          short_headline: String(json.short_headline ?? ""),
          merged_at: json.merged_at ? String(json.merged_at) : null,
        });
        await sleep(60);
      }
      if (slices.length > 0) {
        datums.push({
          feed_key: "defipunkd",
          punkd_slug: slug,
          slices,
          source_url: `https://defipunkd.com/protocol/${slug}`,
          fetched_at,
          provenance: "feed",
        });
      }
    }
    data[proto.slug] = datums;
  }

  return {
    feed_key: "defipunkd",
    fetched_at,
    source: RAW,
    ok: true,
    data,
  };
}
