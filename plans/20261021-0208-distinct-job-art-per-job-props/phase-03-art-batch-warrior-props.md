# Phase 03: Art batch A: Warrior props (Knight, Paladin, Sentinel)

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 02 · Parallel with 04, 05 (separate files) · Blocks: 06
- Inputs: spike `reports/02-spike-decision.md` (zone, hexes, trim, motion table), [report 01](reports/01-scout-and-baseline-report.md) sections 2-3
- Docs: `docs/code-standards.md#avatar-sprites` ("Redraw or tune", grid rules), `docs/design-guidelines.md#character-avatar`
- Reference art: `/home/user/portfolio-app/src/data/avatar/avatar-class-warrior.ts` (pose + anchors), `avatar-job-props-warrior.ts` (legacy placeholder from phase 01)

## Overview
- Date: 2026-10-21 · Priority: P0 · Effort: L (5h) · Implementation status: Todo · Review status: Pending (sheet review gate at the end)
- Draw the 3 Warrior props (2 frames each) and the Warrior trim, replacing the legacy banner/crystal/hawk placeholders.

## Key Insights
- Warrior zone (policy S): x23..31, y0..13 = 9x14 (head box ends x21, shield sprite starts y15/16, sword on the left). Body dips 1 px in frame B: a prop may shift +1 row in frame B (then it must be <= 13 rows tall).
- Colour budget: Warrior pose keys `ILRbikory` + gear `x` = 11 at tier 3; spare 5, accent uses 1 -> up to 4 more new keys. Draw with `I L R b i k l o r y x` + the job's accent.
- Metaphors must read at 128 px (4 CSS px per art px, so a 9x13 prop is 36x52 px) and at 64 px in the sheet grid. Silhouette (outer shape) differs first, colour second.
- Frame A is the rest/no-JS/reduced-motion state: it must be the complete, most recognisable pose. Frame B changes >= 4 px.
- No logos: Knight uses a generic musical-sharp mark, not the C# hexagon; Paladin a leaf, not the Spring or Java mark; Sentinel a tower/rack, not a vendor server icon.

## Requirements
- Functional: `avatar-job-props-warrior.ts` exports `warriorProps` for `knight`, `paladin`, `sentinel`; each frame `{x, y, rows}` inside the Warrior zone; frame A and B same size; uses its accent as the main hue (>= 15% of opaque px).
- Non-functional: file < 200 lines; unit test `avatar-job-props` green for the 3 jobs (zone, gear collision tiers 0-3 both frames, identity, colours, accent); colours <= 16 at all tier samples; animated raw/gz inside budget (watch Warrior t3 max, today 8.9 KB).

