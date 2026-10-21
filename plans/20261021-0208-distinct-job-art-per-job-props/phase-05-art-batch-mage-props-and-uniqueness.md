# Phase 05: Art batch C: Mage props (Enchanter, Summoner, Seer) + cross-job uniqueness tests

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 02 (03 and 04 for the uniqueness test) · Blocks: 06
- Inputs: spike `reports/02-spike-decision.md`, [report 01](reports/01-scout-and-baseline-report.md) sections 2-3
- Docs: `docs/code-standards.md#avatar-sprites`, `docs/design-guidelines.md#character-avatar`
- Reference art: `/home/user/portfolio-app/src/data/avatar/avatar-class-mage.ts` (staff x23-24 y6-28, orb box x22-25 y0-5, sparks on frame B), `avatar-job-props-mage.ts` (legacy placeholder)

## Overview
- Date: 2026-10-21 · Priority: P0 · Effort: L (5h) · Implementation status: Todo · Review status: Pending (sheet review gate)
- Draw the 3 Mage props and trim check, then close the batch series: delete the legacy skip list and add the cross-job uniqueness tests (all 9 props pairwise distinct, silhouettes still class-distinct).

## Key Insights
- Mage zone (policy S): x26..31, y7..25 = **6x19**: the crystal staff (identity box x23-24, y6-28) and orb box (x22-25, y0-5) squeeze the right strip; frame B sparks at x26 y2-3 forbid rows above 6. A second floor zone (7x10 @ (0,22)) exists but is only used if the spike chose it.
- Colour budget: Mage pose already has 14 keys (`ILSabciklosuxy`), gear tier 3 adds none; spare 2, accent uses 1. All three props can be drawn with Mage keys (`a` arcane, `x` sparkle, `c u` blues, `y b`, `k i I`, `l L`) + accent: no extra colour.
- Mage animated raw today 9.0-9.5 KB, so bytes are less of a problem than for Archer; narrow props mean few runs.
- 6 px wide is small: prefer bold 1-2 px strokes; blink/rotate are the cheapest readable motions.
- Metaphors: Enchanter = automated pipeline (CI/CD: rune circle feeding stages), Summoner = container crate that conjures, Seer = floating eye (test automation sees what will happen).

## Requirements
- Functional: `avatar-job-props-mage.ts` exports `mageProps` for `enchanter`, `summoner`, `seer` inside the Mage zone; same size across frames; accent main hue >= 15% of opaque px; tests: 9 props pairwise distinct, each frame pair differs by >= 4 px, silhouette tests still pass.
- Non-functional: file < 200 lines; `LEGACY_ART` skip list deleted; <= 16 colours; animated raw/gz inside thresholds; `class-looks` count still 10.

## Architecture
| Job | Metaphor (skills) | Frame A (rest) | Frame B (motion) | Size | Keys (+ accent) |
|---|---|---|---|---|---|
| Enchanter | rune circle / pipeline (GitHub Actions, Jenkins) | 6x6 accent rune ring with an arcane glyph, a 1 px line down to a small second node | glyph rotates a quarter turn, a bright pixel advances down the pipeline | 6x14 | `a i x` + `H` enchanter |
| Summoner | container crate (Docker) | accent crate with dark ribs and a hook/chain on top | lid lifts 1 px, 2-3 arcane `a` puff pixels rise | 6x10 | `L k a` + `J` summoner |
| Seer | floating eye (Playwright, test automation) | open eye: white `x` sclera, accent iris, dark pupil, 2 ray pixels above | blink: eye shrinks to a closed lid line with lashes | 6x7 | `x I a` + `M` seer |
Outer shapes: ring+tail (tall) / box+hook (square) / lens (wide, short). If the spike chose policy B or the floor zone, adjust sizes there, not here.

New tests (in `tests/unit/avatar-job-props.test.ts`, keep < 200 lines or split `avatar-job-props-unique.test.ts`):
- 9 props: frame-A opaque masks normalised to their bounding box; every pair differs by >= 20 px AND IoU <= 0.70 (calibrate to the measured minimum minus margin after drawing; record the numbers in the test comment).
- Motion: frame A vs B differ in >= 4 px and <= 60% of the prop's opaque pixels (same object, not a different one); both frames share the bounding box size.
- `jobPropSprites` has exactly `JOB_IDS` as keys; no two jobs share the same rows array.

