# Phase 04: Avatar sprite system: grids, palette, composer, tests

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 00 (prototypes, IoU numbers); 02 (types, for selector step only) · Blocks: 05
- Inputs: [researcher-02](research/researcher-02-report.md), prior [pixel icon phase](../20261017-0821-rpg-theme-redesign/phase-03-pixel-icon-system.md)
- Docs: `docs/design-guidelines.md#pixel-icons`, `docs/code-standards.md#pixel-icons`, `src/utils/pixel-icon-path.ts`

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: L (10h, ~half drawing) · Implementation: Not started · Review: Not started
- Hand-authored 32x32 layered sprites as TS string grids, multi-key palette as CSS tokens, pure composer → one inline SVG (one `<path>` per palette key), validated by invariant + silhouette tests. Grids/composer start right after 00 (parallel with 01-03).

## Key Insights
- Identity order: silhouette (headgear + weapon + torso mass) > color > detail. Jobs differ by **one** prop; gear = added pixels + material ramp.
- 3 motif props (banner/crystal/hawk) placed in a shared accessory region → 9 jobs from 3 class looks x 3 props (no per-job art).
- Gear authored once per slot-tier on the shared base body, inside reserved regions so it never touches class-identity pixels (head top, main-hand weapon).
- Sub-rect layers `{x, y, rows}` keep sparse gear files small (shield 10x12, not 32x32).
- Dark theme: near-black outline vanishes on `#14110f` → avatar sits on a portrait plate; outline vs plate >= 3:1 in both themes (measured, not assumed).
- `gridToPathData(grid, char)` is size-agnostic → reuse as is.

## Requirements
- **Art style (user-approved direction 2026-10-17, see [sticker prototypes](reports/assets/03-sticker-style-prototypes.png), [source](reports/assets/03-sticker-style-prototypes.ts.txt))**: chibi "die-cut sticker" pixel art. Big head (~40% height), dot eyes + blush, 1px near-black outline (8-neighbour, chunky), muted earthy palette with 3-tone ramps (highlight top/left, shade bottom/right), cream sticker ring 2px with rounded corners added by the composer on a padded viewBox (`-2 -2 36 36`), soft CSS drop-shadow. Original art only (reference image = style cue, not traced, not committed). Pose (user ref): **3/4 view turned toward the viewer's right**: eyes + visor + beard shifted right, far eye near the cheek edge, 1px nose bump, back of head/hair/hood on the left, plume/hat tip/hood point trail back (left), near (left) pauldron bigger than far, tabard/buckle off-center right, toes point right; held item in the hand on the viewer's right, free hand at the side. Class reads: Warrior = T-visor great helm + plume, broad pauldrons, red tabard, sword point-down in right fist; Mage = bent pointed hat + wide brim, grey beard, robe to floor, crystal staff beside the robe; Archer = pointed hood, capelet, strap, recurve bow held out at arm's length. Prototype IoU: w-m .723/.770, w-a .702/.726, m-a .723/.769 (32/16), colors 10-15. Gear + job art must follow the same 3/4 convention (e.g. shield seen at an angle, boots toes right).
- Sticker ring replaces the planned portrait plate: cream ring separates the dark outline from the dark theme bg (contrast measured in 06). Optional grid-paper texture behind the hero avatar (CSS gradients, no image).
- Palette cap raised: <=16 visible colors per avatar (3-tone ramps), sticker key `#` → `--avatar-sticker`.
- Regions below are pre-sticker; re-derive from the prototypes in step 2: main hand moves to viewer right (x21-31), shield/off-hand to viewer left (x0-9, y16-29), job motif box to top-left (x0-9, y0-12) since the mage crystal occupies top-right.
- Canvas 32x32 (fallback 24x32 only if 00 says so). Regions (x cols, y rows):

| Region | Box | Owner |
|---|---|---|
| Head-top identity | x10-21, y0-5 | class headgear only (helm / pointed hat / hood+feather) |
| Main hand (viewer left) | x0-9, y0-29 | class weapon (sword / staff, orb above head line / bow arc) |
| Body | x10-21, y6-31 | base body + class outfit (+ archer quiver tip at shoulder); armor/amulet/boots on top |
| Off hand (viewer right) | x22-31, y14-27 | shield gear |
| Accessory (top right) | x22-31, y0-12 | job motif prop |

