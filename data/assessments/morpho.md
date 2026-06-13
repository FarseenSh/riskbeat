# Morpho & Morpho Vaults — Risk Assessment Notes

*Author: Farseen Shaikh (@FarseenSh) · Written: 2026-06-12 · All facts carry as-of dates inline.*

## What the feeds say (verbatim, linked)

- **DeFiScan** ([defiscan.info/protocols/morpho](https://defiscan.info/protocols/morpho), published 2025-05-21, fetched 2026-06-12): **Stage 1**; risk vector verbatim — chain **L**, upgradeability **M**, autonomy **M**, exit window **M**, accessibility **L**.
- **DeFiPunk'd** ([defipunkd.com/protocol/morpho](https://defipunkd.com/protocol/morpho), fetched 2026-06-12): covers both `morpho` and `morpho-blue`; e.g. slice "open-access": **green (strong)** — "No user allowlists or geofences" (merged 2026-05-04).
- **Philidor** (fetched 2026-06-12): scores **171 curated vaults built on Morpho** — e.g. "Sentora PYUSD Main", total score **6.66**, tier "Core", vault TVL ≈ $294M (verbatim). The cell is **partial** by our coverage rules: Philidor rates vaults on Morpho, not the protocol object.
- **DeFi Sphere** (fetched 2026-06-12): **258 Morpho lending markets** scored with per-market collateral- and liquidity-risk scores (string-typed in the source; displayed verbatim).
- **DefiLlama Hacks** (snapshot 2026-06-12), verbatim entry: "LeadBlock's Morpho Blue Market", 2024-10-14, **$250,000**, technique "Oracle Misconfiguration Exploit", classification "Protocol Logic".
- **Not applicable:** Pharos (no associated stablecoin).

## Governance & control (observed, sourced)

- Morpho Blue's core singleton is **non-upgradeable**. Its `owner()` is the **Morpho DAO 5/9 Safe** (threshold live-verified against the Safe Transaction Service, 2026-06-12); its powers are fee switches and periphery registries — there is no upgrade path over the core.
- There is **no protocol-level guardian by design** — "guardian" exists per-vault as a MetaMorpho role, which is why it appears on the Morpho Vaults row, not here.

## Incident history

- One entry (LeadBlock market, above). Note the layer: a **market-level** oracle misconfiguration on a permissionlessly-created market — the core contract was not exploited. The feed's classification is quoted verbatim; the layer observation is mine.

## Analyst notes (observations, no verdicts)

- Morpho is the **most-covered lending protocol in this registry** — five automated feeds carry data for it as of 2026-06-12. But each feed's *unit of assessment* differs: DeFiScan rates the protocol's decentralization, Philidor rates curated vaults, Sphere rates individual markets. These answer different questions, which is why the matrix keeps them in separate columns and RiskBeat never merges them.
- The protocol-vs-vault distinction is the load-bearing one for users: depositing into a MetaMorpho vault adds **curator-allocation risk on top of** protocol risk. Philidor's per-vault scores (and their spread) are the closest public measurement of that added layer; the registry shows them verbatim on the Morpho Vaults row.

## What I checked and couldn't confirm

- Whether any Tier-B/C registry feed (Credora, Xerberus, LlamaRisk, Gauntlet, DeFi Safety) holds unpublished Morpho coverage; those cells stay "not yet covered" until published or contributed via PR.

## Sources

- RiskBeat archived snapshots, 2026-06-12 (`data/cache/{defiscan,defipunkd,philidor,defisphere,defillama-hacks}/2026-06-12-*.json`)
- defiscan.info/protocols/morpho (published 2025-05-21) · defipunkd.com/protocol/morpho
- Safe Transaction Service (5/9 threshold, live-verified 2026-06-12)
- Morpho docs (docs.morpho.org, accessed at registry build 2026-06-12)
