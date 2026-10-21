# Phase 02: Accent palette + tokens, trim layer, prop geometry/collision invariants

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 01 · Blocks: 03-05
- Inputs: [report 01](reports/01-scout-and-baseline-report.md) sections 2, 3, 5, 6; spike decision `reports/02-spike-decision.md` (zones, hexes, trim masks)
- Tools: [check-accent-contrast.ts](reports/assets/check-accent-contrast.ts), [measure-prop-zones.ts](reports/assets/measure-prop-zones.ts)
- Docs: `docs/design-guidelines.md#theme-and-color`, `#character-avatar`; `docs/code-standards.md#avatar-sprites` (colours only via keys -> `--avatar-*`)

## Overview
- Date: 2026-10-21 · Priority: P0 · Effort: M (5h) · Implementation status: Todo · Review status: Pending
- Add the plumbing and the safety net BEFORE drawing: 9 accent palette keys and tokens, the `trim` layer (accent on outfit, from per-class masks), the per-class prop zones, and unit tests that every prop must satisfy (zone, collisions with all gear tiers and frames, identity boxes, colour keys, accent usage).

## Key Insights
- Art colours are single hexes in `:root` (same in both themes); only `--avatar-sticker` and `--avatar-shadow` are `light-dark()`. Accent tokens follow the art colours: plain hex, not in the dark-only `@supports not` block.
- Contrast: accent vs the 1px outline `#2a1f1d` is the real boundary (provisional 4.07-8.75:1, gate >= 3:1); vs the ring it is 1.0-2.2:1 light / 1.7-3.7:1 dark (informational; outline always sits between). Record figures in the token comment like the existing sticker figures.
- Digits would sort first in `Object.keys(AVATAR_PALETTE)` (reorders `PALETTE_KEYS`), so keys are letters `A B C D E F H J M`.
- Trim as a separate `trim` layer (z 15: after `class`, before `armor`) leaves pose rows and Adventurer untouched, and gear still draws over it. Masks use a placeholder char `*` (not a palette key) replaced by the job's accent key when the layer is built: 3 masks per frame, not 9.
- Today no test compares prop pixels with gear pixels. Gear tier 3 is a superset of tiers 0-2 (tested), but the new test walks all tiers anyway.

## Requirements
- Functional: 9 keys `A..M` -> slugs `accent-<job>`; tokens `--avatar-accent-<job>`; `JOB_ACCENT: Record<JobId, PaletteKey>` in `avatar-job-style.ts`; `LayerSlot` `'trim'` with `LAYER_Z.trim = 15`; per-class trim masks (frame A/B, anchors) in `avatar-class-trim.ts`; `JOB_PROP_ZONES: Record<CombatClassId, readonly Box[]>`; `selectAvatarLayers` adds the trim layer when a valid job is set.
- Non-functional: <= 16 colours per look at every tier sample (spare after accent: warrior 4, archer 1, mage 1 extra keys); markup budgets unchanged in this phase (still legacy props); both themes identical for accents (token test); files < 200 lines.

## Architecture
```
avatar-palette.ts      + A..M -> accent-knight .. accent-seer
design-tokens.css      + --avatar-accent-* (one hex each, comment: contrast vs outline / ring)
avatar-job-style.ts    JOB_PROP_NAMES (01) + JOB_ACCENT (job -> key) + JOB_PROP_ZONES (class -> Box[])
avatar-class-trim.ts   classTrim[classId][frame] = { x, y, rows }   rows use '.' and '*'
select-avatar-layers   layers: class(10) · trim(15, '*' -> JOB_ACCENT[jobId]) · armor · amulet · boots · shield · job(50)
```
Zone values come from the spike (policy S default): Warrior `{x0:23,y0:0,x1:31,y1:13}`, Archer `{23,0,31,12}`, Mage `{26,7,31,25}`. A prop frame must lie fully inside one zone box.

## Related Code Files
Modify:
- `/home/user/portfolio-app/src/data/avatar/avatar-palette.ts`: 9 keys (+ header comment: accent keys).
- `/home/user/portfolio-app/src/styles/design-tokens.css`: 9 `--avatar-accent-*` in the avatar block; extend the contrast comment.
- `/home/user/portfolio-app/src/data/avatar/avatar-types.ts`: `LayerSlot` + `'trim'`, `LAYER_Z.trim = 15`, `PoseTrim` type.
- `/home/user/portfolio-app/src/data/avatar/avatar-job-style.ts`: add `JOB_ACCENT`, `JOB_PROP_ZONES`.
- `/home/user/portfolio-app/src/utils/avatar/select-avatar-layers.ts`: trim layer.
- `/home/user/portfolio-app/scripts/render-avatar-sheet.ts`: optional `--zones` is NOT added (YAGNI); sheet already shows accents through the looks.
Create:
- `/home/user/portfolio-app/src/data/avatar/avatar-class-trim.ts` (masks, about 60 lines).
- `/home/user/portfolio-app/tests/unit/avatar-job-props.test.ts` (new invariants, about 140 lines).
Tests to touch: `tests/unit/avatar-svg-paths.test.ts` (token test covers new keys automatically), `tests/unit/compose-avatar-grid.test.ts` (`selectAvatarLayers` slot order now includes `trim` for job looks), `tests/unit/avatar-sprites.test.ts` (move prop tests out if near 200 lines).

