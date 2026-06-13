# Conflicts of Interest

> RiskBeat's neutrality is only credible if its relationships are disclosed. This file lists every commercial, financial, advisory, or governance relationship between the RiskBeat maintainer and any listed protocol or feed provider. It is maintained in the open and updated whenever a relationship changes.

_Last updated: 2026-06-12._

---

## Maintainer

- **Farseen Shaikh** — technical lead & steward ([github.com/FarseenSh](https://github.com/FarseenSh)).

## Disclosure statement

As of the date above, **the maintainer has no commercial, employment, advisory, equity, or paid-governance relationship with any of the 20 listed seed protocols or any feed provider in the registry**, and is not compensated by any rated entity for placement, ordering, or favorable presentation on RiskBeat.

## Feed providers' relationships with rated protocols

These are conflicts **of the feeds, not of RiskBeat** — a feed provider that is paid by a protocol it rates has an interest RiskBeat does not share and cannot audit. They are recorded in the feed registry (`data/feeds/feeds.yaml`, machine-readable, CI-required field), rendered on every feed card on the site, and listed here formally:

- **DeFi Sphere** is built by **Block Analitica**, which provides ongoing paid risk services to **Spark** — a protocol in the seed registry. (Block Analitica's own dashboard is not a separate registry column because DeFi Sphere *is* Block Analitica's public lending-market data surface.)
- **LlamaRisk** is the **primary paid risk service provider to Aave DAO** (epoch-4 renewal Apr 2026) and has historically been funded from the **Curve** ecosystem — both protocols in the seed registry. Its cells on those rows carry this disclosure inline.
- **Gauntlet** holds paid risk-management engagements with rated protocols (currently **Compound**) and **curates Morpho vaults**; it exited its Aave engagement in Feb 2024.
- **Credora** is owned by **RedStone**, an oracle provider whose feeds rated protocols may consume.

## Disclosed proximities (for transparency)

These are not conflicts of the RiskBeat maintainer, but are disclosed so readers can judge the data pipeline for themselves:

- **DeFiScan** is built by the **DeFi Collective**, and **Pharos** (`pharos.watch`) is built by a **DeFi Collective board member**. Both are feeds in the RiskBeat registry, and the DeFi Collective is among the parties most likely to also build a neutral aggregator. RiskBeat has no relationship with the DeFi Collective. Both feeds are **MIT-licensed**, and our pipeline consumes only their **public data** — so RiskBeat's coverage of them does not depend on their cooperation or consent, and is not influenced by them.

## Recusal policy

If any maintainer acquires a relationship with a feed provider or protocol (employment, advisory, token grant, paid engagement, or governance role), they must:
1. Add it to this file before the relationship begins, and
2. **Recuse** themselves from any feed-registry or coverage decision touching that entity (per [`CHARTER.md`](./CHARTER.md) §7).

## Funding disclosure

- RiskBeat's initial build (June 2026) was **self-funded by the maintainer**. RiskBeat **has applied** for the Ethereum Foundation ESP / App Relations grant under the "Neutral DeFi Risk Intelligence Aggregator" RFP; if awarded, that is non-dilutive public-goods funding and will be recorded here.
- RiskBeat **does not** accept funding from any listed protocol or feed provider in exchange for editorial influence. Any post-grant matching contributions are governed by [`CHARTER.md`](./CHARTER.md) §7 — disclosed terms, zero editorial influence.

## How to flag a missing disclosure

Open a GitHub issue or PR against this file. Suspected undisclosed conflicts can be raised privately with the steward; material findings will be recorded here.
