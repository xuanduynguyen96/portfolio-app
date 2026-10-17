# Codebase Summary

Static Astro 7 site plus the Career RPG layer (see [system-architecture.md](system-architecture.md#career-rpg-pipeline)). Hand-maintained from the actual tree (not repomix).

## Root

| Path | Role |
|------|------|
| `astro.config.mjs` | `site`, `base: '/portfolio-app'`, static output |
| `package.json` | Scripts (`test:unit`, `test:e2e`), deps, `engines` node >=22.18, `overrides` pinning `playwright-core` to `@playwright/test` |
| `playwright.config.ts` | Builds, runs `astro preview --ignore-lock` on :4321, Chromium project |
| `tsconfig.json` | Extends `astro/tsconfigs/strict`; `erasableSyntaxOnly` (pure modules also run under Node type stripping) |
| `.nvmrc` | Node 22 |
| `.github/workflows/deploy-to-github-pages.yml` | verify (check, unit, e2e) -> build -> deploy; weekly cron rebuild |
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
│   ├── project-card.astro           quest card (tier badge, XP, derived repo/demo links)
│   ├── section-heading.astro        "// 01 label" eyebrow + h2
│   ├── site-header.astro            logo (initials), nav (+ Speedrun), mobile menu + inline script import
│   ├── site-footer.astro            + Changelog link
│   ├── skip-to-content-link.astro
│   ├── tag-chip.astro / tag-list.astro
│   ├── career-rpg/                  quest-tier-badge, boss-battle-panel, xp-progress-bar, completeness-hud,
│   │                                streak-badge, skill-tree-node (recursive), achievement-card
│   └── sections/                    hero, about, character-sheet (new), skills (skill tree), projects, experience, contact
├── content/
│   ├── projects/*.md                quests: case study + difficulty/isBoss/skills/obstacles/metrics/evidence
│   └── changelog/*.md               dated build log (`date`, `summary` + body); feeds the streak
├── content.config.ts                strict zod: `projects` (boss refine) + `changelog` collections
├── data/
│   ├── site-config.ts               name, role, bio, email, socials, SEO, `availability`
│   ├── skills-data.ts               flat `skillNodes` (parent links + evidence URLs)
│   ├── experience-data.ts           timeline entries
│   ├── xp-rules.ts                  ALL weights/caps/thresholds/titles, `PLACEHOLDER_MARKER`, `SKILL_ID_PATTERN`
│   └── career-schemas.ts            strict zod: httpsUrl, evidence, metric, skill node
├── layouts/base-layout.astro        head/SEO, root-flag script, ClientRouter, fonts, CSS, animations entry
├── pages/
│   ├── index.astro                  composes the 7 sections (hero, about, character, skills, projects, experience, contact)
│   ├── projects/[slug].astro        detail page per project entry (+ boss-battle-panel)
│   ├── speedrun.astro               `/speedrun/` 60s recruiter view
│   ├── changelog.astro              `/changelog/` entries newest first + streak badge
│   └── 404.astro                    "Signal lost", noindex
├── scripts/
│   ├── mobile-menu.ts               nav toggle (progressive enhancement)
│   ├── speedrun-countdown.ts        decorative 60s clock on /speedrun/ (aria-hidden, static under reduced motion/no JS)
│   └── animations/
│       ├── gsap-setup.ts            registers ScrollTrigger + SplitText
│       ├── init-animations.ts       lifecycle: init / cleanup / flags
│       ├── hero-text-reveal.ts      SplitText title + [data-hero] stagger
│       ├── scroll-reveals.ts        [data-reveal] batch fade-up
│       └── card-spotlight.ts        --spot-x/--spot-y on .glass[data-spotlight]
├── styles/
│   ├── design-tokens.css            :root custom properties
│   ├── global-styles.css            reset, base, focus, utilities, pre-hide rule
│   └── effects.css                  grid/scanlines bg, .glass, .neon-text, .eyebrow, .status-dot
└── utils/
    ├── with-base-path.ts            prefix internal paths with `base`
    ├── format-date-range.ts         "2023-04" -> "Apr 2023 — Present"; `formatEntryDate`
    └── career-rpg/                  Career RPG engine (pure except load-career-state.ts)
        ├── career-types.ts          input/output types (QuestInput, ScoredQuest, SkillTreeNode, CareerState...)
        ├── count-words.ts           prose words (code/urls/hidden/link defs excluded), distinct words
        ├── diminishing-returns.ts   `decayedSum`, `normalizeEvidenceUrl` (coarse dedupe key)
        ├── quest-scoring.ts         sort, validate, per-quest XP, tier decay + caps
        ├── skill-tree.ts            validate, build nested tree, node levels
        ├── xp-and-level.ts          attribute XP (capped), level curve, titles
        ├── consistency-streak.ts    changelog validation + ISO-week streak
        ├── profile-completeness.ts  10-check HUD
        ├── speedrun-achievements.ts top metrics (boss first)
        ├── build-career-state.ts    validate all -> score -> `CareerState`; `CareerRuleError`
        ├── evidence-links.ts / format-metric.ts / countdown-clock.ts / resolve-build-now.ts  small helpers
        └── load-career-state.ts     ONLY Astro-aware: getCollection + raw-source scan + `CAREER_RPG_NOW`; memoized
```

## `public/`

`favicon.svg`, `og-image.png` (generated; command in README).

## `tests/unit/` (`node --test`, 95 tests)

`npm run test:unit` runs `tests/unit/*.test.ts` through Node type stripping (no build, no Astro). Mostly one test file per pure module in `src/utils/career-rpg/` (+ `career-schemas`, `format-date-range`); `career-fixtures.ts` has input builders (`quest()`, `words(n)`...). `load-career-state.ts` is not unit-tested (needs `astro:content`); e2e covers it.

## `tests/e2e/` (Playwright, 56 tests)

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
| `quest-cards-and-boss.spec.ts` | Tier badge + XP/Unverified per card, boss first + spans 2 cols (>=56rem), single column at 360px |
| `character-sheet-and-hud.spec.ts` | Level/title vs attribute XP, progress bar names/values, HUD 0-100 + missing list, no-JS `<details>` |
| `skill-tree.spec.ts` | Nested lists, level in accessible text, locked nodes, safe evidence links, no-JS tree |
| `changelog-and-streak.spec.ts` | Entries newest first with `datetime`, streak badge text + link, footer link on every page |
| `speedrun-page.spec.ts` | Identity/availability/<=3 achievements/CTAs, nav + hero entry, countdown ticks, restarts after soft nav, static under reduced motion |
| `test-helpers.ts` | `SITE_NAME`, `SECTION_IDS` (incl. `character`), `PROJECT_SLUGS`, `BOSS_SLUG`, `CAREER_PAGES`, `trackPageErrors`, `expectAllRevealsVisible` |

Tests mirror real content: `SITE_NAME`, `PROJECT_SLUGS` (`test-helpers.ts`) and the `PROJECTS` array (title, tags, coverAlt) in `project-detail-and-focus.spec.ts`, plus slug in `accessibility-axe.spec.ts` / `page-navigation-lifecycle.spec.ts`. Update them when editing name or projects. Also mirrored: `BOSS_SLUG` (the single `isBoss` project), and `questHeading`/`badge`/`questStatus` per project in `PROJECTS` (change with difficulty, evidence or body length). `changelog-and-streak.spec.ts` counts `src/content/changelog/*.md` and accepts any valid streak text (e2e does not pin `CAREER_RPG_NOW`).

## Data flow

`src/data/*.ts` + `src/content/{projects,changelog}/*.md` -> `loadCareerState()` (pure scoring) -> section components / pages -> static HTML in `dist/`. See [system-architecture.md](system-architecture.md).
