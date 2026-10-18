# Codebase Summary

Static Astro 7 site plus the GitHub-derived Career RPG layer and pixel avatar (see [system-architecture.md](system-architecture.md#github-derived-pipeline)). Hand-maintained from the actual tree (not repomix). Last updated 2026-10-18 (v1.4).

## Root

| Path | Role |
|------|------|
| `astro.config.mjs` | `site`, `base: '/portfolio-app'`, static output |
| `package.json` | Scripts (`test:unit`, `test:e2e`, `snapshot:fetch`, `character:explain`), deps, `engines` node >=22.18, `overrides` pinning `playwright-core` to `@playwright/test` |
| `playwright.config.ts` | Builds, runs `astro preview --ignore-lock` on :4321, Chromium project |
| `tsconfig.json` | Extends `astro/tsconfigs/strict`; `erasableSyntaxOnly` (pure modules also run under Node type stripping) |
| `.nvmrc` | Node 22 |
| `.github/workflows/deploy-to-github-pages.yml` | verify (check, unit, e2e) -> build -> deploy; no cron (dispatched by the refresh workflow) |
| `.github/workflows/refresh-github-snapshot.yml` | Weekly (Mon 02:47 UTC) + manual: fetch -> validate -> commit snapshot -> dispatch deploy |
| `.gitattributes` | `.claude/**` linguist-vendored, `plans/**` + `docs/**` documentation (keeps language stats about the site) |
| `scripts/` | Node scripts (type stripping, not bundled): `fetch-github-snapshot.ts` + `github-snapshot/` (GraphQL queries, post, paged fetch), `explain-character.ts`, `render-avatar-sheet.ts` |
| `CLAUDE.md` | Agent/project instructions |
| `plans/` | Implementation plan + phase files |

## `src/`

```
src/
├── assets/
│   └── og-image-source.svg          source for public/og-image.png (placeholder covers removed with the placeholder projects)
├── components/
│   ├── glass-card.astro             .glass surface, optional spotlight
│   ├── neon-button.astro            link button (primary|ghost, external), `data-caret`
│   ├── pixel-icon.astro             8x8 inline-SVG icon (sizes 16/24/32/48, aria-hidden unless `label`)
│   ├── pixel-icon-gallery.astro     all icons, shown on /credits/
│   ├── avatar/                      character-avatar (inline SVG, optional 2-frame loop, `switchable` hook), avatar-gallery (/credits/: 10 looks + tier ramp), class-job-switcher (v1.4: `<details>` control, styles, loads the stub script)
│   ├── theme-head-script.astro      inline head script: sole writer of html[data-theme], theme-color metas
│   ├── theme-toggle.astro           light/dark button (`data-theme-toggle`), hidden without JS
│   ├── menu-toggle-button.astro     mobile nav button (own file, forced-colors safe)
│   ├── header-controls.astro        ThemeToggle + MenuToggleButton
│   ├── project-card.astro           quest card (tier badge, XP/Derived, repo/demo links from the snapshot)
│   ├── section-heading.astro        "// 01 label" eyebrow + h2
│   ├── site-header.astro            logo (initials), nav (+ Speedrun), HeaderControls + menu script import
│   ├── site-footer.astro            + Changelog, Credits links
│   ├── skip-to-content-link.astro
│   ├── tag-chip.astro / tag-list.astro
│   ├── career-rpg/                  quest-tier-badge, boss-battle-panel, xp-progress-bar, completeness-hud,
│   │                                streak-badge, skill-tree-node (recursive), achievement-card,
│   │                                character-nameplate (`switchable`), character-portrait-panel (hosts the switcher), gear-legend, class-why-panel,
│   │                                github-data-note, speedrun-character-header
│   └── sections/                    hero, about, character-sheet (new), skills (skill tree), projects, experience, contact
├── content/
│   ├── projects/<repo-slug>.md      optional case-study override per public repo (title/summary/tags/cover/featured/order/isBoss/obstacles/metrics + body). Today: `portfolio-app.md` (boss, TODO(content) draft)
│   └── changelog/*.md               dated build log (`date`, `summary` + body); no longer feeds the streak
├── content.config.ts                strict zod: `projects` (override fields only) + `changelog` collections
├── data/
│   ├── site-config.ts               name, role, bio, email, socials, SEO, `availability`
│   ├── skills-data.ts               flat `skillNodes` (parent links + `match` rules; evidence is derived)
│   ├── character-class-rules.ts     class vote rules: language/keyword weights, recency, secondary thresholds, fallback
│   ├── character-job-rules.ts       class ids/names, archetype labels, 9 jobs (class x motif)
│   ├── gear-rules.ts                4 gear slots: file/keyword patterns + tier thresholds
│   ├── github/                      `github-snapshot.json` (committed, workflow-written), `github-snapshot-schema.ts` (strict zod), `github-login.ts`
│   ├── avatar/                      hand-authored sprites: `avatar-class-{warrior,mage,archer,adventurer}`, `avatar-gear-{armor,shield,boots-amulet}`, `avatar-job-motifs`, `avatar-palette`, `avatar-types`, registry `avatar-sprites`
│   ├── credits-data.ts              fonts, icons, libraries + licenses for /credits/
│   ├── pixel-icons.ts               registry (`pixelIcons`, `PixelIconName`, sizes, grid legend)
│   ├── pixel-icons-career.ts        8x8 grids: attributes, tiers, boss
│   ├── pixel-icons-hud.ts           8x8 grids: xp, level, streak, locked, evidence, quest, achievement, sun, moon
│   ├── pixel-icons-gear.ts          8x8 grids: armor, shield, boots, amulet (gear legend)
│   ├── pixel-icon-map.ts            attribute / difficulty / boss / skill-root id -> icon name
│   ├── experience-data.ts           timeline entries
│   ├── xp-rules.ts                  ALL game weights/caps/thresholds/titles (quest block, skillEvidence, streak, HUD), `PLACEHOLDER_MARKER`, `SKILL_ID_PATTERN`
│   └── career-schemas.ts            strict zod: httpsUrl, metric, skill node + `match`, override fields
├── layouts/base-layout.astro        head/SEO, ThemeHeadScript, root-flag script, ClientRouter, fonts (MedievalSharp preloaded), CSS, animations entry
├── pages/
│   ├── index.astro                  composes the 7 sections (hero, about, character, skills, projects, experience, contact)
│   ├── projects/[slug].astro        detail page per quest (repo slug; + boss-battle-panel; override body if any)
│   ├── speedrun.astro               `/speedrun/` 60s recruiter view (+ character header)
│   ├── changelog.astro              `/changelog/` entries newest first + streak badge
│   ├── credits.astro                `/credits/` fonts, icon + avatar gallery, libraries, licenses
│   └── 404.astro                    "Off the map", noindex
├── scripts/
│   ├── mobile-menu.ts               nav toggle (progressive enhancement)
│   ├── class-job-switcher.ts        eager stub: state, saved choice (`portfolio-look`), controls, lifecycle; lazy-imports `look-apply-model`
│   ├── look-apply-model.ts          lazy chunk: composes the chosen look in the browser, swaps avatar title/desc/frames + names (no innerHTML)
│   ├── switcher-body.ts             builds the class/job radio groups on first open (DOM APIs)
│   ├── speedrun-countdown.ts        decorative 60s clock on /speedrun/ (aria-hidden, static under reduced motion/no JS)
│   └── animations/
│       ├── gsap-setup.ts            registers ScrollTrigger + SplitText; `PIXEL_STEP` (8)
│       ├── init-animations.ts       lifecycle: init / cleanup / flags
│       ├── hero-text-reveal.ts      SplitText title (`steps(4)`) + [data-hero] stagger
│       ├── scroll-reveals.ts        [data-reveal] batch fade-up
│       └── card-spotlight.ts        --spot-x/--spot-y on .glass[data-spotlight]
├── styles/
│   ├── design-tokens.css            :root tokens: `light-dark()` colors, fonts, pixel units
│   ├── global-styles.css            reset, base, focus, `.hud-text`, `.h2-compact`, pre-hide rule
│   └── effects.css                  dither bg, pixel frames (.glass/.pixel-frame), .neon-text, .eyebrow, .status-dot, [data-caret], `.pixel-details` disclosure
└── utils/
    ├── with-base-path.ts            prefix internal paths with `base`
    ├── format-date-range.ts         "2023-04" -> "Apr 2023 — Present"; `formatEntryDate`
    ├── pixel-icon-path.ts           grid -> SVG path data: `gridToPathData`, rect-merged `gridToMergedPathData` (pure, unit-tested)
    ├── to-roman-numeral.ts          section numbers ("Ch. I"), pure, unit-tested
    ├── github-character/            GitHub snapshot -> character (pure; same purity rules as career-rpg)
    │   ├── github-snapshot-types.ts / character-types.ts   snapshot + raw API shapes / profile, signals, gear types
    │   ├── normalize-snapshot.ts    raw GraphQL -> public-only normalized snapshot (+ `serializeSnapshot`)
    │   ├── repo-tokens.ts / repo-archetype-vote.ts   name/keyword tokens; one weighted archetype vote per repo
    │   ├── classify-character.ts    scores -> class, job, motif, ranked why signals, gear
    │   ├── gear-tiers.ts / character-title.ts   slot tiers 0-3; "Class · Job" string
    │   └── repo-quests.ts / repo-skill-matches.ts   repo -> quest selection, difficulty, boss; skill `match` rules
    ├── avatar/                      sprite composition (pure)
    │   ├── select-avatar-layers.ts  profile + frame -> placed layers (anchors per pose frame)
    │   ├── compose-avatar-grid.ts   z-ordered 32x32 grid; `avatar-sticker-outline.ts` pad + outline + ring
    │   ├── avatar-svg-paths.ts / avatar-svg-markup.ts   merged paths per palette key; accessible SVG string, sizes 128/192/256
    │   ├── avatar-description.ts    `AvatarProfile`, gear/look text for `<desc>`
    │   ├── class-looks.ts           the 10 selectable looks (`allClassLooks`), keys (`mage/data`), allow-list parsers, `changeClass`/`changeMotif`, `defaultLook`, `lookProfile`
    │   ├── class-labels.ts          switcher strings: `lookTitle`, GitHub pick line, status + failure messages
    │   └── look-avatar-model.ts     look + stats gear -> frames, title, desc (`lookAvatarModel`, `parseGear`); same modules as the build
    └── career-rpg/                  Career RPG engine (pure except load-career-state.ts)
        ├── career-types.ts / career-state-types.ts   input/output types (QuestInput, ScoredQuest, SkillTreeNode, CareerState...)
        ├── count-words.ts           prose words (code/urls/hidden/link defs excluded), distinct words
        ├── diminishing-returns.ts   `decayedSum`, `normalizeEvidenceUrl`
        ├── quest-scoring.ts         sort, per-quest XP (repo facts + case study), tier decay + caps
        ├── validate-quest-overrides.ts   override slug names a snapshot repo, <=1 boss, unique slugs
        ├── skill-tree.ts            validate, build nested tree, node levels from matching repos
        ├── xp-and-level.ts          attribute XP (capped), level curve, titles
        ├── consistency-streak.ts    changelog date validation + ISO-week streak from GitHub contribution weeks
        ├── profile-completeness.ts  10-check HUD (incl. snapshot freshness, repo descriptions/topics, boss case study)
        ├── speedrun-achievements.ts top metrics (boss first)
        ├── build-career-state.ts    validate all -> select + score -> `CareerState`; `CareerRuleError`
        ├── evidence-links.ts / format-metric.ts / countdown-clock.ts / resolve-build-now.ts  small helpers
        └── load-career-state.ts     ONLY Astro-aware: snapshot parse + getCollection + raw-source scan + `CAREER_RPG_NOW`; memoized

## `public/`

`favicon.svg` (literal colors), `og-image.png` (generated; command in README; still old palette, not the avatar).

## `tests/unit/` (`node --test`, 261 tests)

`npm run test:unit` runs `tests/unit/**/*.test.ts` through Node type stripping (no build, no Astro). One test file per pure module in `src/utils/{career-rpg,github-character,avatar}/` (plus `career-schemas`, `character-rules`, `github-snapshot-schema`, `fetch-github-data` for the script, `format-date-range`, `pixel-icons`, `pixel-icon-path`, `to-roman-numeral`). Notable: `classify-character.test.ts` (fixture profiles per class, hybrid vs pure job, Adventurer fallback, tie-breaks, purity), `avatar-sprites.test.ts` (shape, tier superset, identity boxes), `avatar-silhouette.test.ts` (class IoU), `avatar-svg-paths.test.ts` (color/size budgets, `--avatar-*` tokens defined). Switcher: `class-looks.test.ts` (10 valid looks, parsers, moves), `class-labels.test.ts`, `look-avatar-model.test.ts` (matches server markup, gear on every look, `parseGear`), `switcher-eager-imports.test.ts` (eager graph never reaches sprites/composer/gear rules). Shared builders: `career-fixtures.ts`, `github-snapshot-fixtures.ts`, `github-raw-fixtures.ts`, `avatar-test-helpers.ts`, `path-raster-oracle.ts`. `load-career-state.ts` is not unit-tested (needs `astro:content`); e2e covers it.

## `tests/e2e/` (Playwright, 120 tests)

| Spec | Covers |
|------|--------|
| `home-page-smoke.spec.ts` | Metadata (canonical, og), sections, animation ready flag, skip link, CTA, contact links |
| `internal-links.spec.ts` | All internal links/assets resolve under base; custom 404 |
| `accessibility-axe.spec.ts` | axe (serious/critical = 0) on home, project details, speedrun, changelog, credits, 404; light + dark |
| `reduced-motion.spec.ts` | Reduce pref, no-JS, bundle-failure failsafe, mid-session switch |
| `responsive-layout.spec.ts` | 360px (no h-scroll, menu), 1280px (inline nav, grid) |
| `page-navigation-lifecycle.spec.ts` | Re-init across ClientRouter, back/forward, menu after soft nav; switcher rebinds after soft nav |
| `scroll-position.spec.ts` | Hash deep link, reload scroll restore |
| `project-detail-and-focus.spec.ts` | Detail page content per slug; visible focus on Tab |
| `quest-cards-and-boss.spec.ts` | Tier badge + XP/Unverified per card, boss first + spans 2 cols (>=56rem), single column at 360px |
| `character-sheet-and-hud.spec.ts` | Level/title vs attribute XP, progress bar names/values, HUD 0-100 + missing list, no-JS `<details>` |
| `skill-tree.spec.ts` | Nested lists, level in accessible text, locked nodes, safe evidence links, no-JS tree |
| `changelog-and-streak.spec.ts` | Entries newest first with `datetime`, streak badge text + link, footer link on every page |
| `speedrun-page.spec.ts` | Identity/availability/<=3 achievements/CTAs, nav + hero entry, countdown ticks, restarts after soft nav, static under reduced motion |
| `theme-toggle.spec.ts` | System scheme, theme-color metas, toggle + persistence, theme set before body (no flash), soft-nav carry-over, blocked storage, no-JS |
| `pixel-icons.spec.ts` | Icons crisp (16/24/32/48, `crispEdges`) and decorative/labelled on home, project, speedrun, credits |
| `forced-colors.spec.ts` | Frames fall back to a real border under `forced-colors: active` |
| `character-avatar.spec.ts` | Hero avatar role/name matches nameplate; sheet legend per slot + keyboard-openable why panel; frames swap only when motion allowed; no-JS fixed integer size (no layout shift); speedrun header + credits gallery |
| `class-job-switcher.spec.ts` | No-JS: control absent; no chunk request before first open; GitHub pick marked, valid jobs per class; arrow keys; all 10 looks (names, status, pixels vs pure modules); gear legend + Why panel stay GitHub-derived; Reset (focus); one status per change; saved/restored/cleared choice; invalid + blocked storage; `/speedrun/` + `/credits/` unchanged; failed chunk load; only hero + sheet are targets |
| `class-job-switcher-quality.spec.ts` | Motion (hero loop follows preference, sheet static), layout shift with a saved look, 360px + 44px targets, forced colors, axe open/chosen in both themes, keyboard |
| `switcher-helpers.ts` | Not a spec: shared helpers for the two switcher specs |
| `credits-page.spec.ts` | `/credits/` groups, entries, license links, icon + avatar gallery, footer link on every page |
| `career-mirror.ts` | Not a spec: recomputes expected quests/boss/titles from the snapshot + override files with the engine's own pure modules |
| `test-helpers.ts` | `SITE_NAME`, `SECTION_IDS` (incl. `character`), re-exports from `career-mirror.ts` (`PROJECT_SLUGS`, `BOSS_SLUG`, `PROJECTS`, `DERIVED_PROJECT`), `CAREER_PAGES`, `INFO_PAGES`, `trackPageErrors`, `expectAllRevealsVisible` |

Tests mirror real content through `career-mirror.ts` (computed from the committed snapshot + override files), so a snapshot refresh or a new case study needs no test edits. Still hardcoded: `SITE_NAME` (`test-helpers.ts`) and the base path (see the deployment guide). `changelog-and-streak.spec.ts` counts `src/content/changelog/*.md` and accepts any valid streak text (e2e does not pin `CAREER_RPG_NOW`).

## Data flow

Weekly workflow -> `src/data/github/github-snapshot.json`; snapshot + `src/data/*.ts` rules + `src/content/{projects,changelog}/*.md` -> `loadCareerState()` (pure classify + scoring) -> section components / pages (avatar composed to inline SVG) -> static HTML in `dist/`. In the browser, the class/job switcher re-composes the avatar on demand from the same pure modules (lazy chunk) and keeps the visitor's choice in `localStorage`. See [system-architecture.md](system-architecture.md).
