/**
 * Validates every data file against its JSON schema, plus invariants a schema
 * can't express:
 *   · protocol slug == filename
 *   · every 0x… address is EIP-55 checksummed (viem)
 *   · DefiLlama version slugs are globally unique across protocols
 *   · overlay feed_keys exist in the registry
 *   · feed `conflict_of_interest` present (machine-auditable neutrality)
 *   · inline_label restricted to the charter §4 exception set
 * Same checks CI runs. Exit non-zero on any failure.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import yaml from "js-yaml";
import { getAddress } from "viem";

const ROOT = resolve(import.meta.dirname, "..");
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const loadSchema = (name: string) =>
  JSON.parse(readFileSync(resolve(ROOT, "schema", name), "utf8"));

const validateFeeds = ajv.compile(loadSchema("feeds.schema.json"));
const validateProtocol = ajv.compile(loadSchema("protocol.schema.json"));
const validateOverlay = ajv.compile(loadSchema("overlay.schema.json"));

/** Charter §4: only short self-explanatory ordinal vocabularies render inline. */
const INLINE_LABEL_ALLOWLIST = new Set(["defiscan", "anticapture"]);

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error(`  ✗ ${msg}`);
};

function walkAddresses(node: unknown, path: string, cb: (addr: string, at: string) => void) {
  if (typeof node === "string") {
    if (/^0x[0-9a-fA-F]{40}$/.test(node)) cb(node, path);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => walkAddresses(v, `${path}[${i}]`, cb));
    return;
  }
  if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) walkAddresses(v, `${path}.${k}`, cb);
  }
}

/* ——— feeds.yaml ——— */
console.log("validating data/feeds/feeds.yaml");
const feedsDoc = yaml.load(
  readFileSync(resolve(ROOT, "data/feeds/feeds.yaml"), "utf8"),
) as { feeds: Record<string, unknown>[] };

if (!validateFeeds(feedsDoc)) {
  for (const e of validateFeeds.errors ?? [])
    fail(`feeds.yaml ${e.instancePath} ${e.message}`);
}
const feedKeys = new Set<string>();
for (const f of feedsDoc.feeds ?? []) {
  const key = String(f.key);
  if (feedKeys.has(key)) fail(`feeds.yaml: duplicate key "${key}"`);
  feedKeys.add(key);
  if (!("conflict_of_interest" in f))
    fail(`feeds.yaml: "${key}" missing conflict_of_interest (CHARTER §6 — empty string is valid, absence is not)`);
  if (f.inline_label === true && !INLINE_LABEL_ALLOWLIST.has(key))
    fail(`feeds.yaml: "${key}" sets inline_label — charter §4 allows only: ${[...INLINE_LABEL_ALLOWLIST].join(", ")} (amend CHARTER.md first)`);
}
console.log(`  ${feedsDoc.feeds?.length ?? 0} feeds ${failures ? "checked (failures above)" : "ok"}`);
const failuresAfterFeeds = failures;

/* ——— protocols/*.yaml ——— */
const protoDir = resolve(ROOT, "data/protocols");
const protoFiles = existsSync(protoDir)
  ? readdirSync(protoDir).filter((f) => f.endsWith(".yaml"))
  : [];
console.log(`validating data/protocols (${protoFiles.length} files)`);
const seenLlamaSlugs = new Map<string, string>();
for (const file of protoFiles) {
  const doc = yaml.load(readFileSync(resolve(protoDir, file), "utf8")) as Record<
    string,
    unknown
  >;
  if (!validateProtocol(doc)) {
    for (const e of validateProtocol.errors ?? [])
      fail(`${file} ${e.instancePath} ${e.message}`);
    continue;
  }
  const slug = String(doc.slug);
  if (slug !== basename(file, ".yaml"))
    fail(`${file}: slug "${slug}" != filename`);

  walkAddresses(doc, slug, (addr, at) => {
    try {
      if (getAddress(addr) !== addr)
        fail(`${file} ${at}: address not EIP-55 checksummed (${addr})`);
    } catch {
      fail(`${file} ${at}: invalid address (${addr})`);
    }
  });

  const dl = doc.defillama as { versions?: { slug: string }[] } | undefined;
  for (const v of dl?.versions ?? []) {
    const prev = seenLlamaSlugs.get(v.slug);
    if (prev) fail(`${file}: defillama slug "${v.slug}" already used by ${prev}`);
    seenLlamaSlugs.set(v.slug, file);
  }
}
console.log(`  ${protoFiles.length} protocols ${failures > failuresAfterFeeds ? "checked (failures above)" : "ok"}`);
const failuresAfterProtos = failures;

/* ——— overlays/*.json ——— */
const overlayDir = resolve(ROOT, "data/overlays");
const overlayFiles = existsSync(overlayDir)
  ? readdirSync(overlayDir).filter((f) => f.endsWith(".json"))
  : [];
console.log(`validating data/overlays (${overlayFiles.length} files)`);
for (const file of overlayFiles) {
  const doc = JSON.parse(readFileSync(resolve(overlayDir, file), "utf8"));
  if (!validateOverlay(doc)) {
    for (const e of validateOverlay.errors ?? [])
      fail(`${file} ${e.instancePath} ${e.message}`);
    continue;
  }
  for (const entry of doc as { feed_key: string; id: string }[]) {
    if (!feedKeys.has(entry.feed_key))
      fail(`${file} entry ${entry.id}: unknown feed_key "${entry.feed_key}"`);
  }
}
console.log(`  ${overlayFiles.length} overlay files ${failures > failuresAfterProtos ? "checked (failures above)" : "ok"}`);

if (failures) {
  console.error(`\nvalidate: ${failures} failure(s)`);
  process.exit(1);
}
console.log("\nvalidate: all green");
