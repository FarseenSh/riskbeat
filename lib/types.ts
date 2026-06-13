/**
 * RiskBeat core types.
 *
 * THE STRUCTURAL RULE (CHARTER.md §2, enforced 4 ways — see ci.yml,
 * eslint-rules/no-cross-feed-render.js):
 *
 * Every feed gets its OWN datum interface in its OWN vocabulary. There is no
 * shared numeric/score supertype and no field common to all variants that
 * holds a rating — so no function can average, weight or blend across feeds
 * without a type error. `FeedDatum` is the only type that crosses feed
 * boundaries, and it is a discriminated union on `feed_key`.
 */
import type { AutomatedFeedKey, FeedKey } from "@/lib/feed-keys";

export type CoverageStatus =
  | "covered"
  | "partial"
  | "not-applicable"
  | "not-yet-covered";

export type ProvenanceTag = "onchain" | "feed" | "curated" | "self-reported";

export type AutomationTier = "full" | "partial" | "manual-only";

export type RiskLevel = "L" | "M" | "H";

/* ————————————————————————— DeFiScan ————————————————————————— */

export const DEFISCAN_DIMENSIONS = [
  "chain",
  "upgradeability",
  "autonomy",
  "exit_window",
  "accessibility",
] as const;
export type DefiscanDimension = (typeof DEFISCAN_DIMENSIONS)[number];

export interface DefiscanDatum {
  feed_key: "defiscan";
  /** DeFiScan's own protocol directory slug (its assessment unit). */
  defiscan_id: string;
  /** DeFiScan's own display name for the reviewed protocol, e.g. "Aave v3". */
  protocol_label: string;
  /** DefiLlama slugs the review declares it covers (from its data.json). */
  covered_llama_slugs: string[];
  /** Integer stage from frontmatter; "O" when the review uses a non-stage marker. */
  stage: number | "O";
  /** Per-dimension risk levels, mapped from the ordered `risks` array. */
  risks: Partial<Record<DefiscanDimension, RiskLevel>>;
  reasons: string[];
  publish_date?: string;
  update_date?: string;
  source_url: string;
  fetched_at: string;
  provenance: "feed";
}

/* ————————————————————————— DeFiPunk'd ————————————————————————— */

export const DEFIPUNKD_SLICES = [
  "control",
  "ability-to-exit",
  "autonomy",
  "open-access",
  "verifiability",
] as const;
export type DefipunkdSlice = (typeof DEFIPUNKD_SLICES)[number];

export interface DefipunkdSliceAssessment {
  slice: DefipunkdSlice;
  consensus_grade: "green" | "orange" | "red" | "unknown";
  consensus_strength: "weak" | "strong" | null;
  short_headline: string;
  merged_at: string | null;
}

export interface DefipunkdDatum {
  feed_key: "defipunkd";
  /** DeFiPunk'd's own assessment slug (its unit; often versioned). */
  punkd_slug: string;
  /** Published slices, verbatim. RiskBeat derives no tier from slice counts. */
  slices: DefipunkdSliceAssessment[];
  source_url: string;
  fetched_at: string;
  provenance: "feed";
}

/* ————————————————————————— Philidor ————————————————————————— */

export interface PhilidorVault {
  name: string;
  address: string;
  total_score: number;
  risk_tier: "Prime" | "Core" | "Edge" | (string & {});
  tvl_usd: number | null;
  asset_symbol: string | null;
  curator_name: string | null;
  protocol_version: string | null;
  last_synced_at: string | null;
}

export interface PhilidorDatum {
  feed_key: "philidor";
  /** Philidor's own protocol id (lowercase, unversioned). */
  protocol_id: string;
  /** Total Ethereum vaults Philidor tracks for this protocol. */
  vault_count_total: number;
  /** Archived subset (top by TVL); each vault scored verbatim. */
  vaults: PhilidorVault[];
  source_url: string;
  fetched_at: string;
  provenance: "feed";
}

/* ————————————————————————— Pharos ————————————————————————— */

/** Verbatim band vocabulary as served by /api/stress-signals (observed live). */
export type PharosDewsBand = "CALM" | "WATCH" | "ALERT" | "WARNING" | "DANGER";

export interface PharosDatum {
  feed_key: "pharos";
  /** Pharos's own stablecoin id, e.g. "gho-aave". */
  coin_id: string;
  coin_symbol: string;
  coin_name: string;
  /** Verbatim safety grade: "A+".."F" | "NR". */
  overall_grade: string;
  /** Verbatim per-dimension grades/scores as published. */
  dimensions: Record<string, { grade: string | null; score: number | null }>;
  dews_band: PharosDewsBand | null;
  dews_score: number | null;
  is_defunct: boolean;
  source_url: string;
  fetched_at: string;
  provenance: "feed";
}

/* ——————————————————————— DefiLlama Hacks ——————————————————————— */

export interface HackEvent {
  /** ISO date derived from the feed's epoch-seconds `date`. */
  date: string;
  /** The feed's `amount` field (USD). */
  amount_usd: number | null;
  name: string;
  technique: string | null;
  classification: string | null;
  returned_funds: number | null;
  source_url: string | null;
}

export interface HacksDatum {
  feed_key: "defillama-hacks";
  events: HackEvent[];
  matched_by: ("defillama-id" | "name-pattern")[];
  source_url: string;
  fetched_at: string;
  provenance: "feed";
}

/* ————————————————————————— DeFi Sphere ————————————————————————— */

export interface SphereMarket {
  pool_id: string;
  name: string;
  /** Sphere's own protocol identifier, e.g. "aave_v3_core". */
  sphere_protocol: string;
  underlying_symbol: string | null;
  collateral_symbol: string | null;
  collateral_risk_score: number | null;
  liquidity_risk_score: number | null;
  total_supply_usd: number | null;
}

