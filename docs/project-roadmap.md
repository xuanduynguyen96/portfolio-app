# Project Roadmap

Last updated: 2026-10-17

## v1: shipped to repo (pending first deploy + real content)

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Scaffold and tooling | Done |
| 2 | Design system and global styles | Done |
| 3 | Content and data model | Done |
| 4 | Layout, components, pages (incl. 404) | Done |
| 5 | Animation module (GSAP, menu, failsafe) | Done |
| 6 | Testing and verification (30 e2e, Lighthouse) | Done |
| 7 | GitHub Pages deployment workflow | Code done; user must enable Pages + push |
| 8 | README + docs | Done |

Plan details: `plans/20261017-0254-astro-portfolio-implementation/` (status tracked there by project-manager).

### Before announcing the site

- [ ] Replace all `TODO(content)` placeholders (`grep -rn "TODO(content)" src`)
- [ ] Real email in `src/data/site-config.ts` (currently `hello@example.com`)
- [ ] Real project write-ups + covers; update test mirrors ([codebase-summary](codebase-summary.md))
- [ ] Settings -> Pages -> Source: GitHub Actions
- [ ] First workflow run: confirm action versions resolve
- [ ] Regenerate `public/og-image.png` if the name/tagline changes

## v2 ideas (unscheduled)

| Idea | Notes |
|------|-------|
| Real content pass | Bio, skills, experience, projects with screenshots |
| Contact form service | Static-friendly (Formspree/Web3Forms style); replaces mailto-only; needs spam + privacy review |
| Three.js hero | Lazy-loaded, reduced-motion + low-power fallback; watch Lighthouse/CLS |
| Blog | Second content collection + RSS |
| Light theme | Token override set + toggle; re-run contrast/axe |
| Sitemap | `@astrojs/sitemap` (+ robots.txt) |
| Supply chain hardening | SHA-pinned actions + Dependabot for npm and Actions |
| Cross-browser tests | Add Firefox + WebKit Playwright projects |

## Known limitations

- Only Chromium covered by e2e.
- Action major versions unverified until first run.
- Tests hardcode placeholder content and base path (see deployment guide for what to update).

## Changelog

| Date | Change |
|------|--------|
| 2026-10-17 | v1 implemented; docs written |
