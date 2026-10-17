# Design Guidelines

Theme: dark futuristic. Neon cyan + magenta on near-black, glass surfaces, mono "terminal" labels. Dark only (light theme is a roadmap item).

Source of truth: `src/styles/design-tokens.css`. Use tokens, not literals.

## Color

| Token | Value | Use |
|-------|-------|-----|
| `--color-bg` | `#05070d` | Page background (also `theme-color`) |
| `--color-bg-elevated` | `#0b1020` | Glass fallback without backdrop-filter |
| `--color-surface-glass` / `-hover` | white 4% / 7% | Card fill |
| `--color-border` / `--color-border-glow` | slate 16% / cyan 22% | Card border / hover border |
| `--color-accent-cyan` | `#00fff0` | Links, eyebrows, focus ring, primary accent |
| `--color-accent-magenta` | `#ff2bd6` | Gradient end, selection bg |
| `--color-text` | `#e6fbff` | Body/headings |
| `--color-text-muted` | `#9fb3c8` | Secondary text |
| `--color-text-on-accent` | `#05070d` | Text on cyan/magenta fills |

Contrast rules:
- Body text on bg must keep WCAG AA (axe runs in CI, includes color-contrast).
- Muted text only on `--color-bg` / glass over it; do not lower its lightness.
- Text on accent fills uses `--color-text-on-accent`.
- Gradient `.neon-text` (cyan -> magenta, `background-clip: text`) only for large display text; falls back to solid cyan.

## Typography

- Display/body: Space Grotesk Variable (`--font-display`). Mono: JetBrains Mono Variable (`--font-mono`). Self-hosted via Fontsource, imported in `base-layout.astro`.
- Scale (fluid `clamp`): `--text-hero`, `--text-h2`, `--text-h3`, `--text-lg`, plus fixed `--text-base`, `--text-sm`, `--text-xs`.
- Headings: tight leading (`--leading-tight`), negative tracking, `text-wrap: balance`. Body `--leading-body` 1.65.
- Eyebrow: `.eyebrow` = mono, uppercase, `--tracking-mono`, cyan. Section pattern `// 01 label`.

## Spacing and layout

- Scale `--space-1` (4px) to `--space-8` (64px); `--space-section` fluid for section padding.
- `.container`: max `--container-max` (72rem), side gutter `max(16px, --gutter)`; no horizontal page scroll at 360px (tested).
- Grids use `auto-fill` + `minmax(min(100%, 20rem), 1fr)`.
- `html { scroll-padding-top: 5rem }` offsets sticky header for anchors.

## Surfaces and effects (`effects.css`)

- Background: fixed grid (`body::before`) + scanlines and cyan/magenta glow blobs (`body::after`), at `--z-bg`, `pointer-events: none`.
- `.glass`: translucent fill, border, `--radius-card`, `--shadow-card`, `backdrop-filter: blur(12px)`; solid fallback via `@supports not`.
- `.glass[data-spotlight]`: radial cyan glow follows pointer (`--spot-x/--spot-y`, set by `card-spotlight.ts`); hover brightens border. Hover-capable devices only.
- Glows: `--shadow-glow-cyan`, `--shadow-glow-magenta`, `.glow-cyan` text-shadow. Keep subtle; one glow per element.
- Layers: `--z-bg` -1, `--z-header` 50, `--z-skip-link` 100.

## Components

| Component | Notes |
|-----------|-------|
| `NeonButton` | `primary` (filled cyan) / `ghost`; min-height 2.75rem; `external` adds `target`/`rel` |
| `GlassCard` | `.glass` + padding; `as` = div/article/li; `spotlight` default on |
| `TagList` / `TagChip` | Pill chips, mono xs, muted |
| `SectionHeading` | Eyebrow + h2, `data-reveal` |
| `ProjectCard` | Glass card, cover, tags, links; `data-spotlight data-reveal`; tier badge + `+N XP` / `Unverified`; boss card has `data-boss` |

