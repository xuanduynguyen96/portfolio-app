# Code Standards

## General

- File names: kebab-case, descriptive (`hero-text-reveal.ts`, `skip-to-content-link.astro`).
- Keep files <200 lines; split by responsibility.
- TypeScript strict (`astro/tsconfigs/strict`, see `tsconfig.json`). Run `npm run check` before pushing.
- Plain CSS only. Colors, spacing, type, radii, motion timing come from tokens in `src/styles/design-tokens.css`; no magic values. Literal colors only in `public/favicon.svg` and the theme head script.
- No UI framework, no Tailwind. Add dependencies only when needed (YAGNI).
- Content lives in data/content files, never in components.

## Component conventions

- Astro components: frontmatter -> markup -> scoped `<style>`. Global CSS only for reset, tokens, shared effects (`src/styles/`).
- Props via `interface Props` / `type Props`; extend `HTMLAttributes<'tag'>` for wrappers (see `glass-card.astro`, `neon-button.astro`).
- Section components in `src/components/sections/`, assembled in `src/pages/index.astro`.
- Each section: `<section id aria-labelledby>` + `SectionHeading` (`index`, `label`, `title`, `id`).
- Lists of chips/tags: `<ul role="list" aria-label>` (`tag-list.astro`).

## Internal links: `withBasePath()`

Every internal `href`/asset path goes through `withBasePath()` (`src/utils/with-base-path.ts`), never a raw `/path`. It prefixes Astro `base` (`/portfolio-app`).

```astro
<a href={withBasePath('/#projects')}>Projects</a>
```

Exceptions: same-page hash links (`href="#contact"`) and external URLs. `internal-links.spec.ts` guards this.

## Animation hooks: data attributes

JS and CSS find animated elements by data attributes, not classes/ids.

| Attribute | Used by | Effect |
|-----------|---------|--------|
| `data-reveal` | `scroll-reveals.ts` | Fade-up when scrolled into view |
| `data-hero` | `hero-text-reveal.ts` | Staggered intro fade-up |
| `data-hero-title` | `hero-text-reveal.ts` | SplitText char reveal (also set `data-hero`) |
| `data-spotlight` | `card-spotlight.ts`, `effects.css` | Pointer-follow glow on `.glass` |
| `data-menu-toggle`, `data-menu` | `mobile-menu.ts` | Mobile nav button / panel |
| `data-theme-toggle` | `theme-head-script.astro` (delegated click) | Light/dark toggle button; `aria-pressed` = dark. No per-element JS |
| `data-look` | `class-job-switcher.ts` | Switcher root (`<details>`); carries `data-default-look` (GitHub pick key) and `data-gear` (tiers JSON); `data-ready` = script bound (reveals the control) |
| `data-look-avatar`, `data-look-name`, `data-look-class`, `data-look-job` | `look-apply-model.ts` | Targets whose SVG `<title>`/`<desc>`/frames or name text the switcher replaces (set by the `switchable` prop on avatar/nameplate) |
| `data-look-body`, `data-look-reset`, `data-look-status`, `data-look-jobs` | `class-job-switcher.ts`, `switcher-body.ts` | Radio group mount, Reset button, polite status line, per-class job group |
| `data-caret` | `effects.css` | Pixel caret on hover/focus; blinks only under `html[data-motion="ok"]` |

