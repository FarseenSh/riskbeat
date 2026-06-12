import {
  CoverageMatrix,
  type MatrixFeedCol,
  type MatrixRowView,
} from "@/components/CoverageMatrix";
import { RatingLegend } from "@/components/RatingLegend";
import { fallbackSafes, fallbackTvl, siteData } from "@/lib/data-loader";
import { fetchDefillamaLive, tvlPointFor, type TvlSyncResult } from "@/lib/defillama";

// ISR: regenerate at most every 30 minutes; a failed live fetch falls back
// to the committed nightly snapshot with a [stale] badge — never a blank.
export const dynamic = "force-static";

export const metadata = {
  title: "Coverage matrix",
  description:
    "20 Ethereum-mainnet protocols × 13 risk feeds — coverage status and verbatim ratings, side by side, with live TVL. No score of our own.",
};

export default async function Home() {
  let tvlSync: TvlSyncResult | null = null;
  let tvlStale = false;
  try {
    tvlSync = await fetchDefillamaLive(siteData.protocols);
  } catch {
    tvlSync = fallbackTvl();
    tvlStale = true;
  }
  if (!tvlSync) {
    tvlSync = { as_of: siteData.generated_at, eth_tvl_by_slug: {}, volume_by_name: {} };
    tvlStale = true;
  }

  const safes = fallbackSafes();

  const rows: MatrixRowView[] = siteData.protocols.map((p) => {
    const point = tvlPointFor(p, tvlSync, tvlStale);
    const cov = siteData.coverage[p.slug];
    const primarySafe = p.governance.safes[0];
    const liveSafe = primarySafe
      ? safes?.by_address[primarySafe.address]
      : undefined;
    const threshold = liveSafe?.threshold ?? primarySafe?.threshold ?? null;
    const owners = liveSafe?.owners?.length ?? primarySafe?.owners ?? null;
    const govBits: string[] = [];
    if (threshold !== null && owners !== null) govBits.push(`${threshold}/${owners}`);
    else if (p.governance.model === "immutable") govBits.push("immutable");
    else if (p.governance.governance_contract) govBits.push("on-chain");
    if (p.governance.timelock)
      govBits.push(
        p.governance.timelock.match(/(\d+)[- ]day/)?.[1]
          ? `${p.governance.timelock.match(/(\d+)[- ]day/)?.[1]}d`
          : "tl",
      );

    return {
      slug: p.slug,
      name: p.name,
      category: p.category,
      tvl: point.value,
      tvlKind: point.kind,
      tvlStale: point.is_stale,
      tvlNote: p.defillama.tvl_note,
      gov: govBits.join(" · ") || "—",
      govTitle: `${p.governance.note.slice(0, 140)} — Safe data via Safe Transaction Service [onchain]`,
      feedsWith: cov.feeds_with_assessments,
      applicable: cov.applicable_feeds,
      sparse: cov.feeds_with_assessments <= 1,
      versions: point.per_version.map((v) => ({ label: v.label, value: v.value })),
      cells: cov.cells,
    };
  });

  const feeds: MatrixFeedCol[] = siteData.feeds.map((f) => ({
    key: f.key,
    name: f.display_name,
    inline: f.inline_label,
    kind: f.rating_kind,
    tier: f.automation_tier,
  }));

  return (
    <div>
      <h1>COVERAGE MATRIX</h1>
      <p className="page-intro">
        What every major DeFi risk feed says about the 20 seed Ethereum-mainnet
        protocols — side by side, verbatim, with no score of our own.{" "}
        {siteData.feeds.filter((f) => f.automation_tier === "full" && f.status === "active").length}{" "}
        feeds populate automatically every night; the rest are registry columns whose
        gaps are shown as data.{" "}
        <a href="/methodology">How to read this →</a>
      </p>
      <RatingLegend feeds={siteData.feeds} />
      <CoverageMatrix rows={rows} feeds={feeds} />
    </div>
  );
}
