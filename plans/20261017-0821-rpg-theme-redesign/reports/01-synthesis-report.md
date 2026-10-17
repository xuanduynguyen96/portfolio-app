# Synthesis 01: RPG theme redesign — decisions + trade-offs

Date: 2026-10-17 · Inputs: scout-01, researcher-01, researcher-02, `plans/reports/261017-rpg-theme-assets.md`, docs (dated today), caller npm checks · Plan: [../plan.md](../plan.md)

## Context shift
- Assets report leaned SVG/game-icons + Kenney, against pixel art. User since chose **8x8 pixel icons**, scoped to icons. Pixel = icons + small flourishes (frames, pips, caret); body/layout stay readable modern.
- Downloads blocked (OGA/itch 403; fontsource/kenney/astro docs DNS) → own icons remove the dependency entirely.

## Decisions
| Area | Chosen | Alternatives (why not now) |
|---|---|---|
| Icons | Own 8x8 grids in TS → inline SVG path, crispEdges, currentColor, 16/24/32/48 | CC0 PNG packs (blocked, not themeable, need pixelated + no `<Image>`); game-icons.net CC BY (not pixel, per-icon credit) |
| Icon delivery | Per-use inline SVG, 1 path/tone | `<symbol>` sprite (fallback if HTML gzip +10 KB) |
| Theme mechanism | `light-dark()` tokens + `color-scheme`; `data-theme` forced by head script | Duplicate `[data-theme]` + media blocks (2x token lines, drift risk); kept only as old-browser dark fallback |
| Soft-nav persistence | Set attr on `newDocument` in `astro:before-swap` + re-apply after-swap | after-swap only (possible 1-frame gap; existing flags pattern) |
| No-JS | CSS follows system; toggles hidden via `:root:not([data-theme])` | Server default dark (ignores user pref) |
| Toggle | 2-state `aria-pressed` "Dark theme" | 3-state with system reset (Q2) |
| Panels/buttons | 4-side box-shadow pixel border (notched), radius 0, no backdrop-filter | border-image 9-slice PNG (needs art, radius conflicts); clip-path steps (clips focus/shadow) |
| Heading font | MedievalSharp 400, h1/h2 >=32px, preloaded | Cinzel Variable 600 (better legibility; researcher #1 pick) — Q3 |
| HUD font | Pixelify Sans Variable, >=14px | Silkscreen (caps-only tags), Press Start 2P (too wide) |
| Mono | Drop JetBrains; `code` → system mono | Keep for `code` (1 extra font, 1 project uses inline code) |
| Names | Keep `GlassCard`/`NeonButton`/`.glass`/`.neon-text`; rename hue tokens + `.mono` | Full rename (25+ files churn, no user value) |
| Pips | CSS clip-path gem | SVG icon per pip (~75 inline SVGs on home) |
| Motion | Keep GSAP; stepped ease on hero chars; CSS caret blink under motion-ok | Stepped reveals for all cards (janky); new animation module (YAGNI) |
| SFX | Web Audio oscillator synth, lazy chunk, off by default | Kenney CC0 OGG (blocked download, decode, codec matrix) |
| Credits | `/credits/` + icon gallery (doubles as art QA) | README-only credits |

## Trade-offs worth flagging
- MedievalSharp flavor vs legibility: confined to >=32px headings; Cinzel swap is 1 import + 1 token.
- Pixelify >=14px widens badges → 360px risk; wrap allowed, text unchanged (e2e exact match).
- Outer-shadow frames need gap/margin >= 4px and larger focus `outline-offset`.
- `light-dark()` = Baseline 2024; older browsers get dark-only fallback (acceptable for portfolio).
- `theme-color` constants in head script mirror `--color-bg` → spec asserts equality.
- Inline icons add HTML bytes; budgeted + measured in 09.

## Parallelism + ownership
- 03 independent (new files only) ‖ 01/02. 01 toggle icons wait for 03.
- 05 (`career-rpg/*`, project-card, character/skills sections) ‖ 07 (`sfx-*`, header-controls). 06 + 07 both add one attribute to `neon-button` / `site-header` nav → do 07 attr edits after 06.
- 08 (`credits*`, footer, test-helpers, axe list) ‖ 04-07 after 01+02.
- 09 last.

## Test strategy
- Keep all 56 e2e + 95 unit green without loosening; visible e2e-asserted text unchanged ("Return to base", badges, XP, streak, Level N).
- New: unit (pixel grids/paths/mappings, roman numerals); e2e theme-toggle (7), axe x2 themes, sfx (6), credits, pixel-icons crisp/decorative.
- Lighthouse 5 pages x light/dark x mobile/desktop; CLS 0.

## Risks (top)
1. Art quality of own icons → preview + credits gallery review gate; packs as fallback (08 B).
2. Astro 7 `astro:before-swap` `newDocument` shape → verify in installed types.
3. Contrast of gold/crimson on parchment for small text → only `--color-accent-*` light variants (>=5.4:1) for text; axe both themes.
4. Font CLS → measure; fallback face with `size-adjust` only if needed.

## Unresolved
See plan.md (14 questions). Highest impact: Q1 default theme, Q3 heading font, Q7 SFX now vs later, Q14 base branch.
