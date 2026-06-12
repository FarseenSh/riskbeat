/**
 * GET /api/v0/matrix.json — the machine-readable coverage matrix.
 * v0, explicitly unstable. Serves coverage statuses + verbatim feed data
 * references; never any combined value (there is none to serve).
 */
import { siteData } from "@/lib/data-loader";
import { tvlPointFor } from "@/lib/defillama";
import type { FeedKey } from "@/lib/feed-keys";

export const dynamic = "force-static";
export const revalidate = 1800;

export function GET() {
  const tvl = siteData.tvl_snapshot;

  const body = {
    version: "v0",
    unstable: true,
    schema_url:
      "https://github.com/FarseenSh/openrisk/blob/main/schema/protocol.schema.json",
    generated_at: siteData.generated_at,
    license:
      "Code AGPL-3.0; compiled data outputs additionally CC0-1.0 to the extent of our rights; verbatim feed values remain attributable to their publishers (see README).",
    provenance_root: siteData.provenance.latest_root,
    charter:
      "No composite scoring — feeds are never combined. https://github.com/FarseenSh/openrisk/blob/main/CHARTER.md",
    feeds: siteData.feeds.map((f) => ({
      key: f.key,
      display_name: f.display_name,
      methodology: f.methodology,
      rating_vocabulary: f.rating_vocabulary,
      automation_tier: f.automation_tier,
      provenance_tag: f.provenance_tag,
      scope_note: f.scope_note,
      conflict_of_interest: f.conflict_of_interest,
      last_fetched: siteData.feed_meta[f.key]?.fetched_at ?? null,
    })),
    protocols: siteData.protocols.map((p) => {
      const cov = siteData.coverage[p.slug];
      return {
        slug: p.slug,
        name: p.name,
        category: p.category,
        chain: p.chain,
        tvl: tvl
          ? tvlPointFor(p, tvl, false)
          : { value: null, kind: "tvl", as_of: null, is_stale: true },
        coverage: Object.fromEntries(
          Object.entries(cov.cells).map(([k, c]) => [
            k,
            { status: c.status, ...(c.note ? { note: c.note } : {}) },
          ]),
        ),
        feeds_with_assessments: cov.feeds_with_assessments,
        applicable_feeds: cov.applicable_feeds,
        feed_data: Object.fromEntries(
          (Object.keys(siteData.feed_data) as FeedKey[]).map((k) => [
            k,
            siteData.feed_data[k]?.[p.slug] ?? [],
          ]),
        ),
      };
    }),
  };

  return Response.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
    },
  });
}
