/**
 * GET /api/v0/provenance-root.json — the daily Merkle roots over the
 * content-addressed archive, latest first, with the exact reproduce command.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { siteData } from "@/lib/data-loader";

export const dynamic = "force-static";
export const revalidate = 1800;

export function GET() {
  const path = resolve(process.cwd(), "data/provenance/roots.jsonl");
  const roots = existsSync(path)
    ? readFileSync(path, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l) as Record<string, unknown>)
    : [];

  return Response.json({
    version: "v0",
    unstable: true,
    generated_at: siteData.generated_at,
    file_count_note:
      "file_count is the number of content-addressed cache files under the day's Merkle tree (feed, TVL and governance snapshots) — it is unrelated to the number of protocols (20).",
    reproduce:
      "git clone https://github.com/FarseenSh/openrisk && pnpm install && pnpm merkle:verify <date>",
    latest: roots[roots.length - 1] ?? null,
    roots: [...roots].reverse(),
  });
}
