# Project Overview & PDR

Last updated: 2026-10-17 · Version: v1.2 (0.1.0 in package.json)

## Vision

Personal developer portfolio with an RPG look (pixel icons and frames, dungeon dark + parchment light themes, motion) that stays fast, accessible and cheap to host. Static site on GitHub Pages; no backend.

## Audience

- Recruiters / hiring managers: scan role, skills, projects in under a minute (`/speedrun/` = 60s view).
- Engineers / clients: open a project case study, follow repo/demo links, get in touch.

## Scope v1 (done)

- Single-page home: Hero, About, Skills, Projects, Experience, Contact.
- Project detail pages from Markdown content collection (`/projects/<slug>/`).
- Custom 404 ("Off the map", noindex).
- GSAP motion: hero text reveal, scroll reveals, card spotlight; page transitions via Astro `ClientRouter`.
- SEO: title/description, canonical, Open Graph + Twitter card, OG image.
- CI: type check + e2e on every PR/push; auto-deploy on `master`.

## Scope v1.1: Career RPG (done)

Gamified layer on v1; every number is computed at build time from evidence, nothing hand-set. Rules: [system-architecture.md](system-architecture.md#career-rpg-pipeline); tunables: `src/data/xp-rules.ts`.

- Quests: projects get `difficulty` (side/main/raid), obstacles, metrics, evidence; exactly one boss battle (2-column card; "Boss Battle" panel on its detail page, "Quest Log" on others).
- Character sheet (`/#character`): level + title, 4 attribute bars, Profile HUD (10-check completeness), streak badge.
- Skill tree (`/#skills`): nested nodes, levels from evidence URLs + verified quests.
- Consistency streak: ISO weeks with a changelog entry (`/changelog/`); weekly scheduled rebuild.
- Recruiter speedrun (`/speedrun/`): availability, top 3 achievements, contact, decorative 60s countdown.
- Anti-gaming + schema strictness: evidence-only XP, build fails on invalid content.

## Scope v1.2: RPG theme (done)

Restyle only; scoring and content model unchanged. Details: [design-guidelines.md](design-guidelines.md).

- Themes: parchment (light) and dungeon (dark); follows system, header toggle forces one (remembered, no flash; no JS = system).
- MedievalSharp headings, Pixelify Sans HUD labels, Space Grotesk body; hand-authored 8x8 pixel icons; pixel-framed panels.
- `/credits/`: fonts, icons, libraries and their licenses.

## Non-goals (v1)

- Three.js / WebGL hero
- CMS or admin UI (content = files in repo)
- Contact form backend (mailto only)
- Blog, i18n, analytics, cookies

## Non-goals (v1.1)

- Backend, database, accounts (all state is build-time static)
- Leaderboard, multiplayer, or any comparison with other people
- Hand-set XP/levels/streak, or runtime XP changes (rebuild to refresh)
- Third-party verification of evidence (self-attested; see roadmap limitations)

## Functional requirements

| ID | Requirement |
|----|-------------|
| F1 | All personal content from `src/data/*.ts` and `src/content/projects/*.md`; no hardcoded copy in components |
| F2 | Nav links and anchors work under base path `/portfolio-app` (via `withBasePath()`) |
| F3 | Project card -> detail page -> back link to `/#projects` |
| F4 | Mobile nav toggles; Esc closes and returns focus to toggle |
| F5 | Project `cover` requires `coverAlt` (schema-enforced) |
| F6 | Strict schemas (`src/data/career-schemas.ts`, `src/content.config.ts`): unknown/hand-set keys (`xp`, `level`, legacy `repoUrl`/`demoUrl`) fail the build; evidence URLs https-only, no credentials |
| F7 | Exactly one boss project (>=1 metric + >=1 obstacle); quest skills must exist and be unique per quest |
| F8 | XP from evidence only: URL earns XP once site-wide (boss claims first), case-study word + distinct-word minimum, tier decay + caps, attribute cap |
| F9 | Skill tree validated at build: kebab ids, known attribute/parent, no cycles, an evidence URL belongs to one skill |
| F10 | Consistency streak from `changelog` collection (ISO weeks, body >= 40 words); future-dated entries (> build time + 24h) fail the build |
| F11 | Character sheet + Profile HUD: level/title, attribute bars, completeness checklist; accessible (native `<progress>` + `aria-valuetext`) |
| F12 | `/speedrun/` shows availability (`siteConfig.availability`), top 3 verified achievements, contact; placeholder-sourced metrics labelled "Sample"; countdown decorative only |

## Non-functional requirements

| Area | Target |
|------|--------|
| Performance | Lighthouse >=95 all categories; CLS 0; static-first, minimal JS |
| Accessibility | no serious/critical axe-core violations (wcag2a/2aa/21aa + best-practice tags) on home, project, 404, `/speedrun/`, `/changelog/`, `/credits/`, in both themes; visible focus, skip link, semantic landmarks |
| Resilience | Works with no JS, JS failure, or `prefers-reduced-motion: reduce`: content never stays hidden |
| Browsers | Evergreen Chromium tested in CI; Firefox/WebKit untested (see roadmap) |
| Theming | Light + dark share one token set; no theme flash; works with no JS (system scheme); forced-colors keeps frames visible |
| Privacy | No trackers, no third-party requests (fonts self-hosted) |
| Maintainability | Files <200 lines, kebab-case, TS strict, documented conventions |
| Determinism | Career state is pure: same content + `CAREER_RPG_NOW` => same output; scoring unit-tested without Astro |

## Success metrics

- Lighthouse (local preview; `/`, project, `/speedrun/`, `/changelog/`): mobile 98-99/100/100/100, desktop 100/100/100/100; CLS 0 (desktop 0.0001, pre-existing nav font swap).
- 116 unit + 86 Playwright tests green; axe 0 serious/critical in both themes.
- Deploy from `master` push with no manual steps after one-time Pages setup.

## Constraints and dependencies

- Node >=22.22 (Astro 7 requirement); `.nvmrc` = 22. `engines` >=22.18 (unit tests rely on Node type stripping).
- Hosted at `https://xuanduynguyen96.github.io/portfolio-app` (project site => `base: '/portfolio-app'`).
- GSAP 3.15 (SplitText + ScrollTrigger are in the public package, no club license needed).
- Playwright pinned to 1.56.1 to match the Chromium available locally.

## Open items

- Replace all `TODO(content)` placeholders (see README) before announcing the site. Current HUD completeness is 40% for that reason; real metrics/evidence needed (only the boss verifies today: all projects share the GitHub profile URL).
- Confirm GitHub Action major versions on first workflow run (could not be verified offline).

## Version history

| Date | Change |
|------|--------|
| 2026-10-17 | v1 implemented (phases 1-8), docs written |
| 2026-10-17 | v1.1 Career RPG layer (phases 01-09): quests/boss, character sheet + HUD, skill tree, streak + changelog, `/speedrun/`, F6-F12 |
| 2026-10-17 | v1.2 RPG theme + light theme, pixel icons, `/credits/` |
