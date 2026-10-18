# Scout 01: integration points for GitHub-derived character + avatar

Date: 2026-10-17. Source: direct reads (codebase-summary.md is fresh, same day). Full map: `docs/codebase-summary.md`.

## Career RPG engine (pure, `src/utils/career-rpg/`)
- `build-career-state.ts` (85 lines): `buildCareerState(inputs: CareerInputs, rules)` -> `CareerState`. Inputs: `quests`, `skills`, `changelog`, `profile`, `rawSources`, `now`. Validates (skills, quests, changelog) -> `CareerRuleError` aggregate; then scoreQuests (URL dedupe `seen` set, boss first), buildSkillTree, computeAttributeXp, levelInfo, computeStreak, evaluateCompleteness, pickTopAchievements.
- `career-types.ts` (153): `QuestInput` (difficulty, isBoss, skills, obstacles, metrics, evidence, body, isSample), `SkillNodeInput`, `ChangelogInput`, `ProfileInput`, `CareerState` {quests, boss, skillTree, attributes, level, streak, completeness, achievements}.
- `load-career-state.ts` (61): ONLY Astro-aware module: `getCollection('projects'|'changelog')`, `import.meta.glob` raw scan for `PLACEHOLDER_MARKER`, strict zod parse of `skillNodes`, `resolveBuildNow(process.env.CAREER_RPG_NOW)`. Memoized prod, uncached dev.
- Reusable pure helpers: `diminishing-returns.ts` (`decayedSum`, `normalizeEvidenceUrl`), `xp-and-level.ts` (attribute cap, level curve `base*(L-1)^exponent`, titles), `consistency-streak.ts` (ISO-week streak; currently takes changelog entries), `resolve-build-now.ts`.
- `profile-completeness.ts` (91): 10 HUD checks; several (placeholders, email, quest evidence) lose meaning after pivot.

## Rules: `src/data/xp-rules.ts` (94)
- `ATTRIBUTE_IDS = ['code-efficiency','ui-polish','communication','reliability']`; quest baseXp/tierCap per difficulty; skillEvidence; level curve; titles (Novice Coder..Principal Archmage); streak; completeness; speedrun.
- Pattern to copy for new `class-rules.ts`/`gear-rules.ts`: typed interface + single exported const, "retune here only".

## Content + schemas
- `src/content.config.ts`: strict zod `projects` (boss refine: exactly one isBoss) + `changelog`. Unknown keys fail build (F6).
- `src/data/career-schemas.ts`: httpsUrl, evidence, metric, skill node schemas.
- `src/content/projects/*.md` (3 placeholder: neon-dashboard, realtime-chat, cli-toolkit); `src/content/changelog/*.md` (3 entries, all 2026-10-17).
- `src/data/skills-data.ts`: hand-written skill nodes with evidence URLs.
- `src/data/site-config.ts`: socials include `https://github.com/xuanduynguyen96` (owner login source).

## Pixel icon system (pattern to extend for avatar)
- `src/data/pixel-icons.ts` (20): registry; `PIXEL_ICON_GRID = 8`; sizes 16/24/32/48; legend `#` ink, `+` shade, `.` empty. Only 2 tones, colored via `currentColor` + shade opacity (no multi-color palette yet).
- `src/utils/pixel-icon-path.ts` (30): `gridToPathData(grid, char)` run-length row merge -> `M{x} {y}h{w}v1h-{w}z`. Generic in grid size already (no 8 hardcode) -> reusable for 32x32 multi-palette layers (one path per palette key).
- `src/components/pixel-icon.astro` (50): inline SVG, `shape-rendering="crispEdges"`, aria-hidden unless `label` (role=img + aria-label).
- `src/data/pixel-icons-career.ts` (155) / `pixel-icons-hud.ts` (106): grids as `readonly string[]`; unit-tested (`tests/unit/pixel-icons*.test.ts`).
- `pixel-icon-gallery.astro` on `/credits/`: precedent for a gallery of all sprites (use for avatar combo gallery).

## UI consumers
- `sections/character-sheet-section.astro` (153): level/title, attribute bars (`xp-progress-bar`), HUD (`completeness-hud`), streak badge. Avatar slot goes here (and hero? speedrun?).
- `sections/skills-section.astro` (51) + `career-rpg/skill-tree-node.astro` (recursive).
- `sections/projects-section.astro` (36) + `project-card.astro`, `pages/projects/[slug].astro`, `boss-battle-panel.astro`.
- `pages/speedrun.astro`: top 3 achievements from verified quest metrics.

## CI: `.github/workflows/deploy-to-github-pages.yml`
- Triggers: push master, pull_request, workflow_dispatch, weekly cron `17 3 * * 1`. `permissions: contents: read`.
- Jobs: `verify` (check, unit, e2e w/ build) -> `build` (`withastro/action@v5`, builds again) -> `deploy`.
- Implications: fetch must run in BOTH verify+build or once and share artifact; PR runs from forks get no secrets -> must work from committed snapshot; `contents: read` only -> committing refreshed snapshot from CI needs `contents: write` (or avoid committing from CI).

## Tests
- Unit 116 (`node --test`, type stripping, no Astro) incl. pixel icon grids; `career-fixtures.ts` builders.
- e2e 86; mirrors content (`PROJECT_SLUGS`, `BOSS_SLUG`, `PROJECTS` array) in `tests/e2e/test-helpers.ts`, `project-detail-and-focus.spec.ts`, `quest-cards-and-boss.spec.ts`, `character-sheet-and-hud.spec.ts`, `skill-tree.spec.ts`, `speedrun-page.spec.ts`, `changelog-and-streak.spec.ts`, `pixel-icons.spec.ts`, `accessibility-axe.spec.ts`, `forced-colors.spec.ts`.

## Constraints (docs)
- Files <200 lines, kebab-case, TS strict + `erasableSyntaxOnly` (pure modules run in Node type stripping: no enums/namespaces/param props).
- NFR: Lighthouse >=95, CLS 0, axe 0 serious/critical both themes, works no-JS/reduced-motion, forced-colors frames visible, no third-party requests at runtime (fetch at build is fine), determinism (same inputs + `CAREER_RPG_NOW` => same output).
- PDR v1.1 non-goals to revise: "Third-party verification of evidence (self-attested)" -> now GitHub-derived.

## Unresolved
- Keep hand-written skill tree at all, or fully derive from languages/topics?
- Keep changelog streak, replace with commit-week streak, or show both?
