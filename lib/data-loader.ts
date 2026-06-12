/**
 * Typed access to the compiled data bundle (lib/generated/site-data.json,
 * produced by scripts/build-data.ts from the git-native data layer).
 * Server-side only — pages pass plain props to client components.
 */
import type { FeedRegistryEntry } from "@/lib/registry";
import type { TvlSyncResult } from "@/lib/defillama";
import type { SafeSyncResult } from "@/lib/safe-api";
import type {
  FeedDatum,
  FeedSnapshot,
  OverlayEntry,
  ProtocolCoverage,
  ProtocolMeta,
} from "@/lib/types";
import type { FeedKey } from "@/lib/feed-keys";
import siteDataJson from "@/lib/generated/site-data.json";

export interface AssessmentInfo {
  exists: boolean;
  is_template: boolean;
  author: string | null;
  markdown: string | null;
}

export interface FeedMetaInfo {
  fetched_at: string | null;
  snapshot_file: string | null;
  snapshot_date: string | null;
  ok: boolean;
}

export interface NightlyLogLine {
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

export interface SiteData {
  generated_at: string;
  feeds: FeedRegistryEntry[];
  protocols: ProtocolMeta[];
  coverage: Record<string, ProtocolCoverage>;
  feed_data: Record<FeedKey, Record<string, FeedDatum[]>>;
  feed_meta: Record<string, FeedMetaInfo>;
  tvl_snapshot: TvlSyncResult | null;
  safe_snapshot: SafeSyncResult | null;
  provenance: {
    latest_root: { date: string; root: string; file_count: number } | null;
    log_tail: NightlyLogLine[];
  };
  overlays: OverlayEntry[];
  assessments: Record<string, AssessmentInfo>;
}

export const siteData = siteDataJson as unknown as SiteData;

export const protocolBySlug = (slug: string): ProtocolMeta | undefined =>
  siteData.protocols.find((p) => p.slug === slug);

export const feedByKey = (key: string): FeedRegistryEntry | undefined =>
  siteData.feeds.find((f) => f.key === key);

export const feedDataFor = (slug: string, key: FeedKey): FeedDatum[] =>
  siteData.feed_data[key]?.[slug] ?? [];

/** Snapshot used as fallback when live fetches fail at render time. */
export const fallbackTvl = (): TvlSyncResult | null => siteData.tvl_snapshot;
export const fallbackSafes = (): SafeSyncResult | null => siteData.safe_snapshot;

export type { FeedRegistryEntry, FeedSnapshot };
