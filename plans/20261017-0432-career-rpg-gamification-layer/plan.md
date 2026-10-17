# Plan: Career RPG gamification layer (additive)

Created: 2026-10-17 · Status: **In progress (implementing via /code)** · Scout: [reports/01-codebase-scout-report.md](reports/01-codebase-scout-report.md) · Prior plan: [../20261017-0254-astro-portfolio-implementation/plan.md](../20261017-0254-astro-portfolio-implementation/plan.md)

## Goal
Gamified "Career RPG" layer on own static portfolio: Character Sheet, Project Quests + Boss Battle, Skill Tree, Recruiter Speedrun `/speedrun/`, Consistency Streak (changelog), HUD completeness. Additive: reuse `glass-card`, `section-heading`, tag/token styles. No backend, no reskin.

## Key Decisions
- XP/level/streak/completeness = **pure build-time fns** in `src/utils/career-rpg/`; all weights in ONE file `src/data/xp-rules.ts`
- Evidence-only scoring; content schemas `z.strictObject` -> `xp`/`level` keys rejected at build
- Anti-gaming: https-only URLs, global URL dedupe (1 URL = XP once site-wide), min body words gate, tier decay + caps, attribute caps
- `repoUrl`/`demoUrl` **migrated** into `evidence[]` (one source of truth; strict schema flags leftovers)
- Exactly one `isBoss` project; cross-entry rules thrown as aggregated `CareerRuleError` (build fails, clear msg)
- Unit tests: **`node:test` + Node 22 type stripping** (zero deps); pure modules use `.ts` import specifiers
- Deterministic "now": `CAREER_RPG_NOW` env (Playwright webServer + unit tests inject date)
- Streak refresh = weekly scheduled CI build (cron) in existing deploy workflow
- Native `<progress>` (labelled), `<details>` for missing list, nested `<ul>` skill tree: all work w/o JS
- Implementation on branch `feat/career-rpg-layer` (HEAD detached now). **No commits/push without user approval**

## Phases

| # | Phase | Priority | Effort | Status | Progress |
|---|---|---|---|---|---|
| 01 | [Rules config, pure scoring utils, unit runner](phase-01-rules-config-scoring-utils-unit-tests.md) | P0 | M | Done | 100% |
| 02 | [Content schema extensions + placeholder content](phase-02-content-schema-extensions.md) | P0 | M | Done | 100% |
| 03 | [Quests & Boss Battle UI](phase-03-quests-and-boss-battle-ui.md) | P0 | M | Planned | 0% |
| 04 | [Character Sheet + HUD completeness](phase-04-character-sheet-and-hud.md) | P0 | M | Planned | 0% |
| 05 | [Skill Tree](phase-05-skill-tree.md) | P1 | M | Planned | 0% |
| 06 | [Streak, changelog page, scheduled build](phase-06-streak-changelog-scheduled-build.md) | P1 | S | Planned | 0% |
| 07 | [Recruiter Speedrun route](phase-07-recruiter-speedrun-route.md) | P0 | S | Planned | 0% |
| 08 | [E2E, a11y, perf verification](phase-08-e2e-a11y-perf-verification.md) | P0 | M | Planned | 0% |
| 09 | [Docs update](phase-09-docs-update.md) | P1 | S | Planned | 0% |

## Dependencies
```
01 -> 02 -> 03 ─┐
          ├-> 04 ┼-> 07 -> 08 -> 09
          ├-> 05 ┤
          └-> 06 ┘
```
- 03/04/05/06 parallel-safe after 02 (disjoint file ownership: 03 cards/detail/sort, 04 index/character/HUD/streak-badge, 05 skills-section, 06 changelog page/footer/workflow). Only share: 06 reuses 04's `streak-badge.astro`.
- 07 needs 03 (achievements) + 04 (level/title UI); owns header + hero. 08 after 03-07. 09 after 08.
- Rollback: all work on feature branch; revert merge commit. Non-additive bits: projects `repoUrl/demoUrl` -> `evidence[]`, `skills-data.ts` shape.

## Definition of Done
- `npm run check`, `npm run test:unit`, `npm run build`, `npm run test:e2e` pass locally + CI
- Strict schemas reject `xp`/`level`/unknown keys; boss count != 1, bad skill parent/cycle, future changelog date -> build fails with named entry
- Unit coverage: xp, level, streak, completeness, skill-tree validation, achievements (happy + edge + failure)
- New pages `/speedrun/`, `/changelog/`: axe 0 serious/critical; no-JS + reduced-motion show all content
- Lighthouse >=95 all categories (home, project, speedrun), CLS 0
- All files <200 lines, kebab-case; docs + README updated
- Weekly cron build present; no secrets added

## Unresolved Questions
1. HUD completeness public to recruiters, or hide behind `siteConfig` flag once 100%/in prod? (default: shown)
2. Boss rule: exactly one (planned) vs at most one?
3. Title tone/names (e.g. "Novice Coder" -> "Principal Archmage") and attribute set (4 planned: Code Efficiency, UI Polish, Communication, Reliability) - confirm
4. Separate "class" from top attribute (e.g. UI Polish -> "Pixel Mage")? Planned: title from level only (YAGNI)
5. Changelog backdating can't be verified statically; accept, or cross-check git commit dates in CI later?
6. Nav: add only "Speedrun" (planned) or also "Character"/"Changelog"?
7. Cron day/time (planned Mon 03:17 UTC); note GitHub disables schedules after 60 days repo inactivity
8. Real evidence URLs/metrics: placeholders until user supplies (marked `TODO(content)`)
