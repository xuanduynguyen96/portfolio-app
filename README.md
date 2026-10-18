# portfolio-app

RPG-themed animated developer portfolio (parchment/dungeon themes, 8x8 pixel icons). Static Astro site + GSAP motion, deployed to GitHub Pages.

- Live (after first deploy): https://xuanduynguyen96.github.io/portfolio-app/
- Lighthouse (local preview, `/`, boss project, `/speedrun/`, `/credits/`): mobile 99-100 all categories (CLS <= 0.002), desktop 100/100/100/100

## Stack

Astro 7.4 (static output) · GSAP 3.15 (ScrollTrigger, SplitText) · plain CSS tokens · Fontsource self-hosted fonts (MedievalSharp headings, Pixelify Sans HUD labels, Space Grotesk body; code uses system mono) · TypeScript strict · Playwright + axe-core e2e · `node:test` unit tests.
No UI framework, no Tailwind.

Career RPG layer (v1.3): the character is **derived from the owner's public GitHub** (committed weekly snapshot, build-time only, no runtime fetch): class, job, gear, quests, skills, XP, streak, plus a layered 32x32 pixel avatar. Since v1.4 a visitor can switch the displayed class/job (default = the GitHub pick). See [Career RPG](#career-rpg).

## Quick start

Requires Node >=22.22 (Astro 7). `.nvmrc` pins 22. Unit tests run `.ts` via Node type stripping (>=22.18; `engines` says so).

```bash
nvm use            # optional
npm ci
npm run dev        # http://localhost:4321/portfolio-app/
```

## Scripts

| Command | Does |
|---------|------|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Static build to `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run check` | `astro check` (types + templates) |
| `npm run test:unit` | `node --test` on `tests/unit/**/*.test.ts` (engine, classifier, snapshot, avatar, pixel icon, class-look pure modules; 261 tests, no build) |
| `npm run test:e2e` | Playwright: builds, runs `astro preview`, 120 tests |
| `npm run snapshot:fetch` | Refresh `src/data/github/github-snapshot.json` from GitHub GraphQL (needs `GITHUB_TOKEN` or `GH_SNAPSHOT_PAT`; no token = keeps file). Run `npm run test:unit` before committing |
| `npm run character:explain` | Print class, job, gear and per-repo votes for the committed snapshot (or a path arg) |
| `node scripts/render-avatar-sheet.ts [out.html] [--png out.png]` | Review sheet of every class x motif x gear tier set, both frames and themes |

First e2e run on a fresh machine: `npx playwright install chromium`.

## Edit content

Derived vs hand-written:
- **Derived from GitHub (do not edit by hand):** class, job, gear, quests, skill levels, XP, level, streak, HUD GitHub checks. Fix them at the source: GitHub repo description/topics/homepage, or the rules files below.
- **Visitor choice (not content):** which class/job look is displayed. Saved per browser, never in the repo; the GitHub-derived pick stays the default.
- **Hand-written:** name, bio, About, Experience, Contact, availability, optional case studies. Remaining `TODO(content)` markers: `grep -rn "TODO(content)" src`.

