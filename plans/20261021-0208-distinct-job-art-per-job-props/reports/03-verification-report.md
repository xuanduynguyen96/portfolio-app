# Report 03: verification (phase 06)

Date: 2026-10-21 · Branch `feat/distinct-job-art` @ bab21ba (+ docs/changelog, uncommitted at time of writing)

## Gates
| Gate | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings |
| `npm run test:unit` | 326/326 (was 279; +38 `avatar-job-props`, + slot/legacy/prop-name cases) |
| `npm run test:e2e` | 122/122 (was 121; + legacy `mage/hawk` key case), incl. axe both themes, forced-colors, reduced-motion, switcher quality |
| Golden digest after phase 01 | `f642d3a8...9d83f7` unchanged (pixel-neutral) |
| Eager guard | `switcher-eager-imports` green; prop art (`IkkkCyI`, `JIJJIJ`, `accent-knight`) absent from `class-job-switcher*.js`, present in `look-apply-model*.js` |
| Mutation check | knight moved 1 px left -> zone/clearance test fails (restored) |

## Sizes (gzip -9)
| Metric | Baseline | Now | Threshold | |
|---|---|---|---|---|
| lazy chunk gz | 4,580 | 5,421 | <= 6,000 | PASS |
| lazy chunk raw | 18,040 | 20,913 | <= 23,000 | PASS |
| eager stub gz | 2,992 | 3,034 (+42) | <= +100 | PASS |
| home HTML gz | 13,515 | 13,629 (+114) | <= +1,000 | PASS |
| credits HTML gz | 12,832 | 13,391 | - | info |
| animated markup raw max | 10,015 | 10,886 (archer/ranger t3) | <= 11,264 | PASS (ceiling unchanged) |
| animated markup gz max | 1,859 | 1,979 (warrior/paladin t3) | <= 2,560 | PASS |
| colours per look max | 16 | 15 | <= 16 | PASS |

## Contrast (final hexes, `check-accent-contrast.ts` with seer `#c74bd0`)
All 9 accents 4.07-8.75:1 vs outline (gate >= 3:1); vs ring 1.00-2.15 light / 1.71-3.68 dark (informational, outline between). Min dE 25.1 overall (herald/summoner), 33.2 within a class (knight/sentinel).

## CLS (Playwright PerformanceObserver, preview build, 2.5 s)
| Viewport | GitHub pick | saved `mage/seer` |
|---|---|---|
| 360 | 0.0028 | 0.0028 |
| 1280 | 0.0010 | 0.0010 |
The client recompose adds no shift; the avatar box (viewBox, size) is unchanged. A saved legacy `mage/hawk` falls back to the GitHub pick (also e2e-covered).

## Visual
Rendered all 10 looks, both frames, tier 0 light + tier 3 dark (scratch PNGs, not committed). 9 props read distinct; trim visible on all combat classes at tier 0; tier 3 gold shield covers most Warrior/Archer trim (expected: gear draws over trim), Mage bands stay visible.

## Not run
- Lighthouse (not installed in this environment; CLS measured as above, no new JS on the eager path, HTML +114 B gz).
- Compose timing at 4x CPU (per-pixel constant; one extra small trim layer).
- Manual screen reader / 200% zoom smoke.
- Baseline CLS on the pre-change build (worktree build failed with a symlinked `node_modules`); identical pick vs saved-look CLS shows the change adds none.

## Unresolved questions
1. Art taste: review the 9 props on the live preview (`/` switcher, `/credits/`) before merge.
