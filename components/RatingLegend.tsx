/**
 * Rating-type legend, generated from the feed registry at build time —
 * categorizes each column's vocabulary so a reader knows a Stage, a grade,
 * a 0–10 and a $-VaR are different languages, not comparable numbers.
 */
import type { FeedRegistryEntry } from "@/lib/registry";

const KIND_LABELS: Record<string, string> = {
  "stage-ladder": "stage ladder",
  "consensus-color": "LLM-consensus color",
  "numeric-tier": "numeric score + tier",
  "letter-grade": "letter grade",
  "incident-history": "incident history",
  "market-scores": "per-market scores",
  "governance-stage": "governance stage",
  "credit-grade": "credit grade",
  "evidence-grade": "evidence grade",
  "narrative-health": "narrative + health",
  "dollar-var": "dollar VaR",
  "process-score": "process score",
};

export function RatingLegend({ feeds }: { feeds: FeedRegistryEntry[] }) {
  return (
    <details className="panel legend" style={{ marginBottom: 14 }}>
      <summary style={{ padding: "8px 12px", cursor: "pointer" }}>
        <span className="lbl">rating-type legend</span>{" "}
        <span className="faint" style={{ fontSize: 11 }}>
          — each column speaks its own vocabulary; none are comparable, none
          are combined
        </span>
      </summary>
      <div style={{ padding: "4px 12px 12px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: "4px 18px" }}>
        {feeds.map((f) => (
          <div key={f.key} style={{ fontSize: 11.5 }}>
            <b className="muted">{f.display_name}</b>{" "}
            <span className="faint">({KIND_LABELS[f.rating_kind] ?? f.rating_kind})</span>
            <span className="faint"> — {f.rating_vocabulary}</span>
          </div>
        ))}
        <div style={{ fontSize: 11.5 }}>
          <b className="muted">Cells</b>{" "}
          <span className="faint">
            — ● covered · ● partial (amber) · — not-yet-covered (neutral gap)
            · N/A out of feed scope
          </span>
        </div>
      </div>
    </details>
  );
}
