# Phase 05: Career RPG components restyle

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [03](phase-03-pixel-icon-system.md), [04](phase-04-surfaces-and-core-components.md) · Parallel with: [07](phase-07-opt-in-chiptune-sfx.md) · Next: [06](phase-06-motion-adaptation.md)
- Prior plan: [career RPG layer](../20261017-0432-career-rpg-gamification-layer/plan.md) (component contracts)
- Docs: `docs/design-guidelines.md#career-rpg-components-srccomponentscareer-rpg`
- Specs to keep green: `quest-cards-and-boss`, `character-sheet-and-hud`, `skill-tree`, `speedrun-page`, `changelog-and-streak`, `project-detail-and-focus`

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: M (4h) · Implementation: Done (via ui-ux-designer; no scoring/data diff) · Review: Done ([03 report](reports/03-code-review-report.md): M3 fixed; L6 skill-tree-node 198/200 lines open)
- Visual-only restyle of the Career RPG layer: icons + text on badges, pixel gem pips, pixel connectors, segmented XP bar, HUD/streak/achievement icons, crimson boss frame. **No scoring/data/schema changes.**

## Key Insights
- e2e uses exact `toHaveText` on `.quest-badge`, `.quest-xp`, `.streak-badge`, `.identity .eyebrow`, `.char-title`, HUD summary → icons inside these are fine only because `<svg>` has no text; prefer icon **outside** label/heading elements where possible.
- Rarity convention reads as RPG and stays non-color-only (text always present): side = muted (common), main = gold, raid = arcane purple, boss = crimson fill + skull icon.
- Pips: CSS-only stepped gem (`clip-path` 4x4 diamond at 2px art px = 8px) → no SVG count blow-up (~75 pips on home). Clip-path OK here: pips not focusable, no shadow needed.
- `<progress>` stays native (a11y names, `aria-valuetext`); segmented look via `::-webkit-progress-value` / `::-moz-progress-bar` repeating gradient. Static (no fill animation).
- Locked nodes: `locked` icon (aria-hidden) + existing visually-hidden "(locked)" text.

## Requirements
- Functional: per table below; `xp-progress-bar` gains optional `icon?: PixelIconName` prop.
- Non-functional: AA both themes; 360px; files <200 lines (`boss-battle-panel` 166, `skill-tree-node` 163 → watch; extract styles to sibling partial if over).

| Component | Change |
|---|---|
| `quest-tier-badge` | `<PixelIcon name={isBoss ? bossIcon : difficultyIcons[difficulty]} />` + text span; square chip with thin pixel frame; colors per rarity |
| `project-card` | panel frame; `[data-boss]` → `--frame-color: var(--color-accent-secondary)` + one `--shadow-glow-secondary`; `+N XP` with `xp` icon |
| `boss-battle-panel` | crimson frame, "Boss Battle"/"Quest Log" heading unchanged, obstacles list bullet = small pixel square |
| `skill-tree-node` | root: `skillRootIcon(id)` 24px before `h3` (sibling); pips → gems; connectors → `--pixel-thin` dashed via repeating-linear-gradient in `--color-border-accent`; locked icon |
| `xp-progress-bar` | track framed, value segmented gold (attributes: attribute icon via prop) |
| `completeness-hud` | `evidence` icon in summary row; `<details>` marker → pixel triangle |
| `streak-badge` | `streak` (flame) icon before text; square framed pill; >=44px |
| `achievement-card` | `achievement` icon; big value in `--font-hud`; "Sample" crimson chip |
| `character-sheet-section` | `level` icon beside (not inside) `.identity .eyebrow`; attribute icons on bars; `xp` icon on total |

