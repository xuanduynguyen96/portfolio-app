# Phase 01: Tokens + theme infrastructure + toggle

## Context Links
- Parent: [plan.md](plan.md) · Parallel with: [phase-03](phase-03-pixel-icon-system.md) (toggle icons, last step) · Next: [phase-02](phase-02-typography-and-fonts.md)
- Research: [researcher-02 §2.2 palette, §2.3 theme](research/researcher-02-theme-fonts-sfx-report.md) · Scout: [token layer](scout/scout-01-theme-surface-report.md)
- Docs: `docs/system-architecture.md#root-flags-progressive-enhancement`, `docs/design-guidelines.md#color`

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: M (5h) · Implementation: Done (deviation: click in head script, no `scripts/theme-toggle.ts`) · Review: Done ([03 report](reports/03-code-review-report.md): M4, L1 fixed; L3, L4 open)
- Semantic token rename, dungeon/parchment palettes via `light-dark()`, no-flash theme head script, header theme toggle, axe in both themes. Visual style otherwise unchanged (sci-fi effects reworked in 04).

## Key Insights
- Hue-literal names (`--color-accent-cyan`) lie after reskin → rename across 19 files (grep list in scout). Mechanical sed, then `npm run check` + build.
- `light-dark(L, D)` resolves per `color-scheme` → one declaration per token; `:root { color-scheme: light dark }` = system; `[data-theme]` forces. No duplicated light/dark blocks.
- ClientRouter swap **resets `<html>` attributes** (see base-layout comment) → `data-theme` must be written to `event.newDocument.documentElement` in `astro:before-swap` (no gap) and re-applied in `astro:after-swap` (meta `theme-color` lives in swapped head).
- `data-theme` is only ever set by JS → `:root:not([data-theme])` = no JS → hide toggle; CSS still follows system.
- Hardcoded literals to tokenize now: header bg `rgb(5 7 13 / .72)`, tag-chip glow, `::selection`, effects.css glows (effects reworked fully in 04).
- e2e asserts text/roles, not colors → low risk; `getByRole('button', {name: 'Menu'})` must stay unique (toggle name "Dark theme").

## Requirements
- Functional: default theme = `prefers-color-scheme`; toggle switches + persists (`localStorage['rpg-theme']` = `light|dark`); survives reload + soft nav; live system change followed when no stored pref; `theme-color` meta = current bg.
- Non-functional: no flash (theme set before first paint); no-JS works; storage errors ignored; all text AA in both themes; files <200 lines.

## Architecture
```
base-layout.astro <head>
 ├─ theme-head-script.astro   (is:inline: apply(), window.__applyTheme, before/after-swap, matchMedia change)
 ├─ <meta theme-color media=dark/light> x2
 └─ existing root-flag script (unchanged)
site-header.astro → header-controls.astro → theme-toggle.astro (button[data-theme-toggle][aria-pressed])
                                             + scripts/theme-toggle.ts (bind on astro:page-load)
design-tokens.css: :root { color-scheme: light dark; --color-*: light-dark(L, D) }
                   :root[data-theme=light|dark] { color-scheme: light|dark }
```
Token map (old → new; values L / D from researcher-02):

| New token | Light | Dark | Replaces |
|---|---|---|---|
| `--color-bg` | #f4ecd8 | #14110f | same name |
| `--color-surface` / `-hover` | #fbf6e9 / #fffaf0 | #1f1a17 / #26201c | `--color-surface-glass(-hover)`, `--color-bg-elevated` |
| `--color-border` (decorative) | #8c7a5b | #4a3f35 | same |
| `--color-border-strong` (controls, 3:1) | #6b5a3e | #7a6a58 | new |
| `--color-border-accent` | gold 50% | gold 45% | `--color-border-glow` |
| `--color-accent-primary` (gold) | #7a5a12 | #d9a441 | `--color-accent-cyan` |
| `--color-accent-secondary` (crimson) | #8b1e2d | #e5635a | `--color-accent-magenta` |
| `--color-accent-arcane` | #4b3a8c | #9c8cf0 | new (raid tier, links alt) |
| `--color-text` / `-muted` | #2b1f14 / #5c4d3a | #eae0cc / #a89c88 | same |
| `--color-text-on-accent` | #fbf6e9 | #14110f | same |
| `--color-focus` | crimson | gold | new (focus ring) |
| `--color-header-bg` | bg 88% | bg 82% | literal in header |
| `--shadow-glow-primary/-secondary` | | | `--shadow-glow-cyan/-magenta` |
Class `.glow-cyan` → `.glow-primary`. Keep `.glass`, `.neon-text`, component names (Unresolved Q5).