## Implementation Steps
1. Finalize hexes from the spike; edit `check-accent-contrast.ts` ACCENTS locally (or pass) and run it: all vs outline >= 3:1, pairwise dE >= 20 overall, >= 30 inside a class.
2. `avatar-palette.ts`: add `A: 'accent-knight', B: 'accent-paladin', C: 'accent-sentinel', D: 'accent-ranger', E: 'accent-skirmisher', F: 'accent-herald', H: 'accent-enchanter', J: 'accent-summoner', M: 'accent-seer'`. Check `isPaletteKey`, `PaletteSlug` type still compile.
3. `design-tokens.css`: add the 9 tokens after `--avatar-sparkle`; comment with the measured ratios (vs outline, vs ring light/dark) and "identical in both themes". Do not touch the `@supports not` block.
4. `avatar-types.ts`: `LayerSlot` adds `'trim'`; `LAYER_Z` `trim: 15`; `export interface PoseTrim { x: number; y: number; rows: SpriteRows }`.
5. `avatar-class-trim.ts`: `classTrim: Record<CombatClassId, readonly [PoseTrim, PoseTrim]>`. Rows contain `.` and `*` only. Seed from the spike: Warrior tabard (x12-13, y22-25, +1 row in frame B), Archer belt (x11-20, y23), Mage hem bands (rows 26 and 29, x10-23/24). Each mask pixel must sit on an opaque class pixel and outside head/held boxes.
6. `avatar-job-style.ts`: `JOB_ACCENT` (A..M as above), `JOB_PROP_ZONES` (values above). Keep the file < 80 lines.
7. `select-avatar-layers.ts`: when the job is valid, push `{slot:'trim', x, y, rows: mask.rows.map(r => r.replaceAll('*', accentKey))}` (new array, no mutation). Adventurer: no trim.
8. New `tests/unit/avatar-job-props.test.ts` over every combat class and its 3 jobs, both frames:
   - Shape: both frames equal width/height, all chars `.` or palette keys (not `#`), non-empty, frames differ (>= 4 px) and frame A is a complete prop (no missing pieces).
   - Zone: every opaque cell lies inside one box of `JOB_PROP_ZONES[class]`; absolute position uses the prop's own x/y.
   - Collision: for gear tiers 0-3 x armor, amulet, shield, bootNear, bootFar at the pose anchors of that frame, no opaque prop cell overlaps an opaque gear cell, and none is 8-adjacent (gap 1) when policy S; no overlap with class pose pixels (gap 1) either.
   - Identity: no prop cell inside head/held boxes (frame-specific).
   - Colours: prop keys are class keys, gear keys or the job's own accent key; the job's accent key covers >= 15% of frame A's opaque pixels (the prop's main hue); no other job's accent key appears.
   - Accent: `JOB_ACCENT` has 9 distinct keys, each with a `--avatar-accent-<job>` token in `design-tokens.css` outside any `light-dark()`.
   - Trim: masks only `.`/`*`, in bounds, every `*` over an opaque class pixel of that frame, outside identity boxes, >= 8 px per frame, Adventurer has none; composed grid shows the accent key at trim cells for each job, and never for Adventurer.
   - Layer order: `slot` list for a job look is `class, trim, armor, amulet, boots, boots, shield, job`.
   Until 03-05 land the legacy props must pass the shape and zone checks only where the zone fits them: add a temporary `LEGACY_ART` skip list (6x11 props at old anchors; Mage legacy fits the Mage zone only partly) that phase 05 deletes. Collision and identity checks must already pass with legacy props (they did for identity before).
9. `npm run test:unit` and `npm run check`; render the sheet (`node scripts/render-avatar-sheet.ts /tmp-or-scratch/out.html --png out.png`) and confirm the accent trim shows on all 9 jobs, Adventurer unchanged.

## Todo list
- [ ] Accent hexes final; contrast and dE gates pass
- [ ] 9 palette keys + 9 tokens (both themes identical), comment with figures
- [ ] `trim` slot, masks, layer; Adventurer has none
- [ ] `JOB_ACCENT`, `JOB_PROP_ZONES`
- [ ] `avatar-job-props.test.ts` written, legacy skip list marked for removal in phase 05
- [ ] Colour cap holds on all looks x tier samples
- [ ] check + unit green; sheet reviewed

## Success Criteria
- All 9 accents >= 3:1 vs outline; token test finds every key; accent shows on trim for each job in the sheet at 128 px and 64 px, both themes identical.
- New test fails if a prop is moved onto a gear tier, an identity box, or outside its zone (prove once by temporarily nudging a legacy anchor, then revert).
- Colour count <= 16 for all 10 looks x tier samples; unit count up by the new file's cases.

## Risk Assessment
| Risk | Impact | Mitigation |
|---|---|---|
| Trim recolours pixels that carry class identity | blind-ID drop | masks exclude hood/hat/plume/weapons; human check on the sheet |
| 16-colour cap at Archer t3 (spare 2) | red unit test | accent = 1 key; props draw from class + gear keys; cap is a test, fails early |
| New key letters collide with future keys | confusion | document: `A..M` reserved for job accents (palette header comment) |
| Trim under armor/amulet hidden at high tiers | accent barely visible | masks avoid the armor/amulet rects; prop carries the main accent |
| Accent hue too close to class colours | weak distinction | dE gates; Warrior/Archer/Mage pick hues absent from the class ramp |

## Security Considerations
Colours only via palette keys and `--avatar-*` tokens (no literals in code). Masks/props are build-time constants; `replaceAll` on constant rows with a key from a closed map, never user text. Eager graph untouched (`avatar-job-style.ts` and `avatar-class-trim.ts` are under `src/data/avatar/`).

## Next steps
Phases 03, 04, 05 (art batches) use this test file as the acceptance gate; each batch ends with the sheet review.
