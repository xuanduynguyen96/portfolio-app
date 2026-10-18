# Plan: GitHub-derived character + layered pixel avatar

Created: 2026-10-17 · Status: **Implemented; pending merge, live refresh run, blind-ID** · Branch: `feat/github-derived-character` · Inputs: [scout](scout/scout-01-report.md), [research 01 GitHub](research/researcher-01-report.md) (verified in 00), [research 02 avatar](research/researcher-02-report.md), [owner data](reports/01-owner-github-data-report.md) · Prior: [career RPG](../20261017-0432-career-rpg-gamification-layer/plan.md), [theme](../20261017-0821-rpg-theme-redesign/plan.md)

## Goal
Career RPG data (character sheet, skills, XP, quests, streak) derived from owner's public GitHub (committed snapshot, build-time only). Layered 32x32 pixel avatar: class, job, gear readable instantly, no text needed. Hand-written About/Experience/Contact/hero copy stays. Fun tone + "based on public GitHub activity" note.

## Key Decisions
- Snapshot `src/data/github/github-snapshot.json` = only build/test input. Normalized, sorted, `asOf` = ISO-week Monday (no per-run volatility). Public repos only
- Refresh: `refresh-github-snapshot.yml` (weekly + dispatch) runs `scripts/fetch-github-snapshot.ts` (GraphQL, GITHUB_TOKEN then PAT fallback, any failure → keep snapshot, warn, exit 0) → commit if changed → **dispatch deploy via `gh workflow run`** (GITHUB_TOKEN pushes do not trigger `push` workflows). Deploy cron moves here. Deploy never fetches
- Verified this session: GraphQL **403 from Claude sessions** (REST OK) → phase 00 verifies in Actions on a `spike/**` branch push. REST shows `portfolio-app` = 127 KB Python from `.claude/` tooling → `.gitattributes` `linguist-vendored` + per-repo vote cap
- Classifier pure + data-driven (`character-class-rules.ts`, `character-job-rules.ts`, `gear-rules.ts`). Archetypes backend/data/frontend → Warrior/Mage/Archer; Job = class x motif of secondary (or own, if pure) → 9 jobs; Adventurer fallback. Deterministic tie-break, ranked "why" signals
- Gear: armor=security, shield=testing, boots=automation (CI/Docker), amulet=docs; tiers 0-3 from repo-count thresholds
- Engine: pure modules + `CareerRuleError` + `CAREER_RPG_NOW` kept; `load-career-state.ts` only Astro-aware. Quests = top repos (+ optional case-study override md per repo, strict). Skills = taxonomy with match rules, evidence = matched repos. Streak = ISO-week contribution streak. HUD checks revised
- Avatar: hand-authored TS grids (no LPC), layers base → class → job prop → gear → fx, last opaque wins, one `<path>` per palette key via existing `gridToPathData`, inline SVG at build, zero client JS, sizes 128/192/256, CSS-only bob gated, legend + nameplate + why carry meaning
- Honesty rule: rules tuned generically (fixtures for other profiles), never per-owner hardcode

## Phases

| # | Phase | Priority | Effort | Status | Progress |
|---|---|---|---|---|---|
| 00 | [Spike: live query verify, classifier dry-run, 3 silhouettes](phase-00-spike-live-query-classifier-dry-run-silhouettes.md) | P0 | M (4h) | Done ([report](reports/02-spike-results-report.md)); art direction approved (sticker, side view, action poses) | 100% |
| 01 | [GitHub fetcher, normalized snapshot, refresh workflow](phase-01-github-fetcher-snapshot-refresh-workflow.md) | P0 | M (5h) | Done, reviewed (live run after merge) | 95% |
| 02 | [Classifier + class/job/gear rules](phase-02-classifier-class-job-gear-rules.md) | P0 | M (5h) | Done, reviewed ([dry-run](reports/03-classifier-dry-run-report.md)) | 100% |
| 03 | [Engine rewire: repo quests, taxonomy, streak, HUD, overrides](phase-03-career-engine-rewire.md) | P0 | L (8h) | Done, reviewed | 100% |
| 04 | [Avatar sprite system: grids, palette, composer, tests](phase-04-avatar-sprite-system.md) | P0 | L (10h, half drawing) | Done, reviewed ([sheet](reports/assets/05-avatar-sheet.png)) | 100% |
| 05 | [UI integration: hero, sheet, speedrun, legend, why, projects](phase-05-avatar-and-character-ui-integration.md) | P0 | L (7h) | Done, reviewed ([hero](reports/assets/05-hero-desktop.png)) | 100% |
| 06 | [Verification: tests, perf, a11y, blind-ID](phase-06-verification-tests-perf-a11y-blind-id.md) | P0 | M (4h) | Automated done ([report](reports/04-verification-report.md)); live refresh + blind-ID pending | 80% |
| 07 | [Docs update](phase-07-docs-update.md) | P1 | S (3h) | Done (README + 7 docs + changelog entry) | 100% |

Progress: 7/8 done (00-05, 07); 06 automated checks done, live refresh run + human blind-ID pending. Decisions taken (user "go ahead" = defaults): Q1 public-only, Q2 half-life 48 → Warrior · Vanguard. Gates: user reviews owner dry-run class (end 00) and avatar prototypes (end 00, end 04).

## Dependencies
```
00 ─→ 01 ─→ 02 ─→ 03 ─→ 05 ─→ 06 ─→ 07
 └──────────→ 04 (grids/composer) ─┘   (04 selector needs 02 types)
```
- 04 grids + composer start after 00 in parallel with 01-03 (disjoint files: `src/data/avatar/*`, `src/utils/avatar/*`). 04 `select-avatar-layers.ts` waits for 02
- Each phase ends green: `npm run check`, `npm run test:unit`, `npm run test:e2e`
- Rollback: branch-only; refresh workflow can be disabled in UI; snapshot revert = `git revert` of data commit

## Definition of Done
- Snapshot + refresh workflow live, verified on a real run (changed, unchanged, no-token paths)
- Owner avatar on hero, sheet, `/speedrun/`; blind-ID >=80% class in <=2s
- check/unit/e2e green; axe 0 serious/critical both themes; Lighthouse >=95 (keep 98+), CLS 0; no-JS, reduced-motion, forced-colors, 360px OK
- Files <200 lines, kebab-case, erasable TS; docs updated

## Unresolved Questions
1. ~~Private repos~~: public-only (default taken).
2. ~~Owner class~~: half-life 48 → Warrior · Vanguard (default taken; 24 would give Archer · Warden).
3. Contribution calendar may include private contribution counts (profile setting): aggregate only, OK?
4. Job names final? (Knight, Spellblade, Vanguard, Sorcerer, Battlemage, Druid, Ranger, Warden, Arcane Archer)
5. 4th gear slot (amulet = docs) or 3 slots only?
6. Delete 3 placeholder projects; who writes `portfolio-app` case-study override (draft by agent, owner review)?
7. Master branch protection? Bot commit would need bypass or PR flow
8. Regenerate OG image from avatar now or defer (planned: defer)?
9. `/changelog/` stays as content but no longer feeds streak: OK, or retire page?
10. Blind-ID: who are the 5 testers?
