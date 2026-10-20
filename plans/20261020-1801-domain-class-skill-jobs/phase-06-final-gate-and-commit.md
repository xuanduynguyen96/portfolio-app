# Phase 06: Final gate, code review, commit

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 01-05 · Blocks: none
- Rules: `.claude/workflows/development-rules.md` (lint before commit, tests before push, conventional commits, no AI references, code-reviewer after implementation), `docs/code-standards.md#commits`

## Overview
- Date: 2026-10-20 · Priority: P0 · Effort: M (2h)
- Implementation status: Todo · Review status: Pending
- Run the whole gate, get a review, commit locally. No push/PR unless the user asks.

## Key Insights
- HEAD is detached at `master`: create a branch first.
- Two staged deletions exist; commit must include them (`git add -A` of the intended paths, not blind).
- Commit messages: conventional, **no AI/co-author trailers** (development-rules overrides the session attribution reminder; user instruction wins).
- `plans/` is tracked in this repo (prior plans committed): include this plan dir in the docs commit.

## Requirements
- Functional: check + unit + build + e2e all green; reviewer findings resolved or logged.
- Non-functional: focused commits; no secrets (`git diff --cached` scan); no `.env*`.

## Architecture
Gate order: type check -> unit -> build -> e2e (builds again + previews). Then review. Then commits.

## Related code files
All files touched in phases 01-05. Nothing new here except commits.

## Implementation Steps
1. `cd /home/user/portfolio-app && git switch -c feat/domain-class-skill-jobs` (keeps working tree + index; staged deletions persist). Confirm with `git status --short`.
2. Gate: `npm run check && npm run test:unit && npm run build && npm run test:e2e` (e2e ~ minutes; background + poll). Record counts + any flake.
3. Budget spot check from build: home HTML gzip vs v1.4 (13,790 B) and switcher chunks: no regression > +1 KB (class names change only). If `dist/` inspection needed: `gzip -c dist/index.html | wc -c`.
4. Genericity + stale grep: `grep -rniE "archetype|sorcerer|battlemage|spellblade|druid|arcane archer|vanguard|artificer" src scripts tests README.md docs` -> only historical changelog/plan/roadmap rows. `grep -rniE "mage" src scripts tests | grep -viE "image"` -> every hit means DevOps (no Data meaning). `grep -rn "xuanduynguyen96" src/data/character-* src/utils` -> none.
5. Code review: invoke `code-reviewer` agent (Agent tool) with scope = `git diff HEAD` + untracked new files, focus: vote math vs spec, tie-breaks, rounding, switcher allow-list, eager-import guard, a11y of Why panel, sprite constraints, docs accuracy. Fix Critical/Important; log Minor in plan.md. Re-run affected gates.
6. Review `git diff HEAD --stat` and `git status --short`: ensure only intended paths; no scratch files in `scripts/` or repo root.
7. Commits (explicit paths, no AI references):
   1. `feat(character): derive class from skill domains and job from skills` (src/data rules, `repo-domain-vote.ts`, classifier, types, quests, avatar sprites (Mage restored as DevOps class) + the `repo-archetype-vote.ts` deletion, switcher/labels/looks, Why panel, scripts)
   2. `test: cover domain classes, skill-based jobs and mage looks` (tests/unit, tests/e2e)
   3. `docs: describe domain classes and skill-based jobs` (README, docs/, changelog entry, plans/20261020-1801-domain-class-skill-jobs)
   Use `git add <paths>` per commit and `git rm`-staged deletions stay in commit 1 (they are already staged; unstage with `git restore --staged` if grouping differently). Pre-commit: `npm run check` already green.
8. Checkpoint (open question 3): default = no checkpoint, commit once everything is green. If the user wants one, commit only the source commit (1) on the branch with its normal conventional message and say tests are red until commit 2.
9. Report to user: branch name, 3 commit SHAs, test counts, owner result, open questions. Do NOT push or open a PR unless asked.

## Todo list
- [ ] Branch created
- [ ] `npm run check` 0 errors
- [ ] `npm run test:unit` green (count recorded)
- [ ] `npm run build` ok
- [ ] `npm run test:e2e` green (count recorded)
- [ ] Budgets unchanged (home HTML gz, chunks)
- [ ] Stale-term + genericity greps clean
- [ ] code-reviewer pass; findings resolved
- [ ] 3 conventional commits, no AI references, no push

## Success Criteria
- All four commands exit 0 on the final tree; reviewer has no open Critical/Important findings.
- `git log --oneline -3` shows the 3 conventional commits; `git status` clean (except intentionally untracked scratch outside repo).
- User receives owner class/job result and unresolved questions.

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|-----------|
| e2e flake or sandbox timeout | false red | re-run failing spec once; background run with polling |
| Live-site class flip on next deploy | identity change | already accepted; document in changelog entry + roadmap |
| Saved-look keys invalid for returning visitors | choice reset once | accepted; noted in changelog/docs |
| Quest list shift changes boss/pinned display | content surprise | phase 04 report; `pinnedBonus` keeps pinned first |
| Commit includes scratch/secret | leak | `git diff --cached --stat` + grep for tokens before each commit |
| Rollback needed | - | `git revert` the 3 commits (reverse order); snapshot/data untouched |

## Security Considerations
No new inputs; `localStorage` allow-list unchanged and tested (old keys rejected). No `innerHTML`/`set:html` added. No secrets in commits; no push means no CI token exposure.

## Next steps
User review -> optional push + PR (not done here). Follow-ups: tighten generic keywords (needs approval), human blind-ID test (Mage is now DevOps; same pose), attributes bars/Why for chosen class (v1.4 follow-ups).
