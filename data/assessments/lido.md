# Lido — Risk Assessment Notes

*Author: Farseen Shaikh (@FarseenSh) · Written: 2026-06-12 · All facts carry as-of dates inline.*

## What the feeds say (verbatim, linked)

- **DeFiScan** ([defiscan.info/protocols/lido-v2](https://defiscan.info/protocols/lido-v2), published 2025-06-19, fetched 2026-06-12): **Stage 0**; risk vector verbatim — chain **L**, upgradeability **H**, autonomy **L**, exit window **H**, accessibility **L**.
- **DeFiPunk'd** ([defipunkd.com/protocol/lido](https://defipunkd.com/protocol/lido), fetched 2026-06-12), all five slices verbatim:
  - control: **orange (strong)** — "Short timelock with insider emergency override" (merged 2026-06-02)
  - ability-to-exit: **orange (strong)** — "Finalized claims safe; new requests pausable indefinitely by governance" (merged 2026-05-04)
  - autonomy: **orange (strong)** — "Oracle committee governs rebase reports" (merged 2026-06-02)
  - open-access: **green (strong)** — "No user allowlists or geofences" (merged 2026-05-04)
  - verifiability: **green (strong)** — "Verified source + multiple recent audits" (merged 2026-05-04)
- **Not covered by:** Philidor (checked 2026-06-12).
- **Not applicable:** Pharos — stablecoin-scoped, and **stETH is a liquid-staking token, not a stablecoin**; DeFi Sphere — lending-market-scoped. These cells are N/A (out of declared scope), which the matrix renders distinctly from "not yet covered" — Lido is the clearest example of why that distinction exists.
- **DefiLlama Hacks:** zero entries (snapshot 2026-06-12).

## Governance & control (observed, sourced)

- **LDO Aragon DAO**; the Aragon Agent contract is protocol admin (address in [`data/protocols/lido.yaml`](../protocols/lido.yaml)).
- **Dual Governance** gives stETH holders a dynamic-timelock brake ("rage-quit") on DAO decisions; ChainSecurity audited Dual Governance in 2024 (registry).
- **GateSeal committee** Safe holds emergency pause (threshold live-verified 2026-06-12; see protocol page); the TMC manages treasury operations.

## Incident history

- No incidents in the DefiLlama hacks database as of 2026-06-12.

## Analyst notes (observations, no verdicts)

- Lido is the **largest row in the registry by TVL** — $14.84B on Ethereum (DefiLlama snapshot 2026-06-12T14:02Z) — and the clearest case of two rating feeds measuring the same protocol with **different vocabularies**: DeFiScan's Stage 0 with H-flags on upgradeability and exit window, and DeFiPunk'd's mixed orange/green slice profile, are published side by side above. RiskBeat does not reconcile them; a Stage and a slice grade are different languages, and the disagreement-or-agreement between them is for the reader to weigh.
- Both feeds' strongest cautions point at the same structural facts — governance's emergency override and the pausability of new exit requests — while both also credit open access and source verifiability. That convergence-of-subject (not of verdict) is visible only because the values sit in one row; that is the aggregation working as intended.

## What I checked and couldn't confirm

- Lido's current share of all staked ETH: widely cited but moving; I did not independently verify a number and therefore do not state one.
- Whether any Tier-B/C registry feed holds unpublished Lido coverage; cells stay "not yet covered" until published or contributed via PR.

## Sources

- RiskBeat archived snapshots, 2026-06-12 (`data/cache/{defiscan,defipunkd,defillama-hacks}/2026-06-12-*.json`)
- defiscan.info/protocols/lido-v2 (published 2025-06-19) · defipunkd.com/protocol/lido
- Safe Transaction Service (GateSeal threshold, live-verified 2026-06-12)
- Lido docs (docs.lido.fi, accessed at registry build 2026-06-12)
