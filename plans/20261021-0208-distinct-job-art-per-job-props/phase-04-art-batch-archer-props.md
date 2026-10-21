# Phase 04: Art batch B: Archer props (Ranger, Skirmisher, Herald)

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 02 · Parallel with 03, 05 (separate files) · Blocks: 06
- Inputs: spike `reports/02-spike-decision.md`, [report 01](reports/01-scout-and-baseline-report.md) sections 2-4
- Docs: `docs/code-standards.md#avatar-sprites`, `docs/design-guidelines.md#character-avatar`
- Reference art: `/home/user/portfolio-app/src/data/avatar/avatar-class-archer.ts`, `avatar-job-props-archer.ts` (legacy placeholder from phase 01)

## Overview
- Date: 2026-10-21 · Priority: P0 · Effort: L (5h) · Implementation status: Todo · Review status: Pending (sheet review gate at the end)
- Draw the 3 Archer props (2 frames each) and verify the Archer trim, replacing the legacy placeholders. Archer is the tightest class for bytes and colours.

## Key Insights
- Archer zone (policy S): x23..31, y0..12 = 9x13. The body ends at x22 on rows 14-16 (zero slack at gap 0), the cape/bow is on the left, shield starts y16. Archer frames do not dip, so props keep their y in both frames.
- Colour budget: pose `GILSfgklosy` + gear t3 `b i x` = 14 (incl. outline); spare 2, accent uses 1 -> at most 1 extra key. Draw with `I L b i k l x y` (all already in the look at t3) + accent; adding `b` or `i` costs a colour at low tiers only, still within the cap.
- Bytes: Archer animated raw is the worst today (max 10,015 B vs 11,264 B). Keep props to compact runs (large flat areas of one key, few isolated pixels). A noisy 10x14 prop measured 11.4-11.6 KB; real art should land ~10.5-11 KB, otherwise the spike's 12 KB ceiling proposal applies.
- Frame A = rest state. Herald glyph `</>` is generic markup text, not a vendor logo; the atom has 2 orbits (React uses 3 ellipses); no phone brand shapes.

## Requirements
- Functional: `avatar-job-props-archer.ts` exports `archerProps` for `ranger`, `skirmisher`, `herald`; frames `{x, y, rows}` inside the Archer zone; same size across frames; accent main hue >= 15% of opaque px.
- Non-functional: file < 200 lines; `avatar-job-props` tests green for these jobs; <= 16 colours at every tier sample; animated raw <= ceiling approved in phase 00; animated gz <= 2,560 B.

## Architecture
| Job | Metaphor (skills) | Frame A (rest) | Frame B (motion) | Size | Keys (+ accent) |
|---|---|---|---|---|---|
| Ranger | orbiting atom (React, Astro) | gold nucleus, two crossing accent orbits, one white electron | electron moves to the opposite side of its orbit; a second pixel dims | 9x11 | `y x k` + `D` ranger |
| Skirmisher | phone + winged boots (mobile) | upright phone (dark body, accent screen with a glint) above a leather boot with a steel wing | wing flaps up (3-4 px move), screen glint toggles | 9x13 | `I k l L x` + `E` skirmisher |
| Herald | horn + tabard with `</>` (websites, markup) | gold horn at the top, accent tabard hanging below with a white `</>` glyph | 2-3 px sound arcs next to the horn, tabard hem shifts 1 px | 9x13 | `y b k x` + `F` herald |
Distinct outer shapes: round orbit / tall stack with wing foot / flag with flared horn. Archer trim = belt (phase 02 mask).

## Related Code Files
Modify:
- `/home/user/portfolio-app/src/data/avatar/avatar-job-props-archer.ts` (rewrite, < 200 lines)
- `/home/user/portfolio-app/src/data/avatar/avatar-class-trim.ts` (only if the belt accent clashes with a prop)
- `/home/user/portfolio-app/tests/unit/avatar-job-props.test.ts` (drop Archer from `LEGACY_ART`)
Create: `reports/assets/sheet-archer.png` (plan folder).
Delete: none.

## Implementation Steps
1. Read the Archer pose rows and anchors (both frames) and the free columns x23..31, y0..12 from `measure-prop-zones.ts`.
2. Draw frame A for each job at the target size with the allowed keys; keep the 1 px gap; avoid isolated single pixels except the intended glint/electron.
3. Derive frame B from A per the table (>= 4 px differ, same size, same bounding box).
4. Place inside the zone (x >= 23, y + height <= 13).
5. `npm run test:unit` (collision with armor/amulet/shield/boots tiers 0-3 on both frames, identity boxes, zone, colours, accent share). Fix.
6. Review gate: `node scripts/render-avatar-sheet.ts plans/20261021-0208-distinct-job-art-per-job-props/reports/assets/sheet-archer.html --png plans/20261021-0208-distinct-job-art-per-job-props/reports/assets/sheet-archer.png`. Check at 64 and 128 px, both frames, both themes, tiers 0 and 3: 3 distinct objects, Archer still reads as an Archer (hood + bow), the prop does not crowd the hood tip.
7. Bytes: animated raw/gz for the three looks at tier 3 (hero) and static (sheet) versus the thresholds; if raw > ceiling, simplify (merge runs, drop stray pixels) before asking for 12 KB.
8. Remove Archer from `LEGACY_ART`; `npm run check && npm run test:unit`.

## Todo list
- [ ] Ranger atom, 2 frames, accent `D`
- [ ] Skirmisher phone + winged boot, 2 frames, accent `E`
- [ ] Herald horn + tabard `</>`, 2 frames, accent `F`
- [ ] Zone, collision, identity, colour tests green for Archer (<= 16 colours at t3)
- [ ] Sheet reviewed; screenshot saved
- [ ] Animated raw/gz within thresholds
- [ ] Legacy skip list updated

## Success Criteria
- 3 distinct Archer props inside the 9x13 zone with no overlap or adjacency to body, gear (all tiers), identity boxes.
- Archer looks <= 16 colours at every tier sample; animated raw under the approved ceiling; gzip <= 2,560 B.
- Blind review: >= 2 of 3 props named correctly; Archer silhouette tests unchanged.

## Risk Assessment
| Risk | Impact | Mitigation |
|---|---|---|
| 9x13 is too small for the `</>` glyph plus a horn | unreadable | glyph max 7x5 inside a 9-wide tabard; drop horn detail first |
| Colour cap (spare 2) | red test | draw with class/gear keys; one accent only |
| Raw bytes above 11 KB at tier 3 | red budget test | fewer runs; else raise ceiling to 12 KB with user OK (Q2) |
| Hood tip (identity head box x10-21, y0-14) near prop | silhouette crowding | gap 1 enforced; check at 64 px |
| Atom resembles a vendor logo | trademark concern | 2 orbits, gold nucleus, no letter shapes (Q8) |

## Security Considerations
Static hand-authored data from a closed palette; no runtime input; eager graph untouched.

## Next steps
Phase 05 (Mage) then 06.