## Architecture
```
PixelIcon (03) ← pixel-icon-map (attributeIcons, difficultyIcons, bossIcon, skillRootIcon)
quest-tier-badge ─ project-card, boss-battle-panel
xp-progress-bar(icon?) ─ character-sheet-section (attributes, level XP)
skill-tree-node (pips CSS, connectors CSS) ─ skills-section
```
Gem pip:
```css
.pip { inline-size: 8px; block-size: 8px; background: var(--color-border);
  clip-path: polygon(25% 0, 75% 0, 75% 25%, 100% 25%, 100% 75%, 75% 75%, 75% 100%, 25% 100%, 25% 75%, 0 75%, 0 25%, 25% 25%); }
.pip--on { background: var(--color-accent-primary); }
```
(8px literal → token `--pip-size: calc(2 * var(--pixel))`.)
Segmented bar:
```css
progress::-webkit-progress-value { background: repeating-linear-gradient(90deg, var(--color-accent-primary) 0 var(--seg), transparent var(--seg) calc(var(--seg) + var(--pixel-thin))); }
```

## Related Code Files
Modify (all under `/home/user/portfolio-app/src/components/`):
- `career-rpg/quest-tier-badge.astro`, `career-rpg/boss-battle-panel.astro`, `career-rpg/skill-tree-node.astro`, `career-rpg/xp-progress-bar.astro`, `career-rpg/completeness-hud.astro`, `career-rpg/streak-badge.astro`, `career-rpg/achievement-card.astro`
- `project-card.astro`, `sections/character-sheet-section.astro`, `sections/skills-section.astro` (root card frame only if needed)
- `/home/user/portfolio-app/src/styles/design-tokens.css`: `--pip-size`, `--seg`
Create: none (split a style partial only if a file exceeds 200 lines)

## Implementation Steps
1. Badge: wrap as `<span class="quest-badge ..."><PixelIcon .../><span>{label}</span></span>`; `display: inline-flex; gap: var(--space-1)`. Run `quest-cards-and-boss` spec (exact text).
2. Project card + boss: frame color swap via `--frame-color`; one glow only; boss spans 2 cols unchanged.
3. Boss panel: crimson frame, bullets `::before` 4px square; keep headings/text.
4. Skill tree: root icon sibling before label; replace circular pips with gems; connectors pixel-dashed; locked: `locked` icon 16px replaces pips row visual (pips still rendered? → render pips always, add lock icon; keeps alignment). Verify `skill-tree` spec + no-JS.
5. XP bar: add `icon?` prop rendered left of label row (outside `#{id}-label`); restyle track/value for WebKit + Firefox; `--bar-height: calc(2 * var(--pixel))`.
6. Character sheet: `level` icon placed in `.identity` before the eyebrow element (not inside, text stays `Level N`); attribute bars pass `attributeIcons[attr]`; total XP `xp` icon.
7. HUD, streak, achievement icons per table; streak text untouched (`changelog-and-streak` asserts exact).
8. Screenshots both themes (home `#character`, `#skills`, `#projects`, project boss + unverified, `/speedrun/`, `/changelog/`).
9. check/unit/e2e; axe both themes.

## Todo List
- [x] quest-tier-badge icon + rarity colors
- [x] project-card + boss frame
- [x] boss-battle-panel (h2 font fix, M3)
- [x] skill-tree-node icons/gems/connectors/lock
- [x] xp-progress-bar segmented + icon prop
- [x] character sheet icons
- [x] HUD / streak / achievement icons
- [ ] screenshots (not recorded)
- [x] suite green (6 career specs)

## Success Criteria
- All 6 career specs green unchanged; axe both themes clean
- Every game state still readable as text (level, locked, unverified, sample, boss)
- No component >200 lines; no scoring/data file diff (`git diff --stat src/utils src/data/xp-rules.ts src/content` empty)

## Risk Assessment
- `::-webkit-progress-value` gradient differs in Firefox → test `::-moz-progress-bar` too (Playwright chromium only in CI; manual FF check optional).
- Icon inside `h3` changes accessible name? SVG aria-hidden → excluded; still place outside.
- Boss crimson + glow on parchment muddy → light theme glow alpha lower via token.

## Security Considerations
- Presentation only; evidence links keep `target=_blank rel="noopener noreferrer"`.

## Next Steps
- 06 motion; 09 pixel-icon e2e checks these components.
