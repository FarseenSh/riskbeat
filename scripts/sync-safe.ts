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
    appendNightlyLog({
      ts: new Date().toISOString(),
      feed: "safe-governance",
      status: "error",
      error: "all Safe reads failed",
    });
    console.error("sync-safe: all reads failed — previous snapshot preserved");
    process.exit(1);
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

main();