## Architecture
Target sprites (sizes are targets inside the 9x14 zone; exact pixels are the dev's art):
| Job | Metaphor (skills) | Frame A (rest) | Frame B (motion) | Size | Keys (+ accent) |
|---|---|---|---|---|---|
| Knight | crest shield (C#/.NET) | heater shield, steel rim, accent field, gold musical-sharp mark, pointed bottom | glint `x` moves along the rim, shield sits 1 px lower (matches body dip) | 9x12 | `i k I y x` + `A` knight |
| Paladin | leaf-and-sword (Spring/Java) | upright sword (steel blade, gold guard) with one accent leaf curled around it | leaf tip swings 2 px outward, sparkle `x` at the blade tip | 7x13 | `k i y l x` + `B` paladin |
| Sentinel | watchtower / server rack | crenellated tower, 3 server slots with LED dots, beacon on top | LEDs alternate on/off, beacon `y`/`x` toggles | 8x13 | `i I k y x` + `C` sentinel |
Distinct outer shapes: wide pointed shield / tall thin blade / crenellated stack. Trim: Warrior tabard (`avatar-class-trim.ts`) already recoloured by phase 02; re-check against the new props.

## Related Code Files
Modify:
- `/home/user/portfolio-app/src/data/avatar/avatar-job-props-warrior.ts`: replace the legacy placeholders (rewrite file, still < 200 lines).
- `/home/user/portfolio-app/src/data/avatar/avatar-class-trim.ts`: only if the review shows the Warrior trim clashes with a prop.
- `/home/user/portfolio-app/tests/unit/avatar-job-props.test.ts`: remove the Warrior entries from the `LEGACY_ART` skip list.
Create: `reports/assets/sheet-warrior.png` (review screenshot; plan folder only).
Delete: none.

## Implementation Steps
1. Read the Warrior pose and its anchors for both frames; open the zone map (`node ... measure-prop-zones.ts`) to see the free columns x23..31.
2. For each job draw frame A on graph paper (or in the file) at the target size, using only the allowed keys; keep >= 1 px gap to body/gear (`avatar-job-props` enforces it) and a clear 1 px silhouette.
3. Derive frame B from A by the motion in the table; frames must differ by >= 4 px and keep the same size.
4. Place with `{ x, y, rows }`: x such that the prop lies in x23..31, y 0..13; frame B may use `y + 1` for the Knight (body dip), others keep y.
5. Run `npm run test:unit -- --test-name-pattern "job props"` (or the full suite). Fix collisions, colour counts, zone violations.
6. Review gate: `node scripts/render-avatar-sheet.ts plans/20261021-0208-distinct-job-art-per-job-props/reports/assets/sheet-warrior.html --png plans/20261021-0208-distinct-job-art-per-job-props/reports/assets/sheet-warrior.png` (run from repo root, output inside the plan folder; the `--png` flag needs Playwright Chromium: `npx playwright install chromium` once). Check: (a) the 3 Warrior jobs read as different objects at 64 px and 128 px, (b) both frames, (c) gear tiers 0 and 3 do not touch the prop, (d) light and dark bands, (e) accent trim visible, class still reads as Warrior (plume, great helm, sword). Iterate until a reviewer who has not seen the metaphor list can name the object for at least 2 of 3.
7. Check bytes: `node ... measure-prop-zones.ts` third block (or the unit budgets): Warrior animated raw/gz stays under the thresholds from the spike.
8. Remove Warrior from the legacy skip list; run `npm run check && npm run test:unit`.

## Todo list
- [ ] Knight crest shield, 2 frames, accent `A`
- [ ] Paladin leaf-and-sword, 2 frames, accent `B`
- [ ] Sentinel watchtower/rack, 2 frames, accent `C`
- [ ] Zone, collision (tiers 0-3, both frames), identity, colour tests green for Warrior
- [ ] Sheet reviewed at 64 and 128 px, both themes; screenshot saved
- [ ] Bytes within spike thresholds
- [ ] Legacy skip list updated

## Success Criteria
- 3 distinct Warrior props, each inside the zone, no overlap or adjacency with body, gear (all tiers), identity boxes.
- Per look <= 16 colours; Warrior animated raw <= spike ceiling; gzip <= 2,560 B.
- Review gate passed (2 of 3 named blind); Warrior still reads as Warrior (silhouette IoU test `avatar-silhouette` unchanged or updated by slot).

## Risk Assessment
| Risk | Impact | Mitigation |
|---|---|---|
| Tower and shield read alike at 64 px | weak uniqueness | different outer shapes (pointed vs crenellated), different heights |
| Prop touches shield tier 3 in frame B | red test | stay within x23..31, y0..13; frame-B shift only +1 |
| Accent on prop vs red tabard/plume looks busy | clutter | accent hues are non-red for Warrior (violet, green, blue) |
| Byte growth in the lazy chunk | budget | re-measure after the batch (phase 06 formal) |

## Security Considerations
Static, hand-authored data; keys from the closed palette; no runtime input. No change to the eager graph.

## Next steps
Phase 04 (Archer) and 05 (Mage); then 06 verifies everything together.