### Career RPG components (`src/components/career-rpg/`)

Reuse existing tokens only; no new colors.

| Component | Style / a11y notes |
|-----------|--------------------|
| `QuestTierBadge` | Mono xs uppercase pill. Variants: side = muted border; main = cyan outline; raid = magenta outline; boss = filled magenta + `--color-text-on-accent`, bold ("Boss · Raid") |
| Boss card / `BossBattlePanel` | Magenta border + `--shadow-glow-magenta` (one glow). Card spans 2 grid columns at >=56rem, single column below. Heading "Boss Battle" vs "Quest Log"; unverified quests state the reason + "0 XP" in text |
| `XpProgressBar` | Native `<progress>` (gradient cyan -> magenta fill, `--bar-height`), named via `aria-labelledby`, `aria-valuetext` carries "450 / 520 XP"; visible value text is `aria-hidden` to avoid double reading. Static: no fill animation |
| `CompletenessHud` | Glass card; missing items in native `<details>` (works without JS, keyboard-operable); summary >=44px |
| `StreakBadge` | Pill link to `/changelog/`, mono; text states streak, paused, or empty (never color alone); >=44px |
| `SkillTreeNode` | Recursive nested `<ul role="list">`; branch = left cyan border line + short horizontal tick per child. Level pips are decorative (`aria-hidden`, filled cyan + glow when earned); real level is visually-hidden text ("level 2 of 3", "(locked)"). Locked = muted label. Evidence in `<details>` |
| `AchievementCard` | Big mono value + quest name; "Sample" magenta pill when the metric comes from a placeholder project |

Availability dot (`.status-dot`, in `effects.css`): cyan = open, magenta = limited, muted = closed via `data-status`. Decorative; always next to visible text.

## Motion principles

- Purposeful, short, ease-out: `expo.out`, 0.8-0.9s reveals, 0.08-0.1s stagger. CSS durations: `--duration-fast/base/slow` (150/250/400ms), `--ease-out-expo`.
- Animate `opacity` + `transform` only (GPU-friendly, no layout shift; CLS 0).
- Hero: title chars rise from line masks, then eyebrow/role/tagline/CTAs fade up.
- Sections/cards: fade-up once on enter (`top 90%`), batched.
- Page transitions: Astro `ClientRouter`; shared `transition:name` on project title/cover.
- Career RPG: progress bars and pips are static (no fill/level-up animation). Only motion is the `/speedrun/` countdown.

### Reduced-motion policy

- `prefers-reduced-motion: reduce` => `data-motion` never set, nothing pre-hidden, GSAP never runs. Global CSS also clamps animation/transition durations.
- Switching to reduce mid-session removes the flag and reveals everything.
- Never convey information by motion alone.
- `/speedrun/` countdown (`speedrun-countdown.ts`): decorative, `aria-hidden`, server-rendered with its start value; runs only without reduced motion, static with no JS or reduce. Never gates content; `data-state` = `running` | `done` ("GG").
- Failure policy: content visible beats animation. See [system-architecture.md](system-architecture.md#root-flags-progressive-enhancement).

## Accessibility visuals

- `:focus-visible`: 2px cyan outline, 3px offset, on every interactive element (tested by Tab walk).
- Skip link slides in on focus (top-left, cyan).
- Touch targets >=44px.
- Decorative glyphs/dots `aria-hidden`.
- Lists with `role="list"` (`ul`/`ol`) get the bullet/padding reset in `global-styles.css`; the role keeps list semantics despite `list-style: none`.
- Game state is never color-only: level, XP, locked, unverified, sample are always text.

## Images

- Covers: SVG in `src/assets/projects/`, 16:9, rendered 600x338 (card) / 1200x675 (detail) via `astro:assets`. Always supply `coverAlt`.
- OG image: 1200x630 PNG in `public/og-image.png` from `src/assets/og-image-source.svg`.
- Favicon: `public/favicon.svg`.
