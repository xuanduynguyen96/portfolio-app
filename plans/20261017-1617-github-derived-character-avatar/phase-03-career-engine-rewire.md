# Phase 03: Engine rewire: repo quests, skill taxonomy, streak, HUD, overrides, schemas

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 01, 02 · Blocks: 05
- Inputs: [scout](scout/scout-01-report.md), [owner data](reports/01-owner-github-data-report.md)
- Docs: `docs/system-architecture.md#career-rpg-pipeline`, `docs/code-standards.md#content-collection`, `README.md#career-rpg`

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: L (8h) · Implementation: Not started · Review: Not started
- Replace self-attested inputs with snapshot-derived ones. Keep engine shape (pure modules, `buildCareerState`, `CareerRuleError`, `CAREER_RPG_NOW`, memoized loader). Minimal UI edits only to keep build/e2e green; new visuals in 05.

## Key Insights
- Old quest gates (body words, unique evidence URL) are meaningless for repos → quest XP from repo facts; case-study override adds bonus. Tier decay + caps + `quests.max` remain the anti-farming guard.
- Placeholder projects (`neon-dashboard`, `realtime-chat`, `cli-toolkit`) are not real repos → delete with covers.
- Repo names `QrCodeScanner`, `aspnet_framework_docker_ex` → slugs `qr-code-scanner`, `aspnet-framework-docker-ex` (camel + snake split, lowercase). Override filename = slug.
- Streak: reuse `weekStartUtc` + run logic, input = ISO weeks with contributions >= threshold.
- e2e mirrors (`PROJECT_SLUGS`, `BOSS_SLUG`) must come from the same pure selector over the committed snapshot (DRY, no drift).

## Requirements
- Quests: top `quests.max` (6) public repos by `questScore` + every repo with an override; boss = override `isBoss` (max 1) else first pinned public repo else top score.
- Difficulty from rules: commits/KiB thresholds → side/main/raid. Skills = taxonomy ids matched by repo (max 6). Evidence = repo URL (+ https homepage as `demo`).
- Quest XP = `baseXp[d] x (1 + Σ bonuses)`: description, homepage, tests signal, CI signal, case study (override body >= `minBodyWords` + `minUniqueWords`), override metrics/obstacles, boss. Status: `'derived' | 'case-study'`.
- Derived metrics per quest: commits, languages count, KiB of code (+ override metrics) → feed speedrun achievements (`isSample` false).
- Override schema (`projects` collection, strict): `title?`, `summary?` (<=160), `tags?`, `cover?`, `coverAlt` (required with cover), `featured?`, `order?`, `isBoss?`, `obstacles` (<=6), `metrics` (<=6), body. Removed keys fail: `difficulty`, `skills`, `evidence`, `xp`, `level`, `repoUrl`, `demoUrl`. Cross-entry: slug must match a snapshot repo; <=1 `isBoss`; slug collisions error.
- Skill taxonomy: node `{id, label, attribute, parent?, match?: {languages?, topics?, keywords?, files?}}`; hand-set `evidence` key rejected. Evidence = matched repo URLs (+ verified quests rollup unchanged). URL-reuse-across-skills rule dropped (one repo legitimately matches many skills).
- Streak: consecutive ISO weeks with `count >= streak.minWeeklyContributions` (1); open current week rule kept; relative to build `now`.
- HUD (10 checks): no-placeholders, real-email, bio-length, availability, socials (kept); **new** snapshot-fresh (`asOf` within `completeness.maxSnapshotAgeDays` of now), quest-descriptions (every quest repo has description), quest-topics (every quest repo >=1 topic), boss-case-study (boss has override body), streak-alive. Dropped: quest-evidence, quest-verified, quest-metrics, skill-evidence.
- `CareerState` adds `character: CharacterProfile`, `snapshotAsOf: string`, `githubUrl: string`.

## Architecture
```ts
export interface CareerInputs {
  snapshot: GithubSnapshot; overrides: QuestOverrideInput[]; skills: SkillNodeInput[];
  changelog: ChangelogInput[];   // validated only (future dates), not scored
  profile: ProfileInput; rawSources: Record<string, string>; now: Date;
}
// src/utils/github-character/repo-quests.ts
export function selectQuestRepos(s: GithubSnapshot, overrides: readonly QuestOverrideInput[], rules?): SnapshotRepo[];
export function toRepoSlug(name: string): string;
export function repoToQuestInput(repo, override | undefined, skills, rules): QuestInput;
```
```
load-career-state.ts: import snapshot JSON → githubSnapshotSchema.parse → getCollection('projects') as overrides
  → buildCareerState: validate(overrides vs snapshot, skills, changelog) → classifyCharacter + computeGearTiers
  → quests (repo-quests + quest-scoring) → skill tree (match) → attributes → level → commit streak → HUD → achievements
```