| What | File |
|------|------|
| Name, role, tagline, bio, location, email, socials, SEO title/description | `src/data/site-config.ts` |
| GitHub account the character comes from | `src/data/github/github-login.ts` |
| GitHub snapshot (normalized, public repos only; written by the refresh workflow, never hand-edited) | `src/data/github/github-snapshot.json` (schema: `github-snapshot-schema.ts`) |
| Case study for one repo (optional, see below) | `src/content/projects/<repo-slug>.md` |
| Class rules (language/keyword votes, recency, secondary-job thresholds, Adventurer fallback) | `src/data/character-class-rules.ts` |
| Class + job names (9 jobs) | `src/data/character-job-rules.ts` |
| Gear rules (armor=security, shield=testing, boots=automation, amulet=docs; tier thresholds) | `src/data/gear-rules.ts` |
| Skill tree: flat `skillNodes` `{id, label, attribute, parent?, match?}`; `match` rules pick the public repos that prove a skill, levels derive from them, never set by hand | `src/data/skills-data.ts` |
| XP weights, caps, level curve, titles, quest difficulty/bonuses, streak/HUD/speedrun thresholds (retune the game here only) | `src/data/xp-rules.ts` |
| Availability (`status` open/limited/closed + `note`; hero eyebrow, `/speedrun/`) | `src/data/site-config.ts` (`availability`) |
| Experience timeline | `src/data/experience-data.ts` |
| Changelog entries (dated build log on `/changelog/`; no longer feeds the streak) | `src/content/changelog/*.md` |
| Avatar art (class poses, job props, gear tiers, palette) | `src/data/avatar/*`, colors `--avatar-*` in `src/styles/design-tokens.css`; see [code standards](docs/code-standards.md#avatar-sprites) |
| Class/job switcher (the 10 selectable looks are derived from the class + job rules, so a new class/job appears automatically; labels, saved key, lazy chunk) | `src/utils/avatar/{class-looks,class-labels,look-avatar-model}.ts`, `src/scripts/{class-job-switcher,look-apply-model,switcher-body}.ts`, `src/components/avatar/class-job-switcher.astro`; see [code standards](docs/code-standards.md#classjob-switcher) |
| Pixel icons: 8x8 grids (add one + a unit test; see [code standards](docs/code-standards.md#pixel-icons)) | `src/data/pixel-icons-{career,hud,gear}.ts`, mapping in `src/data/pixel-icon-map.ts` |
| Credits page (fonts, libraries, licenses; icon + avatar galleries are automatic) | `src/data/credits-data.ts` |
| Theme colors, fonts, frames | `src/styles/design-tokens.css`, [docs/design-guidelines.md](docs/design-guidelines.md) |
| Favicon / social preview image | `public/favicon.svg`, `public/og-image.png` |

Notes:
- Logo initials derive from `siteConfig.name`.
- `email` is `hello@example.com` placeholder; the Contact section uses it for `mailto:`.
- Regenerate the OG image after editing `src/assets/og-image-source.svg` (still old palette; not generated from the avatar yet):

```bash
node -e "require('sharp')('src/assets/og-image-source.svg').png().toFile('public/og-image.png')"
```

(`sharp` ships with Astro.)

### Add a case study (optional override)

Quests are the top public repos from the snapshot (`quest.max` in `xp-rules.ts`, plus any repo with an override). A repo without a file still gets a page, difficulty and XP from repo facts. A file adds your words and earns the case-study bonus.

1. Create `src/content/projects/<repo-slug>.md`. The file name must be the repo slug: lowercase, words split on case/`_`/`.`, joined by `-` (`QrCodeScanner` -> `qr-code-scanner`). A name that matches no snapshot repo fails the build.
2. Frontmatter (strict; unknown keys fail the build): optional `title`, `summary` (max 160), `tags` (<=6), `cover` + `coverAlt` (alt required with a cover), `featured`, `order`, `isBoss` (at most one repo; default boss = first pinned, else top-ranked), `obstacles` (<=6), `metrics` (<=6 of `{label, value, unit?}`).
3. **Forbidden keys:** `difficulty`, `skills`, `evidence`, `xp`, `level`, `repoUrl`, `demoUrl`. Difficulty, skills and links come from the repo; XP from rules.
4. Body: >=150 prose words (>=80 distinct) or no case-study bonus (quest stays "derived"). Boss counts as a case study for the HUD when the body passes.
5. Prefix drafts with a `TODO(content)` comment: the quest shows a "Sample" tag until removed.

The e2e expectations mirror the engine from the snapshot and override files (`tests/e2e/career-mirror.ts`), so adding a case study needs no test edits.

## Career RPG

XP, level, title, attribute bars, skill-node levels, HUD % and streak are **computed, never set**: a hand-written `xp`, `level`, `difficulty` or `repoUrl` key fails the build. Pipeline, scoring, anti-gaming: [docs/system-architecture.md](docs/system-architecture.md#github-derived-pipeline).

- **Data:** the weekly workflow `refresh-github-snapshot.yml` reads the owner's public GitHub (GraphQL), keeps public non-fork repos only, commits a normalized snapshot, then dispatches the deploy. The build never calls GitHub. Page copy says "Based on public GitHub activity as of <date>".
- **Class:** each public repo votes once (languages, keywords, recency, activity). Warrior = backend, Mage = data, Archer = frontend; Adventurer when there is too little signal. **Job** = class x secondary archetype (9 jobs). **Gear** tiers 0-3 from repo hygiene: armor = security, shield = testing, boots = automation, amulet = docs. A "Why" panel lists the ranked repo signals. Debug with `npm run character:explain`.
- **Tuning rule:** change the rules files generically (a reason that holds for any developer), keep the fixture profiles in `tests/unit/classify-character.test.ts` on their expected classes. Never hardcode the owner.
- **Avatar:** hand-authored 32x32 sprites composed at build time into one inline SVG; the server render needs zero JS. Name = "Class · Job", gear in the description; a short two-frame action loop runs only when motion is allowed, then rests.
- **Class/job switcher (v1.4):** the character sheet portrait panel has "Choose class & job": pick any of 10 looks (Warrior/Mage/Archer x Backend/Data/Frontend, or Adventurer, which has no job). Changes the hero and sheet avatar and name. Default and "Reset to GitHub pick" = the look derived from GitHub ("GitHub pick"). Gear tiers still come from GitHub stats only and are drawn on every look. Attributes, the `Why <Class>?` panel, `/speedrun/` and `/credits/` keep showing the GitHub-derived class (follow-ups). The choice is saved in this browser only (`localStorage` key `portfolio-look`). Switching re-composes the avatar in the browser from the same pure modules in a small lazy chunk fetched on first open (or on load when a choice is saved); without JS the control is hidden and the GitHub pick shows.
- Routes: `/credits/` (fonts, icons, avatar gallery, licenses), `/#character` (portrait, gear legend, why, level, attributes, HUD, streak), `/#skills`, `/#projects` (quests + boss), `/speedrun/` (60s recruiter view with the avatar), `/changelog/`.
- `CAREER_RPG_NOW=YYYY-MM-DD` pins the build date (end of that UTC day) to reproduce a past streak/HUD, e.g. `CAREER_RPG_NOW=2026-10-17 npm run build`. Unset = real time.
- Streak = consecutive ISO weeks (UTC) with public GitHub contributions (from the snapshot).
- Source files with the `TODO(content)` marker count against the HUD; quests from such case studies show a "Sample" tag.

## Deploy

Push to `master` -> GitHub Actions verifies (check + unit + e2e), builds, deploys. Weekly (Mon 02:47 UTC) `refresh-github-snapshot.yml` refreshes the GitHub snapshot, commits it if changed (as `github-actions[bot]`) and dispatches the deploy, so the build-date streak stays fresh. Manual refresh: Actions -> "Refresh GitHub snapshot" -> Run workflow (on `master`). One-time setup: Settings -> Pages -> Source: **GitHub Actions**; if `master` is protected, let the bot push (see the guide).
Details, branch protection, optional PAT, schedule pause, custom domain, troubleshooting: [docs/deployment-guide.md](docs/deployment-guide.md).

## Docs

| Doc | Topic |
|-----|-------|
| [docs/project-overview-pdr.md](docs/project-overview-pdr.md) | Goals, scope, requirements |
| [docs/code-standards.md](docs/code-standards.md) | Conventions, a11y + motion rules |
| [docs/codebase-summary.md](docs/codebase-summary.md) | Directory map |
| [docs/system-architecture.md](docs/system-architecture.md) | Build pipeline, GitHub-derived pipeline, scoring, refresh + deploy, class/job switcher flow, animation lifecycle |
| [docs/design-guidelines.md](docs/design-guidelines.md) | Themes, tokens, fonts, pixel frames + icons, avatar, motion policy |
| [docs/deployment-guide.md](docs/deployment-guide.md) | Pages, CI/CD, snapshot refresh ops |
| [docs/project-roadmap.md](docs/project-roadmap.md) | v1 to v1.4 status, open items, v2 ideas |
