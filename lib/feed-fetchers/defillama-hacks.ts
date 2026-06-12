/**
 * DefiLlama Hacks — incident history (not a rating). Free public REST.
 *   GET api.llama.fi/hacks → full array. Field realities: `amount` is USD,
 *   `date` is epoch SECONDS, `source` is often "".
 * Matching: defillamaId joins first (authoritative), then anchored
 * name-pattern fallbacks from the protocol registry (events with null ids).
 * A protocol with zero events is real data: "no incidents on record".
 */
import { fetchJson } from "@/lib/fetch-util";
import type { FeedSnapshot, HackEvent, HacksDatum, ProtocolMeta } from "@/lib/types";

const URL = "https://api.llama.fi/hacks";

interface ApiHack {
  date?: number;
  name?: string;
  classification?: string;
  technique?: string;
  amount?: number;
  chain?: string[];
  defillamaId?: number | string | null;
  source?: string;
  returnedFunds?: number | null;
}

export async function fetchHacks(
  protocols: ProtocolMeta[],
): Promise<FeedSnapshot> {
  const fetched_at = new Date().toISOString();
  const all = await fetchJson<ApiHack[]>(URL);
  const data: FeedSnapshot["data"] = {};

  for (const proto of protocols) {
    const ids = new Set(proto.hack_match.ids.map(String));
    const patterns = proto.hack_match.name_patterns.map((p) => new RegExp(p, "i"));
    const matched_by = new Set<"defillama-id" | "name-pattern">();

    const events: HackEvent[] = all
      .filter((h) => {
        const idHit = h.defillamaId != null && ids.has(String(h.defillamaId));
        const nameHit = patterns.some((re) => re.test(String(h.name ?? "")));
        if (idHit) matched_by.add("defillama-id");
        else if (nameHit) matched_by.add("name-pattern");
        return idHit || nameHit;
      })
      .map((h) => ({
        date: h.date ? new Date(h.date * 1000).toISOString().slice(0, 10) : "",
        amount_usd: typeof h.amount === "number" ? h.amount : null,
        name: String(h.name ?? ""),
        technique: h.technique ? String(h.technique) : null,
        classification: h.classification ? String(h.classification) : null,
        returned_funds:
          typeof h.returnedFunds === "number" ? h.returnedFunds : null,
        source_url: h.source ? String(h.source) : null,
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const datum: HacksDatum = {
      feed_key: "defillama-hacks",
      events,
      matched_by: [...matched_by],
      source_url: "https://defillama.com/hacks",
      fetched_at,
      provenance: "feed",
    };
    data[proto.slug] = [datum];
  }

  return { feed_key: "defillama-hacks", fetched_at, source: URL, ok: true, data };
}
