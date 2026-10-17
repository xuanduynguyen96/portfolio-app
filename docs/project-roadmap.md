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

## v1.1: Career RPG layer (done, branch `feat/career-rpg-layer`)

Plan: `plans/20261017-0432-career-rpg-gamification-layer/` (phases 01-09, reports in `reports/`). Design: [system-architecture](system-architecture.md#career-rpg-pipeline).

| Phase | Scope | Status |
|-------|-------|--------|
| 01 | Rules (`xp-rules.ts`), pure scoring utils, unit tests | Done |
| 02 | Strict content schemas (`career-schemas.ts`, `content.config.ts`) | Done |
| 03 | Quest tiers + boss battle UI | Done |
| 04 | Character sheet + Profile HUD | Done |
| 05 | Skill tree | Done |
| 06 | Streak, `changelog` collection, weekly scheduled build | Done |
| 07 | `/speedrun/` recruiter route | Done |
| 08 | e2e, a11y, perf verification (56 e2e, 95 unit; Lighthouse mobile 98-99/100/100/100, desktop 100x4, CLS 0) | Done |
| 09 | README + docs | Done |

Before merge: user review; commit/push only after approval.

## v1.2: RPG theme redesign (done, branch `feat/rpg-theme-redesign`)

Plan: `plans/20261017-0821-rpg-theme-redesign/` (reports in `reports/`). Design: [design-guidelines](design-guidelines.md). Career RPG scoring untouched (restyle only).

| Phase | Scope | Status |
|-------|-------|--------|
| 01 | Tokens (`light-dark()`), theme head script, toggle | Done |
| 02 | Fonts: MedievalSharp, Pixelify Sans; JetBrains Mono dropped | Done |
| 03 | Hand-authored 8x8 pixel icon system + unit tests | Done |
| 04 | Pixel-frame surfaces + core components | Done |
| 05 | Career RPG components restyle | Done |
| 06 | Motion adaptation (stepped easing, caret) | Done |
| 07 | Opt-in chiptune SFX | Deferred |
| 08 | `/credits/` page (A done); external pixel packs (B) | B skipped |
| 09 | Verification, docs, changelog | Done (116 unit, 86 e2e) |

Deferred follow-ups: opt-in SFX (07), external CC0 packs (08B), `<symbol>` sprite sheet (only if HTML weight grows), recolor project covers + OG image to the RPG palette (still cyan/magenta). Open decisions: plan.md "Unresolved Questions".

Before merge: user approval received; commit per phase after review.

## v2 ideas (unscheduled)

| Idea | Notes |
|------|-------|
| Real content pass | Bio, skills, experience, projects with screenshots |
| Contact form service | Static-friendly (Formspree/Web3Forms style); replaces mailto-only; needs spam + privacy review |
| Three.js hero | Lazy-loaded, reduced-motion + low-power fallback; watch Lighthouse/CLS |
| Blog | Second content collection + RSS |
| Theme polish | 3-state toggle (reset to system), recolor covers + OG image, opt-in SFX, external pixel packs |
| Sitemap | `@astrojs/sitemap` (+ robots.txt) |
| Supply chain hardening | SHA-pinned actions + Dependabot for npm and Actions |
| Cross-browser tests | Add Firefox + WebKit Playwright projects |

## Known limitations

- Only Chromium covered by e2e.
- Action major versions unverified until first run.
- Tests hardcode placeholder content and base path (see deployment guide for what to update).
- Streak refreshes only on rebuild (weekly scheduled CI run; GitHub pauses schedules after 60 days without repo activity).
- Changelog dates are self-attested: backdating is not verified.
- Evidence URLs and metrics are self-attested; nothing is checked against the target (no fetch, no ownership proof).
- Current content is placeholder (HUD 40%); only the boss verifies because all projects share the GitHub profile URL.
- e2e does not pin `CAREER_RPG_NOW`, so streak assertions accept any valid state.

## Changelog

| Date | Change |
|------|--------|
| 2026-10-17 | v1 implemented; docs written |
| 2026-10-17 | v1.1 Career RPG layer implemented (phases 01-09); docs updated |
| 2026-10-17 | v1.2 RPG theme + light (parchment) theme implemented; SFX, external packs, sprite sheet, cover/OG recolor deferred; docs updated |
