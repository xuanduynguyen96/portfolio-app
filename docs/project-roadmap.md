# Project Roadmap

Last updated: 2026-10-21 (v1.6)

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
| 02 | Classifier + class/job/gear rules (then: Warrior · Vanguard) | Done |
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

## v1.4: Class/job switcher (done, branch `feat/class-job-switcher`)

Plan: `plans/20261018-0541-class-job-switcher/` (phases 00-06, reports in `reports/`). Design: [system-architecture](system-architecture.md#classjob-switcher), [design-guidelines](design-guidelines.md#classjob-switcher-control).

| Phase | Scope | Status |
|-------|-------|--------|
| 00 | Spike: variant payload budget, delivery decision (browser compose from the pure modules in a lazy chunk) | Done |
| 01 | Pure `class-looks` + `class-labels` modules, unit tests | Done |
| 02 | `look-avatar-model` + lazy DOM applier, gear-on-every-look tests | Done |
| 03 | Switcher component + eager stub + saved choice | Done |
| 04 | Integration: hero + character sheet (`switchable` avatar/nameplate) | Done |
| 05 | Verification: 261 unit, 120 e2e; Lighthouse mobile home 99/100/100/100, CLS 0.0016 (unchanged); home HTML gzip +338 B (13,790 B); eager stub 2,826 B gz; lazy chunk 4,627 B gz; no chunk request before first open; compose + apply 10-14 ms warm at 4x CPU throttle | Done |
| 06 | Docs + changelog | Done |

What shipped: visitor picks any of 10 looks in the character sheet; default and "Reset to GitHub pick" = the GitHub-derived look; gear tiers from GitHub stats only, drawn on every look; choice saved in `localStorage` (`portfolio-look`); hero + sheet avatar and name change. No new library, font or asset (`credits-data.ts` unchanged).

### Follow-ups (v1.4, not built)

- [ ] Attributes bars + `Why <Class>?` panel for the chosen class (today they describe the GitHub-derived class).
- [ ] Propagate the chosen look to `/speedrun/` and `/credits/` (cheap with the saved key).
- [ ] Class-specific gear art (gear is the same sprite set on every class).
- [ ] Visitor-supplied GitHub username (gear and class from their own stats): needs a runtime API, rate limits, privacy review; conflicts with "build never calls GitHub".
- [ ] Smaller ideas: theme accents per class, hero entry link / reset, shareable `?look=` link.

## v1.5: class = domain, job = skills (done, branch `feat/domain-class-skill-jobs`; uncommitted)

Plan: `plans/20261020-1801-domain-class-skill-jobs/` (phases 01-06, reports in `reports/`). Model: [system-architecture](system-architecture.md#github-derived-pipeline). Behaviour change only; no new library, font or asset.

| Phase | Scope | Status |
|-------|-------|--------|
| 01 | Mage = DevOps rename, verify + fix source, art review | Done |
| 02 | Unit tests rewrite + invariants (every voting skill in exactly one job): 279 unit | Done |
| 03 | E2E updates: 121 e2e | Done |
| 04 | Real-data check (owner result, quest shift) | Done |
| 05 | Docs + changelog entry (`2026-10-20-domain-classes.md`) | Done |
| 06 | Final gate, review, commit | Pending |

What shipped: class = domain from skill matches (backend Warrior, frontend Archer, DevOps Mage), 3 skill-based jobs per class, prop = job slot (per-job props since v1.6), class and job evidence lists in the Why panel, quest ranking independent of class. Mobile hero caption puts class and job on separate lines and reserves 2 lines: CLS 0.085 before the fix, 0 now.

Behaviour changes:
- Python, TypeScript, JavaScript, Go, Rust and Swift alone no longer vote; a repo must prove a domain skill.
- Mage meant Data before; it is now the DevOps class (same pose). Data-only profiles are Adventurer or another domain.
- Saved `portfolio-look` keys from before v1.5 (old motif ids) are invalid and reset once to the GitHub pick.
- Quest list may reorder.

Dated example (2026-10-19 snapshot, not a rule): Warrior · Knight (then: Warrior · Vanguard); scores backend 2.877 / frontend 2.364 / devops 0.974; one repo swapped in the top 6 quests, boss unchanged. Frontend is ~82% of backend, so a later snapshot may flip to Archer (accepted, not tuned). Details: `plans/20261020-1801-domain-class-skill-jobs/reports/02-real-data-check-report.md`.

### Follow-ups (v1.5, not built)

- [ ] Re-check the class after the next snapshot refresh.
- [ ] Tighten generic whole-word keywords (`rest`, `server`, `api`, `mobile`) in `skills-data.ts` if they mis-vote (also changes skill levels).
- [ ] Human blind-ID of the Mage silhouette next to the current Warrior/Archer art.

## v1.6: distinct art per job (done, branch `feat/distinct-job-art`)

Plan: `plans/20261021-0208-distinct-job-art-per-job-props/` (phases 00-07, reports in `reports/`). Art rules: [code-standards](code-standards.md#avatar-sprites); design: [design-guidelines](design-guidelines.md#character-avatar). Art only; no new library, font or asset.

| Phase | Scope | Status |
|-------|-------|--------|
| 00 | Spike: class prop zones, overlap policy, byte budget | Done |
| 01 | Job-keyed data model refactor (`JOB_IDS`/`JobId`, look key `class/jobId`; commit b3c36ca) | Done |
| 02 | Palette tokens (9 `--avatar-accent-<job>`), accent + trim layer, prop invariants | Done |
| 03-05 | Art: Warrior, Archer, Mage props (3 each, 2 frames) + uniqueness checks (commit bab21ba) | Done |
| 06 | Verification: 326 unit, 122 e2e; lazy chunk 5,421 B gz (was 4,580; budget <= 6,000); eager stub 3,034 B gz (was 2,992; <= +100); home HTML 13,629 B gz (was 13,515; <= +1,000); animated markup max 10,886 B raw / 1,979 B gz; colors max 15 | Done |
| 07 | Docs + changelog entry (`2026-10-21-distinct-job-art.md`) | Done |

What shipped: 9 props keyed by job id (replace 3 shared slot props), each with a frame B motion; per-job accent colour (prop main hue + outfit trim via the `trim` layer, z 15); Adventurer unchanged (no prop, no trim). Accent contrast vs the outline 4.07-8.75:1 (gate >= 3:1); pairwise dE >= 25 (>= 33 within a class).

Behaviour changes:
- Look key = `class/jobId` (e.g. `mage/seer`); radio value = job id. Legacy keys (`mage/hawk`, `warrior/banner`, `mage/data`) are invalid and reset once to the GitHub pick. Changing class still keeps the job slot (Warrior · Sentinel -> Archer · Herald -> Mage · Seer).
- Removed: `MOTIF_IDS`, `MotifId`, `JobDefinition.motif`, `CharacterProfile.motif`, `PoseAnchors.motif`, `avatar-job-motifs.ts`, `parseMotif`, `changeMotif`, `motifsFor`. New: `jobSlot`, `jobAtSlot`, `jobsFor`, `parseJobId`, `changeJob`.

### Follow-ups (v1.6, not built)

- [ ] Human check that each of the 9 props reads at 128px (tests cover geometry and colour, not recognisability).

## v2 ideas (unscheduled)

| Idea | Notes |
|------|-------|
| Real content pass | Bio, skills, experience, projects with screenshots |
| Contact form service | Static-friendly (Formspree/Web3Forms style); replaces mailto-only; needs spam + privacy review |
| Three.js hero | Lazy-loaded, reduced-motion + low-power fallback; watch Lighthouse/CLS |
| Blog | Second content collection + RSS |
| Theme polish | 3-state toggle (reset to system), recolor OG image (or render it from the avatar), opt-in SFX, external pixel packs |
| More classes | New domain = id in `DOMAIN_IDS` + voting skills + class + 3 jobs + pose ([code standards](code-standards.md#avatar-sprites)). A data/ML class needs data skills in `skills-data.ts` first (Mage is DevOps) |
| Private data (aggregate) | Opt-in aggregate private contribution/repo counts; today public-only |
| Better gear signals | Tests below repo root (Maven `src/test`, Go `_test.go`); needs deeper tree data in the snapshot |
| Avatar extras | `fx` layer (level-up sparkles), more tiers/poses, `<symbol>` reuse if HTML weight grows, class-specific gear art |
| Switcher follow-ups | Chosen class in attributes + Why panel, `/speedrun/` + `/credits/` propagation, theme accents, shareable `?look=`, visitor-supplied GitHub username (runtime API) |
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
- Class accuracy depends on skill matches (`skills-data.ts`): generic whole-word keywords can mis-vote, HTML/CSS/C#/Java also count by language share (linguist: vendored/generated files skew it; `.gitattributes` keeps agent tooling and docs out of this repo), and any CI workflow matches `github-actions`, so a CI-heavy frontend repo leaks some DevOps share. Profiles whose repos prove no domain skill (e.g. Python-only) are Adventurer. Sparse public history makes the class sensitive to a few repos (recency half-life 48 months in `character-class-rules.ts`).
- Gear hygiene signals read root, `.github/` and workflow file names only (tests below the root are missed).
- Quests are repo facts plus the owner's case-study text; override text, metrics and changelog dates are self-attested (backdating not verified). Repos can be created to inflate counts; caps and decay limit the effect.
- Class art readability is unit-tested by silhouette overlap only; human blind-ID still pending. Job props are unit-tested for zone, clearance, colour and difference, not for recognisability.
- Class/job choice is client-only, per browser (`localStorage`), sprite + name only, hero and character sheet only. Attributes and the `Why <Class>?` panel describe the GitHub-derived class, and `/speedrun/` + `/credits/` always show it. Gear is the same stats-derived tiers on every look. If the lazy chunk fails to load, the control reverts and stays unavailable until reload.
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
| 2026-10-18 | v1.4 Class/job switcher implemented (phases 00-06): 10 selectable looks, "GitHub pick" default + Reset, stats-derived gear on every look, saved choice, lazy browser-side compose; follow-ups listed above; docs updated |
| 2026-10-20 | v1.5 Class = domain from skill matches, job = specific skills, Mage = DevOps (phases 01-05; 279 unit, 121 e2e; final gate pending); mobile hero caption CLS 0.085 -> 0; saved looks reset once; changelog entry added; docs updated |
| 2026-10-21 | v1.6 Distinct art per job (phases 00-07; 326 unit, 122 e2e): 9 job-keyed props with own motion, per-job accent + outfit trim; look keys `class/jobId`, legacy keys reset once; lazy chunk 5,421 B gz; changelog entry added; docs updated |
