# Contributing to RiskBeat

RiskBeat is **community-correctable by design**. There is no database and no admin panel — **all data lives in git, and pull requests are the write path.** Anyone can correct a datum, add a protocol, or propose a new feed. CI validates every change automatically, so reviewers focus on credibility, not syntax.

By contributing you agree your contribution is licensed under the project's [AGPL-3.0](./LICENSE) license.

---

## The data layer

```
data/
├── protocols/<slug>.yaml   # one file per protocol
├── feeds/feeds.yaml        # the feed registry (generates the typed FeedKey)
├── overlays/<slug>.json    # community corrections & manual feed data
└── cache/<feed>/<date>-<sha256>.json   # nightly automated snapshots (do not hand-edit)
```

Every value displayed on the site carries exactly one **provenance tag**:

| Tag | Meaning |
|---|---|
| `[onchain]` | read directly from chain or the Safe Transaction Service |
| `[feed]` | fetched from an automated external risk feed |
| `[curated]` | added or verified by a contributor via PR (requires `source_url` + `source_date`) |
| `[self-reported]` | provided by the protocol team, not independently verified |

## The three kinds of PR

| PR type | Files you change | What CI checks |
|---|---|---|
| **Correct or add feed data** | `data/overlays/<slug>.json` | schema valid · `feed_key` exists · `provenance_tag` set · `source_url` + `source_date` present for curated data |
| **Add a protocol** | `data/protocols/<new-slug>.yaml` | schema valid · `slug` == filename · checksummed `0x…` addresses · DefiLlama slug resolves |
| **Add a feed** | `data/feeds/feeds.yaml` + a fetcher in `lib/feed-fetchers/` | schema valid · `FeedKey` unique · `automation_tier` + `conflict_of_interest` set · at least one test fixture |

### Overlay entry — required fields
```json
[
  {
    "id": "aave-defiscan-stage-001",
    "protocol_slug": "aave",
    "feed_key": "defiscan",
    "field": "stage",
    "original_value": "Stage 0",
    "corrected_value": "Stage 1",
    "correction_type": "update",
    "source_url": "https://defiscan.info/protocols/aave",
    "source_date": "2026-06-09",
    "contributor": "github:your-handle",
    "date": "2026-06-09",
    "provenance_tag": "curated",
    "status": "open"
  }
]
```
The file is an **array** of entries; `id` and `protocol_slug` are required, and
`correction_type: "update"` requires both `original_value` and `corrected_value`.
`correction_type` is one of `add | update | flag | deprecate`. Flags (`stale`, `disputed`, …) require a `flag_reason` and `evidence_url`.

## What gets merged — and what doesn't

A PR is merged when it (a) passes CI, (b) cites a credible, linkable source, and (c) does not introduce any synthesis. A PR is **rejected** if it:
- introduces a composite/averaged/ranked value across feeds (this is prohibited — see [`CHARTER.md`](./CHARTER.md));
- changes a feed's rating to something other than what the feed actually published;
- adds an unsourced `[curated]` or `[self-reported]` value;
- editorializes about whether a protocol is "safe" or "risky."

The full no-composite-scoring rule, the permitted operations, and the rendering rules are in [`CHARTER.md`](./CHARTER.md). Conflicts of interest are disclosed in [`CONFLICTS.md`](./CONFLICTS.md) — if you have a relationship with a feed or protocol you're editing, disclose it in your PR.

## Local development

```bash
pnpm install
pnpm dev        # run the site at http://localhost:3000
pnpm validate   # schema-validate every data file (same checks CI runs)
pnpm lint       # includes the no-cross-feed-render rule
pnpm build      # production build
```

A correction shows up on the live **`/corrections`** page once merged, and the underlying datum becomes verifiable from a clone via **`/verify`**.

## Conduct

Be precise, cite sources, assume good faith. Disputes about a feed's methodology belong with that feed; RiskBeat only records what each feed says, verbatim.
