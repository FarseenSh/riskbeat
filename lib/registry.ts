/**
 * Loads the git-native registries (protocols, feeds, overlays) from data/.
 * Node-side only — pages consume the compiled bundle via lib/data-loader.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import yaml from "js-yaml";
import type { OverlayEntry, ProtocolMeta } from "@/lib/types";

const ROOT = resolve(import.meta.dirname, "..");

export interface FeedRegistryEntry {
  key: string;
  display_name: string;
  url: string;
  source_url: string;
  license: string;
  access_method: "github_raw" | "rest_api" | "scrape" | "manual";
  machine_readable: boolean;
  api_key_required: boolean;
  automation_tier: "full" | "partial" | "manual-only";
  status: "active" | "partial" | "manual" | "deprecated";
  provenance_tag: "onchain" | "feed" | "curated" | "self-reported";
  methodology: string;
  rating_vocabulary: string;
  rating_kind: string;
  inline_label: boolean;
  scope_note: string;
  conflict_of_interest: string;
}

export function loadFeedRegistry(): FeedRegistryEntry[] {
  const doc = yaml.load(
    readFileSync(resolve(ROOT, "data/feeds/feeds.yaml"), "utf8"),
  ) as { feeds: FeedRegistryEntry[] };
  return doc.feeds;
}

export function loadProtocols(): ProtocolMeta[] {
  const dir = resolve(ROOT, "data/protocols");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => yaml.load(readFileSync(resolve(dir, f), "utf8")) as ProtocolMeta)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export function loadOverlays(): OverlayEntry[] {
  const dir = resolve(ROOT, "data/overlays");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .flatMap(
      (f) =>
        JSON.parse(readFileSync(resolve(dir, f), "utf8")) as OverlayEntry[],
    );
}
