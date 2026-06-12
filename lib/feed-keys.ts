// AUTO-GENERATED from data/feeds/feeds.yaml — do not edit by hand.
// Regenerate with `pnpm codegen`; CI fails if this file drifts from the registry.

export const FEED_KEYS = ["defiscan", "defipunkd", "philidor", "pharos", "defillama-hacks", "defisphere", "anticapture", "credora", "xerberus", "llamarisk", "gauntlet", "defisafety"] as const;
export type FeedKey = (typeof FEED_KEYS)[number];

/** Feeds fetched nightly by automation (automation_tier: full, status: active). */
export const AUTOMATED_FEED_KEYS = ["defiscan", "defipunkd", "philidor", "pharos", "defillama-hacks", "defisphere"] as const;
export type AutomatedFeedKey = (typeof AUTOMATED_FEED_KEYS)[number];
