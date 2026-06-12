/**
 * Read-side access to the FULL content-addressed archive (every dated
 * snapshot, not just the latest) for the /api/v0/history endpoint.
 *
 * Same tie-break rule as latestSnapshot: when a date has multiple
 * content-addressed files for one feed (intra-day refetches), the most
 * recently written file is that day's record; earlier files remain in the
 * archive and under the day's Merkle root.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import type { FeedDatum, FeedSnapshot } from "@/lib/types";
import { AUTOMATED_FEED_KEYS, type AutomatedFeedKey } from "@/lib/feed-keys";

const ROOT = process.cwd();
const CACHE = resolve(ROOT, "data/cache");
const ROOTS = resolve(ROOT, "data/provenance/roots.jsonl");

export interface DailyRoot {
  date: string;
  root: string;
  file_count: number;
}

export function rootsByDate(): Map<string, DailyRoot> {
  const out = new Map<string, DailyRoot>();
  if (!existsSync(ROOTS)) return out;
  for (const line of readFileSync(ROOTS, "utf8").split("\n").filter(Boolean)) {
    const r = JSON.parse(line) as DailyRoot;
    out.set(r.date, r); // later lines win — same upsert semantics as compute
  }
  return out;
}

interface DatedFile {
  date: string;
  path: string;
  mtime: number;
}

function datedFiles(feed: AutomatedFeedKey): DatedFile[] {
  const dir = resolve(CACHE, feed);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}-[0-9a-f]{64}\.json$/.test(f))
    .map((f) => ({
      date: f.slice(0, 10),
      path: resolve(dir, f),
      mtime: statSync(resolve(dir, f)).mtimeMs,
    }));
}

export interface HistoryDay {
  date: string;
  merkle_root: string | null;
  feeds: Partial<
    Record<AutomatedFeedKey, { fetched_at: string; datums: FeedDatum[] }>
  >;
}

/** Per-protocol time series across the whole archive, oldest date first. */
export function protocolHistory(slug: string): HistoryDay[] {
  const roots = rootsByDate();
  const days = new Map<string, HistoryDay>();

  for (const feed of AUTOMATED_FEED_KEYS) {
    // newest file per (feed, date)
    const byDate = new Map<string, DatedFile>();
    for (const f of datedFiles(feed)) {
      const prev = byDate.get(f.date);
      if (!prev || f.mtime > prev.mtime) byDate.set(f.date, f);
    }
    for (const [date, file] of byDate) {
      const snap = JSON.parse(readFileSync(file.path, "utf8")) as FeedSnapshot;
      const datums = snap.data?.[slug] ?? [];
      if (datums.length === 0) continue;
      const day = days.get(date) ?? {
        date,
        merkle_root: roots.get(date)?.root ?? null,
        feeds: {},
      };
      day.feeds[feed] = { fetched_at: snap.fetched_at, datums };
      days.set(date, day);
    }
  }

  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function archiveBegins(): string | null {
  let min: string | null = null;
  for (const feed of AUTOMATED_FEED_KEYS)
    for (const f of datedFiles(feed))
      if (!min || f.date < min) min = f.date;
  return min;
}
