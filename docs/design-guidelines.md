# Design Guidelines

Theme: RPG. Two palettes, parchment (light) and dungeon (dark), gold + crimson + arcane accents, notched pixel frames, 8x8 pixel icons. Follows the system color scheme; a header toggle forces one via `html[data-theme="light|dark"]` (remembered, no flash). No JS: system scheme via CSS, toggle hidden.

Source of truth: `src/styles/design-tokens.css`. Use tokens, not literals. Only literal colors: `public/favicon.svg` and the pre-CSS `theme-head-script.astro` (+ its test), which mirror `--color-bg`.

## Theme and color

Every color token is one `light-dark(parchment, dungeon)` pair, resolved by `color-scheme` (`light dark` by default, `light`/`dark` under `[data-theme]`). Browsers without `light-dark()` get a dark-only fallback block (toggle hidden). Never branch on theme in components; use the token.

| Token | Use |
|-------|-----|
| `--color-bg` / `-surface` / `-surface-hover` | Page / panel fill / hovered panel (`--color-bg` also feeds the `theme-color` metas) |
| `--color-border` / `-border-strong` / `-border-accent` | Decorative hairlines (non-interactive only) / pixel frames (>=3:1) / connectors, crest |
| `--color-accent-primary` | Gold: links, eyebrows, primary fills, XP |
| `--color-accent-secondary` | Crimson: boss, limited status, selection |
| `--color-accent-arcane` | Violet: raid tier |
| `--color-text` / `-text-muted` / `-text-on-accent` | Body / secondary / text on gold or crimson fills |
| `--color-focus` | Focus ring (crimson light, gold dark) |
| `--color-glow-primary` / `-secondary`, `--color-frame-drop`, `--color-texture`, `--color-header-bg` | Glow, frame drop shadow, dither, sticky header |

Contrast rules:
- Body text keeps WCAG AA in both themes (axe runs in CI for both). Measured ratios (text, frames, focus ring): [03 code review](../plans/20261017-0821-rpg-theme-redesign/reports/03-code-review-report.md) "Verified OK".
- Muted text only on `--color-bg` / `--color-surface`. Text on accent fills uses `--color-text-on-accent`.
- Interactive frames use `--color-border-strong`; `--color-border` is for non-interactive decoration.
- Game state is never color-only (text + shape/icon).
- `.neon-text` (gold to crimson gradient, name kept from v1) only for large display text (h1); solid gold fallback.

## Typography

| Role | Font (token) | Rule |
|------|--------------|------|
| Headings | MedievalSharp (`--font-heading`) | h1/h2 only, **>=32px** (preloaded). h2 smaller than that: `.h2-compact` (body face, h3 size) |
| HUD labels | Pixelify Sans Variable (`--font-hud`) | Eyebrows, badges, chips, numbers; **>=14px** (`--text-hud`). Apply via `.hud-text` |
| Body, h3+ | Space Grotesk Variable (`--font-display`) | Default |
| Code | System mono (`--font-mono`) | JetBrains Mono removed |

All self-hosted via Fontsource, imported in `base-layout.astro`. Scale (fluid `clamp`): `--text-hero`, `--text-h2`, `--text-h3`, `--text-lg`, fixed `--text-base`, `--text-sm`, `--text-hud`. Tight leading, `text-wrap: balance` on headings, body `--leading-body` 1.65. Eyebrow: `.eyebrow` = Pixelify, uppercase, gold; pattern "Ch. I · About" (`toRomanNumeral`).

## Spacing and layout

- Scale `--space-1` (4px) to `--space-8` (64px); `--space-section` fluid. Pixel units: `--pixel` 4px, `--pixel-thin` 2px.
- `.container`: max `--container-max` (72rem), gutter `max(16px, --gutter)`; no horizontal scroll at 360px in both themes (tested).
- Grids use `auto-fill` + `minmax(min(100%, 20rem), 1fr)`.
- `html { scroll-padding-top: 5rem }` offsets the sticky header.
- Radius is 0 everywhere (square pixel corners).

## Surfaces and effects (`effects.css`)

- Background: 4px dither checker (`body::before`) + vignette (`body::after`) at `--z-bg`.
- **Pixel frame**: 4 offset `box-shadow`s (notched corners) + drop shadow, driven by `--frame-width`, `--frame-color`, `--frame-drop`. `.glass` = panels (`--pixel`), `.pixel-frame` = controls/chips (`--pixel-thin`). The frame sits outside the box: leave >= `--pixel` between framed siblings.
- **Never set `box-shadow` on a framed element.** Change `--frame-color`/`--frame-width`/`--frame-drop` (e.g. hover, rarity). Boss glow uses `filter: drop-shadow`, not `box-shadow`.
- `forced-colors: active` drops box-shadow, so framed elements get a `CanvasText` border fallback of `--frame-width` (covered by `forced-colors.spec.ts`).
- `.glass[data-spotlight]`: gold radial glow follows the pointer (`--spot-x/--spot-y`, `card-spotlight.ts`), painted under text (`z-index: -1` + `isolation`). Hover-capable devices only.
- No `backdrop-filter` or `clip-path` on panels. Names `.glass`/`GlassCard`/`NeonButton` kept from v1 (API unchanged).
- Layers: `--z-bg` -1, `--z-header` 50, `--z-skip-link` 100.

## Pixel icons

