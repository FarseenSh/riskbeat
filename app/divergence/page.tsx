import type { Metadata } from "next";
import Link from "next/link";
import { siteData } from "@/lib/data-loader";
import { tvlPointFor } from "@/lib/defillama";
import { RatingDisplay } from "@/components/RatingDisplay";
import type { FeedKey } from "@/lib/feed-keys";

export const metadata: Metadata = {
  title: "Divergence",
  description:
    "Every protocol assessed by two or more rating feeds, with each feed's verbatim value side by side. OpenRisk computes nothing — including here.",
};

/**
 * Side-by-side view of multi-covered protocols. CHARTER note: this page
 * performs no comparison, mapping, or normalization between feeds — it
 * filters by coverage STATUS (a permitted count) and renders each feed's
 * verbatim value next to the others. Whether feeds agree is for the reader.
 */
export default function DivergencePage() {
  const ratingFeeds = siteData.feeds.filter(
    (f) => f.rating_kind !== "incident-history",
  );

  const rows = siteData.protocols
    .map((p) => {
      const withData = ratingFeeds.filter((f) => {
        const cell = siteData.coverage[p.slug].cells[f.key as FeedKey];
        const datums = siteData.feed_data[f.key as FeedKey]?.[p.slug] ?? [];
        return (
          (cell?.status === "covered" || cell?.status === "partial") &&
          datums.length > 0
        );
      });
      const tvl = siteData.tvl_snapshot
        ? tvlPointFor(p, siteData.tvl_snapshot, false)
        : null;
      return { proto: p, feeds: withData, tvl: tvl?.value ?? null };
    })
    .filter((r) => r.feeds.length >= 2)
    .sort((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0));

  return (
    <div>
      <h1>DIVERGENCE</h1>
      <p className="page-intro">
        Every protocol that two or more rating feeds have assessed, with each
        feed&apos;s verbatim value in one row — sorted by TVL. OpenRisk
        computes nothing here: a Stage, a slice grade, a vault score and a
        letter grade are different languages, not comparable numbers. Where
        the feeds diverge — and whether that matters — is for you to judge.
        Incident records (DefiLlama Hacks) are excluded: an incident log is
        history, not a rating.
      </p>

      <p className="page-intro muted">
        {rows.length} of {siteData.protocols.length} seed protocols currently
        have two or more rating-feed assessments. The other{" "}
        {siteData.protocols.length - rows.length} are the coverage gap — see
        the <Link href="/">matrix</Link>.
      </p>

      {rows.map(({ proto, feeds, tvl }) => (
        <section key={proto.slug} className="panel" style={{ marginBottom: "1.5rem" }}>
          <header className="panel-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "1rem", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0 }}>
              <Link href={`/protocol/${proto.slug}`}>{proto.name}</Link>
            </h2>
            <span className="muted">
              {tvl != null
                ? `$${(tvl / 1e9) >= 1 ? `${(tvl / 1e9).toFixed(2)}B` : `${(tvl / 1e6).toFixed(1)}M`}`
                : "—"}{" "}
              · {feeds.length} rating feeds
            </span>
          </header>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", padding: "12px" }}>
            {feeds.map((f) => {
              const datums =
                siteData.feed_data[f.key as FeedKey]?.[proto.slug] ?? [];
              return (
                <div key={f.key} style={{ border: "1px solid var(--border)", padding: "0.75rem" }}>
                  <div className="muted" style={{ marginBottom: "0.5rem" }}>
                    {f.display_name}
                    {siteData.coverage[proto.slug].cells[f.key as FeedKey]
                      ?.status === "partial" && " · partial"}
                  </div>
                  <RatingDisplay datum={datums[0]} />
                  {datums.length > 1 && (
                    <div className="muted" style={{ marginTop: "0.5rem" }}>
                      +{datums.length - 1} more on the{" "}
                      <Link href={`/protocol/${proto.slug}`}>
                        protocol page
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
