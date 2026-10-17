# Phase 02: Design System & Global Styles

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [phase-01](phase-01-scaffold-and-tooling.md)
- Research: [261017-portfolio-app-stack.md](../reports/261017-portfolio-app-stack.md) (theme tokens snippet)
- Skills to activate during implementation: `aesthetic`, `ui-styling` (CSS parts only, no Tailwind)

## Overview
- Date: 2026-10-17 · Priority: P0 · Status: Done · Review: Code-reviewed + tester-validated
- Tokens, typography, background grid/scanlines, glass surface, focus styles, reduced-motion CSS guard.

## Key Insights
- Futuristic look = palette + type + glow + grid. No library needed.
- Neon cyan on near-black passes contrast easily; magenta for accents/decoration only, not body text.
- `backdrop-filter` costs GPU on large areas → use on cards/header only, with `@supports` fallback.
- Background effects via fixed pseudo-elements, `pointer-events: none`, no JS.

## Requirements
- Functional: tokens for color, spacing, radius, type scale, shadows/glow, z-index, motion durations.
- Non-functional: WCAG AA contrast for text (≥4.5:1 body, ≥3:1 large/UI); visible focus ring; fluid type with `clamp()`; no layout shift from fonts (`font-display: swap` via Fontsource).

## Architecture
```
src/styles/
├── design-tokens.css   :root custom properties only
├── global-styles.css   reset, base elements, typography, focus, reduced-motion
└── effects.css         .glass, .neon-glow, background grid/scanline, gradient text
```
Imported once in `base-layout.astro` (phase 04), plus Fontsource imports.

Token sketch:
```css
:root {
  --color-bg: #05070d;
  --color-bg-elevated: #0b1020;
  --color-surface-glass: rgb(255 255 255 / 0.04);
  --color-border-glow: rgb(0 255 240 / 0.22);
  --color-accent-cyan: #00fff0;
  --color-accent-magenta: #ff2bd6;
  --color-text: #e6fbff;
  --color-text-muted: #9fb3c8;
  --font-display: 'Space Grotesk Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono Variable', ui-monospace, monospace;
  --text-hero: clamp(2.5rem, 6vw + 1rem, 5.5rem);
  --space-section: clamp(4rem, 10vw, 8rem);
  --radius-card: 16px;
  --shadow-glow-cyan: 0 0 24px rgb(0 255 240 / 0.35);
  --duration-fast: 150ms;
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

## Related Code Files
Create:
- `/home/user/portfolio-app/src/styles/design-tokens.css`
- `/home/user/portfolio-app/src/styles/global-styles.css`
- `/home/user/portfolio-app/src/styles/effects.css`

## Implementation Steps
1. Write `design-tokens.css` (above + spacing scale `--space-1..8`, z-index `--z-header`, `--z-bg`).
2. `global-styles.css`: modern reset (box-sizing, margin 0, img max-width), `body` bg/text/font, `html { scroll-behavior: smooth }` inside `@media (prefers-reduced-motion: no-preference)`, `:focus-visible` cyan outline + offset, `.visually-hidden`, `.skip-link`, container `max-width: 72rem; padding-inline: 16px+`.
3. Reduced-motion guard: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`.
4. Pre-hide hook for JS reveals (consumed in phase 05): `html[data-motion='ok'] :is([data-reveal], [data-hero]) { opacity: 0; }` — only applies when JS sets the attribute.
5. `effects.css`:
   - `body::before` grid: two `linear-gradient` 1px lines, 48px cells, low-alpha cyan, radial mask fading at edges.
   - `body::after` scanlines: `repeating-linear-gradient` 2px, very low alpha.
   - `.glass`: surface + 1px glow border + `backdrop-filter: blur(12px)`; `@supports not (backdrop-filter: blur(1px))` → solid `--color-bg-elevated`.
   - `.neon-text` gradient cyan→magenta via `background-clip: text` (decorative headings only; keep a solid-color fallback).
6. Verify contrast of text tokens vs bg (manual calc or axe in phase 06).

## Todo List
- [x] design-tokens.css
- [x] global-styles.css (reset, type, focus, skip-link, container)
- [x] reduced-motion guard + `[data-reveal]` pre-hide hook
- [x] effects.css (grid, scanlines, glass, neon text)
- [x] Contrast check (axe in phase 06)

## Success Criteria
- Each CSS file <200 lines.
- Text tokens meet AA on `--color-bg`.
- With JS disabled, nothing hidden (no `data-motion` attr → no pre-hide).

## Risk Assessment
- Scanline/grid too busy → keep alpha ≤0.06; easy to tune.
- Gradient text unreadable for some → use only on large display text.

## Security Considerations
- None (static CSS). Fonts self-hosted → no third-party requests.

## Next Steps
- Phase 03 content model; phase 04 consumes these classes.
