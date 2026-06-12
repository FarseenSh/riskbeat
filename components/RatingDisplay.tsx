/**
 * RatingDisplay — THE verbatim renderer (CHARTER.md §4).
 *
 * One branch per feed, each rendering that feed's published vocabulary
 * exactly as published. There is deliberately NO branch that reads two
 * feeds' values and no common "score" path — the no-cross-feed-render lint
 * rule and the FeedDatum union keep it that way.
 */
import { DEFIPUNKD_SLICES } from "@/lib/types";
import type {
  DefiSphereDatum,
  DefipunkdDatum,
  DefiscanDatum,
  FeedDatum,
  GenericCuratedDatum,
  HacksDatum,
  PharosDatum,
  PhilidorDatum,
} from "@/lib/types";

const fmtUsd = (n: number | null): string => {
  if (n === null) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const DIM_LABELS: Record<string, string> = {
  chain: "Chain",
  upgradeability: "Upgradeability",
  autonomy: "Autonomy",
  exit_window: "Exit Window",
  accessibility: "Accessibility",
};

const riskColor = (lvl: string) =>
  lvl === "L" ? "var(--green)" : lvl === "M" ? "var(--amber)" : "var(--text)";

function Defiscan({ d }: { d: DefiscanDatum }) {
  return (
    <div className="rating-block">
      <div className="rating-headline">
        <span className="rating-big">
          {typeof d.stage === "number" ? `Stage ${d.stage}` : "Others"}
        </span>
        <span className="faint"> — {d.protocol_label}</span>
      </div>
      <div className="rating-dims">
        {Object.entries(d.risks).map(([dim, lvl]) => (
          <span key={dim} className="dim-chip" title={`${DIM_LABELS[dim] ?? dim}: ${lvl === "L" ? "Low" : lvl === "M" ? "Medium" : "High"} risk (DeFiScan's own vocabulary)`}>
            <span className="faint">{DIM_LABELS[dim] ?? dim}</span>{" "}
            <b style={{ color: riskColor(lvl as string) }}>{lvl}</b>
          </span>
        ))}
      </div>
      {d.reasons.length > 0 && (
        <div className="faint" style={{ marginTop: 4 }}>
          reasons: {d.reasons.join("; ")}
        </div>
      )}
    </div>
  );
}

const GRADE_COLOR: Record<string, string> = {
  green: "var(--green)",
  orange: "var(--amber)",
  red: "var(--red)",
  unknown: "var(--text-muted)",
};

function Defipunkd({ d }: { d: DefipunkdDatum }) {
  return (
    <div className="rating-block">
      <div className="faint" style={{ marginBottom: 4 }}>
        assessment unit: <b className="muted">{d.punkd_slug}</b> ·{" "}
        {d.slices.length}/{DEFIPUNKD_SLICES.length} slices published
      </div>
      <table className="mini-table">
        <tbody>
          {d.slices.map((s) => (
            <tr key={s.slice}>
              <td className="muted" style={{ whiteSpace: "nowrap" }}>
                {s.slice}
              </td>
              <td>
                <b style={{ color: GRADE_COLOR[s.consensus_grade] }}>
                  {s.consensus_grade}
                </b>
                {s.consensus_strength && (
                  <span className="faint"> ({s.consensus_strength})</span>
                )}
              </td>
              <td className="faint">{s.short_headline}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Philidor({ d }: { d: PhilidorDatum }) {
  return (
    <div className="rating-block">
      <div className="faint" style={{ marginBottom: 4 }}>
        {d.vault_count_total} vaults tracked · top{" "}
        {Math.min(6, d.vaults.length)} of {d.vaults.length} archived by TVL
        shown · 0–10 score + tier, per vault
      </div>
      <table className="mini-table">
        <tbody>
          {d.vaults.slice(0, 6).map((v) => (
            <tr key={v.address || v.name}>
              <td className="muted">{v.name}</td>
              <td>
                <b>{v.total_score.toFixed(2)}</b>{" "}
                <span
                  style={{
                    color:
                      v.risk_tier === "Prime"
                        ? "var(--green)"
                        : v.risk_tier === "Core"
                          ? "var(--amber)"
                          : "var(--text-muted)",
                  }}
                >
                  {v.risk_tier}
                </span>
              </td>
              <td className="num faint">{fmtUsd(v.tvl_usd)}</td>
              <td className="faint">{v.curator_name ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Pharos({ d }: { d: PharosDatum }) {
  return (
    <div className="rating-block">
      <div className="rating-headline">
        <span className="rating-big">{d.overall_grade}</span>
        <span className="faint">
          {" "}
          — {d.coin_name} ({d.coin_symbol})
        </span>
        {d.dews_band && (
          <span className="muted"> · DEWS: {d.dews_band}</span>
        )}
      </div>
      <div className="rating-dims">
        {Object.entries(d.dimensions).map(([dim, v]) => (
          <span key={dim} className="dim-chip">
            <span className="faint">{dim}</span> <b>{v.grade ?? "—"}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function Hacks({ d }: { d: HacksDatum }) {
  if (d.events.length === 0)
    return <div className="muted">No incidents on record.</div>;
  return (
    <table className="mini-table">
      <tbody>
        {d.events.map((e, i) => (
          <tr key={i}>
            <td className="muted" style={{ whiteSpace: "nowrap" }}>
              {e.date}
            </td>
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
  );
}

function Sphere({ d }: { d: DefiSphereDatum }) {
  return (
    <div className="rating-block">
      <div className="faint" style={{ marginBottom: 4 }}>
        {d.market_count_total} lending markets scored · top{" "}
        {Math.min(6, d.markets.length)} by supply shown · collateral risk +
        liquidity risk, per market
      </div>
      <table className="mini-table">
        <tbody>
          {d.markets.slice(0, 6).map((m) => (
            <tr key={m.pool_id || m.name}>
              <td className="muted">{m.name}</td>
              <td className="faint">{m.sphere_protocol}</td>
              <td>
                coll <b>{m.collateral_risk_score?.toFixed(1) ?? "—"}</b>
              </td>
              <td>
                liq <b>{m.liquidity_risk_score?.toFixed(1) ?? "—"}</b>
              </td>
              <td className="num faint">{fmtUsd(m.total_supply_usd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Curated({ d }: { d: GenericCuratedDatum }) {
  return (
    <div className="rating-block">
      <div className="rating-big">{d.raw_value}</div>
      {d.value_label && <div className="muted">{d.value_label}</div>}
      <div className="faint">
        sourced {d.source_date} by {d.contributor}
      </div>
    </div>
  );
}

export function RatingDisplay({ datum }: { datum: FeedDatum }) {
  switch (datum.feed_key) {
    case "defiscan":
      return <Defiscan d={datum} />;
    case "defipunkd":
      return <Defipunkd d={datum} />;
    case "philidor":
      return <Philidor d={datum} />;
    case "pharos":
      return <Pharos d={datum} />;
    case "defillama-hacks":
      return <Hacks d={datum} />;
    case "defisphere":
      return <Sphere d={datum} />;
    default:
      return <Curated d={datum as GenericCuratedDatum} />;
  }
}
