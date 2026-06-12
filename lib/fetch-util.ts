/**
 * Shared fetch/archive utilities for the feed pipeline.
 *
 * Snapshots are content-addressed: data/cache/{feed}/{YYYY-MM-DD}-{sha256}.json
 * where the hash is over the canonical file bytes — so any datum shown on the
 * site can be re-derived from a `git clone` and the day's Merkle root
 * (scripts/compute-merkle-root.ts, surfaced at /verify).
 */
import { createHash } from "node:crypto";
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve } from "node:path";

export const REPO_ROOT = resolve(import.meta.dirname, "..");
export const CACHE_DIR = resolve(REPO_ROOT, "data/cache");
export const PROVENANCE_DIR = resolve(REPO_ROOT, "data/provenance");

export function sha256Hex(input: string | Buffer): string {
  return createHash("sha256").update(input).digest("hex");
}

export function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface FetchJsonOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  retries?: number;
}

/** fetch + JSON with timeout, retry and exponential backoff. Throws on !ok. */
export async function fetchJson<T = unknown>(
  url: string,
  { headers = {}, timeoutMs = 25_000, retries = 2 }: FetchJsonOptions = {},
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      if (res.status === 404) {
        clearTimeout(timer);
        const err = new Error(`404 ${url}`) as Error & { status?: number };
        err.status = 404;
        throw err;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      const json = (await res.json()) as T;
      clearTimeout(timer);
      return json;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if ((err as { status?: number }).status === 404) throw err;
      if (attempt < retries)
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1) ** 2));
    }
  }
  throw lastError;
}

export async function fetchText(
  url: string,
  { headers = {}, timeoutMs = 25_000, retries = 2 }: FetchJsonOptions = {},
): Promise<string | null> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timer);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return await res.text();
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
      if (attempt < retries)
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1) ** 2));
    }
  }
  throw lastError;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GitHub raw auth headers when GITHUB_TOKEN is present (raises rate limits). */
export function githubHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ArchiveResult {
  file: string;
  sha256: string;
  bytes: number;
  reused: boolean;
}

/** Write a content-addressed snapshot; identical content is never duplicated. */
export function writeSnapshot(feedDir: string, payload: unknown): ArchiveResult {
  const dir = resolve(CACHE_DIR, feedDir);
  mkdirSync(dir, { recursive: true });
  const body = JSON.stringify(payload, null, 1);
  const hash = sha256Hex(body);
  const file = `${utcDate()}-${hash}.json`;
  const path = resolve(dir, file);
  const reused = existsSync(path);
  if (!reused) writeFileSync(path, body);
  return { file: `${feedDir}/${file}`, sha256: hash, bytes: Buffer.byteLength(body), reused };
}

/** Keep only the most recent N snapshots per feed directory. */
export function pruneSnapshots(feedDir: string, keep = 30): string[] {
  const dir = resolve(CACHE_DIR, feedDir);
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}-[0-9a-f]{64}\.json$/.test(f))
    .sort();
  const drop = files.slice(0, Math.max(0, files.length - keep));
  for (const f of drop) rmSync(resolve(dir, f));
  return drop;
}

/** Latest snapshot for a feed directory: newest date, mtime tie-break for
 *  same-day refetches (hash order is not temporal). */
export function latestSnapshot<T = unknown>(
  feedDir: string,
): { payload: T; file: string; date: string } | null {
  const dir = resolve(CACHE_DIR, feedDir);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}-[0-9a-f]{64}\.json$/.test(f))
    .sort(
      (a, b) =>
        a.slice(0, 10).localeCompare(b.slice(0, 10)) ||
        statSync(resolve(dir, a)).mtimeMs - statSync(resolve(dir, b)).mtimeMs,
    );
  const file = files.at(-1);
  if (!file) return null;
  return {
    payload: JSON.parse(readFileSync(resolve(dir, file), "utf8")) as T,
    file: `${feedDir}/${file}`,
    date: file.slice(0, 10),
  };
}

export interface NightlyLogEntry {
  ts: string;
  feed: string;
  status: "ok" | "error" | "skipped";
  url?: string;
  file?: string;
  sha256?: string;
  bytes?: number;
  protocols_with_data?: number;
  error?: string;
  reason?: string;
}

export function appendNightlyLog(entry: NightlyLogEntry): void {
  mkdirSync(PROVENANCE_DIR, { recursive: true });
  appendFileSync(
    resolve(PROVENANCE_DIR, "nightly-log.jsonl"),
    JSON.stringify(entry) + "\n",
  );
}
