# Phase 02: Typography + fonts

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [phase-01](phase-01-tokens-and-theme-infrastructure.md) · Next: [phase-04](phase-04-surfaces-and-core-components.md), [phase-08](phase-08-credits-page-and-optional-pixel-packs.md)
- Research: [researcher-02 §2.1 fonts, §2.5 perf/CLS](research/researcher-02-theme-fonts-sfx-report.md)
- Verified (npm, by caller): `@fontsource/medievalsharp` 5.3.0 OFL-1.1, `@fontsource-variable/pixelify-sans` 5.3.0 OFL

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: S (3h) · Implementation: Done (`.h2-compact` for long/small h2s) · Review: Done ([03 report](reports/03-code-review-report.md): M3 fixed)
- MedievalSharp for h1/h2 display, Pixelify Sans Variable for HUD/eyebrow/badge/button labels, Space Grotesk body unchanged. Drop JetBrains Mono. Rename `.mono` utility → `.hud-text`.

## Key Insights
- JetBrains Mono today = labels (22 files via `.mono`, `--font-mono`) + inline `code` in project prose (1 project). Labels move to Pixelify → JetBrains only for `code` → not worth a webfont: `--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`. Net family count 2 → 3 (+1 file per page realistically: heading; Pixelify on all pages).
- MedievalSharp: 1 weight (400), weak legibility <32px → h1/h2 only; raise `--text-h2` min 1.875rem → 2rem. `font-synthesis: none` (no faux bold). h3 stays Space Grotesk 700.
- Pixel font min 14px → labels use new `--text-hud: 0.875rem` (was `--text-xs` 12px). Widens chips/badges → recheck 360px.
- Fontsource CSS has `unicode-range` per subset → browser fetches latin only. Preload only heading latin file; must be the **same hashed URL** the CSS references or it double-downloads.
- `.mono` is a lying name after swap; rename mechanical, same pattern as 01.

## Requirements
- Functional: h1/h2 render in MedievalSharp, labels in Pixelify Sans, body Space Grotesk, `code` system mono.
- Non-functional: CLS 0 on `/` + project page; <=1 preload; no external font requests; Lighthouse perf mobile >=98; text spacing override (WCAG 1.4.12) doesn't clip labels.

## Architecture
```
design-tokens.css
  --font-display  'Space Grotesk Variable', system-ui, sans-serif   (body, h3+)
  --font-heading  'MedievalSharp', 'Iowan Old Style', Georgia, serif (h1, h2, .display)
  --font-hud      'Pixelify Sans Variable', ui-monospace, monospace (eyebrow, .hud-text, chips, buttons)
  --font-mono     ui-monospace, SFMono-Regular, Menlo, Consolas, monospace (code)
  --text-hud 0.875rem · --tracking-hud 0.04em (replaces --tracking-mono)
base-layout.astro: imports + <link rel=preload as=font crossorigin href={medievalLatinUrl}>
```

## Related Code Files
Modify:
- `/home/user/portfolio-app/package.json` (+2 deps, -jetbrains; description later in 09)
- `/home/user/portfolio-app/src/layouts/base-layout.astro`: font imports, preload link
- `/home/user/portfolio-app/src/styles/design-tokens.css`: font + hud tokens, `--text-h2` min
- `/home/user/portfolio-app/src/styles/global-styles.css`: `h1, h2` heading font; `code` mono; `.mono` → `.hud-text`
- `/home/user/portfolio-app/src/styles/effects.css`: `.eyebrow` → `--font-hud`, `--text-hud`, `--tracking-hud`
- 22 `.astro` files using `.mono` class / `--font-mono` for labels (grep): rename class, `font-family: var(--font-hud)`, `font-size: var(--text-hud)` where label was `--text-xs`
Create: none · Delete: dep `@fontsource-variable/jetbrains-mono`

