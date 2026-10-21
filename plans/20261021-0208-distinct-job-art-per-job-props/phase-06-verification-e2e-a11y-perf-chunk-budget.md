# Phase 06: Verification: e2e, a11y, CLS/perf, lazy-chunk threshold

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 03, 04, 05 · Blocks: 07
- Inputs: spike `reports/02-spike-decision.md` (approved thresholds), [report 01](reports/01-scout-and-baseline-report.md) section 4
- Prior: [switcher phase 05](../20261018-0541-class-job-switcher/phase-05-verification-e2e-a11y-perf.md) (budgets and methods reused)
- Docs: `docs/code-standards.md#testing`, `docs/project-overview-pdr.md` (performance and a11y rows), `docs/design-guidelines.md#motion`

## Overview
- Date: 2026-10-21 · Priority: P0 · Effort: M (4h) · Implementation status: Todo · Review status: Pending
- Prove the feature with numbers: all automated suites, a11y, no layout shift, Lighthouse unchanged, lazy chunk and home HTML within the thresholds approved in phase 00. Record results for the docs phase.

## Key Insights
- Props are fixed-size inside a fixed-size SVG: CLS risk is nil by construction; the existing no-JS integer-size test and the saved-look CLS test already guard it.
- Lazy chunk is the only budgeted cost that grows meaningfully (predicted +0.8-1.0 KB gz). Threshold from phase 00: <= 6,000 B gz (baseline 4,627 B), eager stub <= +100 B gz, home HTML <= +1,000 B gz.
- Credits gallery and the switcher radio groups derive from `allClassLooks()` / `JOBS`, so they need no code; they still need a look.
- Most e2e assertions are derived from `LOOKS`/`pick` (not hardcoded), so only helper selectors changed in phase 01; "all 10 looks" already compares rendered path data with the pure modules.

## Requirements
- Functional: unit, e2e, check, build green; 9 jobs selectable and each renders its own art; legacy saved keys ignored; Reset restores the pick.
- Non-functional: Lighthouse mobile `/` 99-100 all categories, CLS <= 0.002 (baseline 0.0016), desktop 100; other pages (`/credits/`, `/speedrun/`, boss project) unchanged; compose + apply <= 16 ms warm at 4x CPU; chunk budgets as above; axe serious/critical = 0 in both themes.

## Architecture
Gate order: `npm run check` -> `npm run test:unit` -> `npm run build` (measure) -> `npm run test:e2e` -> Lighthouse (preview) -> manual a11y. Record every number in `reports/03-verification-report.md`.

## Related Code Files
Modify (only if a gap shows):
- `/home/user/portfolio-app/tests/e2e/class-job-switcher.spec.ts`: add one test "nine job looks render nine different avatars" (collect the hero `path` `d` signature per job look via `chooseLook`, assert 9 unique) and a legacy-key case (`mage/hawk`) if not added in phase 01.
- `/home/user/portfolio-app/tests/e2e/character-avatar.spec.ts`: only if the credits count or desc wording needs an assertion (`Job prop:` text appears in the SVG `desc`).
- `/home/user/portfolio-app/tests/unit/look-avatar-model.test.ts`: `desc` contains `Job prop: <JOB_PROP_NAMES[job]>` for each job (if not done in 01).
Create: `reports/03-verification-report.md`, `reports/assets/lighthouse-*.json` or notes (plan folder).
Delete: none.

