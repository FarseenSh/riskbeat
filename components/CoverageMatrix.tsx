"use client";

/**
 * The coverage matrix. Cell encoding is COVERAGE STATUS only (charter §4 —
 * visual weight never implies a synthesized verdict):
 *   ● green   covered          ● amber   partial
 *   —  grey   not-yet-covered (a neutral gap, deliberately not a warning)
 *   N/A slate not-applicable  (out of the feed's declared scope)
 * DeFiScan renders its stage label inline — the charter's only inline
 * exception among active feeds (self-explanatory ordinal vocabulary).
 */
import { useMemo, useState } from "react";
import Link from "next/link";

export interface MatrixCellView {
  status: "covered" | "partial" | "not-applicable" | "not-yet-covered";
  inline?: string;
  note?: string;
}

export interface MatrixRowView {
  slug: string;
  name: string;
  category: string;
  tvl: number | null;
  tvlKind: "tvl" | "volume-24h" | "volume-30d";
  tvlStale: boolean;
  tvlNote?: string;
  gov: string;
  govTitle: string;
  feedsWith: number;
  applicable: number;
  sparse: boolean;
  versions: { label: string; value: number | null }[];
  cells: Record<string, MatrixCellView>;
}

export interface MatrixFeedCol {
  key: string;
  name: string;
  inline: boolean;
  kind: string;
  tier: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  lending: "Lending",
  cdp: "CDP",
  dex: "DEX",
  "swap-aggregator": "Aggregator",
  yield: "Yield",
  "liquid-staking": "Staking",
  "capital-allocator": "Allocator",
};

const fmtValue = (n: number | null, kind: string): string => {
  if (n === null) return "—";
  const s =
    n >= 1e9
      ? `$${(n / 1e9).toFixed(2)}B`
      : n >= 1e6
        ? `$${(n / 1e6).toFixed(1)}M`
        : `$${(n / 1e3).toFixed(0)}K`;
  return kind === "volume-30d" ? `${s} vol₃₀` : kind === "volume-24h" ? `${s} vol₂₄` : s;
};

function Cell({ cell }: { cell: MatrixCellView }) {
  const title = cell.note;
  if (cell.status === "not-applicable")
    return (
      <span className="cell-na" title={title ?? "Out of this feed's declared scope"}>
        N/A
      </span>
    );
  if (cell.status === "not-yet-covered")
    return (
      <span className="cell-nyc" title={title ?? "Not yet assessed by this feed — a coverage fact, not a judgment"}>
        —
      </span>
    );
  if (cell.inline)
    return (
      <span className="stage-label" title={title}>
        <span className={`dot dot-${cell.status}`} />{" "}
        {cell.inline}
      </span>
    );
  return (
    <span title={title ?? (cell.status === "covered" ? "Covered" : "Partial coverage")}>
      <span className={`dot dot-${cell.status}`} />
    </span>
  );
}

type SortKey = "tvl" | "name" | "coverage";