## Related Code Files
Modify:
- `/home/user/portfolio-app/src/data/avatar/avatar-job-props-mage.ts` (rewrite)
- `/home/user/portfolio-app/src/data/avatar/avatar-class-trim.ts` (only if hem accent clashes)
- `/home/user/portfolio-app/tests/unit/avatar-job-props.test.ts` (delete `LEGACY_ART`, add uniqueness/motion cases)
- `/home/user/portfolio-app/tests/unit/avatar-silhouette.test.ts` (only if IoU fails: see step 7)
Create: `reports/assets/sheet-mage.png` and `reports/assets/sheet-all-jobs.png` (plan folder).
Delete: none (legacy skip list is code inside the test).

## Implementation Steps
1. Read the Mage pose rows/anchors for both frames; confirm the strip x26..31, y7..25 on the zone map (frame B sparks!).
2. Draw frame A for the 3 props at the target sizes within the allowed keys; keep the 1 px gap to the staff/identity boxes and to gear tiers 0-3 (Mage shield sits at (16,19)/(16,19), amulet (16,15)).
3. Derive frame B from A per the table; same size.
4. Place at x26.., y7..25; Seer may sit mid-strip, Enchanter taller, Summoner lower, so the three also differ in vertical position.
5. `npm run test:unit`; fix zone/collision/colour/identity failures.
6. Remove the whole `LEGACY_ART` skip list; add the uniqueness and motion tests; calibrate thresholds from the actual 36 pairs (print the minimum diff/IoU once).
7. Silhouette guard: run `avatar-silhouette.test.ts`. If a cross-class IoU now exceeds .80/.85 because props of different size add area, keep the slot loop but ALSO assert IoU on bodies without props (`jobId: null`); do not loosen the numbers.
8. Review gate: `node scripts/render-avatar-sheet.ts plans/20261021-0208-distinct-job-art-per-job-props/reports/assets/sheet-all-jobs.html --png plans/20261021-0208-distinct-job-art-per-job-props/reports/assets/sheet-all-jobs.png` (all 9 jobs, tiers 0 and 3, frames A and B, light and dark). Check: nine distinct objects at 64 and 128 px; each class still reads as its class; accent trims visible; props never touch gear. Save the screenshot.
9. Bytes: record animated raw/gz per look (max over tiers) and static sheet size; compare to thresholds.
10. `npm run check && npm run test:unit`.

## Todo list
- [ ] Enchanter rune ring + pipeline, accent `H`
- [ ] Summoner crate + hook, accent `J`
- [ ] Seer eye with blink, accent `M`
- [ ] `LEGACY_ART` skip list removed; all Mage tests green
- [ ] Uniqueness (36 pairs) + motion tests added and calibrated
- [ ] Silhouette guard still green (or body-only variant added)
- [ ] All-jobs sheet reviewed, screenshot saved
- [ ] Bytes within thresholds

## Success Criteria
- 9 pairwise-distinct props, each with a 2-frame job-specific motion; no test skips remain.
- Zero overlap or adjacency with body, gear (tiers 0-3, both frames), identity boxes, on all 3 classes.
- <= 16 colours on all 10 looks x tier samples; markup budgets met; unit green.
- Blind review of the all-jobs sheet: >= 6 of 9 props named correctly from the metaphor list.

## Risk Assessment
| Risk | Impact | Mitigation |
|---|---|---|
| Three tall 6 px props look alike | uniqueness fails | vary silhouette (ring+tail / box / lens), vertical position, accent hue |
| Eye/rune unreadable at 64 px | weak payoff | review at 64 and 128; fall back to policy B or the floor zone (open Q1, Q5) |
| Frame B sparks (x26, y2-3) collide with a tall Enchanter | red test | start at y >= 7 |
| IoU of classes rises with larger props | red silhouette test | body-only variant, never loosen thresholds |
| Seer blink frame is the "static" frame in reduced motion | wrong rest state | frame A = eye open; B = closed |

## Security Considerations
Static data, closed palette, no input. Eager graph untouched (checked by `switcher-eager-imports`).

## Next steps
Phase 06 verifies everything end to end (e2e, a11y, CLS/perf, chunk size).
