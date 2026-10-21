# Phase 07: Docs sync, changelog, final gate, review, commit

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 06 · Blocks: none
- Inputs: `reports/03-verification-report.md` (measured numbers to paste), spike decision (policy, zones, hexes)
- Rules: `.claude/workflows/development-rules.md` (lint before commit, tests before push, code-reviewer after implementation, conventional commits without AI references), `.claude/workflows/documentation-management.md`, `docs/code-standards.md#commits`
- Prior: [v1.5 final gate](../20261020-1801-domain-class-skill-jobs/phase-06-final-gate-and-commit.md)

## Overview
- Date: 2026-10-21 · Priority: P1 · Effort: M (4h) · Implementation status: Todo · Review status: Pending
- Make every doc match the shipped behaviour (job id keys, 9 props, accents, zones, new budgets), add the changelog entry, run the full gate, get a code review, commit locally. No push or PR unless asked.

## Key Insights
- Docs currently say the prop is the job SLOT in at least: code-standards (L151, L163), design-guidelines (L113), system-architecture (L75, L82-84, L101, L111, L146), codebase-summary (L56, L59, L110), PDR (L57, L70, F17), roadmap (v1.5 rows), README (avatar row; script table counts). `MOTIF_PROP_NAMES` is mentioned in code-standards but never existed; remove the mention.
- Test counts change (279 unit, 121 e2e, README/codebase-summary/code-standards/PDR quote them): update from the phase 06 run, not by arithmetic.
- Changelog frontmatter is strict: `date` + `summary` (<= 160 chars) only; file name `YYYY-MM-DD-slug.md`; it no longer feeds the streak.
- Commit rule: conventional, no AI references. The session attribution reminder asks for trailers, but the development rules and this plan's brief say no AI references; follow the project rule (same call as the v1.5 gate).

## Requirements
- Functional: docs + changelog accurate; gates green; reviewer has no open Critical/Important findings; 3 focused commits on a feature branch.
- Non-functional: docs concise (sacrifice grammar), link instead of copy numbers where a rules file owns them; no secrets in commits.

