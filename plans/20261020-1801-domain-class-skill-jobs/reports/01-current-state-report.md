# Report 01: current working-tree state (verified by reading code + running read-only commands, 2026-10-20)

> **Superseded in part (user decision, 2026-10-20): Mage = DevOps.** This report describes the tree as audited, with the generated **Artificer** class. The plan now replaces it: restore the original Mage pose, rename `artificer` -> `mage`, jobs Enchanter/Summoner/Seer (see [plan.md](../plan.md) "Revision"). Artificer art findings (item 2 under "Missing / broken") no longer apply. Owner result and all other findings stand.

Base: `master` @ `2976490`, HEAD **detached at master** (create a branch before committing). All changes uncommitted. Staged: 2 deletions (`git rm`). Nothing else staged.

## Commands run (read-only)
| Cmd | Result |
|-----|--------|
| `npm run check` | 78 errors, **all in tests/ + `scripts/render-avatar-sheet.ts`**; 0 in `src/` |
| `npm run test:unit` | 187 tests, 171 pass, 16 fail (all stale tests / removed-export imports) |
| `npm run character:explain` | OK. Owner = **Warrior · Knight** (was Warrior · Vanguard) |
| `node scripts/render-avatar-sheet.ts` | **CRASH** `TypeError ... reading '0'` at `select-avatar-layers.ts:37` |

## Done (src, verified)
| Area | File | Status |
|------|------|--------|
| Rules | `src/data/character-class-rules.ts` (39 L) | DOMAIN_IDS, `skillDomains`, signals{domain 5, job 2}, fallback. Matches spec |
| Rules | `src/data/character-job-rules.ts` (60 L) | CLASS_IDS (4), CLASS_BY_DOMAIN, MOTIF_IDS, DOMAIN_LABELS, JOBS (3/class). Matches spec table |
| Vote | `repo-domain-vote.ts` (58 L, new) | zeroVote, round3, recencyWeight, activityWeight, repoWeight, repoDomainVote (even split by voting-skill count) |
| Classifier | `classify-character.ts` (95 L) | skill-match voting, fallback (total<1 or voters<2), primary tie by DOMAIN_IDS order, job = max credit, first job wins ties |
| Types | `character-types.ts` | `ClassSignal.domain`, `signals`, `jobSignals`; `secondary` gone |
| Quests | `repo-quests.ts` | `questScore = repoWeight + hygiene + pinned` (class-independent) |
| Avatar | `avatar-class-artificer.ts` (new), `avatar-sprites.ts`, `avatar-job-motifs.ts` (keys banner/crystal/hawk), mage file deleted | registered; 2 frames differ |
| Switcher | `class-looks.ts`, `class-labels.ts`, `look-avatar-model.ts`, `select-avatar-layers.ts`, `avatar-description.ts`, `switcher-body.ts` | key = `class/motif`; job found by motif; job hints = `specialty` |
| UI | `class-why-panel.astro`, `character-nameplate.astro` | two lists (class, job); DOMAIN_LABELS |
| Scripts | `explain-character.ts` | prints domain scores, per-repo vote, both signal lists |

## Missing / broken (verified)
1. **`scripts/render-avatar-sheet.ts`**: hero cell still `profileOf('warrior', 'frontend', ...)` (old motif id) -> crash + tsc error. Fix to `'banner'`. With that one line patched in a scratchpad copy the sheet renders (1.2 MB html, PNG ok).
2. **Artificer art (eyeballed from the rendered PNG)**: readable (teal coat/cap, wrench front-left, banner top-right clear of wrench, no overlap seen). Concerns: (a) teal tunic close to Adventurer's teal tunic -> blind-ID risk; (b) wrench thin (2 px wide), frame B difference subtle (shaft lowered 3 rows, passes "frames differ"); (c) anchors guessed, identity-box + budget + silhouette tests not yet run on it (tests don't compile). Needs second look at 64px and 128px.
3. **Stale comment** `src/data/xp-rules.ts:39` "Quest ranking = class vote + ...". Reword to repo weight.
4. **Test files not updated** (compile or runtime failure): `avatar-silhouette`, `avatar-sprites`, `avatar-svg-paths`, `character-rules`, `class-looks`, `compose-avatar-grid`, `look-avatar-model`, `class-labels` (runtime fail), `classify-character`, `repo-archetype-vote` (import of deleted module), plus `avatar-test-helpers.ts`, `github-snapshot-fixtures.ts` (language-only fixtures; pureMage obsolete).
5. **`repo-quests.test.ts` passes unmodified** (12 pass; Go repos still rank by weight). Only additive tests needed (class independence), not a rewrite.
6. **E2E not updated** (tsc errors + stale keys): `class-job-switcher.spec.ts` (ARCHETYPE_LABELS import; `'mage'`, `'data'` x5 refs; hint assertion), `class-job-switcher-quality.spec.ts` (`mage/data` + "Arcane Archer" comment), `character-avatar.spec.ts` (`ARCHETYPE_IDS.length ** 2 + 1`). `switcher-helpers.ts`, `page-navigation-lifecycle.spec.ts`, `career-mirror.ts` have **no stale refs** (use `allClassLooks`, `selectQuestRepos`, `classifyCharacter`; no edit expected, only re-run).
7. **Docs stale** (not touched): README (Career RPG section, "Class rules" row, "Class + job names (9 jobs)" row, switcher row/bullet, test counts 261/120), docs/{system-architecture,code-standards,design-guidelines,codebase-summary,project-roadmap,project-overview-pdr,deployment-guide}.md. `docs/project-overview-pdr.md` and `deployment-guide.md` (test count 261) were NOT in the caller's list; they also mention the old model.
8. Changelog `src/content/changelog/2026-10-18-class-job-switcher.md` mentions Mage/Data: dated historical entry, leave.

## Design observations to resolve in phase 1
- `pickJob` compares **unrounded** credit sums while domain scores are rounded (round3). Round credits too for one consistent tie rule (exact-tie unit tests stay valid).
- `changeClass` keeps the job **slot** (motif) across classes; jobs are now class-specific (warrior/crystal = Paladin -> artificer/crystal = Shipwright). Behaviour fine, wording in docs/tests must say "slot".
- Fallback profile (`Adventurer`) returns signals for all domains (not only primary); panel shows the "not enough signal" text so harmless.
- `github-actions` matches ANY repo with a workflow file; `playwright` only via root config file. A frontend repo with CI gets a devops share. Per-repo split keeps it minority unless the repo proves few frontend skills (see risks).
- Keywords are whole-word tokens (`repoTokens`), so 'ui'/'ai' substring bugs cannot happen; generic whole words still can: `rest`, `server`, `api`, `mobile`, `landing`, `website`, `asp`, `ios`.
- Quest scale unchanged (repoWeight 0.25..1.5 vs old vote total <= 1 x weight).

## Current owner result (live snapshot 2026-10-19)
Warrior · Knight. scores backend 2.877 | frontend 2.364 | devops 0.974 (frontend = 82% of backend: sensitive to one repo). Job credit: Knight (C#/.NET repos) > Sentinel > Paladin.
Per repo: devops only from `portfolio-app` (0.617), `aspnet_framework_docker_ex` (0.177), `spring-jenkins` (0.180).

## Unresolved
- Quest list shift not measured yet (phase 4 does it against an HEAD copy).
