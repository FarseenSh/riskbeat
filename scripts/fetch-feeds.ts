/**
 * Nightly feed orchestrator: runs all six automated fetchers, archives each
 * result content-addressed under data/cache/{feed}/, appends the provenance
 * log, and prunes to a 30-snapshot rolling window per feed.
 *
 * Failure semantics: a failed/skipped feed writes NO snapshot — the previous
 * good snapshot stays in place and the site renders it with its original
 * fetched_at (stale, never invented). Exit code stays 0 unless every feed
 * fails (so one flaky upstream never breaks the nightly commit of the rest).
 */
import { loadProtocols } from "@/lib/registry";
import {
  appendNightlyLog,
  pruneSnapshots,
  writeSnapshot,
} from "@/lib/fetch-util";
import type { FeedSnapshot, ProtocolMeta } from "@/lib/types";
import { fetchDefiscan } from "@/lib/feed-fetchers/defiscan";
import { fetchDefipunkd } from "@/lib/feed-fetchers/defipunkd";
import { fetchPhilidor } from "@/lib/feed-fetchers/philidor";
import { fetchPharos } from "@/lib/feed-fetchers/pharos";
import { fetchHacks } from "@/lib/feed-fetchers/defillama-hacks";
import { fetchDefisphere } from "@/lib/feed-fetchers/defisphere";

const FETCHERS: [string, (p: ProtocolMeta[]) => Promise<FeedSnapshot>][] = [
  ["defiscan", fetchDefiscan],
  ["defipunkd", fetchDefipunkd],
  ["philidor", fetchPhilidor],
  ["pharos", fetchPharos],
  ["defillama-hacks", fetchHacks],
  ["defisphere", fetchDefisphere],
];

const only = process.argv
  .find((a) => a.startsWith("--only="))
  ?.slice("--only=".length);

async function main() {
  const protocols = loadProtocols();
  console.log(`fetch-feeds: ${protocols.length} protocols`);
  let okCount = 0;

  for (const [key, fetcher] of FETCHERS) {
    if (only && key !== only) continue;
    const started = Date.now();
    try {
      const snapshot = await fetcher(protocols);
      if (!snapshot.ok) {
        console.warn(`  ◌ ${key}: skipped — ${snapshot.error}`);
        appendNightlyLog({
          ts: new Date().toISOString(),
          feed: key,
          status: "skipped",
          reason: snapshot.error,
        });
        continue;
      }
      const withData = Object.values(snapshot.data).filter(
        (d) => d.length > 0,
      ).length;
      const archive = writeSnapshot(key, snapshot);
      pruneSnapshots(key);
      appendNightlyLog({
        ts: new Date().toISOString(),
        feed: key,
        status: "ok",
        url: snapshot.source,
        file: archive.file,
        sha256: archive.sha256,
        bytes: archive.bytes,
        protocols_with_data: withData,
      });
      okCount++;
      console.log(
        `  ✓ ${key}: ${withData}/${protocols.length} protocols with data, ${archive.bytes}b → ${archive.file}${archive.reused ? " (content unchanged)" : ""} [${Date.now() - started}ms]`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${key}: ${message} — previous snapshot preserved`);
      appendNightlyLog({
        ts: new Date().toISOString(),
        feed: key,
        status: "error",
        error: message,
      });
    }
  }

  if (okCount === 0 && !only) {
    console.error("fetch-feeds: every feed failed");
    process.exit(1);
  }
  console.log(`fetch-feeds: done (${okCount} feeds archived)`);
}

main();