Class layers may draw anywhere except off-hand + accessory boxes; gear + job layers only in their own boxes (tested).

- Layers z-order: `base 0 < class 10 < armor 20 < amulet 25 < boots 30 < shield 40 < job 50 < fx 60`; last opaque wins.
- Tier 0 per slot = plain leather/cloth version (looks finished, never "naked"); tier n+1 mask ⊇ tier n mask; tier 2 adds 2-4 silhouette px; tier 3 gold ramp + 1-2 sparkle px (`x`).
- Adventurer: base body + traveler tunic + walking stick, no job prop.
- Palette keys (single char, `.` = transparent), target <=12 visible per avatar, hard cap 16:

| Keys | Slug(s) | Use |
|---|---|---|
| `o` | outline | all outlines |
| `s` `S` | skin, skin-shade | face/hands |
| `h` | hair | |
| `r` `R` / `v` `V` / `g` `G` / `n` `N` | warrior red / mage violet / archer green / adventurer brown (+shade) | class cloth |
| `w` | wood | staff, bow, banner pole |
| `l` `L` / `b` `B` / `i` `I` / `y` `Y` | leather / bronze / iron / gold (+dark) | gear tiers 0-3 |
| `a` | arcane | orb, crystal |
| `x` | sparkle | tier-3 glints |

## Architecture
```ts
// src/data/avatar/avatar-types.ts
export type LayerSlot = 'base' | 'class' | 'armor' | 'amulet' | 'boots' | 'shield' | 'job' | 'fx';
export interface SpriteLayer { slot: LayerSlot; x: number; y: number; rows: readonly string[] }
export type GearTier = 0 | 1 | 2 | 3;
export type TieredSprite = readonly [SpriteLayer, SpriteLayer, SpriteLayer, SpriteLayer]; // index = tier
// src/data/avatar/avatar-palette.ts
export const AVATAR_PALETTE = { o: 'outline', s: 'skin', S: 'skin-shade', /* ... */ } as const;
export type PaletteKey = keyof typeof AVATAR_PALETTE;   // css var: `--avatar-${slug}`
// src/utils/avatar/compose-avatar-grid.ts
export const AVATAR_SIZE = 32;
export function composeAvatarGrid(layers: readonly SpriteLayer[]): string[];  // sorts by LAYER_Z, last opaque wins
// src/utils/avatar/avatar-svg-paths.ts
export function avatarPaths(grid: readonly string[]): { key: PaletteKey; cssVar: string; d: string }[]; // keys in palette order
// src/utils/avatar/select-avatar-layers.ts (needs 02)
export function selectAvatarLayers(c: CharacterProfile): SpriteLayer[];
```
Motif grid example (crystal, accessory region, 6x8 at x24 y2):
```ts
crystal: { slot: 'job', x: 24, y: 2, rows: ['..oo..', '.oaao.', 'oaxaao', 'oaaaao', '.oaao.', '..oo..', '..o...', '......'] }
```
Render (05 component): `<svg viewBox="0 0 32 32" width height shape-rendering="crispEdges">` + `<path d style="fill:var(--avatar-…)">` per key.

