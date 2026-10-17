# Code Standards

## General

- File names: kebab-case, descriptive (`hero-text-reveal.ts`, `skip-to-content-link.astro`).
- Keep files <200 lines; split by responsibility.
- TypeScript strict (`astro/tsconfigs/strict`, see `tsconfig.json`). Run `npm run check` before pushing.
- Plain CSS only. Colors, spacing, type, radii, motion timing come from tokens in `src/styles/design-tokens.css`; no magic values.
- No UI framework, no Tailwind. Add dependencies only when needed (YAGNI).
- Content lives in data/content files, never in components.

## Component conventions

- Astro components: frontmatter -> markup -> scoped `<style>`. Global CSS only for reset, tokens, shared effects (`src/styles/`).
- Props via `interface Props` / `type Props`; extend `HTMLAttributes<'tag'>` for wrappers (see `glass-card.astro`, `neon-button.astro`).
- Section components in `src/components/sections/`, assembled in `src/pages/index.astro`.
- Each section: `<section id aria-labelledby>` + `SectionHeading` (`index`, `label`, `title`, `id`).
- Lists of chips/tags: `<ul role="list" aria-label>` (`tag-list.astro`).

## Internal links: `withBasePath()`

Every internal `href`/asset path goes through `withBasePath()` (`src/utils/with-base-path.ts`), never a raw `/path`. It prefixes Astro `base` (`/portfolio-app`).

```astro
<a href={withBasePath('/#projects')}>Projects</a>
```

Exceptions: same-page hash links (`href="#contact"`) and external URLs. `internal-links.spec.ts` guards this.

## Animation hooks: data attributes

JS and CSS find animated elements by data attributes, not classes/ids.

| Attribute | Used by | Effect |
|-----------|---------|--------|
| `data-reveal` | `scroll-reveals.ts` | Fade-up when scrolled into view |
| `data-hero` | `hero-text-reveal.ts` | Staggered intro fade-up |
| `data-hero-title` | `hero-text-reveal.ts` | SplitText char reveal (also set `data-hero`) |
| `data-spotlight` | `card-spotlight.ts`, `effects.css` | Pointer-follow glow on `.glass` |
| `data-menu-toggle`, `data-menu` | `mobile-menu.ts` | Mobile nav button / panel |

Rules:
1. New animation = new module in `src/scripts/animations/`, called from `init-animations.ts` inside the `gsap.matchMedia()` callback, so `mm.revert()` cleans it up.
2. Register GSAP plugins only in `gsap-setup.ts`; import `gsap`/`ScrollTrigger`/`SplitText` from there.
3. Animate with `opacity` + `transform`. Never `autoAlpha`/`visibility:hidden` for reveals: unrevealed content would leave the accessibility tree.
4. Do not add CSS `scroll-behavior: smooth`: it breaks hash deep links and reload scroll restoration (ScrollTrigger's first refresh cancels the animated restore).
5. Pre-hide via CSS only under `html[data-motion="ok"]`. Never hide content unconditionally.
6. Scripts that touch the DOM must re-bind on `astro:page-load` (ClientRouter replaces the DOM); clean up on `astro:before-swap`.
7. Cards/elements using `.glass[data-spotlight]` need no extra JS; `card-spotlight.ts` is global.

See [system-architecture.md](system-architecture.md) for the flag lifecycle.

## Accessibility rules

- One `<h1>` per page; sections labelled via `aria-labelledby`.
- Skip link first in body; `<main id="main" tabindex="-1">`.
- Visible `:focus-visible` outline on all interactives (min contrast vs bg).
- Decorative glyphs: `aria-hidden="true"`. Images: meaningful `alt`; `coverAlt` mandatory with `cover`.
- External links: `target="_blank"` + `rel="noopener noreferrer"` (`NeonButton external`).
- Touch targets >=44px (`neon-button` min-height 2.75rem).
- Gradient `.neon-text` is for large display text only.
- Respect `prefers-reduced-motion`: no motion, content visible.
- Progressive enhancement: no JS => nav visible, content visible.

## Content collection

Schemas in `src/content.config.ts` (zod `strictObject`: unknown keys fail the build). Keep `summary` <=160 chars. Prefix new placeholders with `TODO(content)` (the marker is `PLACEHOLDER_MARKER`; the HUD and "Sample" tags count it).

- Reusable field schemas live in `src/data/career-schemas.ts`: `httpsUrl` (https only, no credentials), `evidenceSchema`, `metricSchema`, `skillNodeSchema`, `skillIdSchema`. Reuse them; don't re-declare URL checks.
- Never add `xp`, `level`, or other computed fields to content; they are rejected. Links go in `evidence` (`repoUrl`/`demoUrl` are gone; read via `getEvidenceLink`).
- Enums (attributes, difficulties, evidence types, statuses) and every weight/cap/threshold/title come from `src/data/xp-rules.ts`. Retune there; no magic numbers in scoring code, components or docs.
- Per-entry rules go in the zod schema; cross-entry rules go in `src/utils/career-rpg/` validators (they aggregate into `CareerRuleError`).

## Career RPG modules (`src/utils/career-rpg/`)

Pure TypeScript, also executed by Node type stripping in `npm run test:unit`. Rules:

1. Relative imports use the `.ts` extension (`from './count-words.ts'`); use `import type` for types.
2. Erasable syntax only (`erasableSyntaxOnly` in `tsconfig.json`): no `enum`, `namespace`, parameter properties.
3. No `astro:*` imports and no `import.meta.env`/`import.meta.glob`. The one exception is `load-career-state.ts` (keep it thin, not unit-tested). Pass time in (`now`) and rules in (`rules` defaulting to `xpRules`); never read the clock in scoring (the only default `new Date()` is in `resolve-build-now.ts`).
4. Return new values, don't mutate inputs (only the shared `seen` URL set is mutated, by design).
5. Validators return `RuleIssue[]`; only `buildCareerState` throws.

Components in `src/components/career-rpg/` take the computed state as props; they don't score.

## Testing

- Unit: `tests/unit/*.test.ts` (`node:test` + `node:assert`), runner `npm run test:unit`, Node >=22.18 (type stripping, so `.ts` specifiers and erasable syntax). Inputs via `tests/unit/career-fixtures.ts`. Add/adjust a unit test with every rule or weight change; assert against `xpRules`, not copied numbers where practical.
- E2E specs in `tests/e2e/*.spec.ts`, shared helpers in `tests/e2e/test-helpers.ts`.
- Tests run against the production build (`astro preview`) so base-path bugs show.
- Add a spec when adding: a page, a new root flag, a new nav/link pattern.
- Do not skip or loosen failing tests to pass CI.

## Commits

Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`). Run `npm run check`, `npm run test:unit` and `npm run test:e2e` before push. Never commit secrets or `.env*`.
