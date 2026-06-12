/**
 * Computes the daily Merkle root over the content-addressed archive, so any
 * third party can verify from a `git clone` that the published data is
 * exactly what the site serves.
 *
 * Tree definition (reproduce independently with any sha256 tool):
 *   files  = every file under data/cache/, sorted by relative path (bytewise)
 *   leaf_i = sha256( relpath_i + "\n" + bytes_i )
 *   level: parent = sha256( left_digest || right_digest )   (raw 32-byte concat)
 *          odd node count → last node is duplicated
 *   root   = hex of the final digest
 *
 * Modes:
 *   (default)        compute + append {date, root, file_count} to
 *                    data/provenance/roots.jsonl (same-date entry replaced)
 *   --print          compute + print only (no write)
 *   --verify <date>  recompute and compare against the recorded entry; exits
 *                    non-zero on mismatch — this is the /verify page command
 */
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { relative, resolve } from "node:path";
import { CACHE_DIR, PROVENANCE_DIR, utcDate } from "@/lib/fetch-util";

const sha256 = (input: Buffer): Buffer =>
  createHash("sha256").update(input).digest();

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

export function computeRoot(): { root: string; file_count: number } {
  const files = walk(CACHE_DIR)
    .map((f) => ({ rel: relative(CACHE_DIR, f), full: f }))
    .sort((a, b) => (a.rel < b.rel ? -1 : 1));
  if (files.length === 0) return { root: "", file_count: 0 };

  let level: Buffer[] = files.map(({ rel, full }) =>
    sha256(Buffer.concat([Buffer.from(rel + "\n"), readFileSync(full)])),
  );
  while (level.length > 1) {
    const next: Buffer[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? level[i];
      next.push(sha256(Buffer.concat([left, right])));
    }
    level = next;
  }
  return { root: level[0].toString("hex"), file_count: files.length };
}

interface RootEntry {
  date: string;
  root: string;
  file_count: number;
  computed_at: string;
}

function loadRoots(): RootEntry[] {
  const path = resolve(PROVENANCE_DIR, "roots.jsonl");
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l) as RootEntry);
}

const { root, file_count } = computeRoot();
const args = process.argv.slice(2);

if (args[0] === "--print") {
  console.log(`${root}  (${file_count} files)`);
} else if (args[0] === "--verify") {
  const date = args[1];
  if (!date) {
    console.error("usage: compute-merkle-root --verify YYYY-MM-DD");
    process.exit(2);
  }
  const entry = loadRoots().find((r) => r.date === date);
  if (!entry) {
    console.error(`no recorded root for ${date} in data/provenance/roots.jsonl`);
    process.exit(2);
  }
  if (entry.root === root) {
    console.log(`VERIFIED ${date}: ${root} (${file_count} files)`);
  } else {
    console.error(
      `MISMATCH ${date}:\n  recorded ${entry.root}\n  computed ${root}`,
    );
    process.exit(1);
  }
} else {
  const date = utcDate();
  const entries = loadRoots().filter((r) => r.date !== date);
  entries.push({
    date,
    root,
    file_count,
    computed_at: new Date().toISOString(),
  });
  writeFileSync(
    resolve(PROVENANCE_DIR, "roots.jsonl"),
    entries.map((e) => JSON.stringify(e)).join("\n") + "\n",
  );
  console.log(`merkle root ${date}: ${root} (${file_count} files)`);
}
