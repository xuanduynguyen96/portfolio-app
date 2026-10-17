# Phase 04: Surfaces + core components

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [01](phase-01-tokens-and-theme-infrastructure.md), [02](phase-02-typography-and-fonts.md), [03](phase-03-pixel-icon-system.md) · Next: 05, 07 (parallel)
- Research: [researcher-01 §2.4 frames + gotchas](research/researcher-01-pixel-icons-and-frames-report.md) · Scout: [component table](scout/scout-01-theme-surface-report.md)
- Docs: `docs/design-guidelines.md#surfaces-and-effects-effectscss`, `docs/code-standards.md#accessibility-rules`

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: L (6h) · Implementation: Done (404 "Off the map", pixel favicon, forced-colors fallback) · Review: Done ([03 report](reports/03-code-review-report.md): M1, L2 fixed; L6 names open)
- Replace sci-fi effects (grid, scanlines, neon blobs, glass blur) with RPG surfaces: pixel-notched panel frames, pixel buttons, dither texture + vignette background, chapter eyebrows, header/logo, 404 copy, pixel favicon.

## Key Insights
- Pixel border via 4 offset `box-shadow`s (NES.css technique) = notched square corners, no assets, no `clip-path` (which would clip focus outlines/shadows), themeable, radius 0.
- Shadow frame sits **outside** box → focus ring needs `outline-offset: calc(var(--pixel) + 2px)` on framed controls; grid gaps already >= frame.
- Drop `backdrop-filter` on panels (solid `--color-surface`): perf win, no radius/blur mismatch. Header may keep blur (sticky over content).
- Spotlight kept (Unresolved Q10), recolored gold, same `data-spotlight` hook + `card-spotlight.ts` untouched.
- Text e2e asserts: keep "Return to base" (internal-links.spec), headings, CTA names. Eyebrow chapter prefix stays `aria-hidden` (as `// 01` today) → SR reads label only.
- Favicon cannot use CSS tokens → only allowed literal-color file (document in design-guidelines).

## Requirements
- Functional: all `.glass` surfaces framed; `NeonButton` primary (gold fill) / ghost (surface + strong frame), pressed state; section eyebrows "Ch. I · About"; logo restyle; 404 RPG copy; background texture both themes.
- Non-functional: AA text in both themes; control boundaries >=3:1 (`--color-border-strong`); 360px no h-scroll; CSS only, tokens only, no images; `effects.css` <200 lines.

## Architecture
New tokens (`design-tokens.css`): `--pixel: 4px`, `--pixel-thin: 2px`, `--color-frame` (= border-strong), `--color-frame-hover` (= accent-primary), `--color-frame-drop` (light-dark ink 18% / black 50%), `--color-texture`, `--radius-card: 0`, `--radius-sm: 0`, `--icon-sm/md/lg/xl` (16/24/32/48px).
```css
/* effects.css */
.glass {                         /* name kept; = RPG panel frame */
  position: relative; background: var(--color-surface); border-radius: 0;
  box-shadow:
    0 calc(-1 * var(--pixel)) 0 0 var(--color-frame), 0 var(--pixel) 0 0 var(--color-frame),
    calc(-1 * var(--pixel)) 0 0 0 var(--color-frame), var(--pixel) 0 0 0 var(--color-frame),
    0 calc(2 * var(--pixel)) 0 0 var(--color-frame-drop);
}
body::before { /* 4px dither, masked */ background: repeating-conic-gradient(var(--color-texture) 0 25%, transparent 0 50%) 0 0 / var(--pixel) var(--pixel); mask-image: radial-gradient(...); }
body::after  { /* vignette */ background: radial-gradient(ellipse at 50% 0%, transparent 40%, var(--color-frame-drop) 100%); }
```
Frame via a shared custom property list so hover only swaps `--frame-color`: `.glass { --frame-color: var(--color-frame); box-shadow: ...var(--frame-color)... }`, `.glass[data-spotlight]:hover { --frame-color: var(--color-frame-hover) }`.

