# Phase 02: Unit tests rewrite + new invariants

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 01 · Blocks: 03, 06
- Docs: `docs/code-standards.md#testing`, `#tuning-class-job-and-gear-rules` (fixtures must keep expected classes)
- Pattern files: `tests/unit/github-snapshot-fixtures.ts`, `avatar-test-helpers.ts`, `career-fixtures.ts`

## Overview
- Date: 2026-10-20 · Priority: P0 · Effort: L (5h)
- Implementation status: Done · Review status: Reviewed (code-reviewer: no critical/important findings)
- Bring 16 failing + type-broken unit files green; add tests for every new rule. Assert against `classRules`/`JOBS`/`skillNodes`, not copied numbers. Fixtures generic (`example-user`, no owner repo names except the single `ownerLike` shape check, which must be renamed/neutralised).

## Key Insights
- Fixtures were language-only; languages that no longer vote (Go, Rust, Swift, TS, JS, Python) must be replaced by skill-proving repos: keyword/topic in name/description, root files, `workflowFiles`, or listed languages (C#, Java, HTML, CSS, Astro).
- `repo-quests.test.ts` passes untouched (12 pass); only add class-independence cases.
- `class-labels.test.ts` fails at runtime (undefined `.find`), `look-avatar-model.test.ts` fails on import.
- Keep the `repo-tokens` test (move into `repo-domain-vote.test.ts` or a new `repo-tokens.test.ts`; DRY: one place).

## Requirements
- Functional: all invariants in plan.md covered; deterministic, no clock reads.
- Non-functional: each file <200 lines; names kebab-case; `.ts` import specifiers; erasable syntax; `node:test`.

## Architecture
Fixture builders (generic, all `AS_OF = 2026-10-12`):
| Builder | Proves | Expected |
|---------|--------|----------|
| `pureBackend()` | C# + `dotnet`/`api` keyword repos, Java + `pom.xml` | Warrior (job by fixture) |
| `pureFrontend()` | `astro.config.mjs` + Astro lang, `react` topic, HTML/CSS share | Archer |
| `pureDevops()` | `Dockerfile`, `Jenkinsfile`, `playwright.config.ts`, `workflowFiles` | Mage |
| `dataOnly()` | Python + Jupyter only | Adventurer |
| `ownerLike()` | C#/Java/ASP.NET older + Astro/web recent (rename `hybridBackendFrontend`) | Warrior or Archer per weights; assert via rules |
| `sparse()` | one repo proving one skill | Adventurer |
Plus helper `provingRepo(name, skillId, overrides)` that builds a repo matching one skill from `skillNodes[].match` (first keyword/file/language/workflows), so job tests do not hardcode strings per skill (DRY, generic).

## Related code files
Modify:
- `tests/unit/avatar-test-helpers.ts` (MOTIF_IDS; job lookup `JOBS[classId].find(j => j.motif === motif)`; LOOK_KEYS)
- `tests/unit/github-snapshot-fixtures.ts` (builders above; remove `pureMage`/`pureArcher`/`pureWarrior` language-only; add `provingRepo`)
- `tests/unit/avatar-silhouette.test.ts` (3 classes: for each motif, all class pairs IoU <=0.80 full / <=0.85 pooled at tiers 0 and 3; within-class jobs differ >=12 px for all 3 classes)
- `tests/unit/avatar-sprites.test.ts` (loops use MOTIF_IDS; CLASS_IDS = warrior, archer, mage, adventurer; identity-box + on-canvas for the restored Mage pose)
- `tests/unit/avatar-svg-paths.test.ts`, `compose-avatar-grid.test.ts` (imports; color budget <=16, markup budgets cover all 3 combat classes)
- `tests/unit/character-rules.test.ts` (rewrite, see below)
- `tests/unit/class-looks.test.ts` (keys `mage/hawk`; invalid `mage/data` (Mage lost its old Data motif), `warrior/data`; count 10; `changeClass` keeps slot; replace `pureMage` data fixture)
- `tests/unit/class-labels.test.ts` (`warrior/banner` = Warrior · Knight; `mage/hawk` = Mage · Seer; Adventurer)
- `tests/unit/look-avatar-model.test.ts` (imports; owner-like derived look matches server markup; gear identical on all 10 looks)
- `tests/unit/classify-character.test.ts` (rewrite, see below)
- `tests/unit/repo-quests.test.ts` (ADD: Python-only/no-language repo still selected; ranking = weight + hygiene + pinned, identical for any class; archived/old repo ranks lower)
- `tests/unit/switcher-eager-imports.test.ts` (no change expected; re-run)
Create: `tests/unit/repo-domain-vote.test.ts`. Delete: `tests/unit/repo-archetype-vote.test.ts`.

## Implementation Steps
1. Helpers + fixtures first (they unblock 8 files). Compile check: `npm run check 2>&1 | grep tests/unit`.
2. `character-rules.test.ts` invariants:
   - 3 jobs per combat class; `Object.keys(JOBS)` == combat ids; unique job ids and names (9); motifs unique within a class and equal `MOTIF_IDS` set.
   - `CLASS_BY_DOMAIN` covers every `DOMAIN_IDS`, values unique; `CLASS_IDS` = combat + adventurer.
   - Every `skillDomains` key is in exactly one job, and that job's class = `CLASS_BY_DOMAIN[domain]`.
   - Every job skill has a `skillDomains` entry (no orphan) and exists in `skillNodes`; every `skillDomains` key exists in `skillNodes`.
   - Group roots (nodes without `match`) not in `skillDomains`.
   - `minLanguageShare` in (0,1); recency/activity/archived/fallback/signals positive; `DOMAIN_LABELS` has every domain.
   - Gear rules test kept as is.
3. `repo-domain-vote.test.ts`:
   - one voting skill -> full `repoWeight` to its domain; two skills same domain -> still full weight; skills in two domains -> split by count (2:1 gives 2/3, 1/3; sum = repoWeight).
   - non-voting skills (typescript, python, group) vote nothing; empty proven -> zero vote, no signals.
   - `repoWeight`: archived x `archivedFactor`; recency halves per 48 months, floor; activity log-capped (`1 + max`).
   - signals: one per voted domain, `points = round3`, `reason` = skill labels.
   - `recencyWeight`/`activityWeight` cases moved from old file; keep repo-tokens `describe`.
4. `classify-character.test.ts` cases (use `provingRepo`):
   - each pure fixture -> expected class and job; all 9 jobs: a profile of >=2 repos proving only that job's skills (+ filler in the same domain) lands on that job.
   - **job follows proven skills**: backend profile with Java/Spring repos lands Paladin; with `web-servers` only -> Sentinel.
   - **job tie** -> earlier job in table (two identical-weight repos, one proving each of two jobs).
   - **domain tie** -> backend over frontend over devops (equal scores; assert scores equal first).
   - **even split**: repo proving 2 backend + 1 devops skills adds 2/3 and 1/3 of `repoWeight`.
   - **Python-only / Jupyter-only / TS-only / Go-only** -> Adventurer.
   - frontend dev with CI + Playwright on every repo stays Archer (guards `github-actions` leak).
   - fallback: total <1 or voters <2 (exact boundary: just under / at `minTotal`).
   - `signals` <= `signals.domain`, only primary domain, sorted by points then repo name, each has reason; `jobSignals` <= `signals.job`, only repos proving the job; shape: `domain` field, no `archetype`/`secondary`.
   - purity: same snapshot -> identical (clock mocked, keep existing test); later `asOf` changes scores.
   - monolith repo cannot exceed `1 x (1 + activity.max)` per domain vote.
5. `class-looks` / `class-labels` / `look-avatar-model`: update literals; add test that every look title matches `characterTitle` and `JOBS` names; saved-key invalidation: `parseLookKey('mage/data')` is null, `parseLookKey('warrior/data')` null.
6. Sprite tests for the restored Mage pose; if red, fix in phase 01 files (loop back).
7. Run: `npm run check` then `npm run test:unit`. Record the final count (README/docs need it; was 261).
8. Delete `repo-archetype-vote.test.ts` only after its tokens test moved.

## Todo list
- [x] helpers + fixtures
- [x] character-rules invariants (3 jobs/class, unique ids/names, skill in exactly one job, ids exist in skillNodes, motifs unique)
- [x] repo-domain-vote.test.ts (+ tokens test kept)
- [x] classify-character.test.ts (9 jobs, ties, split, Python-only, signals shape)
- [x] class-looks, class-labels, look-avatar-model updated
- [x] avatar sprite/silhouette/svg/compose tests incl. Mage
- [x] repo-quests additive cases
- [x] `npm run check` 0 errors; `npm run test:unit` green; new count recorded

## Success Criteria
- 0 tsc errors project-wide; `npm run test:unit` all pass; no test loosened (budgets, IoU 0.80, 12 px, <=16 colors unchanged).
- Every behaviour bullet in plan.md has a test; no owner-specific string in fixtures/tests besides a neutral hybrid shape.
- Unit count recorded in report/plan for docs.

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| `provingRepo` couples tests to `skills-data` matches | derive from `skillNodes` generically; one test asserts every voting skill is provable by the helper |
| Silhouette IoU >0.80 for Mage vs Warrior/Archer | redraw pose (phase 01), never raise the cap (Mage passed at HEAD) |
| Fixture hybrid flips class after weight tweak | assert on rules-derived expectation (compare scores), not literal class where tie-prone |
| Dropping old language tests loses coverage | new skill-match tests cover the same intent (noise floor via `minLanguageShare` kept: test <10% language ignored) |

## Security Considerations
Test-only. Keep fixtures free of real tokens/emails; `example-user` login only.

## Next steps
Phase 03 (e2e) consumes the green helpers; phase 06 reruns everything.
