# Plan: class = domain, job = skills (Warrior/Archer/Mage)

Created: 2026-10-20 · Revised 2026-10-20 (user: **Mage = DevOps**, Artificer dropped) · Status: **Implemented, gates green (279 unit, 121 e2e, check 0 errors), code-reviewed; uncommitted, awaiting user OK to commit** · Target: v1.5 · Inputs: [current-state report](reports/01-current-state-report.md) · Prior: [class/job switcher](../20261018-0541-class-job-switcher/plan.md)

## Goal
Replace language/keyword archetype votes with **skill-match domain votes**. Class = domain (backend=Warrior, frontend=Archer, devops=**Mage**; Adventurer fallback). Mage stops meaning "Data": it is now the DevOps class and reuses its existing hand-drawn pose. Job = specific skills (3 per class, each domain skill in exactly one job). Prop = job slot (banner|crystal|hawk). 10 looks, keys `class/motif`. Quests ranked by repo weight, not class. Evidence = `signals` (domain, max 5) + `jobSignals` (max 2).

## Revision: Mage = DevOps (replaces Artificer)
Why: DevOps = conjuring/automation (pipelines = spells, containers = summons, tests = foresight); data has no skills in `skills-data.ts`, so a Data Mage could never be earned; reusing the Mage pose removes the new-art work and the Artificer-vs-Adventurer teal risk.
| Was (working tree) | Becomes |
|--------------------|---------|
| class id `artificer`, name Artificer | `mage`, name Mage |
| `CLASS_IDS` = warrior, archer, artificer, adventurer | warrior, archer, **mage**, adventurer |
| jobs Forgemaster / Shipwright / Warden | **Enchanter** (github-actions, jenkins; banner; "CI/CD pipelines") / **Summoner** (docker; crystal; "Containers") / **Seer** (playwright; hawk; "Test automation") |
| `avatar-class-artificer.ts` (new, untracked) | delete; restore `avatar-class-mage.ts` from HEAD (`git restore --staged --worktree src/data/avatar/avatar-class-mage.ts`), keep export `magePose` |
| `avatar-sprites.ts` imports `artificerPose` | import `magePose`, key `mage` |
| look key `artificer/hawk` | `mage/hawk` (`mage/data` stays invalid: no `data` motif) |
Code footprint is 4 files: `character-job-rules.ts`, `avatar-sprites.ts`, `avatar-class-artificer.ts` (delete) + `avatar-class-mage.ts` (restore), comment in `class-looks.ts:30`. Old HEAD Mage jobs (Battlemage/Sorcerer/Druid) are gone; names are unique across the 9 jobs. Old Mage pose: pointed hat, beard, orb hand, crystal staff; it passed every sprite test at HEAD with the same prop art, but must be re-verified against the new Warrior/Archer silhouettes (phase 01 step 5-8, phase 02).

## Phase 0 decision: base (in force)
**Keep the partial working tree and verify/fix it.** Why: src compiles (0 tsc errors outside tests/scripts), rules + classifier + vote + switcher wiring already match the spec on read-through; only 1 real src bug (`render-avatar-sheet.ts`) + 1 stale comment found, plus the Mage rename above; redo = throw away ~10 correct files for no gain. Redo only if phase 1 finds the vote model itself wrong. Rollback = `git restore` + unstage deletions (see below).

## Phases
| # | Phase | Pri | Effort | Status | Depends |
|---|-------|-----|--------|--------|---------|
| 01 | [Rename to Mage, verify + fix source, art review](phase-01-verify-and-fix-source.md) | P0 | M (2.5h) | Done | - |
| 02 | [Unit tests rewrite + new invariants](phase-02-unit-tests-rewrite.md) | P0 | L (5h) | Done | 01 |
| 03 | [E2E updates + run](phase-03-e2e-updates.md) | P0 | M (3h) | Done | 01, 02 |
| 04 | [Real-data check (owner result, quest shift)](phase-04-real-data-check.md) | P1 | S (1h) | Done | 01 (parallel with 02) |
| 05 | [Docs update + changelog decision](phase-05-docs-update.md) | P1 | M (3h) | Done | 04 |
| 06 | [Final gate, review, commit](phase-06-final-gate-and-commit.md) | P0 | M (2h) | Gates green + reviewed; commits pending user OK | 01-05 |

Order: 01 -> (02 || 04) -> 03 -> 05 -> 06. Total ~16.5h (no new art). 03 needs green unit fixtures only for shared helpers; e2e mirrors engine so it runs once src compiles.

## Key decisions (user-confirmed unless marked)
- Domain ids/tie order: backend, frontend, devops. Class names: Warrior, Archer, Mage (user: Mage = DevOps). Mage job names (Enchanter/Summoner/Seer) = assistant suggestion, open for veto.
- Vote = even split across a repo's voting skills' domains x `repoWeight`; fallback total<1 or voters<2.
- Job credit = sum of primary-domain vote of voting repos proving >=1 job skill; ties -> earlier job. Invariant: every `skillDomains` key in exactly one job of its domain's class (unit-tested).
- Old saved `portfolio-look` (e.g. `mage/data`) invalid -> falls back to GitHub pick (accepted, no migration).
- Rules stay generic: no owner names anywhere; fixtures synthetic.

## Behaviour changes to document
- Python/TS/JS/Go/Rust/Swift alone no longer vote; repo must prove a domain skill (keyword, topic, root file, workflow, or listed language: C#, Java, HTML, CSS, Astro).
- Mage changes meaning: Data -> DevOps. Data-only profiles -> Adventurer (or another domain); a DevOps-heavy profile (Docker, Jenkins, Actions, Playwright) is now a Mage. Owner live class: Warrior · Vanguard -> Warrior · Knight today (re-check after refresh).
- Quest list may reorder (Python-only repos still rank).

## Risks (top; full tables in phases)
Restored Mage pose vs new Warrior/Archer silhouettes (IoU, identity boxes) · class flips on live site · saved-look invalidation · quest shift · generic whole-word keywords (`rest`, `server`, `api`, `mobile`) · html/css/csharp language-only votes · `github-actions` matches any workflow so CI-heavy frontend repos leak devops share · e2e count drift (120 expected unchanged).

## Rollback
Uncommitted: `git restore --source=HEAD --staged --worktree .` restores every tracked file incl. the staged deletions (`repo-archetype-vote.ts`; `avatar-class-mage.ts` is restored by phase 01 anyway); delete the untracked new file by name (`repo-domain-vote.ts`, plus `avatar-class-artificer.ts` if phase 01 has not removed it yet); never `git clean` (would also remove this plan). Committed: `git revert <sha>`. Snapshot untouched, no data migration.

## Unresolved questions
1. Mage job names ok (Enchanter / Summoner / Seer)? (Class name settled: Mage = DevOps.)
2. Herald owns html+css+web-sites: language-only HTML/CSS share (>=10%) votes frontend. Acceptable, or drop html/css from `skillDomains`?
3. Commit partial work as a checkpoint commit now (tests red) or one commit at the end?
4. Add a changelog entry (src/content/changelog, strict frontmatter) for the model change?
5. Accept owner class flip risk: frontend 2.36 vs backend 2.88 (82%), so next snapshot may flip to Archer.
6. Tighten generic keywords (`rest`, `server`, `api`, `mobile`) in `skills-data.ts`? Affects skill levels too, so out of scope unless approved.
7. Create branch name `feat/domain-class-skill-jobs` (HEAD is detached at master)? Push/PR only on request.
8. Should `/speedrun/` and credits copy mention domain classes? (assumed no change).
