# Plan: Astro Portfolio (futuristic, animated) on GitHub Pages

Created: 2026-10-17 · Status: **Implemented, awaiting user review** · Source research: [261017-portfolio-app-stack.md](../reports/261017-portfolio-app-stack.md)

## Goal
Static portfolio: Astro + GSAP (ScrollTrigger, SplitText) + CSS custom properties. Dark neon/glass look. Deployed to GitHub Pages via Actions.

## Key Decisions
- Astro static output, no UI-framework islands, no Three.js (YAGNI)
- Assumed URL: `https://xuanduynguyen96.github.io/portfolio-app`, `base: '/portfolio-app'` (**assumption**)
- Dark-only theme v1 (no light toggle)
- Projects = content collection (Markdown → detail pages); skills/experience = typed TS data
- Contact = `mailto:` + social links (no form service v1)
- Fonts self-hosted via Fontsource (no Google Fonts request)
- File names kebab-case (repo rule), even for `.astro` components; files <200 lines
- Node 22 (local env has v22.22.0)
- **No commits/pushes during implementation unless user requests**

## Phases

| # | Phase | Priority | Status | Progress |
|---|---|---|---|---|
| 01 | [Scaffold & tooling](phase-01-scaffold-and-tooling.md) | P0 | Done | 100% |
| 02 | [Design system & global styles](phase-02-design-system-and-global-styles.md) | P0 | Done | 100% |
| 03 | [Content & data model](phase-03-content-and-data-model.md) | P0 | Done | 100% |
| 04 | [Layout, components & pages](phase-04-layout-components-and-pages.md) | P0 | Done | 100% |
| 05 | [Animation module](phase-05-animation-module.md) | P0 | Done | 100% |
| 06 | [Testing & verification](phase-06-testing-and-verification.md) | P0 | Done | 100% |
| 07 | [GitHub Pages deployment](phase-07-github-pages-deployment.md) | P0 | Done (code); pending user: enable Pages + push | ~80% |
| 08 | [README & docs](phase-08-readme-and-docs.md) | P1 | Done | 100% |

## Dependencies
```
01 → 02 → 03 → 04 → 05 → 06 → 07
                     └──────────→ 08 (after 06)
```
- 07 needs repo admin: Settings → Pages → Source = GitHub Actions (user action)
- 07 workflow only runs once pushed — push needs user approval

## Effort (rough)
01: S · 02: M · 03: S · 04: L · 05: M · 06: M · 07: S · 08: M

## Definition of Done
- `npm run check`, `npm run build`, `npm run test:e2e` all pass locally
- Site renders at 360px+ without horizontal scroll; axe: 0 serious/critical
- Reduced-motion users see all content, no motion
- Workflow file ready; deploy verified after user pushes + enables Pages
- README + 7 docs files created

## Corrections vs research report
- Research workflow snippet omitted `actions/checkout` and the separate `deploy` job (`withastro/action` only builds + uploads). Phase 07 uses the correct two-job shape.

## Implementation Notes / Deviations (2026-10-17)
- Astro 7.4 (not 5): `z` from `astro/zod`. `astro preview` auto-backgrounds under AI agents → Playwright webServer uses `--ignore-lock`.
- create-astro template fetch blocked → scaffolded manually.
- Playwright pinned 1.56.1 (matches preinstalled Chromium); npm override pins playwright-core for @axe-core/playwright types.
- Reveals use opacity, not autoAlpha (a11y tree). CSS smooth scroll removed (broke deep links/reload with ScrollTrigger). Found by tests/code review.
- Failsafe moved to head inline script (also covers bundle load failure). Mobile menu flag set before paint (mobile CLS 0.021→0).
- Extra util `src/utils/format-date-range.ts`. Mobile menu script extracted to `src/scripts/mobile-menu.ts` (<200 lines rule). Project files named `neon-dashboard.md` etc. (cleaner URLs).
- Workflow deploy restricted to `refs/heads/main`.
- Results: check + tsc 0 errors. e2e 30/30 (2 runs; 48/48 repeat of timing-sensitive specs), ~26s. Lighthouse mobile 99/100/100/100, CLS 0; desktop 100×4. npm audit 0 vulns.
- Code review: 0 critical, 1 high + 4 medium fixed; lows partly fixed (idempotent init, slow-bundle skip, 404 noindex, main focus outline, coverAlt refine, logo initials). Deferred: SHA-pinned actions, Firefox/WebKit, aria-current, axe mobile-menu state.
- Reports: `reports/code-review-report.md`, `reports/261017-tester-report.md`.

## Unresolved Questions
1. Real content (name, bio, projects, experience, email, socials) or keep placeholders?
2. Project site (`/portfolio-app`) or user site (`xuanduynguyen96.github.io`, no base)?
3. Contact: `mailto:` OK, or form service?
4. Custom domain? (affects `site`, `base`, CNAME)
5. Action versions: confirm on first CI run.
6. Pages source = GitHub Actions (user action; required before deploy).
