# Balancer — Risk Assessment Notes

*Author: Farseen Shaikh (@FarseenSh) · Written: 2026-06-12 · All facts carry as-of dates inline.*

## What the feeds say (verbatim, linked)

- **DeFiPunk'd** ([defipunkd.com/protocol/balancer-v3](https://defipunkd.com/protocol/balancer-v3), fetched 2026-06-12) — assesses **V3 only**, both slices verbatim:
  - ability-to-exit: **orange (weak)** — "Exits pausable; recovery mode admin-gated" (merged 2026-05-12)
  - verifiability: **orange (weak)** — "Audits exist but audit-to-deploy drift unresolved" (merged 2026-05-12)
  - The cell is **partial**: V2 — the codebase that was exploited in 2025 — is not assessed.
- **Not covered by:** DeFiScan, Philidor (checked 2026-06-12).
- **Not applicable:** Pharos (no stablecoin), DeFi Sphere (not a lending market).
- **DefiLlama Hacks** (snapshot 2026-06-12), all entries verbatim:
  - 2025-11-03 — Balancer V2 — **$128,000,000** — "Composable Stable Pools Exploit" — classification "Protocol Logic"
  - 2023-09-19 — Balancer V2 — $238,000 — "Frontend Attack"
  - 2023-08-27 — Balancer V2 — $800,000 — classification "Protocol Logic" (no technique recorded by the feed)

## Governance & control (observed, sourced)

- **veBAL Snapshot voting executed by the DAO Multisig** (**6/11**, threshold live-verified against the Safe Transaction Service, 2026-06-12; address in [`data/protocols/balancer.yaml`](../protocols/balancer.yaml)) — **no on-chain timelock between vote and execution** (observed at registry build, 2026-06-12).

## Incident history

- The November 2025 V2 composable-stable-pools exploit ($128M, verbatim above) is the largest 2025 entry in the archive for the seed-20. V2 and V3 are distinct codebases; V3 (Spearbit 2024 audit, registry) has no incident entries as of 2026-06-12.

## Analyst notes (observations, no verdicts)

- The question this project exists to answer — *"what did every feed say the day before the exploit?"* — **cannot be answered for 2025-11-03 from RiskBeat's archive, because the archive begins 2026-06-12.** I checked our own provenance log: there is no earlier snapshot. For the next incident, the nightly content-addressed archive makes that reconstruction a `git log` away. Recording the limitation honestly is the point of the column.
- As of 2026-06-12, the only rating-feed coverage of Balancer is DeFiPunk'd's V3 assessment (merged 2026-05-12); the exploited V2 codebase — still holding ≈ $19.1M on Ethereum against V3's ≈ $66.4M (DefiLlama snapshot 2026-06-12T14:02Z) — has no current assessment from any feed in the registry.

## What I checked and couldn't confirm

- Pre-exploit third-party assessments of Balancer V2 (what existed before 2025-11-03): not reconstructable from our archive (begins 2026-06-12), and I did not find a dated, citable pre-exploit rating of V2 from the registry's feeds at build time. Contributions with sources are welcome via PR.
- The feed records no returned-funds figure for the 2025 exploit as of 2026-06-12; recovery status is therefore not stated here.

## Sources

- RiskBeat archived snapshots, 2026-06-12 (`data/cache/{defipunkd,defillama-hacks}/2026-06-12-*.json`) and `data/provenance/roots.jsonl`
- defipunkd.com/protocol/balancer-v3
- Safe Transaction Service (DAO Multisig threshold, live-verified 2026-06-12)
- DefiLlama TVL snapshot 2026-06-12T14:02Z (`data/cache/defillama-tvl/`)
