/**
 * Archives a nightly Safe Transaction Service snapshot (threshold/owners per
 * governance Safe) — the static fallback behind the live ISR layer.
 */
import { loadProtocols } from "@/lib/registry";
import { fetchSafeStatuses, SAFE_API_BASE } from "@/lib/safe-api";
import { appendNightlyLog, pruneSnapshots, writeSnapshot } from "@/lib/fetch-util";

async function main() {
  const protocols = loadProtocols();
  const sync = await fetchSafeStatuses(protocols);
  const live = Object.values(sync.by_address).filter((s) => !s.is_stale).length;
  const total = Object.keys(sync.by_address).length;
  if (live === 0 && total > 0) {
    // All upstream reads failed (Safe Transaction Service down or rate-limited).
    // This is a recoverable, EXPECTED condition — not a build failure. We write
    // no new snapshot, so the previous good one stays and renders stale-but-
    // honest; returning (exit 0) lets the nightly still commit the feeds/TVL
    // that DID update this run. Exiting non-zero here would skip the commit.
    appendNightlyLog({
      ts: new Date().toISOString(),
      feed: "safe-governance",
      status: "error",
      error: "all Safe reads failed",
    });
    console.error(
      "sync-safe: all reads failed — previous snapshot preserved (non-fatal)",
    );
    return;
  }
  const archive = writeSnapshot("safe-governance", sync);
  pruneSnapshots("safe-governance");
  appendNightlyLog({
    ts: new Date().toISOString(),
    feed: "safe-governance",
    status: "ok",
    url: SAFE_API_BASE,
    file: archive.file,
    sha256: archive.sha256,
    bytes: archive.bytes,
  });
  console.log(`sync-safe: ${live}/${total} safes live → ${archive.file}`);
}

main().catch((err) => {
  // A crash here must not abort the nightly run — feeds already archived
  // this night still get committed; the previous Safe snapshot stays live.
  appendNightlyLog({
    ts: new Date().toISOString(),
    feed: "safe-governance",
    status: "error",
    error: err instanceof Error ? err.message : String(err),
  });
  console.error("sync-safe: failed —", err);
});
