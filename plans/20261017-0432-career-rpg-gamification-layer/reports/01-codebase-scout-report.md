# Codebase Scout Report: Career RPG layer

Date: 2026-10-17 · Scope: integration points for gamified layer · Method: direct read of tree (node_modules NOT installed in this checkout; run `npm ci` first)

## Repo state
- `git status`: `HEAD detached at refs/heads/master`, clean. Impl must start with `git switch -c feat/career-rpg-layer`.
- `src/` ~1.85k lines incl. CSS/SVG. Largest: `site-header.astro` 194 lines (near 200 cap: adding nav item OK, nothing more), `global-styles.css` 153, `[slug].astro` 125.

## Content / data (integration targets)
| File | Today | Impact |
|---|---|---|
| `src/content.config.ts` | `projects` only, `z.object` (non-strict), `repoUrl`/`demoUrl` `z.url()` (any scheme), `.refine` coverAlt | strict object, quest fields, evidence; add `changelog` collection |
| `src/content/projects/{neon-dashboard,realtime-chat,cli-toolkit}.md` | ~60-word bodies, all `repoUrl: https://github.com/xuanduynguyen96` (profile root, same URL x3), `# TODO(content)` YAML comment | migrate to `evidence[]`; global URL dedupe means only 1 earns XP |
| `src/data/skills-data.ts` | `SkillGroup[] {label, items: string[]}`, 4 groups / 21 items | reshape to flat `SkillNode[]` with `id/parent/attribute/evidence` |
| `src/data/site-config.ts` | no availability; email `hello@example.com` | add `availability` |
| `src/components/sections/hero-section.astro` | hardcoded "Available for new projects" eyebrow | read `siteConfig.availability` (DRY) |

## Rendering
- `projects-section.astro` -> `sortProjects()` -> `project-card.astro` (uses `repoUrl`/`demoUrl` directly). `[slug].astro` same fields + `render()`.
- `skills-section.astro`: grid of `GlassCard as="li"` + `TagList`. Section id `skills` / `#skills-title` used by tests + nav.
- `index.astro`: Hero > About(1) > Skills(2) > Projects(3) > Experience(4) > Contact(5) (`SectionHeading index`).
- `site-header.astro`: `navItems` array (5 hash links). `site-footer.astro` 33 lines.
- Reusable: `glass-card.astro` (`as` div/article/li), `tag-chip.astro` (renders `<li>` only -> not reusable as standalone badge), `tag-list.astro`, `section-heading.astro`, `neon-button.astro` (`external`).
- No `<progress>`/`<meter>`/`<details>` styling exists yet.

## Utils
- `with-base-path.ts` uses `import.meta.env.BASE_URL` -> NOT importable from Node tests.
- `sort-projects.ts`, `format-date-range.ts` pure. No utils import each other.

## Motion / PE
- Head inline script sets `data-motion="ok"` (no reduce) + 3s failsafe; CSS pre-hides `[data-reveal],[data-hero]` only under flag.
- `init-animations.ts` lifecycle `astro:page-load` / `astro:before-swap`; new client scripts must follow same pattern.

## Tests
- `tests/e2e/*` 8 specs, 24 `test(` calls (30 incl. loops). Hardcoded mirrors: `SITE_NAME`, `SECTION_IDS`, `PROJECT_SLUGS` (`test-helpers.ts`), `PROJECTS` array (`project-detail-and-focus.spec.ts`), `PROJECT_TITLE` (`page-navigation-lifecycle.spec.ts`), axe `PAGES`, `.project-card` count 3 (`home-page-smoke.spec.ts`).
- `reduced-motion.spec.ts` `expectStaticContentVisible` asserts all `[data-reveal],[data-hero]` opacity 1 + transform none -> new sections inherit coverage.
- No unit runner, no `tests/unit/`.

## Tooling
- `package.json`: scripts dev/build/preview/check/test:e2e. TS ^6.0.3, @types/node 22.20.5, engines node >=22. Lockfile: astro 7.4.0, zod 4.6.7.
- `tsconfig.json` extends `astro/tsconfigs/strict`; flags (allowImportingTsExtensions, verbatimModuleSyntax) unverifiable offline -> verify after `npm ci`.
- `playwright.config.ts`: webServer `npm run build && npm run preview -- --port 4321 --ignore-lock`, `reuseExistingServer: !CI`. Supports `env` option (use for fixed build date).
- `.github/workflows/deploy-to-github-pages.yml`: triggers push master / PR / dispatch; verify (ci, check, playwright install, e2e) -> build (withastro/action@v5) -> deploy. No `schedule`.

## Node test runner probe (scratchpad, Node v22.22.0)
- `process.features.typescript === 'strip'` -> type stripping on by default.
- `node --test "*.test.ts"` with `import { f } from './f.ts'` -> PASS.
- Extensionless relative import `./rules` -> `ERR_MODULE_NOT_FOUND`. => pure modules must use explicit `.ts` specifiers + `import type` for types; no enums/namespaces/param properties.

## Unresolved
- Astro strict tsconfig flags (need `allowImportingTsExtensions`) - verify post-install.
- zod 4.6 `z.url({ protocol })` option name - verify post-install.
