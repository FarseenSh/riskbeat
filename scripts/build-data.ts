/**
 * Compiles the git-native data layer into lib/generated/site-data.json,
 * consumed by every page via lib/data-loader.ts. Runs before `next build`
 * and `next dev` — git stays the database; this is just the build artifact.
 *
 * COVERAGE RULES (per CHARTER.md — status is about feed coverage, never a
 * judgment about the protocol):
 *   covered          the feed has assessed this protocol (all versions, or
 *                    a family-level assessment)
 *   partial          the feed assesses a subset (some versions, or vaults/
 *                    markets rather than the protocol object)
 *   not-applicable   the protocol is OUT OF the feed's declared scope
 *                    (Pharos: stablecoin-scoped · DeFi Sphere: lending-market
 *                    -scoped) — visually distinct, excluded from gap counts
 *   not-yet-covered  in scope, no assessment archived — an honest gap,
 *                    rendered neutrally (grey), NEVER warning-colored
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadFeedRegistry, loadOverlays, loadProtocols } from "@/lib/registry";
import { latestSnapshot, PROVENANCE_DIR, REPO_ROOT } from "@/lib/fetch-util";
import type { TvlSyncResult } from "@/lib/defillama";
import type { SafeSyncResult } from "@/lib/safe-api";
import type {
  CoverageCell,
  DefiscanDatum,
  DefipunkdDatum,
  FeedDatum,
  FeedSnapshot,
  OverlayEntry,
  ProtocolCoverage,
  ProtocolMeta,
} from "@/lib/types";
import { AUTOMATED_FEED_KEYS, type FeedKey } from "@/lib/feed-keys";

const OUT_DIR = resolve(REPO_ROOT, "lib/generated");

const nyc = (note?: string): CoverageCell => ({
  status: "not-yet-covered",
  ...(note ? { note } : {}),
});

const stageLabel = (stage: number | "O"): string =>
  typeof stage === "number" ? `Stage ${stage}` : "Others";

function defiscanCell(proto: ProtocolMeta, datums: DefiscanDatum[]): CoverageCell {
  if (datums.length === 0) return nyc();
  const covered = new Set(datums.flatMap((d) => d.covered_llama_slugs));
  const versions = proto.defillama.versions.map((v) => v.slug);
  const matched = versions.filter((s) => covered.has(s));
  const inline = [...new Set(datums.map((d) => stageLabel(d.stage)))].join(" / ");
  if (versions.length === 0 || matched.length >= versions.length)
    return { status: "covered", inline };
  return {
    status: "partial",
    inline,
    note: `Reviews ${matched.join(", ") || datums.map((d) => d.defiscan_id).join(", ")}; not yet ${versions.filter((v) => !covered.has(v)).join(", ")}`,
  };
}

function defipunkdCell(proto: ProtocolMeta, datums: DefipunkdDatum[]): CoverageCell {
  if (datums.length === 0) return nyc();
  const versionSlugs = new Set(proto.defillama.versions.map((v) => v.slug));
  const matchedVersions = datums.filter((d) => versionSlugs.has(d.punkd_slug));
  const familyLevel = datums.filter((d) => !versionSlugs.has(d.punkd_slug));
  if (familyLevel.length > 0 || matchedVersions.length >= versionSlugs.size)
    return { status: "covered" };
  const missing = [...versionSlugs].filter(
    (s) => !datums.some((d) => d.punkd_slug === s),
  );
  return {
    status: "partial",
    note: `Assesses ${datums.map((d) => d.punkd_slug).join(", ")}; not yet ${missing.join(", ")}`,
  };
}

function buildCoverage(
  proto: ProtocolMeta,
  feedData: Record<FeedKey, Record<string, FeedDatum[]>>,
  overlays: OverlayEntry[],
  feedRegistry: ReturnType<typeof loadFeedRegistry>,
): ProtocolCoverage {
  const cells = {} as Record<FeedKey, CoverageCell>;

  for (const feed of feedRegistry) {
    const key = feed.key as FeedKey;
    const datums = feedData[key]?.[proto.slug] ?? [];

    if (key === "defiscan") {
      cells[key] = defiscanCell(proto, datums as DefiscanDatum[]);
    } else if (key === "defipunkd") {
      cells[key] = defipunkdCell(proto, datums as DefipunkdDatum[]);
    } else if (key === "philidor") {
      if (datums.length === 0) cells[key] = nyc();
      else if (proto.feeds.philidor?.relation === "native")
        cells[key] = { status: "covered" };
      else
        cells[key] = {
          status: "partial",
          note: "Scores individual vaults/markets built on this protocol, not the protocol itself",
        };
    } else if (key === "pharos") {
      const inScope = proto.stablecoins.some((s) => s.pharos_id);
      if (!inScope)
        cells[key] = {
          status: "not-applicable",
          note: "Pharos is stablecoin-scoped; this protocol has no associated stablecoin",
        };
      else if (datums.length === 0) cells[key] = nyc();
      else {
        const ids = proto.stablecoins.filter((s) => s.pharos_id).length;
        cells[key] =
          datums.length >= ids
            ? { status: "covered" }
            : {
                status: "partial",
                note: `Grades ${datums.length} of ${ids} associated stablecoins`,
              };
      }
    } else if (key === "defisphere") {
      const lending = proto.category === "lending" || proto.category === "cdp";
      if (!lending)
        cells[key] = {
          status: "not-applicable",
          note: "DeFi Sphere is lending-market-scoped; this protocol is not a lending market",
        };
      else if (datums.length === 0)
        cells[key] = nyc("Lending protocol not present in DeFi Sphere's market set");
      else {
        const d = datums[0] as Extract<FeedDatum, { feed_key: "defisphere" }>;
        cells[key] = {
          status: "covered",
          note: `${d.market_count_total} lending markets scored`,
        };
      }
    } else if (key === "defillama-hacks") {
      const d = datums[0] as Extract<FeedDatum, { feed_key: "defillama-hacks" }> | undefined;
      const n = d?.events.length ?? 0;
      cells[key] = {
        status: "covered",
        note: n > 0 ? `${n} incident${n > 1 ? "s" : ""} on record` : "No incidents on record",
      };
    } else {
      // Tier B/C registry columns: covered only via merged curated overlays.
      const overlay = overlays.find(
        (o) =>
          o.feed_key === key &&
          o.protocol_slug === proto.slug &&
          o.status === "merged" &&
          (o.correction_type === "add" || o.correction_type === "update"),
      );
      cells[key] = overlay
        ? { status: "covered", note: overlay.corrected_value }
        : nyc(feed.scope_note);
    }
  }

  const statuses = Object.values(cells).map((c) => c.status);
  return {
    slug: proto.slug,
    cells,
    // COUNT of status enum values only — never reads a rating (CHARTER §2.1).
    feeds_with_assessments: statuses.filter(
      (s) => s === "covered" || s === "partial",
    ).length,
    applicable_feeds: statuses.filter((s) => s !== "not-applicable").length,
  };
}

interface AssessmentInfo {
  exists: boolean;
  is_template: boolean;
  author: string | null;
  markdown: string | null;
}

function loadAssessments(slugs: string[]): Record<string, AssessmentInfo> {
  const dir = resolve(REPO_ROOT, "data/assessments");
  const out: Record<string, AssessmentInfo> = {};
  for (const slug of slugs) {
    const path = resolve(dir, `${slug}.md`);
    if (!existsSync(path)) {
      out[slug] = { exists: false, is_template: true, author: null, markdown: null };
      continue;
    }
    const md = readFileSync(path, "utf8");
    const isTemplate = md.includes("<!-- TEMPLATE");
    const author = md.match(/\*Author:\s*([^·*]+)/)?.[1]?.trim() ?? null;
    out[slug] = {
      exists: true,
      is_template: isTemplate,
      author,
      markdown: isTemplate ? null : md,
    };
  }
  return out;
}

function tailJsonl<T>(path: string, n: number): T[] {
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .slice(-n)
    .map((l) => JSON.parse(l) as T);
}

function main() {
  const feeds = loadFeedRegistry();
  const protocols = loadProtocols();
  const overlays = loadOverlays();

  const feed_data = {} as Record<FeedKey, Record<string, FeedDatum[]>>;
  const feed_meta = {} as Record<
    string,
    { fetched_at: string | null; snapshot_file: string | null; snapshot_date: string | null; ok: boolean }
  >;
  for (const key of AUTOMATED_FEED_KEYS) {
    const snap = latestSnapshot<FeedSnapshot>(key);
    feed_data[key] = snap?.payload.data ?? {};
    feed_meta[key] = {
      fetched_at: snap?.payload.fetched_at ?? null,
      snapshot_file: snap ? `data/cache/${snap.file}` : null,
      snapshot_date: snap?.date ?? null,
      ok: snap?.payload.ok ?? false,
    };
  }

  const coverage: Record<string, ProtocolCoverage> = {};
  for (const proto of protocols)
    coverage[proto.slug] = buildCoverage(proto, feed_data, overlays, feeds);

  const tvl = latestSnapshot<TvlSyncResult>("defillama-tvl");
  const safes = latestSnapshot<SafeSyncResult>("safe-governance");

  const roots = tailJsonl<{ date: string; root: string; file_count: number }>(
    resolve(PROVENANCE_DIR, "roots.jsonl"),
    1,
  );
  const log_tail = tailJsonl<Record<string, unknown>>(
    resolve(PROVENANCE_DIR, "nightly-log.jsonl"),
    40,
  );

  const site = {
    generated_at: new Date().toISOString(),
    feeds,
    protocols,
    coverage,
    feed_data,
    feed_meta,
    tvl_snapshot: tvl?.payload ?? null,
    safe_snapshot: safes?.payload ?? null,
    provenance: { latest_root: roots[0] ?? null, log_tail },
    overlays,
    assessments: loadAssessments(protocols.map((p) => p.slug)),
  };

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(resolve(OUT_DIR, "site-data.json"), JSON.stringify(site));
  const kb = Math.round(JSON.stringify(site).length / 1024);
  console.log(
    `build-data: ${protocols.length} protocols × ${feeds.length} feeds → lib/generated/site-data.json (${kb} KB)`,
  );
}

main();
