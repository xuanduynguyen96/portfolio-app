# Code Review 03: RPG theme redesign (uncommitted, branch feat/rpg-theme-redesign)

## Scope
- Files: 35 modified + 21 untracked (excl. plans/). Focus: theme-head-script, effects.css/tokens, header controls, pixel icons, credits, new tests.
- No edits made. Contrast ratios computed from token hexes (node script), not eyeballed.
- Not re-run: e2e (reported green). forced-colors finding is spec-based, not browser-verified.

## Overall
Solid. Theme script correct for no-flash, ClientRouter swap, blocked storage, delegated click. Tokens complete in fallback block. No Critical. Biggest gaps: no forced-colors fallback for box-shadow frames, docs not updated (DoD), small-size MedievalSharp h2s, a few weak tests.

## Critical
None.

## High
None confirmed. (H candidate demoted: forced-colors, see M1.)

## Medium

### M1. Pixel frames vanish in forced-colors (Windows High Contrast)
- `src/styles/effects.css:31-42` (all `.glass`/`.pixel-frame`), controls with `border: 0`: `src/components/theme-toggle.astro:~17`, `src/components/menu-toggle-button.astro:~14`.
- No `forced-colors` / `prefers-contrast` rule anywhere in `src` (grep: 0 hits). Spec: UA forces `box-shadow: none` in forced-colors.
- Scenario: Windows HCM user at <48rem. Theme toggle, menu toggle, ghost button, logo crest, chips, panels have no boundary (old design had 1px `border`). Menu icon bars are `background` pseudo-elements (forced to Canvas) so invisible too: nav unreachable by sight. Focus outline survives, boundary does not.
- Fix: in effects.css
  ```css
  @media (forced-colors: active) {
    .glass, .pixel-frame { border: var(--frame-width) solid CanvasText; }
  }
  ```
  and in menu-toggle-button use `forced-color-adjust`/`background: CanvasText` for `.menu-icon` bars (or `border-block-start` based bars). Add e2e with `page.emulateMedia({ forcedColors: 'active' })` asserting toggles have non-zero border width.

### M2. Docs not updated (Definition of Done item)
- `docs/design-guidelines.md:3,13-16,32,43-46,53-71,94-95` (neon cyan/magenta, mono, glass, `--color-accent-cyan`, "Dark only"), `docs/project-overview-pdr.md:7`, `docs/codebase-summary.md:66` ("grid/scanlines bg"), `docs/system-architecture.md`, `README.md` still describe sci-fi theme. `git status`: docs/ and README untouched.
- Impact: docs now lie about tokens (`--color-accent-cyan` no longer exists), theme toggle, fonts (JetBrains Mono dropped), icon system, credits page. CLAUDE.md mandates keeping docs current; plan DoD: "docs + changelog updated".
- Fix: update design-guidelines (tokens table, themes, fonts, frames, icons, a11y), codebase-summary (new files), system-architecture (theme flow), roadmap (light theme done), README.
- Also plan.md still says all 9 phases "Pending" (not updated; I was told not to edit).

### M3. MedievalSharp used below 32px (violates own token contract)
- `src/components/career-rpg/boss-battle-panel.astro:112-114` (`h2 { font-size: var(--text-h3) }`), `src/pages/speedrun.astro:146-148` (same). Global `h1,h2 { font-family: var(--font-heading) }` (`global-styles.css:48-54`) applies; `design-tokens.css:31` says "h1, h2 only (>=32px)".
- Scenario: "Top achievements", "Next step", quest-panel title render in MedievalSharp at 20-24px: poor legibility (plan Q3 flagged this exact risk). `changelog.astro:108-113` already fixed it by overriding to `--font-display`; these two missed.
- Fix: same override (`font-family: var(--font-display); font-weight: 700; letter-spacing: -0.02em`), or better, move to a single rule: global `h2` uses heading font only via a `.display-heading` class / `:where(h2)` + opt-out. Minimal: copy the changelog override.

### M4. "No flash" e2e can pass when the script is broken
- `tests/e2e/theme-toggle.spec.ts:65-74`. Probe is a rAF scheduled in `addInitScript`. Static page parses in one chunk, so first rAF usually fires after DOMContentLoaded; a regression that applied the theme only in the `DOMContentLoaded` listener (line 42 of script) still passes.
- Fix: deterministic probe: in `addInitScript` install `MutationObserver` on `documentElement` recording `{theme, bodyExists: !!document.body}` at first `data-theme` mutation; assert `bodyExists === false` (set from head, before body parsed).