## Architecture
Doc map (what changes):
| File | Change |
|---|---|
| `docs/design-guidelines.md` (Character avatar) | "Job = prop" rewritten: 9 unique props, abstract metaphors, zone sizes per class (policy), per-job accent on trim + prop (identical in both themes, contrast vs outline), per-job 2-frame motion under the same gating; switcher section: radio values are job ids |
| `docs/code-standards.md` (#avatar-sprites, #classjob-switcher) | "Add a job prop" -> add a job: id in `JOB_IDS`/`JOBS`, prop in `avatar-job-props-<class>.ts` inside `JOB_PROP_ZONES`, accent key + token, name in `JOB_PROP_NAMES`, trim mask; colour cap spare table; collision tests; rule 4 keys (`mage/seer`; pre-v1.6 slot keys invalid); drop `MOTIF_*` mentions; palette keys `A..M` reserved |
| `docs/system-architecture.md` | class/job table drops slot labels (prop names instead); Avatar render bullets (9 props, trim layer z 15, accents); switcher: key `class/job`, saved-key sentence (v1.6); measured block with new chunk sizes |
| `docs/codebase-summary.md` | `avatar/` dir list (`avatar-job-props-*`, `avatar-job-style`, `avatar-class-trim`), `class-looks.ts` key example, `character-job-rules.ts` row, test counts and the new `avatar-job-props.test.ts` |
| `docs/project-overview-pdr.md` | F17 key `class/job`; scope line "prop = job slot" -> unique prop; performance row with measured sizes |
| `docs/project-roadmap.md` | new "v1.6: distinct job art" section (phases, what shipped, behaviour change), changelog table row, follow-ups: accent on nameplate/UI, per-job gear art left open |
| `README.md` | Avatar art row (job props, accents), scripts table counts, switcher paragraph key note if it names slots |
| `src/data/credits-data.ts` | sprite entry note: "classes, job props, ..." -> "classes, nine job props with accents, 4 gear tiers, 2 action frames" (still own work, no third-party art); `credits-page.spec` does not pin the text |
| `src/content/changelog/2026-10-21-distinct-job-art.md` | new entry (below) |

Changelog entry:
```
---
date: 2026-10-21T12:00:00Z
summary: Each of the nine jobs now has its own prop, accent color and small animation. Saved looks from earlier versions reset once to your GitHub pick.
---
```
Body (2 short paragraphs): what changed (Knight crest shield ... Seer eye; accent on outfit trim; each prop moves its own way, same motion rules); saved looks use job names now (`mage/seer`), earlier ones reset once; gear, class and name unchanged.

## Related Code Files
Modify: the docs above, `README.md`, `src/data/credits-data.ts`.
Create: `src/content/changelog/2026-10-21-distinct-job-art.md`; `reports/04-code-review-report.md` (plan folder).
Delete: none.

## Implementation Steps
1. Branch: `git switch -c feat/distinct-job-art` from the current tip (HEAD is on `master`; plan files are untracked and come along).
2. Update docs per the map using the numbers in `reports/03-verification-report.md` (chunk, home HTML, counts, Lighthouse, contrast). Keep each doc's "Last updated" line current (2026-10-21, v1.6).
3. Add the changelog entry; `npm run build` validates the strict schema.
4. Stale-term greps (expect only historical plan/changelog/roadmap rows): `grep -rniE "motif|banner|crystal|hawk" src scripts tests README.md docs` (plus `mage staff crystal` in pose comments is fine), `grep -rn "MOTIF_" src scripts tests docs`, `grep -rniE "6x11|job slot" docs README.md`.
5. Final gate: `npm run check && npm run test:unit && npm run build && npm run test:e2e` (background + poll); Lighthouse already done in 06, re-run only if code changed after 06.
6. Code review: invoke the `code-reviewer` agent on `git diff master...HEAD` plus untracked files. Focus: pixel-neutral claim of phase 01 (digest), look-key allow-list and slot mapping, eager-import guard, collision test correctness (off-by-one at gap 1), palette/token completeness, trim mask validity, colour cap, docs accuracy, no `innerHTML`. Fix Critical/Important, log Minor in `reports/04-code-review-report.md`, re-run affected gates.
7. `git diff --stat` and `git status --short`: only intended paths; no scratch files; no secrets (`git diff --cached | grep -iE "token|secret|key="` sanity scan).
8. Commits (explicit `git add <paths>`, conventional, no AI references, no trailers):
   1. `refactor(avatar): key job props by job id` (phase 01 files)
   2. `feat(avatar): distinct prop, accent and motion per job` (palette, tokens, trim, art, style, switcher text, credits note)
   3. `test(avatar): cover job props, accents and collisions` (tests/unit + tests/e2e)
   4. `docs: describe per-job avatar art` (README, docs/, changelog, plans/20261021-0208-distinct-job-art-per-job-props)
   If splitting by phase proves messy, 3 commits (feat / test / docs) are acceptable.
9. Report to the user: branch, SHAs, counts, size table (baseline vs measured vs threshold), Lighthouse, review result, unresolved questions. Do not push.

## Todo list
- [ ] Branch created
- [ ] 7 docs + README + credits note updated; no stale slot wording
- [ ] Changelog entry (frontmatter valid, summary <= 160, date 2026-10-21)
- [ ] check, unit, build, e2e green (counts recorded)
- [ ] code-reviewer pass; findings resolved
- [ ] Commits created locally, no AI references

## Success Criteria
- Stale-term greps clean outside history; every number in docs traces to the verification report.
- All gates exit 0 on the final tree; reviewer has no open Critical/Important findings.
- `git log --oneline` shows conventional commits only; `git status` clean; nothing pushed.

## Risk Assessment
| Risk | Impact | Mitigation |
|---|---|---|
| Docs drift (counts, sizes) | misleading docs | paste from the verification report, grep for old counts (279, 121, 4,627) |
| Changelog schema violation | build fails | `npm run build` before commit |
| Review finds collision off-by-one | wrong gap | fix test + art together, re-run sheet |
| Visitors with old saved looks | choice resets once | stated in the changelog and docs; migration is an open question |
| Accidental attribution trailer | breaks project rule | commit message check before `git commit` |

## Security Considerations
No secrets, no push. Review checks that storage values still pass only through `parseLookKey`/`parseJobId` and that client code builds DOM with `createElement`/`textContent` and CSSOM fills only.

## Next steps
User review, optional push/PR. Follow-ups (not built): accent tint on nameplate/UI (open Q3), class-specific gear art, shareable `?look=`, human blind-ID test with the new props.
