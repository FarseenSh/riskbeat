# Gearbox — Risk Assessment Notes

*Author: Farseen Shaikh (@FarseenSh) · Written: 2026-06-12 · All facts carry as-of dates inline.*

## What the feeds say (verbatim, linked)

- **Not covered by any rating feed** as of 2026-06-12: DeFiScan, DeFiPunk'd, Philidor and DeFi Sphere all return no assessment for Gearbox (archived in `data/cache/*/2026-06-12-*.json`). This is a statement about feed coverage, not about the protocol.
- **Not applicable:** Pharos — stablecoin-scoped; Gearbox has no associated stablecoin.
- **DefiLlama Hacks:** zero entries for Gearbox in the incident database (snapshot 2026-06-12).

## Governance & control (observed, sourced)

- GEAR-token DAO. Two operational multisigs, thresholds live-verified against the Safe Transaction Service on 2026-06-12: **Technical Guard 6/12** (emergency pause powers) and **Treasury Guard 5/10** (treasury operations). Addresses in [`data/protocols/gearbox.yaml`](../protocols/gearbox.yaml).
- Under the current V3 architecture, day-to-day risk parameters (liquidation thresholds, quotas, rates) are **not set by the DAO but by independent per-market Curators**. Gearbox's own docs state the DAO "cannot change the risk parameters (LTVs, Liquidation Thresholds, Interest Rates) of a live market managed by a Curator" ([docs.gearbox.finance, Protocol DAO page](https://docs.gearbox.finance/about-gearbox/governance-and-operations/protocol-dao), accessed 2026-06-12).

## Risk-provider history (primary sources)

- **RiskDAO** was engaged by the Gearbox DAO via GIP-15; it published a triple-layer risk framework and parameter recommendations ([Risk DAO on Medium, 2022-10-27](https://medium.com/risk-dao/triple-layer-risk-analysis-for-gearbox-lending-platform-f4a0fbc8d2a2)), and the DAO's 2023 "Gearbox Risk Foundation" post describes the partnership as ongoing at that time ([Gearbox Medium, 2023-08-15](https://medium.com/gearbox-protocol/gearbox-risk-foundation-making-security-transparent-f21a89967c68)).
- **Chaos Labs** announced a partnership with Gearbox covering parameter recommendations and risk monitoring ([chaoslabs.xyz, 2024-06-26](https://chaoslabs.xyz/posts/chaos-labs-partners-with-gearbox)).
- As of 2026-06-12 the curator model above means there is no single protocol-wide third-party risk provider; risk-setting responsibility sits with each market's curator.

## Incident history

- No incidents in the DefiLlama hacks database as of 2026-06-12.

## Audits (registry, with scope)

- ChainSecurity 2024 (V3) · Consensys Diligence 2023 · Sigma Prime 2022. Listed in the registry; see protocol page.

## Analyst notes (observations, no verdicts)

- Gearbox is the clearest example of the registry's coverage gap: a live lending protocol (Ethereum TVL ≈ $14.5M, DefiLlama snapshot 2026-06-12T14:02Z) that **no major risk feed currently assesses**. Anyone relying on "a feed would have flagged it" logic should know that, for this protocol, no feed is looking.
- The curator model relocates risk-parameter responsibility from the DAO to named curators per market — the same structural pattern Philidor scores vault-by-vault on Morpho and Euler. Philidor does not cover Gearbox markets as of 2026-06-12.

## What I checked and couldn't confirm

- Whether the Chaos Labs engagement is still active in June 2026 — the 2024 announcement is public, but I found no public engagement reports dated 2026. Treated as unconfirmed.
- The GEAR token contract address is omitted from our registry pending checksum verification (the address circulating in third-party docs failed our EIP-55/length check at build time).

## Sources

- OpenRisk archived snapshots, 2026-06-12 (`data/cache/{defiscan,defipunkd,philidor,defisphere,defillama-hacks}/2026-06-12-*.json`)
- Safe Transaction Service (thresholds, live-verified 2026-06-12)
- docs.gearbox.finance — Protocol DAO & guardrails pages (accessed 2026-06-12)
- Risk DAO Medium (2022-10-27) · Gearbox Medium GRF post (2023-08-15) · Chaos Labs announcement (2024-06-26)