## Related Code Files
Modify:
- `/home/user/portfolio-app/src/styles/design-tokens.css`: rewrite color block, `color-scheme`, `@supports not (color: light-dark(#000,#fff))` dark-only fallback
- `/home/user/portfolio-app/src/styles/global-styles.css`, `/home/user/portfolio-app/src/styles/effects.css`: token renames, literals → tokens
- 17 component/page files from scout grep (`neon-button`, `site-header`, `hero/experience-section`, all `career-rpg/*`, `project-card`, `tag-chip`, `projects/[slug]`, `speedrun`, `changelog`): rename only
- `/home/user/portfolio-app/src/layouts/base-layout.astro`: replace hardcoded `theme-color` meta with `<ThemeHeadScript />`
- `/home/user/portfolio-app/src/components/site-header.astro`: mount `<HeaderControls />`; bg token; extract menu button
- `/home/user/portfolio-app/tests/e2e/accessibility-axe.spec.ts`: loop `colorScheme` dark + light
Create:
- `/home/user/portfolio-app/src/components/theme-head-script.astro`
- `/home/user/portfolio-app/src/components/header-controls.astro` (wrapper; 07 adds SFX toggle)
- `/home/user/portfolio-app/src/components/theme-toggle.astro`, `/home/user/portfolio-app/src/scripts/theme-toggle.ts`
- `/home/user/portfolio-app/src/components/menu-toggle-button.astro` (moved from header, keeps header <200 lines)
- `/home/user/portfolio-app/tests/e2e/theme-toggle.spec.ts`

## Implementation Steps
1. Branch: `git switch -c feat/rpg-theme-redesign` (base per Unresolved Q14). No commits.
2. Rename (word-boundary sed over `src/`), then grep old names → expect 0:
   `sed -i 's/--color-accent-cyan/--color-accent-primary/g; s/--color-accent-magenta/--color-accent-secondary/g; s/--shadow-glow-cyan/--shadow-glow-primary/g; s/--shadow-glow-magenta/--shadow-glow-secondary/g; s/--color-border-glow/--color-border-accent/g; s/--color-surface-glass/--color-surface/g; s/glow-cyan/glow-primary/g'`. `--color-bg-elevated` → `--color-surface`.
3. Rewrite `design-tokens.css` color block:
   ```css
   :root { color-scheme: light dark; --color-bg: light-dark(#f4ecd8, #14110f); /* ... */ }
   :root[data-theme='light'] { color-scheme: light; }
   :root[data-theme='dark'] { color-scheme: dark; }
   @supports not (color: light-dark(#000, #fff)) { :root { color-scheme: dark; --color-bg: #14110f; /* dark values */ } }
   ```