Hand-authored, no downloads. Source: 8x8 grids in `src/data/pixel-icons-*.ts` (`#` ink, `+` shade, `.` empty), rendered by `PixelIcon` (`pixel-icon.astro`) as inline SVG; list on `/credits/` gallery.

- Sizes: **16 / 24 / 32 / 48** px only (integer grid multiples stay crisp); `shape-rendering: crispEdges`.
- Color is `currentColor` (shade = ink at reduced opacity); never hardcode fills.
- Decorative by default: `aria-hidden="true"`, no text nodes, always next to visible text. Pass `label` only for a standalone icon (adds `role="img"` + `aria-label`).
- Id -> icon mappings (attribute, difficulty, boss, skill root) live in `src/data/pixel-icon-map.ts`.
- Adding an icon: [code-standards.md](code-standards.md#pixel-icons).

## Components

| Component | Notes |
|-----------|-------|
| `NeonButton` | `primary` (filled gold, `data-caret`) / `ghost`; min-height 2.75rem; `external` adds `target`/`rel` |
| `GlassCard` | `.glass` + padding; `as` = div/article/li; `spotlight` default on |
| `TagList` / `TagChip` | Square framed chips, Pixelify, muted |
| `SectionHeading` | Eyebrow + h2, `data-reveal` |
| `ProjectCard` | Panel, cover, tags, links; tier badge + `+N XP` / `Unverified`; boss card has `data-boss` |
| `ThemeToggle`, `MenuToggleButton` (in `HeaderControls`) | 44px framed buttons; toggle name "Dark theme" + `aria-pressed`, sun/moon icons `aria-hidden` |
| `PixelIcon` | See above |

### Career RPG components (`src/components/career-rpg/`)

Tokens only; no new colors.

| Component | Style / a11y notes |
|-----------|--------------------|
| `QuestTierBadge` | Pixelify uppercase, framed, tier icon + text. Rarity: side = common (muted), main = gold, raid = arcane, boss = filled crimson + `--color-text-on-accent` ("Boss · Raid") |
| Boss card / `BossBattlePanel` | Crimson frame + `drop-shadow` glow (one glow). Spans 2 columns at >=56rem. Panel h2 uses `.h2-compact`. "Boss Battle" vs "Quest Log"; unverified quests state reason + "0 XP" in text |
| `XpProgressBar` | Native `<progress>` styled as framed track with segmented gold fill (`--seg`), named via `aria-labelledby`, `aria-valuetext` "450 / 520 XP"; visible value `aria-hidden`. Static |
| `CompletenessHud` | Panel; missing items in native `<details>`; summary >=44px |
| `StreakBadge` | Framed link to `/changelog/`; text states streak, paused or empty; >=44px |
| `SkillTreeNode` | Nested `<ul role="list">`; pixel-dashed connectors; gem pips (`--pip-size`; hollow = locked, solid gold = earned, shape differs) decorative, real level in visually-hidden text; evidence in `<details>` |
| `AchievementCard` | Big HUD value + quest name; "Sample" framed tag for placeholder-sourced metrics |

Availability gem (`.status-dot`): gold = open, crimson = limited, muted = closed via `data-status`. Decorative; always next to visible text.

## Motion

- Purposeful and short. Reveals use `opacity` + `transform` only (CLS 0), stepped to the pixel grid: `PIXEL_STEP = 8` (`gsap-setup.ts`) offsets, hero title chars `steps(4)` easing; other CSS timing `--duration-fast/base/slow`, `--ease-out-expo`.
- Hero: title chars rise from line masks, then eyebrow/role/tagline/CTAs fade up. Sections/cards: fade-up once on enter, batched.
- Page transitions: Astro `ClientRouter`; shared `transition:name` on project title/cover.
- Menu caret (`[data-caret]`, pixel triangle on hover/focus) blinks only under `html[data-motion="ok"]`; otherwise static.
- Career RPG: bars and pips are static. Only motion is the `/speedrun/` countdown.

### Reduced-motion policy

- `prefers-reduced-motion: reduce` => `data-motion` never set, nothing pre-hidden, GSAP never runs (no blinking caret either). Global CSS clamps animation/transition durations.
- Switching to reduce mid-session removes the flag and reveals everything.
- Never convey information by motion alone.
- `/speedrun/` countdown (`speedrun-countdown.ts`): decorative, `aria-hidden`, server-rendered start value; static with no JS or reduce. Never gates content.
- Failure policy: content visible beats animation. See [system-architecture.md](system-architecture.md#root-flags-progressive-enhancement).

## Accessibility visuals

- `:focus-visible`: 2px `--color-focus` outline; framed elements offset by frame width + 2px so the ring clears the frame (tested by Tab walk).
- Skip link slides in on focus (top-left).
- Touch targets >=44px.
- Decorative glyphs/icons/dots `aria-hidden`.
- `role="list"` on reset lists keeps list semantics (`global-styles.css`).
- Game state never color-only: level, XP, locked, unverified, sample are always text.
- Forced colors: border fallback above.

## Images

- Covers: SVG in `src/assets/projects/`, 16:9, rendered 600x338 (card) / 1200x675 (detail) via `astro:assets`. Always supply `coverAlt`. Still the old cyan/magenta palette (recolor deferred, see [roadmap](project-roadmap.md)).
- OG image: 1200x630 PNG in `public/og-image.png` from `src/assets/og-image-source.svg` (also old palette).
- Favicon: `public/favicon.svg` (literal colors by exception).
