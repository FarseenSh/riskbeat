# Euler — Risk Assessment Notes

*Author: Farseen Shaikh (@FarseenSh) · Written: 2026-06-12 · All facts carry as-of dates inline.*

## What the feeds say (verbatim, linked)

- **Not covered by any rating feed** as of 2026-06-12: DeFiScan, DeFiPunk'd, Philidor and DeFi Sphere return no assessment for Euler V2 (archived in `data/cache/*/2026-06-12-*.json`).
- **Not applicable:** Pharos — stablecoin-scoped; Euler has no associated stablecoin in our registry.
- **DefiLlama Hacks** (snapshot 2026-06-12), verbatim entry: Euler V1, 2023-03-13, **$197,000,000**, technique "Flashloan Donate Function Logic Exploit", classification "Protocol Logic", returned funds recorded at **$240,000,000** (the feed's recovered figure exceeds the nominal loss after market moves; both numbers verbatim).

## Governance & control (observed, sourced)

- EUL-token DAO with on-chain **Governor + Timelock** (Governor address in [`data/protocols/euler.yaml`](../protocols/euler.yaml)).
- Safes, thresholds live-verified against the Safe Transaction Service on 2026-06-12: **DAO Treasury 4/8** (proposer role), **Foundation Treasury 4/7**, **Foundation Ops 3/5** (pause-guardian-type roles).
- Euler docs reference an ops multisig holding `UNPAUSE_ADMIN_ROLE` without publishing a distinct address beyond the operational wallet we list — recorded as a gap, not guessed.

## Incident history

- 2023-03-13 — Euler V1 — $197M flashloan/donate-logic exploit; recovery completed April 2023 with the feed recording $240M returned (verbatim above). V1 and V2 are different codebases: V2 (the current protocol) shipped in 2024 after a separate audit cycle and has no incident entries.

## Analyst notes (observations, no verdicts)

- **TVL trajectory** (DefiLlama `api.llama.fi/protocol/euler-v2`, accessed 2026-06-12): all-chain TVL grew to ≈ **$1.79B on 2025-10-20**, then declined to ≈ **$270M by 2026-06-12** (≈ –85% from peak). The Ethereum-mainnet portion in our snapshot is **$126.9M** (2026-06-12T14:02Z). I checked DefiLlama's per-chain series and the figures are consistent; I did not establish a cause and make no causal claim — the trajectory is recorded as data.
- Euler V2 combines three facts that rarely co-occur in this registry: a nine-figure historical exploit on its predecessor (fully compensated per the feed's returned-funds field), an ~85% one-year TVL drawdown, and **zero current coverage from any rating feed**. Whatever one concludes, no automated feed in this registry is watching it as of 2026-06-12 — that absence is itself the datum.

## What I checked and couldn't confirm

- A stated cause for the 2025→2026 TVL decline: I checked DefiLlama series and Euler's public channels at registry-build time and found no single authoritative explanation; recorded as unexplained rather than guessed.
- A distinct published address for the `UNPAUSE_ADMIN_ROLE` multisig (see governance above).

## Sources

- OpenRisk archived snapshots, 2026-06-12 (`data/cache/defillama-hacks/2026-06-12-7d287fc9….json` and the five feed snapshots)
- Safe Transaction Service (thresholds, live-verified 2026-06-12)
- DefiLlama protocol API for `euler-v2` (accessed 2026-06-12)
- Euler docs (docs.euler.finance, accessed at registry build 2026-06-12)