## Related Code Files
Create:
- `/home/user/portfolio-app/src/data/avatar/avatar-types.ts`, `/home/user/portfolio-app/src/data/avatar/avatar-palette.ts`
- `/home/user/portfolio-app/src/data/avatar/avatar-base-body.ts`
- `/home/user/portfolio-app/src/data/avatar/avatar-class-warrior.ts`, `avatar-class-mage.ts`, `avatar-class-archer.ts`, `avatar-class-adventurer.ts` (outfit + headgear + weapon, one layer each class)
- `/home/user/portfolio-app/src/data/avatar/avatar-job-motifs.ts` (banner, crystal, hawk)
- `/home/user/portfolio-app/src/data/avatar/avatar-gear-armor.ts`, `avatar-gear-shield.ts`, `avatar-gear-boots-amulet.ts` (4 tiers each)
- `/home/user/portfolio-app/src/data/avatar/avatar-sprites.ts` (registry: `classSprites`, `motifSprites`, `gearSprites`)
- `/home/user/portfolio-app/src/utils/avatar/compose-avatar-grid.ts`, `avatar-svg-paths.ts`, `select-avatar-layers.ts`, `avatar-description.ts` (title "Warrior · Vanguard", desc "Armor tier 0 of 3 (Security) ..." shared by SVG + legend)
- `/home/user/portfolio-app/src/components/avatar/character-avatar.astro` (props `profile`, `size: 128|192|256`, `idPrefix`)
- `/home/user/portfolio-app/scripts/render-avatar-sheet.ts` (all combos → HTML sheet in scratchpad, both theme plates; for review + blind-ID)
- Tests: `/home/user/portfolio-app/tests/unit/avatar-sprites.test.ts`, `avatar-silhouette.test.ts`, `compose-avatar-grid.test.ts`, `avatar-svg-paths.test.ts`
Modify:
- `/home/user/portfolio-app/src/styles/design-tokens.css` (`--avatar-*` tokens `light-dark()`, `--avatar-plate`; dark-only fallback block)
- `/home/user/portfolio-app/src/data/credits-data.ts` (entry: original avatar sprites, own work, no third-party art)

## Implementation Steps
1. Types, palette, `LAYER_Z`; tokens in `design-tokens.css` (outline/plate per theme; class cloth + materials mostly same both themes).
2. Port 00 prototypes → base body + 3 class layers; author Adventurer.
3. 3 motif props; 4 slots x 4 tiers (tier 0 first; then add pixels only).
4. Composer + paths + description; component (role=img, `aria-labelledby` `<title>`/`<desc>` with `idPrefix` ids, width/height attrs, `.avatar-plate` wrapper, bob CSS: `steps(2)` translateY 1 sprite px, only under `html[data-motion="ok"]`, transform only).
5. Sheet script; review both themes at 128/192/256; iterate art. **Gate:** user approves sheet.
6. Tests:
   - sprites: every layer in bounds, row widths equal, chars ⊂ palette ∪ `.`, non-empty, slot matches file, every class/motif/slot-tier exists
   - tiers: mask(t+1) ⊇ mask(t) per slot; tier 2 adds >=2 px over tier 1
   - regions: gear/job pixels never inside head-top or main-hand boxes
   - compose: z-order, last-opaque-wins, output 32x32, input not mutated
   - coverage: opaque px 25-60% for every class x motif at tier 0 and tier 3
   - silhouette: pairwise cross-class IoU (pure jobs, tier 0 and all-tier-3) < threshold from 00 at 32 and 16x16 OR-pool; within-class job pairs differ >= 12 px
   - SVG: every combo (10 looks x 4^4 tiers) markup <= 3 KB; distinct keys <= 16; every `--avatar-*` var used exists in `design-tokens.css` (read file text)
7. `npm run check` + `npm run test:unit`.

## Todo List
- [ ] types, palette, tokens
- [ ] base + 4 class looks
- [ ] 3 motifs + 16 gear sprites
- [ ] composer, paths, description, component
- [ ] sheet script + user art gate
- [ ] 4 test files green; credits entry

## Success Criteria
- All invariant + silhouette tests pass; max SVG <= 3 KB (gzip ~1 KB)
- Sheet: each class nameable at 128px in both themes by reviewer; tier 0 looks complete
- Data files <200 lines each (split further if needed)

## Risk Assessment
- Art quality is the main risk → prototypes in 00, sheet gate here, blind-ID in 06; fallback: simplify to silhouettes + 2 tones.
- Gear covering class color (armor on mage robe) → armor tier masks limited to chest center + belt; test coverage of class cloth >= 40% of its tier-0 px remains at tier 3.
- `forced-colors` may flatten fills [unverified] → 05 legend carries meaning; `forced-color-adjust: none` on plate only after contrast check.

## Security Considerations
- Path data from whitelisted chars only (test enforced); CSS var names from typed palette map; no user input.

## Next Steps
- 05 places `CharacterAvatar` + legend. Unresolved: plate colors per theme; IoU threshold final (from 00).