### M5. Credits test cannot detect a missing/incorrect per-entry license
- `tests/e2e/credits-page.spec.ts:133-134`. `section.getByText(entry.license, {exact:false}).first()` is region-wide, case-insensitive substring. Three fonts share "SIL Open Font License 1.1" so deleting 2 of 3 entries' licenses still passes; "MIT" matches Astro's row for Fontsource; "Own work"/others fine. Test title promises "every ... license link" but never asserts `licenseUrl` hrefs (only counts `_blank` links).
- Fix: scope to the card: `section.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3, name: entry.name }) })`, then assert `toContainText(entry.author)`, license text, and `getByRole('link', {name: license})` has `href=entry.licenseUrl` when present.

## Low

### L1. Toggle is shown but inert when `light-dark()` unsupported
- `design-tokens.css:97-122` fallback is dark-only (block is complete: all 19 `light-dark()` tokens covered, verified). But script still sets `data-theme`, shows toggle (`theme-toggle.astro` hides only when no `data-theme`), flips `aria-pressed` and theme-color metas to parchment while page stays dark. Also `:root[data-theme='light'] { color-scheme: light }` (specificity > fallback `color-scheme: dark`) gives light scrollbars/controls on dark tokens.
- Fix: inside the `@supports not` block: `[data-theme-toggle] { display: none }` and `:root[data-theme] { color-scheme: dark }`.

### L2. Spotlight tint lowers muted text contrast on hover (dark)
- `effects.css:61-82`. At pointer centre `--color-glow-primary` (gold .3) over `--color-surface-hover` ~ rgb(92,72,39); `--color-text-muted` #a89c88 on that ~3.2:1 (<4.5). `::before` is positioned with no z-index so it also paints over text. Hover-only, transient; axe does not test. Fix: `z-index: 0` on `::before` + content above, or lower alpha to ~.18 in dark.

### L3. Theme script minor edge cases (no user-visible bug today)
- `theme-head-script.astro:35`: on re-exec the new closure's `apply()` runs with `chosen=null`; with storage blocked it would reset an in-tab choice to system before the `__themeBound` guard returns. Astro keeps identical head scripts, so unreachable now. Guard first, apply second: move `if (window.__themeBound) return;` above `apply()` (still need an apply for the new doc: dispatch a `CustomEvent` or call a stored `window.__applyTheme`).
- No `storage` event listener: tab B stays on its own `chosen` after tab A changes theme (until reload). Optional.
- Hex duplicated twice in same file (lines 7-8 and 12) plus tokens + test. Single `const BG` in frontmatter with `define:vars` would remove one copy. Note: this makes theme-head-script (+ test) literal-color files beyond favicon; rule "favicon only" should be amended in code-standards to mention it (unavoidable, pre-CSS).

### L4. Test gaps (nothing fake, but unguarded)
- `theme-toggle.spec.ts`: no live `emulateMedia({colorScheme})` change test (no stored choice follows; stored choice ignores). No invalid stored value (`'foo'`) test. No theme-color meta check after soft navigation (Astro swaps head metas; `apply()` on after-swap is what fixes content). No keyboard (Enter/Space) toggle.
- `project-detail-and-focus.spec.ts:84-114` (focus) only checks computed outline in default (light) scheme; no dark run; cannot detect ring overlapping/hidden by pixel frame. Non-text contrast (frames, icons >=3:1) not tested by axe; manual calc below passes.
- `pixel-icons.spec.ts`: labelled-icon branch never exercised (no `label` usage), harmless.
- `pixel-icons.test.ts:21-24` hardcoded count 24 plus redundant `<= 32` — change-detector, ok but the `<=32` line adds nothing.

### L5. Dead code / assets
- Unused tokens: `--icon-sm/md/lg/xl`, `--radius-card`, `--shadow-card` (+ its fallback entry `design-tokens.css:~119`). 0 `var()` consumers.
- Icons `sound-on`, `sound-off` have 0 consumers (SFX phase 07 not built) yet render in the credits gallery and are asserted by unit test `pixel-icons.test.ts:61-63`. Either build SFX or drop the 2 icons (set size 22).
- `PIXEL_ICON_SIZES` etc fine.