## Implementation Steps
1. `npm i @fontsource/medievalsharp@5.3.0 @fontsource-variable/pixelify-sans@5.3.0 && npm uninstall @fontsource-variable/jetbrains-mono`.
2. Inspect `node_modules/@fontsource/medievalsharp/files/` + `LICENSE`; note exact latin file name and copyright holder (for 08 credits).
3. base-layout:
   ```astro
   import '@fontsource-variable/space-grotesk';
   import '@fontsource/medievalsharp/400.css';
   import '@fontsource-variable/pixelify-sans';
   import medievalLatin from '@fontsource/medievalsharp/files/medievalsharp-latin-400-normal.woff2?url';
   ---
   <link rel="preload" href={medievalLatin} as="font" type="font/woff2" crossorigin />
   ```
   After build: `grep -o 'medievalsharp-latin-400[^")]*' dist -r | sort -u` → exactly one hashed name (preload == CSS).
4. Tokens per Architecture; remove `--tracking-mono` (rename usages to `--tracking-hud`).
5. global-styles: `h1, h2 { font-family: var(--font-heading); font-weight: 400; font-synthesis: none; letter-spacing: 0.01em; }`; drop negative tracking for those; `code { font-family: var(--font-mono) }`; rename `.mono` utility to `.hud-text { font-family: var(--font-hud); letter-spacing: var(--tracking-hud) }`.
6. `sed -i 's/\bmono\b/hud-text/'` only inside `class=`/`class:list` strings (review each hit; don't touch `--font-mono`, `code`). Then replace label `font-family: var(--font-mono)` with `--font-hud` in tag-chip, neon-button, hero, skill-tree-node, boss-battle-panel; label `--text-xs` → `--text-hud`.
7. Check headings that are not h1/h2 but display (hero title is h1 ✓, character `char-title`?) → apply `--font-heading` only if rendered >=32px.
8. Build; Playwright 360px + 1280px screenshots (scratchpad) home, project, speedrun, 404; fix overflow (wrap, `min-inline-size: 0`).
9. CLS: Lighthouse mobile `/` + project. If CLS > 0: add fallback face in global-styles
   `@font-face { font-family: 'MedievalSharp Fallback'; src: local('Georgia'); size-adjust: <ratio>%; ascent-override: ..; descent-override: ..; }` — ratio = h1 width(real)/width(fallback) measured with a scratch Playwright script; append to `--font-heading` stack after MedievalSharp.
10. Text spacing check: inject WCAG 1.4.12 bookmarklet CSS in Playwright, screenshot badges/buttons, no clipping.
11. check/unit/e2e (hero `SplitText` autoSplit re-splits on font load; `expectHeroVisible` must pass).

## Todo List
- [x] deps add/remove, license info noted
- [x] imports + single preload, verify one hashed URL
- [x] tokens (heading/hud/mono/text-hud/h2 min)
- [x] `.mono` → `.hud-text`, label fonts/sizes
- [ ] 360/1280 screenshots, overflow fixes (screenshots not recorded; responsive spec green)
- [x] CLS 0 (Lighthouse, see 09)
- [ ] text-spacing check (WCAG 1.4.12) not recorded
- [x] suite green

## Success Criteria
- `grep -rn "jetbrains\|\bmono\b" src` → only `--font-mono` on `code`
- Network on `/`: font requests = Space Grotesk + MedievalSharp latin + Pixelify latin; none external
- CLS 0; responsive-layout spec green; no label <14px in Pixelify

## Risk Assessment
- Fontsource file naming differs → step 2 confirms before writing import.
- MedievalSharp glyph coverage (latin-ext names/diacritics) → site name "Xuan Duy Nguyen" plain latin; fallback serif covers rest.
- Wider Pixelify labels break badge rows on 360px → allow wrap, keep text unchanged (e2e exact-match).
- SplitText splitting before font swap → `autoSplit` handles; verify hero spec.

## Security Considerations
- Self-hosted npm fonts only; pinned versions; OFL text kept in node_modules + credited in 08.

## Next Steps
- 04 surfaces use `--font-hud` for buttons; 08 credits fonts (authors from step 2).