4. Tokenize literals: header bg, tag-chip shadow (`--shadow-glow-primary`), effects.css rgb glows (temporary gold/crimson via tokens; full rework phase 04).
5. `theme-head-script.astro` (`is:inline`, before root-flag script):
   ```js
   const KEY = 'rpg-theme', BG = { dark: '#14110f', light: '#f4ecd8' }; // mirror --color-bg
   const stored = () => { try { const t = localStorage.getItem(KEY); return t === 'light' || t === 'dark' ? t : null; } catch { return null; } };
   const effective = () => stored() ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
   const apply = () => { const t = effective(); document.documentElement.dataset.theme = t;
     document.querySelectorAll('meta[name="theme-color"]').forEach((m) => (m.content = BG[t]));
     document.querySelectorAll('[data-theme-toggle]').forEach((b) => b.setAttribute('aria-pressed', String(t === 'dark'))); };
   window.__applyTheme = (t) => { try { localStorage.setItem(KEY, t); } catch {} apply(); };
   apply();
   if (!window.__themeBound) { window.__themeBound = true;
     document.addEventListener('astro:before-swap', (e) => { e.newDocument.documentElement.dataset.theme = effective(); });
     document.addEventListener('astro:after-swap', apply);
     matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!stored()) apply(); }); }
   ```
   Plus two metas: `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#14110f">` and light twin (correct without JS).
6. `theme-toggle.astro`: `<button type="button" class="theme-toggle" data-theme-toggle aria-pressed="false">` + `<span class="visually-hidden">Dark theme</span>` + icon slot; >=44px; `:global(:root:not([data-theme])) .theme-toggle { display: none }`.
7. `scripts/theme-toggle.ts`: on `astro:page-load` bind click → `window.__applyTheme(isDark ? 'light' : 'dark')`; sync `aria-pressed`. `declare global { interface Window { __applyTheme?: (t: 'light' | 'dark') => void } }`; no-op if missing.
8. `header-controls.astro` (flex group) in header between logo and menu button; move menu button + icon CSS into `menu-toggle-button.astro` (same markup/attrs; `responsive-layout.spec` must stay green).
9. After phase 03 merged: icons `sun`/`moon` (`PixelIcon size={24}`), CSS shows moon when `[data-theme=dark]`, sun otherwise.
10. `accessibility-axe.spec.ts`: `for (const colorScheme of ['dark', 'light'] as const) test.describe(colorScheme, () => { test.use({ colorScheme }); ...existing loop })`.
11. `theme-toggle.spec.ts`: (a) emulate dark/light → `data-theme` + `aria-pressed`; (b) click → persists after reload; (c) no flash: `addInitScript(() => requestAnimationFrame(() => (window.__t0 = document.documentElement.dataset.theme)))` with stored `light` + system dark → `__t0 === 'light'`; (d) soft nav: MutationObserver logs `data-theme` removal → none, value kept; (e) `theme-color` meta == computed body bg; (f) no-JS context → toggle hidden, body bg follows `colorScheme`; (g) localStorage throwing (`addInitScript` overriding `Storage.prototype.getItem` to throw) → page still themed, no page errors.
12. Run check, unit, e2e; fix contrast fails via token values only.

## Todo List
- [x] branch, rename sed, zero old names
- [x] tokens with light-dark + fallback
- [x] literals → tokens
- [x] theme-head-script + metas
- [x] theme-toggle comp, header-controls, menu-toggle-button extract (no `theme-toggle.ts`, see deviation)
- [x] sun/moon icons (after 03)
- [x] axe both themes, theme-toggle.spec.ts (8 tests)
- [x] check/unit/e2e green

## Success Criteria
- `grep -rE "accent-cyan|accent-magenta|glow-cyan|glow-magenta|border-glow|surface-glass" src` → empty
- theme-toggle spec 7 cases pass; axe 0 serious/critical on 6 pages x 2 themes; all prior specs green
- `site-header.astro` <200 lines

## Risk Assessment
- `before-swap` `newDocument` API differs in Astro 7 → verify event shape in `node_modules/astro` types; fallback: after-swap only (tiny flash risk, test (d) detects).
- `light-dark()` inside `rgb()`/shadow tokens: use whole-color values only (`light-dark(rgb(...), rgb(...))`).
- Interim look (gold on sci-fi grid) ugly until 04 — acceptable, not shipped.
- `BG` constants drift from tokens → spec (e) catches.

## Security Considerations
- localStorage holds only `light|dark`; value whitelisted before use; no innerHTML; inline script static (no interpolated data).

## Next Steps
- 02 fonts; 08 may add credits page to axe list after this.