### L6. Names that no longer match
- `.neon-text` (gold-crimson gradient), `NeonButton`, `.glass`/`GlassCard` (no glass, no blur), `neon-dashboard` slug. Plan decision #5 keeps them; `.glass` has a comment, `.neon-text` and NeonButton do not. Add one-line comments or rename later.
- Project cover SVGs + `public/og-image.png` + `src/assets/og-image-source.svg` still cyan/magenta (`#00fff0`, `#ff2bd6`); `coverAlt` in `realtime-chat.md`, `neon-dashboard.md` says cyan/magenta (accurate to the images, but social preview and cards clash with new palette). Plan Q6 open.
- Caret blink (`effects.css:155-157`) infinite while hovered/focused, no pause: marginal WCAG 2.2.2; decorative, gated on `data-motion='ok'`. Ignore or use finite iteration count.
- `.logo` `aria-label="Home"` vs visible initials (WCAG 2.5.3 label-in-name): pre-existing.
- `skill-tree-node.astro:~137,~175` single-line rule bodies `{ background: ... }` inconsistent with file formatting; file at 198/200 lines, no headroom.

## Verified OK (no finding)
- Theme script: sets `data-theme` + metas synchronously in head before body (metas precede script); `before-swap` writes `newDocument.documentElement` so `swapRootAttributes` carries it; `after-swap` + DOMContentLoaded refresh `aria-pressed`; `localStorage` in try/catch both get/set; in-memory `chosen` survives soft nav; matchMedia listener only when unstored; delegated click needs no rebind; duplicate-listener guard present.
- Toggle a11y: stable name "Dark theme" + `aria-pressed`, icons `aria-hidden`, hidden without `data-theme` (no-JS), 44px target.
- Pixel frames: no component overrides `box-shadow` on a `.glass`/`.pixel-frame` (grep: only experience dot + `.status-dot`, not frames). Boss glow correctly uses `filter: drop-shadow`. Focus ring `outline-offset: frame+2px` clears frames (specificity (0,2,0) > `:focus-visible`).
- Token coverage: every `var(--x)` used is defined (only `--spot-*`, `--pixel-icon-shade-opacity` are runtime/optional). Fallback block covers all light-dark tokens.
- Contrast (ratio): frame `--color-border-strong` vs bg/surface: light 5.65/6.16, dark 3.61/3.31 (>=3 OK). Focus ring vs bg/surface: light 7.7/8.4, dark 8.4/7.7. accent-primary vs bg: 5.4 / 8.4. muted vs surface: 7.6 / 6.4. on-accent on primary/secondary: 5.9/8.4, 8.4/5.6. `--color-border` (dark 1.7-1.8) and `--color-border-accent` only on non-interactive chips/connectors/crest (exempt).
- File sizes: max 198 lines (`skill-tree-node.astro`); all <200. kebab-case OK. Internal links via `withBasePath`; credits/footer covered by internal-links test. Unit tests for icon path + roman numerals are real (exact path strings, boundary/throw cases, area check).

## Recommended actions (priority)
1. Add forced-colors fallback for frames + menu icon (M1) with e2e.
2. Update docs/README (and plan.md statuses) (M2).
3. Fix h2 font in boss panel + speedrun (M3).
4. Make no-flash test deterministic; tighten credits test (M4, M5).
5. Hide toggle in `@supports not light-dark` block (L1); remove dead tokens/sound icons or build SFX (L5).

## Metrics
- Type/lint/test status: as reported (check 0 errors, unit 116/116, e2e 84/84). Not re-run.
- Blocking findings: 0 Critical, 0 High, 5 Medium, 6 Low groups.

## Unresolved questions
1. Is a forced-colors/HCM target in scope? (If not, downgrade M1 to Low and note it in docs.)
2. Keep 2-state toggle (no way back to "follow system" once chosen)? Plan Q2 still open.
3. Recolor project covers + OG image (Plan Q6) before merge, or follow-up?
4. Sound icons: build opt-in SFX (phase 07) or remove the 2 icons?
5. Amend "favicon only literal colors" rule to include the pre-CSS head script/metas?
