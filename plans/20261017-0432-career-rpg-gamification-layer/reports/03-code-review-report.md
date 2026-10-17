# Code Review: Career RPG layer (feat/career-rpg-layer)

Reviewer: code-reviewer agent, 2026-10-17. Scope: phases 01-07 (~3.6k lines). Critical: none.

## Findings -> status
| # | Sev | Finding | Status |
|---|---|---|---|
| H1 | High | Evidence dedupe bypass via query/`www.`/case/trailing dot/`index.html` | **Fixed**: coarse key (lowercase host+path, no query/hash/www/dot/index) + tests |
| H2 | High | Placeholder metrics render as speedrun achievements; master deploys them | **Open: user decision** (deploy gate vs "sample data" label) |
| M1 | Med | Word gate padding (`a a a`, hidden spans, link defs) | **Fixed**: `minUniqueWords: 80`, strip hidden els + link defs, new `body-too-repetitive` status |
| M2 | Med | One URL levels many skill nodes | **Fixed**: build fails when a URL (normalized) is reused across skills |
| M3 | Med | Duplicate skill in a quest -> duplicate "Proven in" links | **Fixed**: `skill listed twice` rule |
| M4 | Med | Strict-schema guarantee untested; `resolveBuildNow` untested | **Fixed**: `career-schemas.test.ts`, pure `resolve-build-now.ts` + test, credential-free https refine |
| M5 | Med | DRY: duplicate sorter, boss rule, kebab regex, level progress | **Fixed**: `sort-projects.ts` removed (cards follow quest order), boss rule only in zod, `SKILL_ID_PATTERN`, `LevelInfo.progress` used |
| M6 | Med | Type stripping needs Node >=22.18 | **Fixed**: `engines >=22.18` |
| M7 | Med | Rejected/dev cache stale | **Fixed**: reset on rejection, no cache in dev |
| M8 | Med | Docs/README/plan stale | Plan updated; README/docs = phase 09 (after user approval) |
| M9 | Med | Copy overclaims; backdating possible | Copy softened; git-date cross-check = **open question** (plan Q5) |
| L | Low | 24h tolerance week edge, credentials, reserved email domains, level count hardcoded, YAGNI fields (`newEvidence`, `totalWeeks`), unverified-reason wording, test brittleness (`>=10`, `/ 10 checks`, unescaped regex), changelog tie order, status-dot comment | Fixed |
| L | Low | Countdown has no pause (WCAG 2.2.2), redundant list aria-labels, token-less 0.5rem/0.8em, nested `<article>`, changelog re-fetch, metric label length | Accepted (decorative + aria-hidden + off under reduced motion; minor) |

## Positives (reviewer)
Strict schemas + aggregated named rule errors; https enforced twice; safe external links; native progress/details; nested-list tree; no-JS + reduced-motion tested; UTC-deterministic dates; tier decay + caps; deterministic boss-first URL claim; CI schedule correct.

## Unresolved questions
1. H2: deploy-only placeholder gate (fail build when placeholders remain) or visible "sample data" label on /speedrun/?
2. M9/Q5: cross-check changelog dates vs git history in CI, or keep as honour system?
3. HUD public once 100% (plan Q1)?
