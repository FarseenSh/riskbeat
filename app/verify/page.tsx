import type { Metadata } from "next";
import { siteData } from "@/lib/data-loader";

export const metadata: Metadata = {
  title: "Verify",
  description:
    "Reproduce any day's data root from a git clone — every feed datum is content-addressed and the daily Merkle root is committed.",
};

export default function VerifyPage() {
  const root = siteData.provenance.latest_root;

  return (
    <div>
      <h1>VERIFY</h1>
      <p className="page-intro">
        Trust nothing; reproduce it. Every nightly fetch is archived
        content-addressed (<code>data/cache/{"{feed}"}/{"{date}"}-{"{sha256}"}.json</code>),
        the day&apos;s Merkle root is committed to{" "}
        <code>data/provenance/roots.jsonl</code>, and both live in the public
        git history — so &quot;what did the feeds say on date X?&quot; has a
        cryptographic answer, forever. When a protocol fails, anyone can
        reconstruct what every feed said the day before.
      </p>

      <div className="panel" style={{ padding: 14, marginBottom: 18 }}>
        <span className="lbl">latest committed root</span>
        {root ? (
          <>
            <div
              className="green"
              style={{ fontSize: 14, margin: "6px 0", wordBreak: "break-all" }}
            >
              {root.root}
            </div>
            <span className="faint">
              {root.date} · {root.file_count} archive files ·{" "}
              <a
                href="https://github.com/FarseenSh/openrisk/blob/main/data/provenance/roots.jsonl"
                target="_blank"
                rel="noopener noreferrer"
              >
                roots.jsonl ↗
              </a>
            </span>
          </>
        ) : (
          <div className="muted">first nightly root pending</div>
        )}
      </div>

      <h2>Reproduce it (one command)</h2>
      <pre>{`git clone https://github.com/FarseenSh/openrisk
cd openrisk && pnpm install
pnpm merkle:verify ${root?.date ?? "YYYY-MM-DD"}
# → VERIFIED ${root?.date ?? "YYYY-MM-DD"}: ${root ? `${root.root.slice(0, 24)}…` : "<root>"}`}</pre>

      <h2>The tree, precisely</h2>
      <pre>{`files  = every file under data/cache/ named <date>-<sha256>.json for the date being verified, sorted by relative path (bytewise)
leaf_i = sha256( relpath_i + "\\n" + file_bytes_i )
parent = sha256( left_digest || right_digest )   # raw 32-byte concat
         (odd node count → last node duplicated)
root   = hex(final digest)        # appended nightly to data/provenance/roots.jsonl`}</pre>
      <p className="prose muted">
        Implementation: <code>scripts/compute-merkle-root.ts</code> (~80 lines,
        no dependencies beyond Node&apos;s crypto). Independent implementations
        are encouraged — if you find a mismatch, that is a finding:{" "}
        <a
          href="https://github.com/FarseenSh/openrisk/issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          open an issue ↗
        </a>
        .
      </p>

      <h2>What this buys</h2>
      <ul className="prose" style={{ marginLeft: 18 }}>
        <li className="muted">
          <b>Tamper-evidence</b> — silently rewriting an archived datum changes
          the root; the mismatch is mechanically detectable from any clone.
        </li>
        <li className="muted">
          <b>Point-in-time accountability</b> — each snapshot records what each
          feed published, with <code>fetched_at</code>, source URL and content
          hash.
        </li>
        <li className="muted">
          <b>No trust in our hosting</b> — the deployed site is a pure function
          of the public repo; rebuild it yourself with{" "}
          <code>pnpm install && pnpm build</code>.
        </li>
      </ul>

      <h2>Provenance log</h2>
      <p className="prose muted">
        Every fetch attempt (including failures and skips) is appended to{" "}
        <code>data/provenance/nightly-log.jsonl</code> — fetch failures keep
        the previous snapshot and mark cells stale rather than inventing data.
        See the <a href="/status">feed health page</a> for the current state.
      </p>
    </div>
  );
}
