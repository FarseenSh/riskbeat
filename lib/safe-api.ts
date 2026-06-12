/**
 * Safe Transaction Service live layer — on-chain governance reads
 * ([onchain] provenance). Base live-verified 2026-06-12; the old
 * safe-transaction-mainnet.safe.global host 308-redirects and is not used.
 */
import type { ProtocolMeta, SafeStatus } from "@/lib/types";

const BASE = "https://api.safe.global/tx-service/eth/api/v1";

export interface SafeSyncResult {
  as_of: string;
  /** Safe address → live status. */
  by_address: Record<string, SafeStatus>;
}

export async function fetchSafeStatuses(
  protocols: ProtocolMeta[],
): Promise<SafeSyncResult> {
  const as_of = new Date().toISOString();
  const addresses = [
    ...new Set(
      protocols.flatMap((p) => p.governance.safes.map((s) => s.address)),
    ),
  ];

  // The Safe API rate-limits bursts — read sequentially with a small gap.
  const entries: [string, SafeStatus][] = [];
  for (const address of addresses) {
    try {
      const res = await fetch(`${BASE}/safes/${address}/`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as {
        threshold?: number;
        owners?: string[];
        version?: string;
      };
      entries.push([
        address,
        {
          address,
          threshold: json.threshold ?? null,
          owners: json.owners ?? null,
          version: json.version ?? null,
          as_of,
          is_stale: false,
        },
      ]);
    } catch (err) {
      entries.push([
        address,
        {
          address,
          threshold: null,
          owners: null,
          version: null,
          as_of,
          is_stale: true,
          error: err instanceof Error ? err.message : "fetch failed",
        },
      ]);
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  return { as_of, by_address: Object.fromEntries(entries) };
}

export const SAFE_API_BASE = BASE;
