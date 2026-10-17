# Project Overview & PDR

Last updated: 2026-10-17 · Version: v1.0 (0.1.0 in package.json)

## Vision

Personal developer portfolio that looks futuristic (dark neon, glass, motion) yet stays fast, accessible and cheap to host. Static site on GitHub Pages; no backend.

## Audience

- Recruiters / hiring managers: scan role, skills, projects in under a minute.
- Engineers / clients: open a project case study, follow repo/demo links, get in touch.

## Scope v1 (done)

- Single-page home: Hero, About, Skills, Projects, Experience, Contact.
- Project detail pages from Markdown content collection (`/projects/<slug>/`).
- Custom 404 ("Signal lost", noindex).
- GSAP motion: hero text reveal, scroll reveals, card spotlight; page transitions via Astro `ClientRouter`.
- SEO: title/description, canonical, Open Graph + Twitter card, OG image.
- CI: type check + e2e on every PR/push; auto-deploy on `main`.

## Non-goals (v1)

- Three.js / WebGL hero
- CMS or admin UI (content = files in repo)
- Light theme / theme switcher
- Contact form backend (mailto only)
- Blog, i18n, analytics, cookies

## Functional requirements

| ID | Requirement |
|----|-------------|
| F1 | All personal content from `src/data/*.ts` and `src/content/projects/*.md`; no hardcoded copy in components |
| F2 | Nav links and anchors work under base path `/portfolio-app` (via `withBasePath()`) |
| F3 | Project card -> detail page -> back link to `/#projects` |
| F4 | Mobile nav toggles; Esc closes and returns focus to toggle |
| F5 | Project `cover` requires `coverAlt` (schema-enforced) |

## Non-functional requirements

| Area | Target |
|------|--------|
| Performance | Lighthouse >=95 all categories; CLS 0; static-first, minimal JS |
| Accessibility | no serious/critical axe-core violations (wcag2a/2aa/21aa + best-practice tags) on home, project, 404; visible focus, skip link, semantic landmarks |
| Resilience | Works with no JS, JS failure, or `prefers-reduced-motion: reduce`: content never stays hidden |
| Browsers | Evergreen Chromium tested in CI; Firefox/WebKit untested (see roadmap) |
| Privacy | No trackers, no third-party requests (fonts self-hosted) |
| Maintainability | Files <200 lines, kebab-case, TS strict, documented conventions |

## Success metrics

- Lighthouse (local preview): mobile 99/100/100/100, desktop 100/100/100/100.
- 30 Playwright tests green (~26s locally).
- Deploy from `main` push with no manual steps after one-time Pages setup.

## Constraints and dependencies

- Node >=22.22 (Astro 7 requirement); `.nvmrc` = 22.
- Hosted at `https://xuanduynguyen96.github.io/portfolio-app` (project site => `base: '/portfolio-app'`).
- GSAP 3.15 (SplitText + ScrollTrigger are in the public package, no club license needed).
- Playwright pinned to 1.56.1 to match the Chromium available locally.

## Open items

- Replace all `TODO(content)` placeholders (see README) before announcing the site.
- Confirm GitHub Action major versions on first workflow run (could not be verified offline).

## Version history

| Date | Change |
|------|--------|
| 2026-10-17 | v1 implemented (phases 1-8), docs written |
