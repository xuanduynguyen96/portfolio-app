# Phase 03: Pixel icon system (data, component, unit tests)

## Context Links
- Parent: [plan.md](plan.md) · Depends on: none · Parallel with: 01, 02 · Used by: 01 (toggle), 04, 05, 07, 08
- Research: [researcher-01 §2.1 crisp, §2.3 SVG vs PNG, §5](research/researcher-01-pixel-icons-and-frames-report.md) · Scout: [icon budget](scout/scout-01-theme-surface-report.md)
- Docs: `docs/code-standards.md#career-rpg-modules-srcutilscareer-rpg` (pure TS + node type stripping rules)

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: M (4h, ~half is drawing) · Implementation: Done (22 icons; sound on/off dropped) · Review: Done ([03 report](reports/03-code-review-report.md): L5 fixed; L4 test nits open)
- 24 hand-authored 8x8 icons as string grids in TS, a pure grid→SVG-path util, `pixel-icon.astro` component, unit tests. Own work: no download, no license, themeable via `currentColor`.

## Key Insights
- Inline SVG `viewBox="0 0 8 8"` + `shape-rendering: crispEdges` + `fill: currentColor` → crisp at integer multiples, follows theme tokens, zero requests.
- Sizes only 16/24/32/48 (2x/3x/4x/6x). Fractional DPR seams accepted (researcher-01 §2.1); crispEdges avoids AA blur.
- One `<path>` per tone (run-merged rows: `M{x} {y}h{w}v1h-{w}z`) ≈ 150-400 B/icon. Per-use inline (not `<symbol>` sprite): simpler, only used icons ship. Budget guard: home HTML gzip growth <=10 KB, else switch to sprite.
- Two tones: `#` = currentColor, `+` = shade (same color, `opacity: .55`) → depth without extra palette. `.` = transparent.
- `as const` map → `PixelIconName` union → wrong name fails `astro check`. Mappings typed `Record<AttributeId|QuestDifficulty, PixelIconName>` → exhaustive at type level.
- Icons have **no text nodes / `<title>`** → e2e `toHaveText` on badges/eyebrows unchanged.
- Leaf skills (brand techs) get no icons (pips instead, phase 05).

## Requirements
- Functional: icon set = 5 skill roots (`languages`, `frontend`, `backend`, `tooling`, `collaboration`), 4 attributes (`code-efficiency`, `ui-polish`, `reliability`, `communication`), quests (`side-quest`, `main-quest`, `raid`, `boss`), HUD (`xp`, `level`, `streak`, `locked`, `evidence`, `quest`, `achievement`, `sound-on`, `sound-off`, `sun`, `moon`). Component props `name`, `size` (16|24|32|48, default 16), `label?` (→ `role="img"` + `aria-label`; else `aria-hidden="true"`), `class?`.
- Non-functional: pure modules unit-testable under Node type stripping (`.ts` specifiers, `import type`, erasable syntax); files <200 lines.

## Architecture
```
src/data/pixel-icons-career.ts  careerIcons = { languages: [8 rows], ... } as const   (13 icons)
src/data/pixel-icons-hud.ts     hudIcons = { xp: [...], ... } as const                 (11 icons)
src/data/pixel-icons.ts         pixelIcons = { ...careerIcons, ...hudIcons } as const;
                                type PixelIconName = keyof typeof pixelIcons; PIXEL_ICON_SIZES = [16,24,32,48] as const
src/data/pixel-icon-map.ts      attributeIcons: Record<AttributeId, PixelIconName>
                                difficultyIcons: Record<QuestDifficulty, PixelIconName>; bossIcon
                                skillRootIcons: Record<string, PixelIconName>; skillRootIcon(id) → fallback 'quest'
src/utils/pixel-icon-path.ts    gridToPathData(grid, char): string   (pure)
src/components/pixel-icon.astro <svg viewBox="0 0 8 8" width height ...><path d/><path class=shade d/></svg>
```
Grid example (`main-quest` sword, `locked` padlock):
```ts
'main-quest': ['......##', '.....#+#', '....#+#.', '#..#+#..', '.##+#...', '..##....', '.#.##...', '#...#...'],
locked:       ['..####..', '.#....#.', '.#....#.', '########', '###++###', '###++###', '########', '........'],
```

