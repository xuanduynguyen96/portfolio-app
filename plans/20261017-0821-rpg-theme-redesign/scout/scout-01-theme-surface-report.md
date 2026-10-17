# Scout 01 — Theme surface map (what a reskin touches)

Date: 2026-10-17. Docs (`docs/*.md`) dated today → used instead of full scout. Branch: `research/rpg-theme-assets` (HEAD `701e689`).

## Token layer (single source of truth)
- `src/styles/design-tokens.css` (64 lines): `:root` only, `color-scheme: dark`, no light theme. Accent names are hue-literal: `--color-accent-cyan`, `--color-accent-magenta`, `--shadow-glow-cyan/-magenta`, `--color-border-glow` (cyan).
- `src/styles/effects.css` (121): `body::before` grid, `body::after` scanlines + glow blobs, `.glass` (+ backdrop-filter, spotlight `::before`), `.neon-text` gradient, `.glow-cyan`, `.eyebrow`, `.status-dot`.
- `src/styles/global-styles.css` (154): reset, focus ring (cyan), utilities, pre-hide rule under `html[data-motion="ok"]`.
- 24 files reference cyan/magenta/glow/glass tokens or classes (all sections, all career-rpg comps, 4 pages, header, button, card). Hue-literal names → rename to semantic (`--color-accent-primary/-secondary`, `--shadow-glow-primary`) = mechanical find/replace, else names lie after reskin.

## Fonts
- `base-layout.astro` imports `@fontsource-variable/space-grotesk` + `jetbrains-mono`. Tokens `--font-display`, `--font-mono`. `theme-color` meta hardcoded `#05070d` (line 40). Inline root-flag script at line 62 (good spot for no-flash theme script).

## Components (lines) → reskin target
| File | Now | RPG target |
|---|---|---|
| `glass-card.astro` (22) | `.glass` | panel frame (keep API, swap class or restyle `.glass`) |
| `neon-button.astro` (68) | primary cyan fill / ghost | stepped-corner "game button" |
| `section-heading.astro` (26) | `// 01 label` eyebrow + h2 | "Chapter I · label" eyebrow, display font |
| `project-card.astro` (130) | glass + cover + tier badge + XP | quest scroll/panel; badge icon |
| `career-rpg/quest-tier-badge.astro` (45) | text pill side/main/raid/boss | pixel icon + text (text stays, icon aria-hidden) |
| `career-rpg/skill-tree-node.astro` (163) | pips = circles, cyan connectors | pixel pips (star/gem), root icon per branch, dotted/pixel connectors |
| `career-rpg/xp-progress-bar.astro` (72) | `<progress>` gradient | segmented pixel bar (static) |
| `career-rpg/completeness-hud.astro` (72), `streak-badge.astro` (56), `achievement-card.astro` (52), `boss-battle-panel.astro` (166) | glass/pill/magenta glow | HUD glyph icons, boss = crimson frame |
| `site-header.astro` (195), `site-footer.astro` (36) | logo initials, nav | + theme toggle, SFX toggle; footer + Credits link |
| `pages/404.astro` ("Signal lost") | sci-fi copy | RPG copy ("You wandered off the map") — no e2e asserts this text |

## Skill data → icon budget
`src/data/skills-data.ts`: 5 roots (languages, frontend, backend, tooling, collaboration), ~25 leaves, 4 attributes (code-efficiency, ui-polish, reliability, communication). Leaves are brand techs (TS, React, Redis…) → 8x8 brand icons unrealistic. Icon budget: 5 root + 4 attribute + 3 difficulty + boss + HUD (xp, level, streak, locked, evidence, quest, achievement, sound on/off, theme sun/moon) ≈ 22 icons. Fits one 32-icon pack or hand-authored set.

## Test coupling
- E2E asserts content/structure/a11y (text, roles, `aria-valuetext`, data attrs, layout widths), not classes/colors → reskin low-risk. Risks: axe color-contrast (both themes), `responsive-layout` 360px h-scroll, focus-visible Tab walk, `reduced-motion` specs.
- New behaviour needing specs: theme toggle (persist, no flash, soft-nav), SFX toggle (default off, no audio request before opt-in), `/credits/` page (internal-links spec covers base path automatically if linked).
- Mirrors in `tests/e2e/test-helpers.ts` (`CAREER_PAGES`) need `/credits/` if added as a page.

## Docs to update after
`docs/design-guidelines.md` (rewrite theme section), `docs/codebase-summary.md`, `docs/system-architecture.md` (theme flag), README "Edit content" (icons/credits), `src/content/changelog/` new entry (feeds streak).

## Unresolved
- Keep Space Grotesk as body font or swap to a warmer sans? (default: keep; fewer deps)