## Implementation Steps
1. `npm run check` (0 errors), `npm run test:unit` (record count; expected 279 + new), fix only real failures; never loosen budgets silently: any ceiling change needs the user's OK (plan Q2).
2. `npm run build`. Measure (from `dist/_astro/`): eager stub (`ls dist/_astro | grep -i class-job-switcher`), lazy chunk (`grep -i look-apply`), `gzip -9 -c <file> | wc -c` and `wc -c`; home HTML `dist/index.html` and `dist/credits/index.html` raw + gz; compare with the phase 00 baseline and the thresholds. Confirm the chunk is still lazy: with the preview server, a fresh load requests no `look-apply*` chunk (existing e2e asserts it).
3. Eager guard: `switcher-eager-imports` green; `grep -rn "avatar-job-" dist/_astro/class-job-switcher*.js` finds nothing (props are not in the stub).
4. `npm run test:e2e` (builds again, ~minutes; run in background and poll). Record the count (expected 121 + added). Re-run a failing spec once before debugging; no skips.
5. a11y checks: axe in `class-job-switcher-quality.spec.ts` and `accessibility-axe.spec.ts` both themes; confirm `role="img"` name equals "Class · Job" for all 9 jobs (existing "names" test over `LOOKS`); `desc` mentions the prop in text; the nameplate, gear legend and Why panel still carry the meaning (nothing depends on the prop colour or motion); forced-colors spec green (art keeps colours via `forced-color-adjust: none`); reduced-motion spec green (no animation, frame A static); loop still stops after 5 x 900 ms (CSS unchanged: `git diff` shows no change to `character-avatar.astro`).
6. Contrast record: re-run `check-accent-contrast.ts` with the final hexes; paste the table into the report (accent vs outline >= 3:1; vs ring informational, both themes).
7. CLS/perf: Lighthouse mobile on `/` x3 (median), `/credits/`, `/speedrun/`, boss project; desktop on `/`. Targets: mobile 99-100, desktop 100, CLS <= 0.002. With a saved look (`localStorage portfolio-look = mage/seer`, longest title) CLS <= 0.005 at 360 and 1280 (existing quality spec). Compose + apply timing at 4x CPU throttle (CDP `Emulation.setCPUThrottlingRate`), warm vs first call, target <= 16 ms warm.
8. Visual: open `/` and `/credits/` in the preview in both themes at 360 and 1280: 9 jobs distinct in the credits gallery (10 avatars), hero loop plays ~4.5 s then rests on frame A, switcher changes props; screenshots into the plan folder.
9. Manual a11y smoke (screen reader announces "Mage · Seer" image; keyboard through the switcher; 200% zoom) as in the prior plan's open items; log results or mark "not run".
10. Write `reports/03-verification-report.md`: counts, sizes vs thresholds table (pass/fail), Lighthouse table, open items. If the lazy chunk exceeds the threshold: do not raise it silently; trim (smaller props, drop trim masks) or escalate (Q2).

## Todo list
- [ ] check 0 errors; unit count recorded
- [ ] build; stub, lazy chunk, home, credits sizes recorded vs thresholds
- [ ] no prop art in the eager stub; no chunk request on a fresh load
- [ ] e2e green (count recorded), new "nine distinct avatars" case
- [ ] axe both themes, forced colors, reduced motion green; desc mentions the prop
- [ ] accent contrast table final
- [ ] Lighthouse mobile/desktop + CLS + 4x CPU timing recorded
- [ ] Visual review at 360/1280, both themes
- [ ] Manual a11y smoke logged or marked not run
- [ ] Verification report written

## Success Criteria
- All suites green; lazy chunk gz <= approved threshold (default 6,000 B); eager stub <= +100 B gz; home HTML gz <= +1,000 B; animated markup within approved ceilings.
- Lighthouse mobile home 99-100 across categories (3-run median), CLS <= 0.002; desktop 100; axe serious/critical = 0 in both themes.
- Report lists measured vs threshold for every row; no unexplained deltas.

## Risk Assessment
| Risk | Impact | Mitigation |
|---|---|---|
| Lazy chunk over 6,000 B gz | NO-GO on budget | trim art/trim masks; or user approves a higher ceiling (Q2) |
| Lighthouse -1 from bigger hero markup | metric dip | 3-run median; markup growth is only ~0.3-0.5 KB gz; shrink runs if needed |
| First compose call > 16 ms at 4x | perf note | one-time cost (44 ms first call in v1.4); only warm is budgeted |
| e2e flake in sandbox | false red | re-run once, background + polling |
| Hashed chunk names in assertions | brittle | match prefixes only |

## Security Considerations
Re-check rule 3 (no `innerHTML`/`set:html` added by this work: `git diff` grep), rule 4 (only allow-listed keys reach the composer; legacy `mage/hawk` removed from storage), rule 6 (eager graph). Lighthouse and screenshots use the local preview only.

## Next steps
Phase 07 syncs docs with the measured numbers, then runs the final gate and commits.
