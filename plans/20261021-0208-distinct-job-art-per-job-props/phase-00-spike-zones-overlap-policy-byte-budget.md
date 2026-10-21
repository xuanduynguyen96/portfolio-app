# Phase 00: Spike: prop zones, overlap policy, colour/accent plan, byte budget, go/no-go

## Context Links
- Parent: [plan.md](plan.md) · Blocks: 01-07 · Report: [01 scout + baseline](reports/01-scout-and-baseline-report.md)
- Scripts (already written, read-only): [measure-prop-zones.ts](reports/assets/measure-prop-zones.ts), [check-accent-contrast.ts](reports/assets/check-accent-contrast.ts), [hash-look-grids.ts](reports/assets/hash-look-grids.ts)
- Prior spike: [switcher phase 00](../20261018-0541-class-job-switcher/phase-00-spike-variant-size-budget-delivery-decision.md) and its [measure-variant-sizes.ts](../20261018-0541-class-job-switcher/reports/assets/measure-variant-sizes.ts)
- Docs: `docs/code-standards.md#avatar-sprites`, `#classjob-switcher` (rule 6 eager-import guard), `docs/design-guidelines.md#character-avatar`, `docs/system-architecture.md#avatar-render`

## Overview
- Date: 2026-10-21 · Priority: P0 · Effort: S (3h) · Implementation status: Todo · Review status: Pending (user go/no-go on the thresholds below)
- Decide, with numbers, whether 9 unique props fit: free zone per class pose frame, overlap policy, colour budget, accent hues, lazy-chunk threshold. Prototype only in a scratch copy; never commit it. Output `reports/02-spike-decision.md` and STOP for the user's go.

## Key Insights
- Statically measured (report 01), spike re-verifies: Warrior 9x14 @ (23,0), Archer 9x13 @ (23,0), Mage 6x19 @ (26,7) with a 1 px gap; touching (gap 0) gives 10x15 / 10x14 / 6x29. Mage floor zone 7x10 @ (0,22) exists but is a second zone (YAGNI unless a Mage prop needs it).
- Spare colours at gear tier 3: warrior 5, archer 2, mage 2; each look adds 1 accent key. Archer/Mage props must be drawn from keys the class + gear already use.
- Archer animated markup is the tightest: 10,015 B vs 11,264 B ceiling; noisy worst case exceeds it. Gzip has room (max 1,859 vs 2,560 B).
- Existing tests check prop vs identity boxes only. Gear z (20-40) is below job z (50): a collision would paint over gear silently.
- Any mid-tone accent is 1.0-2.2:1 vs the light-theme ring; the outline (`#2a1f1d`, 4.07-8.75:1 for the candidates) is the real neighbour.
- `npm ci` has not been run in this checkout: no `node_modules`, no `dist/`. Chunk sizes need a build.

## Requirements
- Functional: output a decision doc with (1) zone box per combat class, (2) overlap policy, (3) final 9 accent hexes + 9 palette keys, (4) trim mask coordinates per class (both frames), (5) per-job frame-B motion table, (6) go/no-go with explicit thresholds.
- Non-functional: no change to the working tree outside `plans/`; scratch copy outside the repo; every figure in the decision doc comes from a command run in this phase.

## Architecture
```
scratch copy (tar, no .git) ──► baseline build ──► sizes (stub, lazy chunk, home HTML)
       │                                                  │
       └─► throwaway prototype: 9 filler props at zone size, 3 accents, trim masks
              ──► unit-style checks (colours, animated raw/gz) + build ──► lazy chunk delta
decision: GO if all thresholds met, else NO-GO -> re-scope (see table)
```
Overlap policy options (decide one; recommended S):
| Option | Rule | Zones | Cost |
|---|---|---|---|
| **S (recommended)** | 1 px gap from body, gear (all tiers) and identity boxes; no overlap | W 9x14, A 9x13, M 6x19 | Mage props narrow |
| T | touching allowed, still no overlap | W 10x15, A 10x14 (zero slack), M 6x29 | silhouettes fuse (no outline between), Archer tight |
| B | may overlap non-identity body pixels (cape/robe) | Mage wider | new body-overlap mask, blind-ID risk, more tests |

## Related Code Files
Read-only inputs: `src/data/avatar/avatar-class-{warrior,archer,mage,adventurer}.ts`, `avatar-gear-*.ts`, `avatar-job-motifs.ts`, `avatar-palette.ts`, `avatar-types.ts`, `src/styles/design-tokens.css` (`--avatar-*`), `src/utils/avatar/*`, `src/scripts/look-apply-model.ts`, `tests/unit/avatar-{sprites,svg-paths}.test.ts`.
Create (plan folder only): `reports/02-spike-decision.md` (+ optional `reports/assets/*.png` of the prototype sheet).
Modify / delete in repo: none.

