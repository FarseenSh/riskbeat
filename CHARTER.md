# RiskBeat Charter

> This is a **founding document**, not a policy file. It defines what RiskBeat may and may not do. It is committed to the repository, rendered on the project's Methodology page, and changes to it are tracked in git history. Amending the core no-composite-scoring rule requires **written agreement from the Ethereum Foundation** (see §3).

_Last updated: 2026-06-12. Steward: Farseen Shaikh ([github.com/FarseenSh](https://github.com/FarseenSh))._

---

## 1. Purpose

RiskBeat exists to be a **credibly-neutral, verbatim record** of what every major DeFi risk feed says about every major protocol. Its value comes from aggregating independent assessments **without synthesis** — the mental model is oracle diversity. The neutrality this requires is not a marketing claim; it is a set of hard constraints, enforced in code, written down here.

## 2. The core commitment — no composite scoring

**RiskBeat does not produce, derive, or display any composite, average, weighted, blended, or synthesized score of its own.** Each feed's published assessment is shown verbatim, in that feed's own vocabulary, attributed to its source. The absence of a house opinion is the product.

### 2.1 Three permitted operations
The only operations RiskBeat performs across the data are:
1. **Verbatim display** — render a feed's rating exactly as the feed publishes it.
2. **Coverage COUNT** — count how many feeds have assessed a protocol (a count of `status` enum values; it never reads or combines rating *values*). Labeled "feeds with assessments," never as a risk signal.
3. **TVL sort/filter** — order or filter protocols by live TVL (or volume), a market metric, not a risk rating.

### 2.2 Two hard prohibitions
1. **No cross-feed arithmetic on rating values.** No function may read two or more feeds' rating values in the same expression to produce a combined output.
2. **No RiskBeat-produced score.** No field, column, badge, color, or label may represent RiskBeat's own judgment of a protocol's risk.

## 3. Amendment process

The two prohibitions in §2.2 may be changed **only** with **written agreement from the Ethereum Foundation App Relations team**, recorded as a signed change to this file with a link to that agreement. No community vote, contributor majority, sponsor, or steward may waive them unilaterally. All other sections may be amended by the steward via a public, reviewed PR.

## 4. Rendering rules

- **Verbatim, native vocabulary.** Ratings are never normalized to a common scale (a `Stage 2`, an `A+`, a `0–100`, a `VaR $`, and a `7/7 passed` are shown as themselves, not translated).
- **Inline-label exception.** In the summary matrix, only feeds whose entire vocabulary is a short, self-explanatory ordinal label (e.g. DeFiScan and Anticapture `Stage 0/1/2`) may render that label inline. Adding any other feed to the inline exception requires a PR against this charter. All other vocabularies render only in per-feed cards on the detail page.
- **No visual-weight manipulation.** Column ordering, font size, color intensity, and similar affordances must not be used to imply that one feed, or one protocol, is "higher risk" than another. Visual weight encodes coverage status only, never a synthesized verdict.
- **Coverage gaps are data.** A `not-yet-covered` cell is rendered explicitly, never hidden behind a number.

## 5. Provenance

Every datum carries exactly one provenance tag: `[onchain]`, `[feed]`, `[curated]`, or `[self-reported]`. Tags are defined on the Methodology page. Curated and self-reported data must cite a `source_url` and `source_date`.

## 6. Feed registry governance

- **Inclusion/exclusion** of any feed is decided in public via PR, with a written rationale, and is documented on the Methodology page.
- **Each feed entry carries a `conflict_of_interest` field** (empty string is valid; an absent field fails CI). This makes feed neutrality machine-auditable.
- **Retirement SLA.** A feed with no update in 90 days is marked `dormant`: its cells render a distinct stale-dash, and it is excluded from the coverage count until it resumes. A feed whose data access disappears is marked accordingly — the gap is shown as data, not hidden.

## 7. Neutrality & conflicts

- RiskBeat has **no feed of its own** and produces no first-party assessment of any protocol.
- The project and its maintainers **do not accept funding from any listed protocol or feed provider** in exchange for placement, ordering, or favorable presentation, and disclose all relationships in [`CONFLICTS.md`](./CONFLICTS.md).
- **Recusal.** Any maintainer with a relationship to a feed or protocol must disclose it and recuse from registry decisions touching that entity.
- Post-grant **matching contributions** (a mechanism named in the RFP) may fund operations only under disclosed terms that grant **no editorial influence** whatsoever; sponsors cannot affect what any feed says or how it is ordered.

## 8. Steward & succession

- **Named steward:** **Farseen Shaikh** ([github.com/FarseenSh](https://github.com/FarseenSh)), committed to long-term maintenance.
- **Succession clause:** on the steward's departure, custody of the repository transfers to the **Ethereum Foundation App Relations team** as fallback custodian, opening a **90-day community-nomination window** for a new steward.
- **Interim default:** if no steward is confirmed within that window, the contributor with the most merged data PRs over the preceding 12 months becomes interim steward, to prevent indefinite limbo.
- The fallback-custodian role is subject to the EF App Relations team's written acknowledgement.

## 9. Enforcement

The commitments above are enforced at four independent layers, so that violating them is *structurally* difficult, not merely against policy:
1. **Type system** — feed data uses a discriminated union with no shared score field; the rating renderer is a switch on feed identity with no aggregation branch.
2. **CI gate** — a grep check fails any change introducing `composite | aggregate | average | combined | our_score` fields in `data/`.
3. **Lint rule** — `no-cross-feed-render` fails CI if any component reads two or more feeds' rating values in the same expression.
4. **This charter** — committed, rendered on-site, and amendable per §3.

---

*RiskBeat is a public good. This charter is the contract that keeps it neutral.*
