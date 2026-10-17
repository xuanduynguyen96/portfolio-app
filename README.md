# portfolio-app

Futuristic animated developer portfolio. Static Astro site + GSAP motion, deployed to GitHub Pages.

- Live (after first deploy): https://xuanduynguyen96.github.io/portfolio-app/
- Lighthouse (local preview, `/`, project, `/speedrun/`, `/changelog/`): mobile 98-99/100/100/100 (CLS 0), desktop 100/100/100/100

## Stack

Astro 7.4 (static output) · GSAP 3.15 (ScrollTrigger, SplitText) · plain CSS tokens · Fontsource self-hosted fonts (Space Grotesk, JetBrains Mono) · TypeScript strict · Playwright + axe-core e2e · `node:test` unit tests.
No UI framework, no Tailwind.

Career RPG layer (v1.1): projects are quests, skills a tree, XP/level/streak are **computed at build time from evidence** (no backend). See [Career RPG](#career-rpg).

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
| `npm run test:unit` | `node --test` on `tests/unit/*.test.ts` (Career RPG pure modules, 95 tests, no build) |
| `npm run test:e2e` | Playwright: builds, runs `astro preview`, 56 tests (~37s) |

First e2e run on a fresh machine: `npx playwright install chromium`.

## Edit content

All current content is placeholder, marked `TODO(content)`. Find it all: `grep -rn "TODO(content)" src`.

| What | File |
|------|------|
| Name, role, tagline, bio, location, email, socials, SEO title/description | `src/data/site-config.ts` |
| Skill tree: flat `skillNodes` `{id, label, attribute, parent?, evidence[]}`; levels derive from `evidence` URLs + verified projects, never set by hand | `src/data/skills-data.ts` |
| Availability (`status` open/limited/closed + `note`; hero eyebrow, `/speedrun/`) | `src/data/site-config.ts` (`availability`) |
| XP weights, caps, level curve, titles, streak/HUD/speedrun thresholds (retune the game here only) | `src/data/xp-rules.ts` |
| Changelog entries (one `.md` each; feed the streak) | `src/content/changelog/*.md` |
| Experience timeline | `src/data/experience-data.ts` |
| Projects = quests (one `.md` each; fields below) | `src/content/projects/*.md` |
| Project cover images | `src/assets/projects/*.svg` |
| Favicon | `public/favicon.svg` |
| Social preview image | `public/og-image.png` |

Notes:
- Logo initials derive from `siteConfig.name`.
- `email` is `hello@example.com` placeholder; the Contact section uses it for `mailto:`.
- Project frontmatter schema (`src/content.config.ts`, strict: unknown keys fail the build):
  - Base: `title`, `summary` (max 160 chars), `tags`, `cover` (optional image path), `coverAlt` (required when `cover` is set), `featured`, `order`.
  - Quest: `difficulty` (`side|main|raid`, required), `isBoss` (default false), `skills` (1-6 skill ids from `skills-data.ts`), `obstacles` (<=6 strings), `metrics` (<=6 of `{label, value, unit?}`), `evidence` (<=8 of `{type: repo|demo|figma|article|other, url}`, https only).
  - `repoUrl` / `demoUrl` are **removed** (unknown keys fail). Put them in `evidence` (`type: repo` / `type: demo`); the "View code" / "Live demo" buttons derive from it.
  - Order: boss first, then featured, then `order`, then title (same for cards).
  - Boss: exactly one project has `isBoss: true`, with >=1 metric and >=1 obstacle.
- New project = new `.md` file in `src/content/projects/`; filename becomes the URL slug (`/projects/<slug>/`). Case study body must be >=150 prose words (>=80 distinct) or the quest earns 0 XP.
- Changelog frontmatter (strict): `date` (ISO, not later than build time + 24h), `summary` (max 160 chars). Body needs >=40 prose words to count for the streak.
- Regenerate the OG image after editing `src/assets/og-image-source.svg`:

```bash
node -e "require('sharp')('src/assets/og-image-source.svg').png().toFile('public/og-image.png')"
```

(`sharp` ships with Astro.)

## Career RPG

XP, level, title, attribute bars, skill-node levels, HUD % and streak are **computed, never set**: a hand-written `xp`, `level` or `repoUrl` key fails the build. Rules, anti-gaming policy, pipeline: [docs/system-architecture.md](docs/system-architecture.md#career-rpg-pipeline).

- Routes: `/#character` (level, attributes, HUD, streak), `/#skills` (skill tree), `/#projects` (quests + boss), `/speedrun/` (60s recruiter view), `/changelog/`.
- Evidence rules in short: one URL earns XP once site-wide; case study word minimum; tier decay + caps. Build errors list every violation at once (`CareerRuleError`).
- `CAREER_RPG_NOW=YYYY-MM-DD` pins the build date (end of that UTC day) to reproduce a past streak/HUD, e.g. `CAREER_RPG_NOW=2026-10-17 npm run build`. Unset = real time.
- Streak = consecutive ISO weeks (UTC) with a changelog entry; refreshed only on rebuild (weekly scheduled CI build).
- Placeholder projects (file still has the `TODO(content)` marker) show a "Sample" tag / note on `/speedrun/`.

## Deploy

Push to `master` -> GitHub Actions verifies (check + unit + e2e), builds, deploys. Also rebuilds weekly (Mon 03:17 UTC) to refresh the streak. One-time setup: repo Settings -> Pages -> Source: **GitHub Actions**.
Details, custom domain / user-site notes, troubleshooting: [docs/deployment-guide.md](docs/deployment-guide.md).

## Docs

| Doc | Topic |
|-----|-------|
| [docs/project-overview-pdr.md](docs/project-overview-pdr.md) | Goals, scope, requirements |
| [docs/code-standards.md](docs/code-standards.md) | Conventions, a11y + motion rules |
| [docs/codebase-summary.md](docs/codebase-summary.md) | Directory map |
| [docs/system-architecture.md](docs/system-architecture.md) | Build pipeline, Career RPG scoring, animation lifecycle |
| [docs/design-guidelines.md](docs/design-guidelines.md) | Tokens, effects, motion policy |
| [docs/deployment-guide.md](docs/deployment-guide.md) | Pages + CI/CD |
| [docs/project-roadmap.md](docs/project-roadmap.md) | v1 + v1.1 status, v2 ideas |