## Implementation Steps
1. Scratch copy outside the repo: `tar --exclude=.git --exclude=node_modules -cf - . | tar -xf - -C <scratch>/baseline`; `npm ci`; `npm run build`. Record: `dist/index.html` raw + `gzip -9 -c ... | wc -c` (v1.5 doc says 112,855 / 13,790), `dist/_astro/` entry for the eager stub (`class-job-switcher*.js`) and the lazy chunk (`look-apply-model*.js`) raw + gz (docs: 6,457 / 2,826 and 18,120 / 4,627). Also `/credits/index.html` gz (10 avatars) for later. Re-baseline replaces the doc numbers if they differ.
2. From the repo root run `node --disable-warning=ExperimentalWarning plans/20261021-0208-distinct-job-art-per-job-props/reports/assets/measure-prop-zones.ts`; compare with report 01 section 2-4. Any difference = stop and explain.
3. Decide the overlap policy (table above) with the user's answer to open question 1; default S. Write the zone boxes as the future `JOB_PROP_ZONES` values (inclusive boxes): S gives Warrior `{x0:23,y0:0,x1:31,y1:13}`, Archer `{23,0,31,12}`, Mage `{26,7,31,25}`.
4. Prototype in the scratch copy (copy of the repo, not the working tree): replace `motifFrames` with 9 filler props that fill each zone at about 70% with the class's own keys + one accent key; apply 3 trim masks; run the existing unit tests (colour cap, markup budgets) and a build. Record per class: colours at gear tier 0 and 3, animated raw/gz max, lazy chunk raw/gz, home HTML gz, `/credits/` gz.
5. Colour plan: assign palette keys `A B C D E F H J M` (knight, paladin, sentinel, ranger, skirmisher, herald, enchanter, summoner, seer); letters because digits sort first in `Object.keys` and would reorder `PALETTE_KEYS`. Run `check-accent-contrast.ts`; nudge hexes until: vs outline >= 3:1 for all 9, pairwise dE >= 20 overall (provisional set has skirmisher/seer at 19.1) and >= 30 inside a class. Record final hexes.
6. Trim masks: list pixel coordinates per class frame (candidates: Warrior tabard rows 22-25 x12-13; Archer belt row 23 x11-20; Mage hem bands rows 26 and 29) and prove with a short script that none touches the head/held identity boxes and every pixel is an opaque class pixel. Warrior frame B shifts +1 row with the body.
7. Motion table: one row per job, frame A = rest/static state, frame B = the delta (>= 4 px changed, silhouette within the zone). Seed (final art in phases 03-05): Knight glint travels the rim; Paladin leaf sways + tip sparkle; Sentinel LEDs/beacon alternate; Ranger electron advances along the orbit; Skirmisher wing flaps + screen glow; Herald sound arcs + tabard hem sway; Enchanter rune glyph rotates + pipeline node advances; Summoner lid lifts + puff rises; Seer blinks (A open, B closed).
8. Go/no-go (table below). Present to the user and STOP for the thresholds (open questions 2, 4, 5).

Go / no-go thresholds (all measured on the scratch prototype with worst-case filler):
| Metric | Baseline | GO if | NO-GO action |
|---|---|---|---|
| Lazy chunk gzip (`look-apply-model*.js`) | 4,627 B (re-measure) | **<= 6,000 B** (+~1,300 B, +28%) | trim: smaller props or drop trim masks, re-measure |
| Lazy chunk raw | 18,120 B | <= 23,000 B | same |
| Eager stub gzip | 2,826 B | <= +100 B (stays < 3 KB) | move any new import out of the eager graph |
| Home HTML gzip | 13,790 B | <= +1,000 B | shrink hero/sheet markup (fewer runs) |
| Animated markup raw, any look/tier | 10,015 B | <= 11,264 B, else propose 12,288 B (user OK) | simplify Archer props |
| Animated markup gzip | 1,859 B | <= 2,560 B | same |
| Colours per look | 16 max | <= 16 on all looks x tier samples | recolour with class keys |
| Free zones | - | each class holds 3 props with >= 20 px pairwise diff | Mage: ask for policy B or second zone |
| Compose + apply 4x CPU | 10-14 ms warm | <= 16 ms warm | none expected (cost is per-pixel constant) |

## Todo list
- [ ] Baseline build + sizes recorded (stub, lazy chunk, home, credits)
- [ ] `measure-prop-zones.ts` output matches report 01
- [ ] Overlap policy chosen (user answer to Q1 recorded)
- [ ] Prototype colours/bytes/chunk measured per class
- [ ] 9 accent hexes + keys fixed, contrast/dE gates pass
- [ ] Trim masks listed and proven outside identity boxes
- [ ] Motion table written
- [ ] `reports/02-spike-decision.md` written, user go/no-go on thresholds

## Success Criteria
- One written go/no-go with every threshold above filled with a measured number; open questions 1, 2, 4, 5 answered or defaulted explicitly.
- Prototype discarded; `git status` shows only `plans/` changes.

## Risk Assessment
| Risk | Mitigation |
|---|---|
| Mage zone too narrow to read as 3 distinct props | decide policy B or second floor zone here, before 100+ px of art is drawn |
| Prototype filler is not real art, byte estimate off | filler is deliberately noisy (worst case); re-measure at each art batch |
| Lighthouse noise hides regressions | 3-run medians (phase 06) |
| Chunk filename hashes change | match `/_astro/` + `look-apply` / `class-job-switcher`, never hardcode hashes |

## Security Considerations
Scratch only, no secrets. Art is public, hand-authored data; no new inputs or network. Nothing added to the eager graph.

## Next steps
Phase 01 (pixel-neutral refactor). If NO-GO: shrink to Warrior + Archer first (6 props) or re-open the overlap policy before continuing.
