import type { FeedRegistryEntry } from "@/lib/registry";
import type { CoverageCell, FeedDatum } from "@/lib/types";
import { ProvenanceTag } from "@/components/ProvenanceTag";
import { RatingDisplay } from "@/components/RatingDisplay";

export function FeedCard({
  feed,
  cell,
  datums,
  fetchedAt,
}: {
  feed: FeedRegistryEntry;
  cell: CoverageCell;
  datums: FeedDatum[];
  fetchedAt: string | null;
}) {
  return (
    <div className="panel feed-card">
      <div className="panel-head">
        <div>
          <span className="lbl lbl-strong">{feed.display_name}</span>{" "}
          <span
            className={cell.status === "covered" ? "green" : "amber"}
            style={{ fontSize: 10, letterSpacing: "0.06em" }}
          >
            {cell.status === "covered" ? "COVERED" : "PARTIAL"}
          </span>
        </div>
        <ProvenanceTag tag={feed.provenance_tag} />
      </div>
      <div style={{ padding: "10px 12px" }}>
        <p className="faint" style={{ fontStyle: "italic", marginBottom: 8 }}>
          {feed.methodology}
        </p>
        {cell.note && (
          <p className="muted" style={{ marginBottom: 8, fontSize: 11.5 }}>
            ◦ {cell.note}
          </p>
        )}
        {datums.map((d, i) => (
          <div key={i} style={{ marginBottom: i < datums.length - 1 ? 12 : 0 }}>
            <RatingDisplay datum={d} />
          </div>
        ))}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <a
            href={
              (datums[0] as { source_url?: string } | undefined)?.source_url ??
              feed.url
            }
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11.5 }}
          >
            View assessment ↗
          </a>
          <span className="faint" style={{ fontSize: 10.5 }}>
            fetched {fetchedAt ? fetchedAt.slice(0, 16).replace("T", " ") : "—"}{" "}
            UTC
          </span>
        </div>
        {feed.conflict_of_interest && (
          <div
            className="faint"
            style={{
              marginTop: 8,
              paddingTop: 8,
              borderTop: "1px solid var(--border)",
              fontSize: 10.5,
            }}
          >
            disclosure: {feed.conflict_of_interest}
          </div>
        )}
      </div>
    </div>
  );
}
