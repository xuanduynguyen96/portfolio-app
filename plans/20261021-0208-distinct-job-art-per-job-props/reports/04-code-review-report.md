# Report 04: code review (phase 07)

Date: 2026-10-21 · Scope `git diff 2943738..bab21ba` · Reviewer: code-reviewer agent · Verdict: no critical findings

## Important (all fixed)
| # | Finding | Fix |
|---|---|---|
| 1 | Byte budgets need a build | Measured in report 03: all pass |
| 2 | Accent contrast/dE + "same in both themes" not pinned by tests | `avatar-job-props.test.ts`: contrast >= 3:1 vs outline, dE >= 20 / >= 30 in class, each token defined exactly once (no theme override). Mutation (seer back to #e0527a) fails at dE 19.1 |
| 3 | Trim visibility tested at tier 0 only | Now all 256 gear tier sets x 9 jobs x 2 frames, >= 4 visible accent px |
| 4 | Colour cap sampled on 8 tier sets | Now all 256 tier sets for every look (max 15 of 16) |

## Minor
- Fixed: `avatar-description.ts` applies the same job-validity guard as `select-avatar-layers` (no prop named when none is drawn).
- Fixed: all 9 `JOB_PROP_NAMES` non-empty + unique (test); silhouette test renamed ("at the same job slot").
- Kept: `JOB_PROP_ZONES` in src (documents the art contract next to accents; tree-shaken); `SpriteLayer` not merged with `PlacedSprite` (unrelated refactor); trim file name `avatar-class-trim.ts` (per-class data, matches docs).
- Kept: sibling-prop difference is shape-only; colour differs by accent anyway, silhouette test backs it.

## Gates after fixes
check 0 errors · unit 329/329 · e2e 122/122 · build ok.

## Unresolved questions
1. Warrior frame B trim is at the 4 px floor: visually enough? (taste call)
