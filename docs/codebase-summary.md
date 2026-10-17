# Codebase Summary

Static Astro 7 site, ~1.1k lines in `src/`. Hand-maintained from the actual tree (not repomix).

## Root

| Path | Role |
|------|------|
| `astro.config.mjs` | `site`, `base: '/portfolio-app'`, static output |
| `package.json` | Scripts, deps, `overrides` pinning `playwright-core` to `@playwright/test` |
| `playwright.config.ts` | Builds, runs `astro preview --ignore-lock` on :4321, Chromium project |
| `tsconfig.json` | Extends `astro/tsconfigs/strict` |
| `.nvmrc` | Node 22 |
| `.github/workflows/deploy-to-github-pages.yml` | verify -> build -> deploy |
| `CLAUDE.md` | Agent/project instructions |
| `plans/` | Implementation plan + phase files |

## `src/`

```
src/
├── assets/
│   ├── og-image-source.svg          source for public/og-image.png
│   └── projects/*-cover.svg         project covers (neon-dashboard, realtime-chat, cli-toolkit)
├── components/
│   ├── glass-card.astro             .glass surface, optional spotlight
│   ├── neon-button.astro            link button (primary|ghost, external)
│   ├── project-card.astro           card for one project entry
│   ├── section-heading.astro        "// 01 label" eyebrow + h2
│   ├── site-header.astro            logo (initials), nav, mobile menu + inline script import
│   ├── site-footer.astro
│   ├── skip-to-content-link.astro
│   ├── tag-chip.astro / tag-list.astro
│   └── sections/                    hero, about, skills, projects, experience, contact
├── content/projects/*.md            project case studies (content collection)
├── content.config.ts                zod schema for `projects`
├── data/
│   ├── site-config.ts               name, role, bio, email, socials, SEO
│   ├── skills-data.ts               skill groups
│   └── experience-data.ts           timeline entries
├── layouts/base-layout.astro        head/SEO, root-flag script, ClientRouter, fonts, CSS, animations entry
├── pages/
│   ├── index.astro                  composes the 6 sections
│   ├── projects/[slug].astro        detail page per project entry
│   └── 404.astro                    "Signal lost", noindex
├── scripts/
│   ├── mobile-menu.ts               nav toggle (progressive enhancement)
│   └── animations/
│       ├── gsap-setup.ts            registers ScrollTrigger + SplitText
│       ├── init-animations.ts       lifecycle: init / cleanup / flags
│       ├── hero-text-reveal.ts      SplitText title + [data-hero] stagger
│       ├── scroll-reveals.ts        [data-reveal] batch fade-up
│       └── card-spotlight.ts        --spot-x/--spot-y on .glass[data-spotlight]
├── styles/
│   ├── design-tokens.css            :root custom properties
│   ├── global-styles.css            reset, base, focus, utilities, pre-hide rule
│   └── effects.css                  grid/scanlines bg, .glass, .neon-text, .eyebrow
└── utils/
    ├── with-base-path.ts            prefix internal paths with `base`
    ├── sort-projects.ts             featured -> order -> title
    └── format-date-range.ts         "2023-04" -> "Apr 2023 — Present"
```

## `public/`

`favicon.svg`, `og-image.png` (generated; command in README).

## `tests/e2e/` (Playwright, 30 tests)

| Spec | Covers |
|------|--------|
| `home-page-smoke.spec.ts` | Metadata (canonical, og), sections, animation ready flag, skip link, CTA, contact links |
| `internal-links.spec.ts` | All internal links/assets resolve under base; custom 404 |
| `accessibility-axe.spec.ts` | axe on home, project detail, 404 |
| `reduced-motion.spec.ts` | Reduce pref, no-JS, bundle-failure failsafe, mid-session switch |
| `responsive-layout.spec.ts` | 360px (no h-scroll, menu), 1280px (inline nav, grid) |
| `page-navigation-lifecycle.spec.ts` | Re-init across ClientRouter, back/forward, menu after soft nav |
| `scroll-position.spec.ts` | Hash deep link, reload scroll restore |
| `project-detail-and-focus.spec.ts` | Detail page content per slug; visible focus on Tab |
| `test-helpers.ts` | `SITE_NAME`, `SECTION_IDS`, `PROJECT_SLUGS`, `trackPageErrors`, `expectAllRevealsVisible` |

Tests mirror real content: `SITE_NAME`, `PROJECT_SLUGS` (`test-helpers.ts`) and the `PROJECTS` array (title, tags, coverAlt) in `project-detail-and-focus.spec.ts`, plus slug in `accessibility-axe.spec.ts` / `page-navigation-lifecycle.spec.ts`. Update them when editing name or projects.

## Data flow

`src/data/*.ts` + `src/content/projects/*.md` -> section components / pages -> static HTML in `dist/`. See [system-architecture.md](system-architecture.md).