Rules:
1. New animation = new module in `src/scripts/animations/`, called from `init-animations.ts` inside the `gsap.matchMedia()` callback, so `mm.revert()` cleans it up.
2. Register GSAP plugins only in `gsap-setup.ts`; import `gsap`/`ScrollTrigger`/`SplitText` from there.
3. Animate with `opacity` + `transform`. Never `autoAlpha`/`visibility:hidden` for reveals: unrevealed content would leave the accessibility tree.
4. Do not add CSS `scroll-behavior: smooth`: it breaks hash deep links and reload scroll restoration (ScrollTrigger's first refresh cancels the animated restore).
5. Pre-hide via CSS only under `html[data-motion="ok"]`. Never hide content unconditionally.
6. Scripts that touch the DOM must re-bind on `astro:page-load` (ClientRouter replaces the DOM); clean up on `astro:before-swap`.
7. Cards/elements using `.glass[data-spotlight]` need no extra JS; `card-spotlight.ts` is global.

See [system-architecture.md](system-architecture.md) for the flag lifecycle.

## Theme head script

`src/components/theme-head-script.astro` (inline, in `<head>`) is the only writer of `html[data-theme]`; never set it from CSS, components or other scripts.

- Runs before first paint; reads `localStorage` (`rpg-theme`, always in try/catch, in-memory fallback), else the system scheme.
- Copies the theme to `newDocument` on `astro:before-swap`, re-applies on `astro:after-swap`. Handles toggle clicks by delegation (works if the bundle fails).
- `:root:not([data-theme])` means no JS: CSS follows the system, the toggle hides.
- It holds literal hexes (pre-CSS) that must match `--color-bg` in `design-tokens.css`; update both plus `theme-toggle.spec.ts`.
- Colors elsewhere are `light-dark()` tokens; never write per-theme overrides in components.

## Pixel icons

Design rules: [design-guidelines.md](design-guidelines.md#pixel-icons).

- Render only through `<PixelIcon name size label? />`; sizes 16/24/32/48.
- Add an icon: (1) add an 8-row x 8-char grid (`#` ink, `+` shade, `.` empty) to `src/data/pixel-icons-career.ts` or `-hud.ts`; `PixelIconName` derives from the keys. (2) Map ids to it in `src/data/pixel-icon-map.ts` if needed. (3) Update `tests/unit/pixel-icons.test.ts` (grid shape, non-empty, names). (4) It appears in the `/credits/` gallery automatically.
- Grid -> SVG path logic lives in `src/utils/pixel-icon-path.ts` (unit-tested).
- Decorative (`aria-hidden`) unless it stands alone; then pass `label`.
- Do not hand-write SVG icons in components.

## Typography utilities

- `.hud-text` (Pixelify, tracking) replaces the old `.mono`; use it for labels, numbers, dates. Keep >=14px.
- h1/h2 render in MedievalSharp and must be >=32px; smaller h2 gets `class="h2-compact"`.
- Code uses `--font-mono` (system mono).

## Accessibility rules

- One `<h1>` per page; sections labelled via `aria-labelledby`.
- Skip link first in body; `<main id="main" tabindex="-1">`.
- Visible `:focus-visible` outline on all interactives (min contrast vs bg).
- Decorative glyphs: `aria-hidden="true"`. Images: meaningful `alt`; `coverAlt` mandatory with `cover`.
- External links: `target="_blank"` + `rel="noopener noreferrer"` (`NeonButton external`).
- Touch targets >=44px (`neon-button` min-height 2.75rem).
- Gradient `.neon-text` is for large display text only.
- Never set `box-shadow` on `.glass`/`.pixel-frame` (it is the frame); override `--frame-*` vars. Forced-colors fallback is in `effects.css`.
- Respect `prefers-reduced-motion`: no motion, content visible.
- Progressive enhancement: no JS => nav visible, content visible.

## Content collection

Schemas in `src/content.config.ts` (zod `strictObject`: unknown keys fail the build). Keep `summary` <=160 chars. Prefix new placeholders with `TODO(content)` (the marker is `PLACEHOLDER_MARKER`; the HUD and "Sample" tags count it, including in case-study overrides).

- Reusable field schemas live in `src/data/career-schemas.ts`: `httpsUrl` (https only, no credentials), `metricSchema`, `skillNodeSchema` (+ `skillMatchSchema`), `skillIdSchema`, `questOverrideFields`. Reuse them; don't re-declare URL checks. The snapshot schema is `src/data/github/github-snapshot-schema.ts`.
- `src/content/projects/<repo-slug>.md` is an optional **case-study override** for a public repo, not a project definition. Never add `xp`, `level`, `difficulty`, `skills`, `evidence` or legacy `repoUrl`/`demoUrl`: they are rejected (derived from the repo). File name = repo slug (`toRepoSlug`), cross-checked against the snapshot by `validate-quest-overrides.ts`.
- Never hand-edit `github-snapshot.json`; the refresh workflow writes it (a manual edit must still pass the strict schema). Schema change = bump `schemaVersion`, update fetcher, normalizer, fixtures and the workflow validation step together.
- Enums (attributes, difficulties, evidence types, statuses) and every game weight/cap/threshold/title come from `src/data/xp-rules.ts`. Class/job/gear numbers live only in `character-class-rules.ts`, `character-job-rules.ts`, `gear-rules.ts`. Retune there; no magic numbers in scoring code, components or docs.
- Per-entry rules go in the zod schema; cross-entry rules go in `src/utils/career-rpg/` validators (they aggregate into `CareerRuleError`).

## Career RPG modules (`src/utils/career-rpg/`)

Pure TypeScript, also executed by Node type stripping in `npm run test:unit`. Rules:

1. Relative imports use the `.ts` extension (`from './count-words.ts'`); use `import type` for types.
2. Erasable syntax only (`erasableSyntaxOnly` in `tsconfig.json`): no `enum`, `namespace`, parameter properties.
3. No `astro:*` imports and no `import.meta.env`/`import.meta.glob`. The one exception is `load-career-state.ts` (keep it thin, not unit-tested). Pass time in (`now`) and rules in (`rules` defaulting to `xpRules`); never read the clock in scoring (the only default `new Date()` is in `resolve-build-now.ts`).
4. Return new values, don't mutate inputs (only the shared `seen` URL set is mutated, by design).
5. Validators return `RuleIssue[]`; only `buildCareerState` throws.

Components in `src/components/career-rpg/` take the computed state as props; they don't score.

## GitHub character modules (`src/utils/github-character/`)

Same rules as career-rpg (`.ts` imports, erasable syntax, no `astro:*`, no clock reads: `asOf`/`now` passed in, return new values) plus:

- Classifier = pure function of the snapshot; deterministic (fixed tie-break order, sorted outputs); every result has a human reason (`ClassSignal.reason`).
- `scripts/` may import these modules directly (Node type stripping) but must not add npm dependencies to the token-bearing fetch step.
- Normalizer is the single place that drops private/fork data; anything new in the raw API data must be filtered there and covered by `normalize-snapshot.test.ts`.

### Tuning class, job and gear rules

1. Run `npm run character:explain` to see scores, per-repo votes, signals, gear.
2. Change only the rules files (`character-class-rules.ts`, `character-job-rules.ts`, `gear-rules.ts`); keep a comment with the reason.
3. The reason must hold for any developer (a language mapping, a hygiene file name, a threshold). Never add the owner's repo names, never special-case a login. The owner's class may change as a side effect; never tune to get a specific result.
4. Add or adjust a fixture profile in `tests/unit/classify-character.test.ts` (and `character-rules.test.ts` for shape rules) so other profiles keep their classes. Examples: new language row -> a profile using it lands where expected; new gear pattern -> a `gear-tiers.test.ts` case for the hit and a near-miss.
5. Run `npm run test:unit`, then check `npm run test:e2e` (`career-mirror.ts` recomputes expectations, so the owner's change needs no test edit).

## Avatar sprites

Art lives in `src/data/avatar/`, composition in `src/utils/avatar/` (pure). Design: [design-guidelines.md](design-guidelines.md#character-avatar).

Grid rules:
- A sprite is rows of single-char palette keys, equal width; `.` transparent. Allowed keys: `AVATAR_PALETTE` except `#` (the sticker ring, composer only). Class poses are 32x32 with no exterior outline (the composer adds outline + ring).
- Layers are sub-rects placed at pose **anchors** (`PoseAnchors`: armor, amulet, shield, bootNear, bootFar, motif), per frame, so gear follows moving parts. Paint order = `LAYER_Z`: `base < class < armor < amulet < boots < shield < job < fx`, last opaque pixel wins.
- Gear and motif art must stay out of the pose's `identity` boxes (head, held items) so class stays readable; unit-tested for every tier x frame.
- Gear tiers: 4 same-size sprites; tier n+1 only adds opaque pixels over tier n (monotonic), tier 2 adds >= 2 px over tier 1; materials leather/wood (0) -> bronze (1) -> iron (2) -> gold + sparkle `x` (3) (`GEAR_MATERIALS`).
- Budgets: <= 16 colors per look (+ ring); markup <= 6 KB static / 11 KB animated raw, <= 2.5 KB gzip animated; classes differ by silhouette (IoU <= .80, jobs of a class differ >= 12 px).
- Colors only via keys -> `--avatar-<slug>` tokens in `design-tokens.css`; never literal colors in sprite or component code. A new key needs a token (the test checks both themes for the ring).

How to:
- **Redraw or tune a gear tier:** edit the rows in `avatar-gear-*.ts` (keep size and monotonic rule), run `node scripts/render-avatar-sheet.ts out.html --png out.png` and look at all classes x tiers, then `npm run test:unit`.
- **Add a pose frame detail / class art:** edit `avatar-class-<class>.ts`; keep 32x32, update `identity` boxes and anchors for both frames; frames must differ.
- **Add a job prop:** a motif is per archetype (`avatar-job-motifs.ts`, 6x11, two frames, name in `MOTIF_PROP_NAMES`); 9 jobs = 3 classes x 3 motifs. A 4th archetype means: id in `ARCHETYPE_IDS`, class + 3 jobs in `character-job-rules.ts`, class pose, motif, class/job tests. The switcher's look list, labels and radio groups derive from those rules (`allClassLooks`, `buildSwitcherBody`), so a new class/job appears there with no extra wiring; update the look/label unit tests and the switcher e2e counts.
- **Add a gear slot:** id + rule in `gear-rules.ts`; 8x8 icon in `pixel-icons-gear.ts`; 4-tier sprite file registered in `avatar-sprites.ts`; `LayerSlot` + `LAYER_Z` entry; anchor in `PoseAnchors` for every pose frame; layer in `select-avatar-layers.ts`; update sprite tests, `gear-tiers` tests, silhouette/budget tests. The tier count (0-3) is fixed in `GearTier`, `TieredRows` and `GEAR_MATERIALS`; a 5th tier is a type change across them.
- Sprite changes: also re-run the blind-ID check if class readability could change. `character-avatar.astro` stays pure markup + CSS (the server render needs no JS); the browser-side swap lives only in the switcher scripts ([Class/job switcher](#classjob-switcher)).

## Class/job switcher

Files: `src/utils/avatar/{class-looks,class-labels,look-avatar-model}.ts` (pure), `src/scripts/{class-job-switcher,look-apply-model,switcher-body}.ts`, `src/components/avatar/class-job-switcher.astro`. Flow: [system-architecture.md](system-architecture.md#classjob-switcher). Visual rules: [design-guidelines.md](design-guidelines.md#class-job-switcher-control).

Rules:
1. **Derived vs chosen.** Class, job, gear and XP are computed from the snapshot, never hand-set. The switcher only chooses which class/job sprite + name is displayed. Gear tiers come from GitHub stats only and are never a function of the chosen look; the derived look is always labelled "GitHub pick" and is the default and the Reset target.
2. **Lifecycle.** Bind on `astro:page-load` (call `unbind()` first, idempotent), abort the `AbortController` on `astro:before-swap`. Async work (lazy import) carries a token and checks `signal.aborted` and the token before touching the DOM.
3. **No `innerHTML` / `set:html` in client code.** Build DOM with `createElement` / `createElementNS` and `textContent`; set fills through CSSOM (`style.setProperty('fill', 'var(--avatar-...)')`), not attribute strings. All text comes from the class/job rules or `class-labels.ts`.
4. **Allow-list parsing.** Anything read from storage or the DOM (`localStorage` `portfolio-look`, `data-default-look`, input values, gear JSON) goes through `parseLookKey` / `parseClassId` / `parseMotif` / `parseGear`; only one of the 10 exact keys (e.g. `mage/data`, `adventurer`) is accepted, else ignored. Never pass raw text to the composer.
5. **Storage is optional.** Wrap every `localStorage` read/write in try/catch. Remove the key on Reset and when the saved look equals the GitHub pick; invalid or unreadable values are ignored and cleaned up when possible.
6. **Eager-import guard.** The stub (`class-job-switcher.ts`) and everything it statically imports (`class-looks.ts`, `class-labels.ts`, `switcher-body.ts`, rules files) must not reach `src/data/avatar/*`, `avatar-description`, `select-avatar-layers`, `compose-avatar-grid`, `avatar-svg-*`, `avatar-sticker*`, `gear-rules`, `look-avatar-model` or `look-apply-model`. Those load only through the dynamic `import('./look-apply-model')`. Guarded by `tests/unit/switcher-eager-imports.test.ts`.
7. **Failed import.** The browser caches a failed dynamic import, so the stub keeps the rejected promise and later changes fail fast: the control reverts to the last applied look and says "Couldn't switch class. Showing the GitHub pick." (or the applied look) until reload. Do not add retry loops.
8. **Pure modules** (`class-looks`, `class-labels`, `look-avatar-model`) follow the career-rpg rules above (`.ts` imports, erasable syntax, no DOM, no clock). Titles come from `characterTitle` (one source).
9. **Progressive enhancement.** Markup is in the server HTML but hidden until `data-ready`, and removed under `@media (scripting: none)`. Radio groups are built by the script on first open to keep the home HTML small. Status text is a polite `role="status"` region with reserved height (no layout shift).

## Testing

- Unit: `tests/unit/**/*.test.ts` (`node:test` + `node:assert`; 261 tests), runner `npm run test:unit`, Node >=22.18 (type stripping, so `.ts` specifiers and erasable syntax). Inputs via `career-fixtures.ts`, `github-snapshot-fixtures.ts`, `github-raw-fixtures.ts`, `avatar-test-helpers.ts`. Switcher: `class-looks`, `class-labels`, `look-avatar-model` (gear drawn on every look, same gear text, matches the server markup) and `switcher-eager-imports`. Add/adjust a unit test with every rule or weight change; assert against `xpRules`, not copied numbers where practical.
- E2E specs in `tests/e2e/*.spec.ts` (120 tests), shared helpers in `tests/e2e/test-helpers.ts` (switcher specs also use `switcher-helpers.ts`). Expected quests/boss come from `career-mirror.ts`, which reuses the engine's pure modules on the committed snapshot + override files: don't hardcode project lists in specs.
- Tests run against the production build (`astro preview`) so base-path bugs show.
- Add a spec when adding: a page, a new root flag, a new nav/link pattern.
- Do not skip or loosen failing tests to pass CI.

## Commits

Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`). Run `npm run check`, `npm run test:unit` and `npm run test:e2e` before push. Never commit secrets or `.env*`.
