# Phase 04: Real-data check (owner result, quest shift, genericity)

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 01 (parallel with 02) · Blocks: 05
- Docs: `docs/code-standards.md#tuning-class-job-and-gear-rules` (never tune to the owner), `docs/system-architecture.md#github-derived-pipeline`
- Report: [current state](reports/01-current-state-report.md) (owner result today)

## Overview
- Date: 2026-10-20 · Priority: P1 · Effort: S (1h)
- Implementation status: Done · Review status: Reviewed (code-reviewer: no critical/important findings)
- Run the new engine on the committed snapshot, compare with the old engine (HEAD) for class, job and quest list, record in a report. No rule tuning to change the answer.

## Key Insights
- Today: Warrior · Knight; scores backend 2.877 | frontend 2.364 | devops 0.974 (frontend 82% of backend). Old: Warrior · Vanguard.
- Old engine lives only in HEAD; compare without touching the tree: export HEAD to scratchpad and symlink `node_modules`.
- Quest ranking old = class vote total + hygiene + pinned; new = `repoWeight` + hygiene + pinned. Repos with no archetype vote (old) dropped to hygiene/pinned only; now they rank by recency/activity.
- `quest.max` = 6.

## Requirements
- Functional: table of class/job/scores old vs new; quest top-6 old vs new with diff; per-repo skill matches that drove votes.
- Non-functional: read-only on repo (no edits to `src/`); outputs under `reports/`.

## Architecture
```
git archive HEAD | tar -x -C $SCRATCH/head ; ln -s /home/user/portfolio-app/node_modules $SCRATCH/head/node_modules
old:  cd $SCRATCH/head && node scripts/explain-character.ts            # old votes
new:  cd /home/user/portfolio-app && npm run character:explain
quests: scratch script (outside repo) importing selectQuestRepos from each tree -> print top 6 + boss
```
Use absolute paths; keep scratch scripts out of `scripts/` (earlier accidental temp file risk: scripts dir is hidden-file sensitive).

## Related code files
Create: `plans/20261020-1801-domain-class-skill-jobs/reports/02-real-data-check-report.md`.
Modify: none. Read: `src/data/github/github-snapshot.json`, `scripts/explain-character.ts`, `src/utils/github-character/repo-quests.ts`.

## Implementation Steps
1. `bash -c 'date +%y%m%d'` not needed; no date stamps in code.
1. Export HEAD copy (see Architecture); run old `character:explain`, save output.
2. Run new `npm run character:explain`; save output.
3. Quest comparison script: for both trees print `selectQuestRepos(snapshot, overrides)` names in order, boss via `pickBossRepo`. Overrides from `src/content/projects/*.md` slugs (only `portfolio-app` exists; read ids with `ls`).
4. For each owner repo list proven skills (`matchSkills`) and which vote. Flag suspicious matches (generic words: `rest`, `server`, `api`, `mobile`, `landing`, `website`) and language-only votes (C#, Java, HTML, CSS).
5. Sensitivity: recompute with `asOf` +/- 1 month and with the top frontend repo removed; note whether the class flips (informational; do not tune).
6. Genericity audit: `grep -rn "xuanduynguyen96\|portfolio-app\|MiniWebServer\|WeatherApp" src/data/character-*.ts src/utils/github-character src/utils/avatar` must return nothing (only snapshot/content files may name repos).
7. Write report: old vs new table, quest diff, flagged matches, flip sensitivity, recommendation (accept / open question for keywords). Feed result into phase 05 docs (owner line) and unresolved questions.

## Todo list
- [x] Old vs new class/job/scores recorded
- [x] Quest top-6 + boss old vs new recorded
- [x] Skill-match audit of owner repos (false positives listed)
- [x] Flip sensitivity noted
- [x] Genericity grep clean
- [x] `reports/02-real-data-check-report.md` written

## Success Criteria
- Report answers: owner's class/job, which repos moved in/out of quests, any suspicious votes, flip risk.
- Grep shows no owner hardcode in rules/classifier/avatar code.

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Owner class flips to Archer next refresh | live site identity changes | accepted by user; document; no tuning |
| Quest list reorders (recency-first) | boss/pinned changes | `pinnedBonus` 0.5 keeps pinned on top; report diff |
| False-positive keyword vote | wrong domain | list in report; propose `skills-data.ts` tightening as separate approved change |
| HEAD copy diverges from snapshot | misleading diff | same snapshot file in both trees |

## Security Considerations
Snapshot is public-repo data only; do not print tokens; scratch copy in session scratchpad, never committed.

## Next steps
Phase 05 uses the results; unresolved questions 2, 5, 6 in plan.md depend on this report.