## Related Code Files
Create:
- `/home/user/portfolio-app/src/data/pixel-icons-career.ts`, `/home/user/portfolio-app/src/data/pixel-icons-hud.ts`, `/home/user/portfolio-app/src/data/pixel-icons.ts`
- `/home/user/portfolio-app/src/data/pixel-icon-map.ts`
- `/home/user/portfolio-app/src/utils/pixel-icon-path.ts`
- `/home/user/portfolio-app/src/components/pixel-icon.astro`
- `/home/user/portfolio-app/tests/unit/pixel-icons.test.ts`, `/home/user/portfolio-app/tests/unit/pixel-icon-path.test.ts`
Modify: none (consumers wired in 01/04/05/07/08)

## Implementation Steps
1. `pixel-icon-path.ts`:
   ```ts
   export type PixelGrid = readonly string[];
   export function gridToPathData(grid: PixelGrid, char: string): string {
     let d = '';
     grid.forEach((row, y) => { let x = 0;
       while (x < row.length) { if (row[x] !== char) { x += 1; continue; }
         const start = x; while (row[x] === char) x += 1;
         d += `M${start} ${y}h${x - start}v1h-${x - start}z`; } });
     return d;
   }
   ```
2. Draw icons (silhouette first, 1px transparent margin where possible, max 2 tones, readable at 16px). Suggested motifs: languages=open book, frontend=paintbrush, backend=anvil, tooling=pickaxe, collaboration=banner, code-efficiency=lightning, ui-polish=gem, reliability=shield, communication=speech scroll, side-quest=boot, main-quest=sword, raid=crossed swords, boss=skull, xp=star, level=up-chevron/crown, streak=flame, locked=padlock, evidence=magnifier, quest=scroll, achievement=trophy, sound-on/off=speaker +/- waves, sun, moon.
3. Preview: scratch script in scratchpad renders all icons at 16/24/32/48 on both palettes to an HTML file, screenshot via Playwright, iterate art.
4. `pixel-icons.ts` merges, exports `PixelIconName`, `PIXEL_ICON_SIZES`, `type PixelIconSize`.
5. `pixel-icon-map.ts` imports `type AttributeId, QuestDifficulty` from `./xp-rules.ts`; `skillRootIcons` keyed by root ids in `skills-data.ts`.
6. `pixel-icon.astro`:
   ```astro
   const { name, size = 16, label, class: className } = Astro.props;
   const grid = pixelIcons[name];
   const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true' as const };
   ---
   <svg class:list={['pixel-icon', className]} viewBox="0 0 8 8" width={size} height={size} focusable="false" {...a11y}>
     <path d={gridToPathData(grid, '#')} />
     {grid.some((r) => r.includes('+')) && <path class="pixel-icon-shade" d={gridToPathData(grid, '+')} />}
   </svg>
   <style>.pixel-icon { flex: none; fill: currentColor; shape-rendering: crispEdges; vertical-align: middle; } .pixel-icon-shade { opacity: 0.55; }</style>
   ```
   Props `size: PixelIconSize` (type-level guard against 20/28).
7. Unit tests `pixel-icons.test.ts`: every icon 8 rows x 8 chars; chars ⊂ `.#+`; >=1 `#`; no two identical grids; every `ATTRIBUTE_IDS` / `QUEST_DIFFICULTIES` mapped to existing icon; every root in `skillNodes` (no `parent`) has `skillRootIcons` entry; icon count <=32.
8. `pixel-icon-path.test.ts`: empty grid → `''`; full row → `M0 0h8v1h-8z`; split runs; char filter (`+` vs `#`); y index correct.
9. `npm run test:unit` + `npm run check`.

## Todo List
- [x] gridToPathData + tests
- [x] 22 grids drawn (was 24; sound on/off dropped)
- [ ] preview both themes, 4 sizes (not recorded)
- [x] pixel-icons index + types
- [x] pixel-icon-map (typed records)
- [x] pixel-icon.astro
- [x] pixel-icons.test.ts invariants
- [x] unit + check green

## Success Criteria
- Unit tests pass (count up from 95); `astro check` rejects `<PixelIcon name="nope" />` and `size={20}` (manual probe, then revert)
- Preview screenshot: every icon recognizable at 16px in both themes

## Risk Assessment
- Art quality subjective → preview page + user review gate before 05; fallback: optional CC0 packs (phase 08 B).
- `skills-data.ts` imported in node test: its import of `./career-schemas` is `import type` (erased) → OK; if not, test via exported root ids list.
- HTML weight from many inline icons → budget check in 09; sprite fallback.

## Security Considerations
- Static data, no user input; path data generated from whitelisted chars only (test enforced) → no markup injection.

## Next Steps
- 01 step 9 toggle icons; 04/05 consumers; 08 icon gallery on credits page.
