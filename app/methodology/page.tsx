import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Metadata } from "next";
import { marked } from "marked";
import { ProvenanceTag } from "@/components/ProvenanceTag";
import { siteData } from "@/lib/data-loader";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "What OpenRisk does and does not do: verbatim aggregation, coverage as data, the four provenance tags, and the full feed registry.",
};

const TIER_LABEL: Record<string, string> = {
  full: "automated nightly",
  partial: "automation pending access",
  "manual-only": "curated via PR",
};

export default function MethodologyPage() {
  const charterMd = readFileSync(
    resolve(process.cwd(), "CHARTER.md"),
    "utf8",
  );
  const charterHtml = marked.parse(charterMd) as string;

  return (
    <div>
      <h1>METHODOLOGY</h1>
      <p className="page-intro">
        The mental model is <b>oracle diversity</b>: no single risk feed is
        canonical, the aggregation is the value, and a coverage gap is itself
        a signal. OpenRisk is a camera, not a judge.
      </p>

      <div className="box box-not">
        <span className="lbl" style={{ color: "var(--red)" }}>
          what openrisk does NOT do
        </span>
        <ul style={{ marginTop: 8 }}>
          <li>
            produce its own risk score, rating, ranking, or verdict —{" "}
            <b>there is no OpenRisk score, ever</b>
          </li>
          <li>average, weight, blend or otherwise combine feeds&apos; ratings</li>
          <li>translate any feed&apos;s vocabulary into another&apos;s</li>
          <li>tell you whether a protocol is &quot;safe&quot;</li>
          <li>hide a coverage gap behind a number</li>
        </ul>
      </div>
      <div className="box box-does">
        <span className="lbl" style={{ color: "var(--green)" }}>
          what openrisk does
        </span>
        <ul style={{ marginTop: 8 }}>
          <li>
            render each feed&apos;s published assessment <b>verbatim, in that
            feed&apos;s own vocabulary</b>, attributed and linked
          </li>
          <li>
            count coverage (a count of status values — never of rating values)
          </li>
          <li>sort and filter by TVL/volume — a market metric, not a rating</li>
          <li>archive every datum content-addressed, with a daily Merkle root</li>
          <li>accept corrections from anyone, via public PR</li>
        </ul>
      </div>

      <h2>Coverage gaps are data</h2>
      <p className="prose">
        A grey dash means <i>no feed in the registry has assessed this protocol
        yet</i> — a fact about the feeds, not a judgment about the protocol.
        Distinctly, <span className="cell-na">N/A</span> means the protocol is{" "}
        <i>outside a feed&apos;s declared scope</i> (Pharos rates stablecoins;
        DeFi Sphere scores lending markets) — those cells are excluded from
        coverage counts entirely. The clearest example on the seed list:
        Gearbox, listed since June 2026, is not yet assessed by any
        rating-producing feed — that empty row is one of the most informative
        rows on the site.
      </p>

      <h2>The four provenance tags</h2>
      <table className="data-table panel" style={{ maxWidth: 880 }}>
        <tbody>
          <tr>
            <td style={{ width: 130 }}>
              <ProvenanceTag tag="onchain" />
            </td>
            <td className="muted">
              read directly from chain or the Safe Transaction Service
            </td>
          </tr>
          <tr>
            <td>
              <ProvenanceTag tag="feed" />
            </td>
            <td className="muted">fetched from an automated external risk feed</td>
          </tr>
          <tr>
            <td>
              <ProvenanceTag tag="curated" />
            </td>
            <td className="muted">
              added or verified by a contributor via PR — requires source_url +
              source_date
            </td>
          </tr>
          <tr>
            <td>
              <ProvenanceTag tag="self-reported" />
            </td>
            <td className="muted">
              provided by the protocol team, not independently verified
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Feed registry — all {siteData.feeds.length} feeds</h2>
      <div className="panel" style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Feed</th>
              <th>Methodology</th>
              <th>Rating vocabulary (verbatim)</th>
              <th>Access</th>
              <th>Status</th>
              <th>Conflict disclosure</th>
            </tr>
          </thead>
          <tbody>
            {siteData.feeds.map((f) => (
              <tr key={f.key}>
                <td style={{ whiteSpace: "nowrap" }}>
                  <a href={f.url} target="_blank" rel="noopener noreferrer">
                    {f.display_name}
                  </a>
                  <div className="faint" style={{ fontSize: 10 }}>
                    {f.license}
                  </div>
                </td>
                <td className="muted" style={{ maxWidth: 260 }}>
                  {f.methodology}
                </td>
                <td className="muted" style={{ maxWidth: 240 }}>
                  {f.rating_vocabulary}
                </td>
                <td className="muted">
                  {f.access_method}
                  {f.api_key_required ? " · key" : ""}
                </td>
                <td className="muted">{TIER_LABEL[f.automation_tier]}</td>
                <td className="faint" style={{ maxWidth: 280 }}>
                  {f.conflict_of_interest || "none disclosed"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="faint" style={{ fontSize: 11, marginTop: 6 }}>
        Every registry entry carries a mandatory <code>conflict_of_interest</code>{" "}
        field — an absent field fails CI, which makes neutrality
        machine-auditable. Scope-limited feeds (Pharos: stablecoins · DeFi
        Sphere: lending markets) render N/A outside their scope.
      </p>

      <h2>Why these 20 protocols</h2>
      <p className="prose">
        The seed list is the RFP&apos;s hand-curated set — chosen for category
        coverage (lending, CDP, DEX, aggregation, yield, liquid staking), not
        raw TVL ranking. Hand-curation is itself disclosed methodology: a raw
        top-20 would churn weekly and double-count wrapped families.
      </p>

      <h2>Deferred feeds (phase 2)</h2>
      <ul className="prose" style={{ marginLeft: 18 }}>
        <li className="muted">
          <b>Anticapture</b> — column live; data lands once API access (via
          Blockful) is granted.
        </li>
        <li className="muted">
          <b>Credora by RedStone</b> — GraphQL whitelist pending; output will
          carry the publisher&apos;s alpha disclaimer.
        </li>
        <li className="muted">
          <b>Xerberus</b> — public REST unconfirmed after its v3.1.0 pivot;
          re-verification before automation.
        </li>
        <li className="muted">
          <b>YO (ex-Exponential.fi)</b> — risk graph live at yo.xyz with an
          x402 pay-per-request API; unsuited to free nightly automation, under
          evaluation.
        </li>
        <li className="muted">
          <b>RiskLayer</b> — excluded: inactive. <b>pigi.finance</b> —
          excluded: paid meta-aggregator re-presenting other feeds conflicts
          with verbatim provenance.
        </li>
      </ul>

      <h2>Contributing</h2>
      <p className="prose">
        All data lives in git; PRs are the write path. CI validates schemas,
        checksums and the no-composite gate on every change — see{" "}
        <a
          href="https://github.com/FarseenSh/openrisk/blob/main/CONTRIBUTING.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          CONTRIBUTING.md ↗
        </a>
        .
      </p>

      <h2>The charter, in full</h2>
      <p className="muted" style={{ fontSize: 12 }}>
        Rendered from{" "}
        <a
          href="https://github.com/FarseenSh/openrisk/blob/main/CHARTER.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          CHARTER.md ↗
        </a>{" "}
        (
        <a
          href="https://github.com/FarseenSh/openrisk/commits/main/CHARTER.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          change history ↗
        </a>
        ) — amending the core rule requires written agreement from the Ethereum
        Foundation.
      </p>
      <div className="charter-frame">
        <div className="prose" dangerouslySetInnerHTML={{ __html: charterHtml }} />
      </div>
    </div>
  );
}
