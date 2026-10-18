# Project Overview & PDR

Last updated: 2026-10-18 · Version: v1.3 (0.1.0 in package.json)

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

- Quests: projects have `difficulty` (side/main/raid), obstacles, metrics, links; exactly one boss battle (2-column card; "Boss Battle" panel on its detail page, "Quest Log" on others). Since v1.3 derived from public repos (see below).
- Character sheet (`/#character`): level + title, 4 attribute bars, Profile HUD (10-check completeness), streak badge.
- Skill tree (`/#skills`): nested nodes, levels from evidence. Since v1.3 evidence = matching public repos.
- Consistency streak: ISO weeks in a row with activity. Since v1.3 = GitHub contributions, not the changelog.
- Recruiter speedrun (`/speedrun/`): availability, top 3 achievements, contact, decorative 60s countdown.
- Anti-gaming + schema strictness: evidence-only XP, build fails on invalid content.

## Scope v1.2: RPG theme (done)

Restyle only; scoring and content model unchanged. Details: [design-guidelines.md](design-guidelines.md).

- Themes: parchment (light) and dungeon (dark); follows system, header toggle forces one (remembered, no flash; no JS = system).
- MedievalSharp headings, Pixelify Sans HUD labels, Space Grotesk body; hand-authored 8x8 pixel icons; pixel-framed panels.
- `/credits/`: fonts, icons, libraries and their licenses.

## Scope v1.3: GitHub-derived character + avatar (done)

Career data now comes from the owner's public GitHub instead of hand-written entries. Pipeline: [system-architecture.md](system-architecture.md#github-derived-pipeline); rules: `src/data/{character-class-rules,character-job-rules,gear-rules,xp-rules,skills-data}.ts`.

- Weekly refresh workflow commits a normalized, public-only snapshot (`src/data/github/github-snapshot.json`); the build reads only that file. Failure keeps the old snapshot.
- Class (Warrior/Mage/Archer/Adventurer), job (class x secondary archetype, 9 jobs) and gear tiers 0-3 (armor=security, shield=testing, boots=automation, amulet=docs), with a ranked "why" panel. Owner today: Warrior · Vanguard.
- Quests = top public repos; optional case-study override per repo (`src/content/projects/<repo-slug>.md`) adds words, obstacles, metrics, boss flag.
- Skill tree via `match` rules over repos; streak from GitHub contributions; HUD gains snapshot-freshness and repo-description/topics checks.
- Layered 32x32 pixel avatar (sticker style, hand-authored): hero, character sheet, `/speedrun/`, `/credits/` gallery; text equivalents everywhere.
- Hand-written copy stays: About, Experience, Contact, hero, availability. Pages state "Based on public GitHub activity as of <date>".

## Non-goals (v1)

- Three.js / WebGL hero
- CMS or admin UI (content = files in repo)
- Contact form backend (mailto only)
- Blog, i18n, analytics, cookies

## Non-goals (v1.1)

- Backend, database, accounts (all state is build-time static)
- Leaderboard, multiplayer, or any comparison with other people
- Hand-set XP/levels/streak, or runtime XP changes (rebuild to refresh)
- Third-party verification of hand-written claims (case-study text, metrics, changelog dates are still self-attested; see roadmap limitations)

## Non-goals (v1.3)

- Private repo data (public, non-fork repos only; the contribution calendar is aggregate weekly counts and may include private activity if the profile setting is on)
- Multiple users / profiles (one `GITHUB_LOGIN`)
- Runtime or build-time GitHub fetch (snapshot only; refresh is a separate workflow)
- Hand-picked class or gear (rules are generic; never per-owner hardcodes)
- LPC or third-party sprite art

## Functional requirements

