/**
 * On-chain sanity verification for the protocol registry (manual tool, not CI
 * — CI must not depend on RPC availability).
 *
 *   · every token/stablecoin address must answer ERC-20 symbol() with the
 *     symbol recorded in the YAML (modulo case/wrapper differences)
 *   · every labeled contract address must have deployed bytecode
 *   · every governance Safe must resolve on the Safe Transaction Service
 *     with the recorded threshold/owner count
 *
 * Run: pnpm tsx scripts/verify-onchain.ts
 */
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import yaml from "js-yaml";
import { createPublicClient, http, erc20Abi } from "viem";
import { mainnet } from "viem/chains";
import { SAFE_API_BASE } from "@/lib/safe-api";

const ROOT = resolve(import.meta.dirname, "..");
const RPC = process.env.ETH_RPC_URL ?? "https://ethereum-rpc.publicnode.com";
const SAFE_API = SAFE_API_BASE;

const client = createPublicClient({ chain: mainnet, transport: http(RPC) });

interface ProtoDoc {
  slug: string;
  governance: {
    governance_contract?: { label: string; address: string };
    safes: { label: string; address: string; threshold: number | null; owners: number | null }[];
  };
  addresses: { label: string; address: string }[];
  tokens: { symbol: string; address: string }[];
  stablecoins: { symbol: string; address: string }[];
}

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error(`  ✗ ${msg}`);
};
const ok = (msg: string) => console.log(`  ✓ ${msg}`);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const dir = resolve(ROOT, "data/protocols");
  const files = readdirSync(dir).filter((f) => f.endsWith(".yaml"));
  console.log(`verify-onchain: ${files.length} protocols via ${RPC}\n`);

  for (const file of files) {
    const doc = yaml.load(readFileSync(resolve(dir, file), "utf8")) as ProtoDoc;
    console.log(`— ${doc.slug}`);

    for (const t of [...doc.tokens, ...doc.stablecoins]) {
      try {
        const sym = await client.readContract({
          address: t.address as `0x${string}`,
          abi: erc20Abi,
          functionName: "symbol",
        });
        const a = sym.toLowerCase().replace(/\s/g, "");
        const b = t.symbol.toLowerCase().replace(/\s/g, "");
        if (a === b || a.includes(b) || b.includes(a)) ok(`${t.symbol} symbol() → "${sym}"`);
        else fail(`${doc.slug} ${t.address}: symbol() "${sym}" != yaml "${t.symbol}"`);
      } catch {
        fail(`${doc.slug} ${t.symbol} ${t.address}: symbol() call failed`);
      }
      await sleep(120);
    }

    const contracts = [
      ...doc.addresses,
      ...(doc.governance.governance_contract ? [doc.governance.governance_contract] : []),
    ];
    for (const c of contracts) {
      try {
        const code = await client.getCode({ address: c.address as `0x${string}` });
        if (code && code !== "0x") ok(`${c.label}: bytecode present`);
        else fail(`${doc.slug} ${c.label} ${c.address}: NO bytecode at address`);
      } catch {
        fail(`${doc.slug} ${c.label} ${c.address}: getCode failed`);
      }
      await sleep(120);
    }

    for (const s of doc.governance.safes) {
      try {
        const res = await fetch(`${SAFE_API}/safes/${s.address}/`);
        if (!res.ok) {
          fail(`${doc.slug} safe ${s.label} ${s.address}: Safe API ${res.status}`);
          continue;
        }
        const data = (await res.json()) as { threshold: number; owners: string[] };
        let mismatched = false;
        if (s.threshold !== null && data.threshold !== s.threshold) {
          fail(`${doc.slug} safe ${s.label}: live threshold ${data.threshold} != yaml ${s.threshold}`);
          mismatched = true;
        }
        if (s.owners !== null && data.owners.length !== s.owners) {
          fail(`${doc.slug} safe ${s.label}: live owners ${data.owners.length} != yaml ${s.owners}`);
          mismatched = true;
        }
        if (!mismatched)
          ok(
            s.threshold === null && s.owners === null
              ? `Safe ${s.label}: live ${data.threshold}/${data.owners.length} (no yaml expectation recorded)`
              : `Safe ${s.label}: ${data.threshold}/${data.owners.length} matches`,
          );
      } catch {
        fail(`${doc.slug} safe ${s.label}: Safe API call failed`);
      }
      await sleep(150);
    }
  }

  console.log(failures ? `\nverify-onchain: ${failures} FAILURE(S)` : "\nverify-onchain: all green");
  process.exit(failures ? 1 : 0);
}

main();