## Related Code Files
Modify:
- `/home/user/portfolio-app/src/styles/design-tokens.css`: pixel/frame/icon/radius tokens
- `/home/user/portfolio-app/src/styles/effects.css`: rewrite bg, `.glass`, spotlight color, `.neon-text` (gold→crimson gradient, solid fallback), `.glow-primary`, `.eyebrow`, `.status-dot` (square pixel, open=gold, limited=crimson, closed=muted)
- `/home/user/portfolio-app/src/styles/global-styles.css`: focus ring `--color-focus` + offset, link color, `::selection`
- `/home/user/portfolio-app/src/components/neon-button.astro`: pixel button
- `/home/user/portfolio-app/src/components/glass-card.astro`: padding only if needed (API unchanged)
- `/home/user/portfolio-app/src/components/section-heading.astro`: chapter eyebrow
- `/home/user/portfolio-app/src/components/tag-chip.astro`: square chip, thin pixel frame
- `/home/user/portfolio-app/src/components/site-header.astro`, `/home/user/portfolio-app/src/components/menu-toggle-button.astro`: pixel bottom border, logo, menu icon bars square
- `/home/user/portfolio-app/src/components/sections/hero-section.astro`: eyebrow/role styling, sci-fi copy check
- `/home/user/portfolio-app/src/pages/404.astro`: RPG copy
- `/home/user/portfolio-app/src/data/site-config.ts`: only sci-fi wording in non-asserted strings (keep `TODO(content)` markers)
- `/home/user/portfolio-app/public/favicon.svg`: pixel crest (literal palette, `shape-rendering="crispEdges"`)
Create:
- `/home/user/portfolio-app/src/utils/to-roman-numeral.ts`, `/home/user/portfolio-app/tests/unit/to-roman-numeral.test.ts`

## Implementation Steps
1. Tokens (above). Check `--color-frame-drop`/texture keep body text AA (axe both themes).
2. `effects.css` rewrite: remove grid, scanlines, neon blobs; add dither + vignette (`--z-bg`, `pointer-events: none`); `.glass` frame; drop `@supports not (backdrop-filter)` branch; spotlight `::before` radial uses `--color-border-accent`.
3. `.neon-text`: `background: linear-gradient(180deg, var(--color-accent-primary), var(--color-accent-secondary))`, keep solid fallback + large-only rule.
4. `neon-button.astro`: primary = `--color-accent-primary` bg + `--color-text-on-accent`, frame via same shadow pattern with `--color-frame-drop` drop; ghost = surface + `--color-border-strong` frame; `:active { transform: translateY(var(--pixel-thin)); }` (shadow drop shrinks); font `--font-hud`; min-height 2.75rem kept; `outline-offset` per Key Insights.
5. `to-roman-numeral.ts` (1-39 enough; throw RangeError outside 1-3999) + unit test (1→I, 4→IV, 7→VII, 9→IX, 14→XIV, 0 throws).
6. `section-heading.astro`: `<p class="eyebrow"><span aria-hidden="true">Ch. {toRomanNumeral(index)} · </span>{label}</p>`; update prop doc comment.
7. Header: `border-bottom: var(--pixel-thin) solid var(--color-border-strong)`; logo = initials in `--font-heading` inside pixel-framed square (drop `</>` brackets), keep `aria-label="Home"`; nav link hover/current = gold + underline `var(--pixel-thin)`.
8. 404: title `404: Off the map | {name}`; eyebrow `Error 404 · Uncharted`; h1 `Off the map`; copy "This path leads nowhere. The page may have moved, or it was never on the map."; button text **unchanged** `Return to base`.
9. Grep sci-fi words (`neon|signal|terminal|futuristic|cyber|glitch`) in `src/` user-facing strings; reword non-asserted ones; leave project content/slugs (`neon-dashboard` is content; Unresolved Q6).
10. Favicon: 8x8 shield/sword pixel art, `viewBox="0 0 8 8"`, dungeon palette.
11. Screenshots 360/1280 both themes (scratchpad) home, project, speedrun, changelog, 404; fix.
12. check/unit/e2e; focus Tab walk spec (`project-detail-and-focus`) must see visible outline.

## Todo List
- [x] tokens (pixel/frame/icon/radius)
- [x] effects.css rewrite (<200 lines)
- [x] focus/selection/link globals
- [x] neon-button pixel style
- [x] roman numeral util + test, section-heading
- [x] tag-chip, header/logo/menu icon
- [ ] hero + copy sweep (not recorded)
- [x] 404 copy, favicon
- [ ] screenshots both themes (not recorded)
- [x] suite green

## Success Criteria
- No `backdrop-filter` on panels; no `--radius-card` > 0; `grep -rn "scanline\|grid" src/styles` empty
- axe both themes 0 serious/critical; responsive + focus specs green
- Visual: framed panels/buttons crisp at 1x and 2x DPR screenshots

## Risk Assessment
- Outer box-shadow frames overlap neighbors in tight flex rows → add `margin: var(--pixel)` or gap >= `--pixel`.
- Gold gradient text on parchment low contrast → `.neon-text` only on h1 (large text 3:1); axe verifies.
- Dither texture under text lowers perceived contrast → texture alpha <=5%, masked away from content center.
- Copy changes accidentally hit e2e-asserted strings → run full e2e after step 9.

## Security Considerations
- CSS/markup only; no new external resources.

## Next Steps
- 05 career components use frames/icons; 07 adds `data-sfx` to `neon-button` + nav links.
