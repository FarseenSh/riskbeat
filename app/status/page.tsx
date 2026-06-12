import type { Metadata } from "next";
import { siteData } from "@/lib/data-loader";

export const metadata: Metadata = {
  title: "Feed health",
  description:
    "Operational status of every automated feed: last fetch, archive file, and the full provenance log tail.",
};

export default function StatusPage() {
  const automated = siteData.feeds.filter(
    (f) => f.automation_tier === "full" && f.status === "active",
  );

  return (
    <div>
      <h1>FEED HEALTH</h1>
      <p className="page-intro">
        Operational truth for the automated pipeline. A failed or skipped fetch
        never invents data — the previous snapshot stays in place and cells
        render stale or not-yet-covered.
      </p>

      <div className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Feed</th>
              <th>Last successful fetch (UTC)</th>
              <th>Snapshot</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {automated.map((f) => {
              const meta = siteData.feed_meta[f.key];
              const ok = Boolean(meta?.ok && meta?.fetched_at);
              return (
                <tr key={f.key}>
                  <td>{f.display_name}</td>
                  <td className="muted">
                    {meta?.fetched_at
                      ? meta.fetched_at.slice(0, 19).replace("T", " ")
                      : "—"}
                  </td>
                  <td className="faint" style={{ maxWidth: 420, wordBreak: "break-all" }}>
                    {meta?.snapshot_file ? (
                      <a
                        href={`https://github.com/FarseenSh/openrisk/blob/main/${meta.snapshot_file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {meta.snapshot_file.split("/").pop()}
                      </a>
                    ) : (
                      "no snapshot yet"
                    )}
                  </td>
                  <td>
                    {ok ? (
                      <span className="green">● archived</span>
                    ) : f.key === "pharos" ? (
                      <span className="amber" title="Free self-serve key — cells render not-yet-covered until the first keyed fetch">
                        ◌ awaiting API key
                      </span>
                    ) : (
                      <span className="amber">◌ no snapshot</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2>Provenance log (latest {siteData.provenance.log_tail.length} entries)</h2>
      <div className="panel" style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ts (UTC)</th>
              <th>feed</th>
              <th>status</th>
              <th>detail</th>
            </tr>
          </thead>
          <tbody>
            {[...siteData.provenance.log_tail].reverse().map((l, i) => (
              <tr key={i}>
                <td className="faint" style={{ whiteSpace: "nowrap" }}>
                  {l.ts.slice(0, 19).replace("T", " ")}
                </td>
                <td className="muted">{l.feed}</td>
                <td>
                  <span
                    className={
                      l.status === "ok"
                        ? "green"
                        : l.status === "skipped"
                          ? "amber"
                          : ""
                    }
                    style={l.status === "error" ? { color: "var(--red)" } : {}}
                  >
                    {l.status}
                  </span>
                </td>
                <td className="faint" style={{ maxWidth: 560, wordBreak: "break-all" }}>
                  {l.status === "ok"
                    ? `${l.protocols_with_data ?? "—"} protocols · ${l.bytes ?? "—"}b · ${l.sha256?.slice(0, 16)}…`
                    : (l.error ?? l.reason ?? "")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="faint" style={{ fontSize: 11, marginTop: 6 }}>
        Full log: <code>data/provenance/nightly-log.jsonl</code> · nightly cron
        03:17 UTC via GitHub Actions.
      </p>
    </div>
  );
}
