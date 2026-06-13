import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { marked } from "marked";
import { FeedCard } from "@/components/FeedCard";
import { GovernanceTable } from "@/components/GovernanceTable";
import { ProvenanceTag } from "@/components/ProvenanceTag";
import {
  fallbackSafes,
  fallbackTvl,
  feedDataFor,
  protocolBySlug,
  siteData,
} from "@/lib/data-loader";
import { fetchDefillamaLive, tvlPointFor } from "@/lib/defillama";
import { fetchSafeStatuses } from "@/lib/safe-api";
import type { FeedKey } from "@/lib/feed-keys";
import type { HacksDatum, SafeStatus } from "@/lib/types";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return siteData.protocols.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const proto = protocolBySlug(slug);
  return {
    title: proto ? `${proto.name} — risk feed coverage` : "Protocol",
    description: proto
      ? `What every risk feed says about ${proto.name}, verbatim: coverage, governance, incidents — with no score of our own.`
      : undefined,
  };
}

const fmtUsd = (n: number | null): string => {
  if (n === null) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${(n / 1e3).toFixed(0)}K`;
};

export default async function ProtocolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const proto = protocolBySlug(slug);
  if (!proto) notFound();

  // Live TVL with snapshot fallback + [stale] badge.
  let tvlSync = null;
  let tvlStale = false;
  try {
    tvlSync = await fetchDefillamaLive([proto]);
  } catch {
    tvlSync = fallbackTvl();
    tvlStale = true;
  }
  const tvl = tvlSync
    ? tvlPointFor(proto, tvlSync, tvlStale)
    : { value: null, kind: "tvl" as const, as_of: "", is_stale: true, per_version: [] };

  // Live Safe reads for THIS protocol with snapshot fallback (one retry —
  // the Safe API rate-limits when many pages build at once).
  let liveSafes: Record<string, SafeStatus> = {};
  let safeFallbackNote: string | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const live = await fetchSafeStatuses([proto]);
      liveSafes = live.by_address;
      const anyLive = Object.values(liveSafes).some((s) => !s.is_stale);
      if (!anyLive && proto.governance.safes.length > 0)
        throw new Error("all stale");
      safeFallbackNote = null;
      break;
    } catch {
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }
      liveSafes = fallbackSafes()?.by_address ?? {};
      if (proto.governance.safes.length > 0) {
        const asOf = siteData.safe_snapshot?.as_of?.slice(0, 10);
        safeFallbackNote = asOf
          ? `governance snapshot of ${asOf} — live refresh unavailable right now`
          : "governance snapshot — live refresh unavailable right now";
      }
    }
  }

  const coverage = siteData.coverage[proto.slug];
  const assessed = siteData.feeds.filter((f) => {
    const s = coverage.cells[f.key as FeedKey]?.status;
    return s === "covered" || s === "partial";
  });
  const gaps = siteData.feeds.filter(
    (f) => coverage.cells[f.key as FeedKey]?.status === "not-yet-covered",
  );
  const notApplicable = siteData.feeds.filter(
    (f) => coverage.cells[f.key as FeedKey]?.status === "not-applicable",
  );

  const hacks = feedDataFor(proto.slug, "defillama-hacks")[0] as
    | HacksDatum
    | undefined;
  const assessment = siteData.assessments[proto.slug];

  return (
    <div>
      <div className="detail-header">
        <div>
          <h1>{proto.display_name.toUpperCase()}</h1>
          <div className="muted" style={{ marginBottom: 6 }}>
            {proto.category} · ethereum ·{" "}
            <a href={proto.website} target="_blank" rel="noopener noreferrer">
              {proto.website.replace("https://", "")} ↗
            </a>
          </div>
          <p className="page-intro" style={{ marginBottom: 0 }}>
            {proto.description}
          </p>
        </div>
        <div className="tvl-box">
          <div className="lbl">
            {proto.defillama.volume_only ? "volume" : "tvl (ethereum)"}
          </div>
          <div className="tvl-value">
            {fmtUsd(tvl.value)}
            {tvl.is_stale && (
              <span className="badge-stale" style={{ marginLeft: 6 }}>
                stale
              </span>
            )}
          </div>
          <div className="faint" style={{ fontSize: 10 }}>
            {proto.defillama.tvl_note ??
              `DefiLlama · as of ${tvl.as_of.slice(0, 16).replace("T", " ")} UTC`}{" "}
            <ProvenanceTag tag="feed" />
          </div>
        </div>
      </div>

      <h2>Governance</h2>
      <GovernanceTable
        governance={proto.governance}
        liveSafes={liveSafes}
        safeFallbackNote={safeFallbackNote}
      />

      <h2>
        Risk intelligence feeds{" "}
        <span className="muted" style={{ fontWeight: 400 }}>
          — {coverage.feeds_with_assessments} of {coverage.applicable_feeds}{" "}
          applicable feeds have an assessment
        </span>
      </h2>
      {assessed.length > 0 ? (
        <div className="feed-cards">
          {assessed.map((f) => (
            <FeedCard
              key={f.key}
              feed={f}
              cell={coverage.cells[f.key as FeedKey]}
              datums={feedDataFor(proto.slug, f.key as FeedKey)}
              fetchedAt={siteData.feed_meta[f.key]?.fetched_at ?? null}
            />
          ))}
        </div>
      ) : (
        <div className="gap-row">
          No feed in the registry has published an assessment of {proto.name}{" "}
          yet — listed since June 2026. This is a statement about feed
          coverage, not about the protocol.
        </div>
      )}

      {gaps.length > 0 && (
        <div className="gap-row" style={{ marginTop: 12 }}>
          <b className="muted">Not yet covered by:</b>{" "}
          {gaps.map((f) => f.display_name).join(" · ")}
          <span className="faint"> — coverage gaps are data, not danger.</span>
        </div>
      )}
      {notApplicable.length > 0 && (
        <div className="gap-row" style={{ marginTop: 8, borderStyle: "dotted" }}>
          <b className="muted">Out of scope (N/A):</b>{" "}
          {notApplicable.map((f) => (
            <span key={f.key}>
              {f.display_name}
              <span className="faint">
                {" "}
                ({coverage.cells[f.key as FeedKey]?.note ?? f.scope_note}) ·{" "}
              </span>
            </span>
          ))}
        </div>
      )}

      {assessment?.exists && !assessment.is_template && assessment.markdown && (
        <>
          <h2>
            Analyst notes{" "}
            <span className="muted" style={{ fontWeight: 400 }}>
              — curated observations, no verdicts (per{" "}
              <a href="https://github.com/FarseenSh/riskbeat/blob/main/CHARTER.md">
                charter
              </a>
              )
            </span>
          </h2>
          <div className="panel" style={{ padding: "4px 18px 14px" }}>
            <div
              className="prose"
              dangerouslySetInnerHTML={{
                __html: marked.parse(assessment.markdown) as string,
              }}
            />
            <div className="faint" style={{ marginTop: 8, fontSize: 11 }}>
              <ProvenanceTag tag="curated" /> ·{" "}
              <a
                href={`https://github.com/FarseenSh/riskbeat/commits/main/data/assessments/${proto.slug}.md`}
                target="_blank"
                rel="noopener noreferrer"
              >
                authorship & history ↗
              </a>
            </div>
          </div>
        </>
      )}

      <h2>Audit history</h2>
      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Firm</th>
              <th>Year</th>
              <th>Scope</th>
              <th>Report</th>
            </tr>
          </thead>
          <tbody>
            {proto.audits.map((a, i) => (
              <tr key={i}>
                <td>{a.firm}</td>
                <td className="muted">{a.year}</td>
                <td className="muted">{a.scope ?? "—"}</td>
                <td>
                  {a.url ? (
                    <a href={a.url} target="_blank" rel="noopener noreferrer">
                      report ↗
                    </a>
                  ) : (
                    <span className="faint">link not on file</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="faint" style={{ fontSize: 11, marginTop: 6 }}>
        Audit list is registry-curated <ProvenanceTag tag="curated" /> — an
        audit is a point-in-time review, not an endorsement.
      </p>

      <h2>Incident history</h2>
      <div className="panel" style={{ padding: "10px 12px" }}>
        {hacks && hacks.events.length > 0 ? (
          <table className="mini-table">
            <tbody>
              {hacks.events.map((e, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: "nowrap" }}>{e.date}</td>
                  <td style={{ color: "var(--red)" }}>{fmtUsd(e.amount_usd)}</td>
                  <td className="muted">{e.name}</td>
                  <td className="faint">
                    {e.technique ?? e.classification ?? ""}
                    {e.returned_funds ? " · funds returned" : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <span className="muted">
            No known incidents on record (DefiLlama Hacks).
          </span>
        )}
        <div className="faint" style={{ marginTop: 6, fontSize: 11 }}>
          Source: DefiLlama Hacks <ProvenanceTag tag="feed" /> · fetched{" "}
          {siteData.feed_meta["defillama-hacks"]?.fetched_at?.slice(0, 10) ?? "—"}
        </div>
      </div>

      {proto.notes && proto.notes.length > 0 && (
        <>
          <h2>Registry notes</h2>
          {proto.notes.map((n, i) => (
            <p key={i} className="muted" style={{ maxWidth: 880, margin: "6px 0" }}>
              ◦ {n} <ProvenanceTag tag="curated" />
            </p>
          ))}
        </>
      )}

      <div className="gap-row" style={{ marginTop: 28 }}>
        See something wrong?{" "}
        <a
          href={`https://github.com/FarseenSh/riskbeat/issues/new?title=correction:+${proto.slug}&body=Protocol:+${proto.slug}%0AFeed:%0AField:%0AWhat+the+source+actually+says:%0ASource+URL:%0ASource+date:`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Submit a correction on GitHub ↗
        </a>{" "}
        — corrections land in <code>data/overlays/</code> via PR and render at{" "}
        <a href="/corrections">/corrections</a>.
      </div>
    </div>
  );
}