| ID | Requirement |
|----|-------------|
| F1 | All personal content from `src/data/*.ts` and `src/content/projects/*.md`; no hardcoded copy in components |
| F2 | Nav links and anchors work under base path `/portfolio-app` (via `withBasePath()`) |
| F3 | Project card -> detail page -> back link to `/#projects` |
| F4 | Mobile nav toggles; Esc closes and returns focus to toggle |
| F5 | Project `cover` requires `coverAlt` (schema-enforced) |
| F6 | Strict schemas (`src/data/career-schemas.ts`, `src/content.config.ts`, `github-snapshot-schema.ts`): unknown/hand-set keys (`xp`, `level`, `difficulty`, `skills`, `evidence`, legacy `repoUrl`/`demoUrl`) fail the build; URLs https-only, no credentials |
| F7 | Quests are public repos from the snapshot; optional case-study override per repo (file name = repo slug, must match a snapshot repo); exactly one boss (override `isBoss`, else first pinned, else top-ranked); at most one `isBoss` override |
| F8 | XP from repo facts only: difficulty by commits/code size, bonuses (description, homepage, tests, CI, case study, metrics, obstacles, boss) from `xp-rules.ts`, case-study word + distinct-word minimum, tier decay + caps, attribute cap |
| F9 | Skill tree validated at build: kebab ids, known attribute/parent, no cycles; `match` rules (no hand evidence); node evidence = distinct matching public repos |
| F10 | Consistency streak = consecutive ISO weeks with GitHub contributions (snapshot); changelog is a build log, future-dated entries (> build time + 24h) still fail the build |
| F11 | Character sheet + Profile HUD: level/title, attribute bars, completeness checklist; accessible (native `<progress>` + `aria-valuetext`) |
| F12 | `/speedrun/` shows character header (avatar + class/job), availability (`siteConfig.availability`), top 3 verified achievements, contact; placeholder-sourced metrics labelled "Sample"; countdown decorative only |
| F13 | Snapshot is the only build/test input for GitHub data; build never calls the network; identical builds for identical inputs + `CAREER_RPG_NOW` |
| F14 | Refresh workflow (weekly + manual) never fails on API/token problems: keeps the old snapshot, warns, exits 0; validates the schema before committing; dispatches the deploy |
| F15 | Class, job, gear deterministic (tie-breaks fixed) and explained (ranked "why" signals); rules generic, tested on fixture profiles |
| F16 | Avatar has text equivalents: `role="img"` named "Class · Job", gear in description, visible nameplate, gear legend, why panel; motion only with `html[data-motion=ok]`, <= ~4.5s then rests; reduced motion / no JS = static frame |

## Non-functional requirements

| Area | Target |
|------|--------|
| Performance | Lighthouse >=95 all categories; CLS 0; static-first, minimal JS |
| Accessibility | no serious/critical axe-core violations (wcag2a/2aa/21aa + best-practice tags) on home, project, 404, `/speedrun/`, `/changelog/`, `/credits/`, in both themes; visible focus, skip link, semantic landmarks; avatar meaning never color/shape-only; keeps colors under forced-colors |
| Resilience | Works with no JS, JS failure, or `prefers-reduced-motion: reduce`: content never stays hidden |
| Browsers | Evergreen Chromium tested in CI; Firefox/WebKit untested (see roadmap) |
| Theming | Light + dark share one token set; no theme flash; works with no JS (system scheme); forced-colors keeps frames visible |
| Privacy | No trackers, no third-party requests (fonts self-hosted). GitHub data: public non-fork repos only, activity as weekly counts, dates rounded to ISO-week Monday; token never shares a job with third-party npm code; zero client JS added by the character |
| Maintainability | Files <200 lines, kebab-case, TS strict, documented conventions |
| Determinism | Career state is pure: same content + `CAREER_RPG_NOW` => same output; scoring unit-tested without Astro |

## Success metrics

- Lighthouse (local preview; `/`, boss project, `/speedrun/`, `/credits/`): mobile 99-100 all categories, desktop 100/100/100/100; CLS <= 0.002.
- 231 unit + 94 Playwright tests green; `npm run check` clean; axe 0 serious/critical in both themes.
- Home HTML gzip +3.4 KB (budget 6 KB); client JS unchanged.
- Blind-ID: >=80% of 5 testers name the class at 128px in <=2s (pending, human).
- Deploy from `master` push with no manual steps after one-time Pages setup.

## Constraints and dependencies

- Node >=22.22 (Astro 7 requirement); `.nvmrc` = 22. `engines` >=22.18 (unit tests rely on Node type stripping).
- Hosted at `https://xuanduynguyen96.github.io/portfolio-app` (project site => `base: '/portfolio-app'`).
- GSAP 3.15 (SplitText + ScrollTrigger are in the public package, no club license needed).
- Playwright pinned to 1.56.1 to match the Chromium available locally.

## Open items

- Replace remaining `TODO(content)` placeholders (see README) before announcing the site: `site-config.ts`, `experience-data.ts`, and the `portfolio-app` case-study draft (owner review).
- First live run of `refresh-github-snapshot.yml` after merge (workflow_dispatch needs the default branch); seed snapshot still counts `.claude/` Python until it refreshes (`.gitattributes` fixes it).
- Human blind-ID test; OG image from the avatar deferred; branch protection on `master` unknown (bot push). See [project-roadmap.md](project-roadmap.md#open-items-v13).
- Confirm GitHub Action major versions on first workflow run (could not be verified offline).

## Version history

| Date | Change |
|------|--------|
| 2026-10-17 | v1 implemented (phases 1-8), docs written |
| 2026-10-17 | v1.1 Career RPG layer (phases 01-09): quests/boss, character sheet + HUD, skill tree, streak + changelog, `/speedrun/`, F6-F12 |
| 2026-10-17 | v1.2 RPG theme + light theme, pixel icons, `/credits/` |
| 2026-10-18 | v1.3 GitHub-derived character + layered pixel avatar: snapshot + weekly refresh, class/job/gear classifier, repo quests + case-study overrides, taxonomy skills, contribution streak, avatar UI; F6-F10 revised, F13-F16 added |