export function CoverageMatrix({
  rows,
  feeds,
}: {
  rows: MatrixRowView[];
  feeds: MatrixFeedCol[];
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("tvl");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const categories = useMemo(
    () => [...new Set(rows.map((r) => r.category))],
    [rows],
  );

  const view = useMemo(() => {
    let v = rows;
    if (query)
      v = v.filter((r) =>
        r.name.toLowerCase().includes(query.toLowerCase()),
      );
    if (category) v = v.filter((r) => r.category === category);
    return [...v].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "coverage") return b.feedsWith - a.feedsWith;
      return (b.tvl ?? -1) - (a.tvl ?? -1);
    });
  }, [rows, query, category, sort]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 10,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          placeholder="search protocols…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: 200 }}
          aria-label="Search protocols"
        />
        <button className={category === null ? "on" : ""} onClick={() => setCategory(null)}>
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            className={category === c ? "on" : ""}
            onClick={() => setCategory(category === c ? null : c)}
          >
            {CATEGORY_LABELS[c] ?? c}
          </button>
        ))}
      </div>

      <div className="panel" style={{ overflowX: "auto" }}>
        <table className="data-table matrix-table">
          <thead>
            <tr>
              <th>
                <button className="th-sort" onClick={() => setSort("name")}>
                  Protocol{sort === "name" ? " ↓" : ""}
                </button>
              </th>
              <th>Category</th>
              <th className="num">
                <button className="th-sort" onClick={() => setSort("tvl")}>
                  TVL / Vol{sort === "tvl" ? " ↓" : ""}
                </button>
              </th>
              <th title="Governance: threshold/owners of the primary verified multisig · timelock — from the Safe Transaction Service [onchain]">
                Gov
              </th>
              <th className="num" title="Feeds with an assessment (covered or partial). A COUNT of coverage statuses — never a combination of rating values. N/A cells are out-of-scope and excluded.">
                <button className="th-sort" onClick={() => setSort("coverage")}>
                  Feeds{sort === "coverage" ? " ↓" : ""}
                </button>
              </th>
              {feeds.map((f) => (
                <th key={f.key} title={`${f.name} — ${f.kind}${f.tier !== "full" ? " · automation pending" : ""}`}>
                  {f.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {view.map((r) => (
              <Row
                key={r.slug}
                row={r}
                feeds={feeds}
                expanded={!!expanded[r.slug]}
                onToggle={() =>
                  setExpanded((e) => ({ ...e, [r.slug]: !e[r.slug] }))
                }
              />
            ))}
          </tbody>
        </table>
      </div>
      <p className="faint" style={{ marginTop: 8, fontSize: 11 }}>
        A grey dash is a statement about feed coverage, not about the protocol
        — gaps are data. N/A means the protocol is outside that feed&apos;s
        declared scope and is excluded from coverage counts.
      </p>
    </div>
  );
}

function Row({
  row,
  feeds,
  expanded,
  onToggle,
}: {
  row: MatrixRowView;
  feeds: MatrixFeedCol[];
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr>
        <td style={{ whiteSpace: "nowrap" }}>
          {row.versions.length > 1 ? (
            <button
              onClick={onToggle}
              className="caret-btn"
              aria-label={`${expanded ? "Collapse" : "Expand"} ${row.name} versions`}
            >
              {expanded ? "▾" : "▸"}
            </button>
          ) : (
            <span className="caret-spacer" />
          )}
          <Link href={`/protocol/${row.slug}`} className="proto-link">
            {row.name}
          </Link>
          {row.versions.length > 1 && (
            <span className="faint"> ({row.versions.length})</span>
          )}
        </td>
        <td className="muted">{CATEGORY_LABELS[row.category] ?? row.category}</td>
        <td className="num" title={row.tvlNote ?? `as of snapshot · DefiLlama [feed]`}>
          {fmtValue(row.tvl, row.tvlKind)}
          {row.tvlStale && <span className="badge-stale" style={{ marginLeft: 4 }}>stale</span>}
        </td>
        <td className="muted" title={row.govTitle} style={{ whiteSpace: "nowrap" }}>
          {row.gov}
        </td>
        <td
          className="num"
          title={
            row.sparse
              ? `${row.feedsWith} of ${row.applicable} applicable feeds — listed since June 2026, not yet assessed by any rating-producing feed in the registry. A fact about the feeds, not the protocol.`
              : `${row.feedsWith} of ${row.applicable} applicable feeds have an assessment`
          }
        >
          {row.feedsWith}
          <span className="faint">/{row.applicable}</span>
        </td>
        {feeds.map((f) => (
          <td key={f.key}>
            <Cell cell={row.cells[f.key] ?? { status: "not-yet-covered" }} />
          </td>
        ))}
      </tr>
      {expanded &&
        row.versions.map((v) => (
          <tr key={v.label} className="version-row">
            <td className="faint" style={{ paddingLeft: 34 }}>
              {v.label}
            </td>
            <td />
            <td className="num faint">{fmtValue(v.value, row.tvlKind)}</td>
            <td colSpan={2 + feeds.length} />
          </tr>
        ))}
    </>
  );
}
