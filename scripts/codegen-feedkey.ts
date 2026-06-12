/**
 * Generates lib/feed-keys.ts from data/feeds/feeds.yaml so the FeedKey type
 * can never drift from the registry. CI runs `--check` and fails on drift.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import yaml from "js-yaml";

const ROOT = resolve(import.meta.dirname, "..");
const REGISTRY = resolve(ROOT, "data/feeds/feeds.yaml");
const OUT = resolve(ROOT, "lib/feed-keys.ts");

interface FeedEntry {
  key: string;
  automation_tier: "full" | "partial" | "manual-only";
  status: string;
}

const doc = yaml.load(readFileSync(REGISTRY, "utf8")) as { feeds: FeedEntry[] };
if (!doc?.feeds?.length) {
  console.error("codegen-feedkey: no feeds found in registry");
  process.exit(1);
}

const keys = doc.feeds.map((f) => f.key);
const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
if (dupes.length) {
  console.error(`codegen-feedkey: duplicate keys: ${dupes.join(", ")}`);
  process.exit(1);
}

const automated = doc.feeds
  .filter((f) => f.automation_tier === "full" && f.status === "active")
  .map((f) => f.key);

const lines = [
  "// AUTO-GENERATED from data/feeds/feeds.yaml — do not edit by hand.",
  "// Regenerate with `pnpm codegen`; CI fails if this file drifts from the registry.",
  "",
  `export const FEED_KEYS = [${keys.map((k) => JSON.stringify(k)).join(", ")}] as const;`,
  "export type FeedKey = (typeof FEED_KEYS)[number];",
  "",
  "/** Feeds fetched nightly by automation (automation_tier: full, status: active). */",
  `export const AUTOMATED_FEED_KEYS = [${automated.map((k) => JSON.stringify(k)).join(", ")}] as const;`,
  "export type AutomatedFeedKey = (typeof AUTOMATED_FEED_KEYS)[number];",
  "",
];
const content = lines.join("\n");

if (process.argv.includes("--check")) {
  let existing = "";
  try {
    existing = readFileSync(OUT, "utf8");
  } catch {
    console.error("codegen-feedkey --check: lib/feed-keys.ts missing — run `pnpm codegen`");
    process.exit(1);
  }
  if (existing !== content) {
    console.error("codegen-feedkey --check: lib/feed-keys.ts is stale vs feeds.yaml — run `pnpm codegen` and commit");
    process.exit(1);
  }
  console.log(`codegen-feedkey --check: in sync (${keys.length} feeds, ${automated.length} automated)`);
} else {
  writeFileSync(OUT, content);
  console.log(`codegen-feedkey: wrote lib/feed-keys.ts (${keys.length} feeds, ${automated.length} automated)`);
}
