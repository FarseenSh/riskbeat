/**
 * Archives a nightly DefiLlama snapshot (Ethereum TVL per version slug +
 * aggregator volumes) — the static fallback behind the live ISR layer.
 */
import { loadProtocols } from "@/lib/registry";
import { fetchDefillamaLive } from "@/lib/defillama";
import { appendNightlyLog, pruneSnapshots, writeSnapshot } from "@/lib/fetch-util";

async function main() {
  const protocols = loadProtocols();
  try {
    const sync = await fetchDefillamaLive(protocols);
    const archive = writeSnapshot("defillama-tvl", sync);
    pruneSnapshots("defillama-tvl");
    appendNightlyLog({
      ts: new Date().toISOString(),
      feed: "defillama-tvl",
      status: "ok",
      url: "https://api.llama.fi/protocols",
      file: archive.file,
      sha256: archive.sha256,
      bytes: archive.bytes,
    });
    const known = Object.values(sync.eth_tvl_by_slug).filter(
      (v) => v !== null,
    ).length;
    console.log(
      `sync-defillama: ${known} slugs with TVL, ${Object.keys(sync.volume_by_name).length} volume rows → ${archive.file}`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    appendNightlyLog({
      ts: new Date().toISOString(),
      feed: "defillama-tvl",
      status: "error",
      error: message,
    });
    console.error(`sync-defillama: ${message} — previous snapshot preserved`);
    process.exit(1);
  }
}

main();