export interface DefiSphereDatum {
  feed_key: "defisphere";
  sphere_protocols: string[];
  /** Archived subset (top by supply); scores verbatim. */
  markets: SphereMarket[];
  market_count_total: number;
  source_url: string;
  fetched_at: string;
  provenance: "feed";
}

/* ——————————————— Generic curated datum (manual feeds) ——————————————— */

export interface GenericCuratedDatum {
  /** Manual/registry feeds only — automated feeds have their own typed datum,
   *  which keeps the union discriminable on feed_key. */
  feed_key: Exclude<FeedKey, AutomatedFeedKey>;
  /** The feed's published rating, verbatim, as free text. */
  raw_value: string;
  value_label?: string;
  source_url: string;
  source_date: string;
  contributor: string;
  provenance: "curated";
}

/* ————————————————————————— The union ————————————————————————— */

export type FeedDatum =
  | DefiscanDatum
  | DefipunkdDatum
  | PhilidorDatum
  | PharosDatum
  | HacksDatum
  | DefiSphereDatum
  | GenericCuratedDatum;

/* ————————————————— Protocol registry (data/protocols) ————————————————— */

export interface ProtocolVersion {
  label: string;
  slug: string;
  /** DefiLlama numeric id (used for hacks matching). */
  id: number | null;
}

export interface VerifiedSafe {
  label: string;
  address: string;
  role: string;
  /** Live-verified via the Safe Transaction Service at authoring time. */
  threshold: number | null;
  owners: number | null;
}

export interface GovernanceInfo {
  model:
    | "governor-timelock"
    | "safe-multisig"
    | "aragon-dao"
    | "token-dao"
    | "immutable"
    | "registry"
    | "hybrid";
  note: string;
  governance_contract?: { label: string; address: string };
  safes: VerifiedSafe[];
  timelock: string | null;
  forum_url: string | null;
}

export interface LabeledAddress {
  label: string;
  address: string;
}

export interface TokenInfo {
  symbol: string;
  address: string;
}

export interface StablecoinInfo {
  symbol: string;
  address: string;
  /** Pharos's own coin id when listed there; null = not listed by Pharos. */
  pharos_id: string | null;
}

export interface AuditEntry {
  firm: string;
  year: string;
  url?: string;
  scope?: string;
}

export interface FeedMappings {
  defiscan?: { ids: string[] };
  defipunkd?: { slugs: string[] };
  philidor?: { protocol_id: string; relation: "native" | "markets" };
  defisphere?: { sphere_protocols: string[] };
}

export interface HackMatch {
  ids: number[];
  name_patterns: string[];
}

export interface ProtocolMeta {
  slug: string;
  name: string;
  display_name: string;
  chain: "ethereum";
  category:
    | "lending"
    | "cdp"
    | "dex"
    | "swap-aggregator"
    | "yield"
    | "liquid-staking"
    | "capital-allocator";
  website: string;
  description: string;
  defillama: {
    versions: ProtocolVersion[];
    volume_only: boolean;
    /** DefiLlama volume-overview display names (volume_only protocols). */
    volume_names?: string[];
    /** Honest gap: no usable standalone DefiLlama entry (e.g. Morpho Vaults). */
    tvl_note?: string;
  };
  governance: GovernanceInfo;
  addresses: LabeledAddress[];
  tokens: TokenInfo[];
  stablecoins: StablecoinInfo[];
  audits: AuditEntry[];
  feeds: FeedMappings;
  hack_match: HackMatch;
  notes?: string[];
  last_manual_review: string;
  added_by: string;
}

/* ————————————————— Coverage (computed, never authored) ————————————————— */

export interface CoverageCell {
  status: CoverageStatus;
  /** Short inline detail for charter-permitted inline labels (e.g. "Stage 0"). */
  inline?: string;
  /** Why a cell is N/A or partial — surfaced as a tooltip/scope note. */
  note?: string;
}

export interface ProtocolCoverage {
  slug: string;
  cells: Record<FeedKey, CoverageCell>;
  /** COUNT of cells with an assessment (covered|partial). Never reads rating values. */
  feeds_with_assessments: number;
  /** Denominator after excluding out-of-scope (not-applicable) cells. */
  applicable_feeds: number;
}

/* ————————————————— Overlays (community corrections) ————————————————— */

export interface OverlayEntry {
  id: string;
  protocol_slug: string;
  feed_key: FeedKey;
  field: string;
  original_value?: string;
  corrected_value?: string;
  correction_type: "add" | "update" | "flag" | "deprecate";
  flag?: string;
  flag_reason?: string;
  evidence_url?: string;
  source_url: string;
  source_date: string;
  contributor: string;
  date: string;
  provenance_tag: ProvenanceTag;
  status: "open" | "merged" | "rejected" | "superseded";
}

/* ————————————————— Feed snapshots (content-addressed cache) ————————————————— */

export interface FeedSnapshot {
  feed_key: FeedKey;
  fetched_at: string;
  source: string;
  ok: boolean;
  error?: string;
  /** protocol slug → data published by this feed (empty array = none). */
  data: Record<string, FeedDatum[]>;
}

/* ————————————————— Live layers (TVL / governance) ————————————————— */

export interface TvlPoint {
  /** Ethereum-chain TVL (or 24h/30d volume for volume_only protocols). */
  value: number | null;
  kind: "tvl" | "volume-24h" | "volume-30d";
  as_of: string;
  is_stale: boolean;
  per_version: { label: string; slug: string; value: number | null }[];
}

export interface SafeStatus {
  address: string;
  threshold: number | null;
  owners: string[] | null;
  version: string | null;
  as_of: string;
  is_stale: boolean;
  error?: string;
}