## Related Code Files
Create:
- `/home/user/portfolio-app/src/utils/github-character/repo-quests.ts`, `/home/user/portfolio-app/src/utils/github-character/repo-skill-matches.ts`
- `/home/user/portfolio-app/src/utils/career-rpg/validate-quest-overrides.ts`
- `/home/user/portfolio-app/src/content/projects/portfolio-app.md` (boss case-study override, agent draft, `TODO(content)` until owner review, Q6)
- Tests: `/home/user/portfolio-app/tests/unit/repo-quests.test.ts`, `/home/user/portfolio-app/tests/unit/validate-quest-overrides.test.ts`
Modify:
- `src/utils/career-rpg/build-career-state.ts`, `career-types.ts` (split override/quest types to `quest-types.ts` if >200), `load-career-state.ts`, `quest-scoring.ts`, `skill-tree.ts`, `consistency-streak.ts` (export `computeWeekStreak(weekStarts, now)`; `computeContributionStreak(weeks, now, rules)`; changelog validator kept), `profile-completeness.ts`, `speedrun-achievements.ts`, `evidence-links.ts`
- `src/data/xp-rules.ts` (`quests` block: max, difficulty thresholds, bonuses; `streak.minWeeklyContributions`; drop `streak.minBodyWords`; `completeness.maxSnapshotAgeDays`)
- `src/data/career-schemas.ts` (`skillNodeSchema` with `match`, no `evidence`; `questOverrideSchema`), `src/content.config.ts` (projects = overrides; changelog comment: not streak)
- `src/data/skills-data.ts` (taxonomy for owner's real stack: TS, JS, C#, Java, Python, HTML, CSS; Astro, React, Xamarin/mobile; ASP.NET/.NET, Spring; GitHub Actions, Docker, Jenkins, Playwright; Technical Writing via docs files)
- `src/pages/projects/[slug].astro` (`getStaticPaths` from `state.quests`; override body via `render()` if present, else derived summary), `src/components/project-card.astro`, `src/components/career-rpg/boss-battle-panel.astro` (status text only)
- Unit tests: `build-career-state`, `quest-scoring`, `skill-tree`, `consistency-streak`, `profile-completeness`, `speedrun-achievements`, `career-schemas`, `career-fixtures.ts`
- e2e: `tests/e2e/test-helpers.ts` (`PROJECT_SLUGS`/`BOSS_SLUG` via `selectQuestRepos(snapshot)`), `quest-cards-and-boss`, `project-detail-and-focus`, `character-sheet-and-hud`, `skill-tree`, `speedrun-page`, `changelog-and-streak`
Delete:
- `src/content/projects/neon-dashboard.md`, `realtime-chat.md`, `cli-toolkit.md`; `src/assets/projects/*-cover.svg` (3)

## Implementation Steps
1. Rules additions in `xp-rules.ts` (typed); update `XpRules` interface.
2. `toRepoSlug` + `selectQuestRepos` (score = class vote total + activity + hygiene; deterministic sort score desc, name asc) + tests incl. collision.
3. `repo-skill-matches.ts`: node matches repo if any language (share >= rules min) / topic / token keyword / root file matches.
4. Rewrite `quest-scoring.ts` around repo facts; keep tier decay/cap helpers from `diminishing-returns.ts`.
5. `skill-tree.ts`: evidence from matches; keep level thresholds, rollup, cycle/parent validation; remove URL-reuse validator.
6. Streak refactor: extract `computeWeekStreak`; old changelog-streak tests rewritten for contribution weeks (fixtures with gaps, open week, `CAREER_RPG_NOW`).
7. HUD checks per Requirements; tests per check.
8. Schemas + override validator (aggregated `RuleIssue`s; message names slug + reason).
9. Loader: JSON import + strict parse; overrides mapping; pass `snapshot`; keep memoization.
10. Delete placeholders; write `portfolio-app.md` override (>=150 words, facts from this repo).
11. Minimal component/page edits to compile; update e2e mirrors; run check + unit + e2e.

## Todo List
- [ ] rules + types
- [ ] repo-quests, skill matches, quest scoring
- [ ] skill tree, streak, HUD, achievements
- [ ] schemas, override validator, loader
- [ ] placeholders removed, boss override drafted
- [ ] unit + e2e mirrors updated; all green

## Success Criteria
- Build uses only committed snapshot + overrides; network off → build passes
- Hand-set `evidence` on skill node, `difficulty` in override, or unknown override slug → build fails with clear `CareerRuleError`
- `CAREER_RPG_NOW=2026-10-17` builds twice → identical `dist/` HTML

## Risk Assessment
- Large blast radius (types ripple into components) → do engine + tests first, then compile fixes; keep commits per step.
- Owner level may look low → tune `quests`/curve so owner lands >= Lv 5 only via generic rules; fun copy for low levels.
- Removing `minBodyWords` streak rule changes README/docs → tracked in 07.

## Security Considerations
- Repo descriptions/topics rendered as text only; homepage links https-only (schema) with `rel="noopener noreferrer"`.
- Strict zod on snapshot prevents a hand-edited JSON from injecting unexpected keys.

## Next Steps
- 05 renders `character`, gear, derived quests. Unresolved: keep `/changelog/` (Q9); override draft owner review (Q6).
