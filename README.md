# OpenRisk — every feed, one view

**A credibly-neutral, open record of what every major DeFi risk feed says about every major protocol — side by side, verbatim, with no score of its own.**

OpenRisk is a **public good** for the Ethereum ecosystem. It is **infrastructure for builders** — an open, machine-readable risk-data layer that wallets, explorers, governance tools, and DAO treasuries can consume to surface *what every feed says about a protocol*. The website is one reference consumer of that data.

The mental model is **oracle diversity**: no single risk feed is canonical, **the aggregation is the value**, and **a coverage gap is itself a signal**.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](./LICENSE) · Built in the open from day one · Ethereum mainnet

---

## What OpenRisk does — and does NOT do

**Does:** aggregates the major DeFi risk feeds for the top-20 Ethereum-mainnet protocols, rendering each feed's assessment **verbatim, in that feed's own vocabulary**; surfaces governance from on-chain sources; tracks which feeds have / have not assessed each protocol; links to every source; maintains a community-correctable data registry.

**Does NOT:** produce its own risk score · weight, rank, or average feeds against each other · tell you whether a protocol is "safe" · endorse any protocol. **There is no OpenRisk score, ever.** This prohibition is documented in [`CHARTER.md`](./CHARTER.md) and enforced in code (a typed data model with no shared score field, a CI gate, and a lint rule). See the charter for the full rule and the process required to ever change it.

## Surfaces

- **`/`** — Coverage matrix: every protocol × every feed, cells labeled `covered / partial / not-applicable / not-yet-covered`, with live TVL.
- **`/protocol/[slug]`** — Per-protocol detail: governance (on-chain, via the Safe Transaction Service), one card per feed with its methodology and **verbatim** rating, source links, an explicit "Not yet covered by:" row, audit & incident history.
- **`/methodology`** — What the project does and does not do, the full feed registry, the four provenance tags, the charter.
- **`/corrections`** — The live log of community corrections.
- **`/verify`** — Reproduce any day's data root from a `git clone`: every feed datum is content-addressed and the daily Merkle root is published.

## Provenance — every datum is tagged

`[onchain]` read from chain / the Safe API · `[feed]` from an automated external feed · `[curated]` added or verified by a contributor via PR · `[self-reported]` provided by the protocol team, unverified.

## Data layer

All data lives in git — there is no database and no admin panel. **Pull requests are the write path.**

```
data/
├── protocols/*.yaml    # one file per protocol (identity, addresses, governance, audits)
├── feeds/feeds.yaml    # the feed registry (generates the typed FeedKey)
├── overlays/*.json     # community corrections
└── cache/{feed}/{date}-{sha256}.json   # content-addressed nightly feed snapshots
```

## Tech stack

Next.js 15 (App Router, SSG + ISR) · TypeScript · git-native YAML/JSON data · DefiLlama (live TVL) · Safe Transaction Service (governance) · GitHub Actions (nightly feed fetch + CI) · deployed on Vercel (Cloudflare Pages as the committed fallback). Near-zero infrastructure cost by design.

## Run locally

```bash
pnpm install
pnpm dev      # http://localhost:3000
pnpm build    # production build
pnpm validate # schema-validate all data files
```

## Contributing

OpenRisk is community-correctable. You can correct a datum, add a protocol, or propose a new feed — all via PR. See [`CONTRIBUTING.md`](./CONTRIBUTING.md). CI validates every change against the schemas and the no-composite-scoring gate.

## Governance, neutrality & conflicts

- [`CHARTER.md`](./CHARTER.md) — the founding rules: no composite scoring, the permitted operations, the amendment process, the steward and succession plan.
- [`CONFLICTS.md`](./CONFLICTS.md) — all disclosed relationships.

## Team

- **Farseen Shaikh** — builder, technical lead & long-term steward · [github.com/FarseenSh](https://github.com/FarseenSh)

OpenRisk is community-correctable by design: data corrections, protocol
additions, and feed proposals come in as pull requests from anyone, and the
CI gates (schema validation, checksums, the no-composite rule) hold every
contributor — including the maintainer — to the same charter.

## License

[GNU AGPL-3.0](./LICENSE). The full codebase and data layer are AGPL-3.0 and public.

**Data outputs:** to the extent OpenRisk holds rights in its *compiled data
outputs* (the JSON snapshots under `data/cache/`, the provenance records, and
the `/api/v0/*` responses), they are additionally dedicated to the public
domain under [CC0-1.0](https://creativecommons.org/publicdomain/zero/1.0/) —
take them, no attribution required. Verbatim ratings inside those outputs
remain the work of their publishers and stay attributable to them; source
links are embedded in every datum.

---

*Built for the Ethereum Foundation ESP / App Relations RFP, "Neutral DeFi Risk Intelligence Aggregator." OpenRisk is not affiliated with, and produces no assessment of its own about, any listed protocol or feed provider.*
