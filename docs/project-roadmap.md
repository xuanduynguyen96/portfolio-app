# Project Roadmap

Last updated: 2026-10-18

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
- [ ] Case studies for key repos (optional overrides, no test edits needed) + GitHub descriptions/topics on quest repos
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

## v1.3: GitHub-derived character + avatar (done, branch `feat/github-derived-character`; pending merge)

Plan: `plans/20261017-1617-github-derived-character-avatar/` (phases 00-07, reports in `reports/`). Design: [system-architecture](system-architecture.md#github-derived-pipeline), [design-guidelines](design-guidelines.md#character-avatar).

| Phase | Scope | Status |
|-------|-------|--------|
| 00 | Spike: live GraphQL verify (Actions `GITHUB_TOKEN`), classifier dry-run, silhouettes | Done |
| 01 | Fetcher, normalized public-only snapshot + schema, weekly refresh workflow, deploy dispatch | Done (live run pending) |
| 02 | Classifier + class/job/gear rules (owner: Warrior · Vanguard) | Done |
| 03 | Engine rewire: repo quests + case-study overrides, skill taxonomy, contribution streak, HUD checks | Done |
| 04 | Avatar sprites (4 poses, 3 motifs, 4 gear x 4 tiers), composer, sticker ring, merged-path SVG | Done |
| 05 | UI: hero, character sheet portrait + gear legend + why, `/speedrun/`, `/credits/` gallery | Done |
| 06 | Verification | Automated done: 231 unit, 94 e2e, Lighthouse mobile 99-100 / desktop 100, CLS <= 0.002, identical builds with fixed `CAREER_RPG_NOW`, zero new client JS, home HTML gzip +3.4 KB. Live refresh + blind-ID pending |
| 07 | Docs | Done |

### Open items (v1.3)

- [ ] Merge, then run "Refresh GitHub snapshot" on `master` three ways: dispatch (commit + deploy), re-run same week (no commit + deploy), `dry_run_no_token` (warning, exit 0). Confirm first live refresh fixes language stats (seed counted `.claude/` Python) and re-check the class.
- [ ] Human blind-ID test: >= 5 people, 128px avatars, class named in <= 2s, >= 80% correct (`node scripts/render-avatar-sheet.ts`).
- [ ] Owner review of the `portfolio-app` case-study draft (`src/content/projects/portfolio-app.md`, marked `TODO(content)`); remove the marker when approved.
- [ ] Branch protection on `master`: confirm the bot push works or add the bypass / PR flow ([deployment-guide](deployment-guide.md#snapshot-refresh)).
- [ ] Confirm whether weekly bot commits keep the 60-day schedule alive.
- [ ] OG image from the avatar: deferred (still old-palette `og-image-source.svg`).
- [ ] Remaining `TODO(content)`: `site-config.ts`, `experience-data.ts`.

## v2 ideas (unscheduled)

| Idea | Notes |
|------|-------|
| Real content pass | Bio, skills, experience, projects with screenshots |
| Contact form service | Static-friendly (Formspree/Web3Forms style); replaces mailto-only; needs spam + privacy review |
| Three.js hero | Lazy-loaded, reduced-motion + low-power fallback; watch Lighthouse/CLS |
| Blog | Second content collection + RSS |
| Theme polish | 3-state toggle (reset to system), recolor OG image (or render it from the avatar), opt-in SFX, external pixel packs |
| More classes / archetypes | New archetype = class pose + motif + 3 jobs ([code standards](code-standards.md#avatar-sprites)); e.g. DevOps/mobile split |
| Private data (aggregate) | Opt-in aggregate private contribution/repo counts; today public-only |
| Better gear signals | Tests below repo root (Maven `src/test`, Go `_test.go`); needs deeper tree data in the snapshot |
| Avatar extras | `fx` layer (level-up sparkles), more tiers/poses, `<symbol>` reuse if HTML weight grows |
| Multiple profiles | Parametrize `GITHUB_LOGIN`; today one account |
| Sitemap | `@astrojs/sitemap` (+ robots.txt) |
| Supply chain hardening | SHA-pinned actions + Dependabot for npm and Actions |
| Cross-browser tests | Add Firefox + WebKit Playwright projects |

## Known limitations

- Only Chromium covered by e2e.
- Action major versions unverified until first run.
- Tests hardcode placeholder content and base path (see deployment guide for what to update).
- Streak and all character data refresh only when the weekly workflow (or a manual run) updates the snapshot and rebuilds; GitHub pauses schedules after 60 days without repo activity.
- Public repos only: private work is invisible. The contribution calendar is aggregate weekly counts and may include private contributions if the profile setting is on (counts only; nothing else is read).
- Class accuracy depends on GitHub language stats (linguist): vendored/generated files skew it. `.gitattributes` keeps agent tooling and docs out of this repo; other repos are as GitHub reports them. Sparse public history makes the class sensitive to a few repos (recency half-life 48 months in `character-class-rules.ts`).
- Gear hygiene signals read root, `.github/` and workflow file names only (tests below the root are missed).
- Quests are repo facts plus the owner's case-study text; override text, metrics and changelog dates are self-attested (backdating not verified). Repos can be created to inflate counts; caps and decay limit the effect.
- Class art readability is unit-tested by silhouette overlap only; human blind-ID still pending.
- Tests hardcode `SITE_NAME` and the base path (see deployment guide); project expectations are computed from the snapshot (`career-mirror.ts`).
- e2e does not pin `CAREER_RPG_NOW`, so streak assertions accept any valid state.
- Only Chromium covered by e2e.
- Action major versions unverified until first run.
- Current HUD is held back by `TODO(content)` placeholders and quest repos without GitHub descriptions/topics.

## Changelog

| Date | Change |
|------|--------|
| 2026-10-17 | v1 implemented; docs written |
| 2026-10-17 | v1.1 Career RPG layer implemented (phases 01-09); docs updated |
| 2026-10-17 | v1.2 RPG theme + light (parchment) theme implemented; SFX, external packs, sprite sheet, cover/OG recolor deferred; docs updated |
| 2026-10-18 | v1.3 GitHub-derived character + layered pixel avatar implemented (phases 00-07); live refresh run, blind-ID, OG image pending; docs updated |
