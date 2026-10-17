# portfolio-app

Futuristic animated developer portfolio. Static Astro site + GSAP motion, deployed to GitHub Pages.

- Live (after first deploy): https://xuanduynguyen96.github.io/portfolio-app/
- Lighthouse (local preview): mobile 99/100/100/100 (CLS 0), desktop 100/100/100/100

## Stack

Astro 7.4 (static output) · GSAP 3.15 (ScrollTrigger, SplitText) · plain CSS tokens · Fontsource self-hosted fonts (Space Grotesk, JetBrains Mono) · TypeScript strict · Playwright + axe-core e2e.
No UI framework, no Tailwind.

## Quick start

Requires Node >=22.22 (Astro 7). `.nvmrc` pins 22.

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
| `npm run test:e2e` | Playwright: builds, runs `astro preview`, 30 tests (~26s) |

First e2e run on a fresh machine: `npx playwright install chromium`.

## Edit content

All current content is placeholder, marked `TODO(content)`. Find it all: `grep -rn "TODO(content)" src`.

| What | File |
|------|------|
| Name, role, tagline, bio, location, email, socials, SEO title/description | `src/data/site-config.ts` |
| Skill groups | `src/data/skills-data.ts` |
| Experience timeline | `src/data/experience-data.ts` |
| Projects (one `.md` each) | `src/content/projects/*.md` |
| Project cover images | `src/assets/projects/*.svg` |
| Favicon | `public/favicon.svg` |
| Social preview image | `public/og-image.png` |

Notes:
- Logo initials derive from `siteConfig.name`.
- `email` is `hello@example.com` placeholder; the Contact section uses it for `mailto:`.
- Project frontmatter schema (`src/content.config.ts`): `title`, `summary` (max 160 chars), `tags`, `cover` (optional image path), `coverAlt` (required when `cover` is set), `repoUrl`, `demoUrl`, `featured`, `order`. Sort: featured first, then `order`, then title.
- New project = new `.md` file in `src/content/projects/`; filename becomes the URL slug (`/projects/<slug>/`).
- Regenerate the OG image after editing `src/assets/og-image-source.svg`:

```bash
node -e "require('sharp')('src/assets/og-image-source.svg').png().toFile('public/og-image.png')"
```

(`sharp` ships with Astro.)

## Deploy

Push to `master` -> GitHub Actions verifies (check + e2e), builds, deploys. One-time setup: repo Settings -> Pages -> Source: **GitHub Actions**.
Details, custom domain / user-site notes, troubleshooting: [docs/deployment-guide.md](docs/deployment-guide.md).

## Docs

| Doc | Topic |
|-----|-------|
| [docs/project-overview-pdr.md](docs/project-overview-pdr.md) | Goals, scope, requirements |
| [docs/code-standards.md](docs/code-standards.md) | Conventions, a11y + motion rules |
| [docs/codebase-summary.md](docs/codebase-summary.md) | Directory map |
| [docs/system-architecture.md](docs/system-architecture.md) | Build pipeline, animation lifecycle |
| [docs/design-guidelines.md](docs/design-guidelines.md) | Tokens, effects, motion policy |
| [docs/deployment-guide.md](docs/deployment-guide.md) | Pages + CI/CD |
| [docs/project-roadmap.md](docs/project-roadmap.md) | v1 status, v2 ideas |
