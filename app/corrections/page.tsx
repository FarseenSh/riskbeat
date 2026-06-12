import type { Metadata } from "next";
import { ProvenanceTag } from "@/components/ProvenanceTag";
import { siteData } from "@/lib/data-loader";
import type { OverlayEntry } from "@/lib/types";

export const metadata: Metadata = {
  title: "Corrections",
  description:
    "The live log of community corrections — every change to the data layer, attributed and sourced.",
};

const STATUS_COLOR: Record<OverlayEntry["status"], string> = {
  open: "var(--amber)",
  merged: "var(--green)",
  rejected: "var(--text-faint)",
  superseded: "var(--text-faint)",
};

export default function CorrectionsPage() {
  const overlays = siteData.overlays;
  const byProtocol = new Map<string, OverlayEntry[]>();
  for (const o of overlays) {
    byProtocol.set(o.protocol_slug, [
      ...(byProtocol.get(o.protocol_slug) ?? []),
      o,
    ]);
  }

  return (
    <div>
      <h1>CORRECTIONS</h1>
      <p className="page-intro">
        OpenRisk is community-correctable: anyone can correct a datum via pull
        request against <code>data/overlays/</code>. CI validates the schema,
        the source link and the no-composite gate; merged corrections render
        here and on the protocol page. The reviewers judge credibility — the
        machines judge syntax.
      </p>

      {overlays.length === 0 ? (
        <div className="gap-row">
          No corrections filed yet — the registry shipped on{" "}
          {siteData.generated_at.slice(0, 10)}. Found something wrong?{" "}
          <a
            href="https://github.com/FarseenSh/openrisk/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noopener noreferrer"
          >
            File the first correction ↗
          </a>
        </div>
      ) : (
        [...byProtocol.entries()].map(([slug, entries]) => (
          <div key={slug} style={{ marginBottom: 18 }}>
            <h2>
              <a href={`/protocol/${slug}`}>{slug}</a>
            </h2>
            <div className="panel">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Feed</th>
                    <th>Field</th>
                    <th>Change</th>
                    <th>Contributor</th>
                    <th>Date</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <b style={{ color: STATUS_COLOR[o.status] }}>
                          {o.status}
                        </b>
                      </td>
                      <td className="muted">{o.feed_key}</td>
                      <td className="muted">{o.field}</td>
                      <td className="muted">
                        {o.correction_type === "flag" ? (
                          <>
                            flagged <b>{o.flag}</b>: {o.flag_reason}
                          </>
                        ) : (
                          <>
                            {o.original_value && (
                              <s className="faint">{o.original_value}</s>
                            )}{" "}
                            → {o.corrected_value}
                          </>
                        )}{" "}
                        <ProvenanceTag tag={o.provenance_tag} />
                      </td>
                      <td className="muted">{o.contributor}</td>
                      <td className="faint">{o.date}</td>
                      <td>
                        <a
                          href={o.evidence_url ?? o.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          source ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      <h2>How to file one</h2>
      <pre>{`1. Fork github.com/FarseenSh/openrisk
2. Edit data/overlays/<protocol-slug>.json (see CONTRIBUTING.md for the schema)
3. Every entry needs: source_url + source_date + contributor ("github:you")
4. Open a PR — CI validates it; a merged entry appears here automatically`}</pre>
    </div>
  );
}
