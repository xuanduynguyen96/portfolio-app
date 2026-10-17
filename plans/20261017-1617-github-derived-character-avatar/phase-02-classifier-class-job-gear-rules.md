# Phase 02: Classifier + class/job/gear rules

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 01 (snapshot types), 00 (dry-run params) · Blocks: 03, 04 (selector), 05
- Inputs: [owner data](reports/01-owner-github-data-report.md), [researcher-01 §5](research/researcher-01-report.md), [spike report](reports/02-spike-results-report.md)
- Docs: `docs/code-standards.md#career-rpg-modules-srcutilscareer-rpg`, pattern `src/data/xp-rules.ts`

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: M (5h) · Implementation: Not started · Review: Not started
- Pure `classifyCharacter(snapshot, rules)` → class, job, archetype scores, ranked "why" signals; `computeGearTiers(snapshot, rules)` → 4 slot tiers + reasons. All numbers in 3 rules files ("retune here only").

## Key Insights
- Repo-count based: each repo votes <= 1 (x recency x activity), so one big repo or notebook bytes can't dominate.
- Owner public estimate (half-life 24 mo): frontend ~2.1 (portfolio-app TS, 3 HTML/JS sites, Xamarin) vs backend ~1.6 (C# x2, Java, aspnet) → **Archer · Warden**. Owner self-image Warrior → plan Q2. Tune only with generic rationale + fixtures.
- Job = class x motif. Motif = secondary archetype, or own archetype if pure → 3 motif props cover 9 jobs (DRY for art, phase 04).
- Floats: round scores to 3 decimals before compare → deterministic across platforms.
- Recency reference = `snapshot.asOf` (not build time) → class is a pure function of the snapshot.

## Requirements
- Classes: `warrior` (backend), `mage` (data), `archer` (frontend), `adventurer` (fallback, no job).
- Jobs (proposed names, rules data):

| Class \ motif | backend (banner) | data (crystal) | frontend (hawk) |
|---|---|---|---|
| Warrior | **Knight** (pure) | Spellblade | Vanguard |
| Mage | Battlemage | **Sorcerer** (pure) | Druid |
| Archer | Warden | Arcane Archer | **Ranger** (pure) |

- Gear slots:

| Slot | Axis | Repo signals (each counts once per repo) | Tier thresholds (repos) |
|---|---|---|---|
| armor | Security | `SECURITY.md` (root/.github/docs), dependabot config, workflow /codeql\|security\|scorecard/ | 1 / 2 / 4 |
| shield | Testing | root entry /^(tests?\|__tests__\|spec)$/i or /\.Tests?$/, workflow /test/ | 1 / 3 / 5 |
| boots | Automation | any workflow file, `Dockerfile`/compose, `Jenkinsfile`, topic/keyword docker\|ci\|jenkins | 1 / 3 / 5 |
| amulet | Docs | >=3 of: README, description, topics, license, `docs/`, https homepage | 1 / 3 / 5 |

- Signals: top 5 contributions to class archetype + top 2 to secondary, each `{repo, archetype, points, reason}`; reason text e.g. `C# (68% of code)`, `keyword "xamarin"`, `primary language`.

## Architecture
```ts
// src/data/character-class-rules.ts
export const ARCHETYPE_IDS = ['backend', 'data', 'frontend'] as const;   // order = final tie-break
export interface ClassRules {
  languages: Record<string, Partial<Record<ArchetypeId, number>>>;  // 'C#': {backend: 1}, 'TypeScript': {frontend: .8, backend: .2}
  languageWeight: Record<string, number>;   // HTML .5, CSS .5; default 1
  ignoredLanguages: readonly string[];      // Shell, Dockerfile, Makefile, PowerShell, Batchfile
  notebookKibCap: number;                   // Jupyter Notebook bytes cap
  minLanguageShare: number;                 // 0.1
  primaryLanguageBonus: number;             // 0.3
  keywords: readonly { match: string; archetype: ArchetypeId; points: number }[];  // xamarin→frontend 2, aspnet→backend 1
  recency: { halfLifeMonths: number; floor: number };   // 24, 0.25
  activity: { commitsLog10Scale: number; max: number }; // weight 1 + min(max, log10(1+commits)*scale)
  archivedFactor: number;                   // 0.5
  secondary: { minRatio: number; minScore: number };    // 0.35, 0.5
  fallback: { minTotal: number; minRepos: number };     // 1.0, 2
}
// src/utils/github-character/character-types.ts
export type ClassId = 'warrior' | 'mage' | 'archer' | 'adventurer';
export interface CharacterProfile {
  classId: ClassId; className: string;
  jobId: string | null; jobName: string | null; motif: ArchetypeId | null;
  scores: Record<ArchetypeId, number>; primary: ArchetypeId | null; secondary: ArchetypeId | null;
  signals: ClassSignal[];
  gear: GearSlotResult[];   // [{slot, axis, label, tier: 0|1|2|3, repos: string[]}]
}
```
```
repoVote(repo):
  tokens = topics ∪ split(name) ∪ words(description)            (lowercase)
  langs  = languages − ignored; Jupyter kib = min(kib, cap); share = kib/Σ; keep share >= minShare
  raw[a] = Σ share·languages[l][a]·languageWeight[l] + (primary bonus) + Σ keyword points
  vote   = scaleToMax1(raw) · recency(pushedWeek, asOf) · activity(commits) · (archived ? f : 1)
classify: scores = round3(Σ votes); total < minTotal || votingRepos < minRepos → adventurer
  primary = argmax (tie: more repos where it is top, then ARCHETYPE_IDS order)
  secondary = 2nd if s2 >= minRatio·s1 && s2 >= minScore else null; motif = secondary ?? primary
```

## Related Code Files
Create:
- `/home/user/portfolio-app/src/data/character-class-rules.ts`, `/home/user/portfolio-app/src/data/character-job-rules.ts` (class labels, job table, motif ids), `/home/user/portfolio-app/src/data/gear-rules.ts`
- `/home/user/portfolio-app/src/utils/github-character/character-types.ts`
- `/home/user/portfolio-app/src/utils/github-character/repo-tokens.ts` (tokenize name camel/snake, description, topics)
- `/home/user/portfolio-app/src/utils/github-character/repo-archetype-vote.ts`
- `/home/user/portfolio-app/src/utils/github-character/archetype-scores.ts` (sum + signals)
- `/home/user/portfolio-app/src/utils/github-character/classify-character.ts`
- `/home/user/portfolio-app/src/utils/github-character/gear-tiers.ts`
- `/home/user/portfolio-app/scripts/explain-character.ts` (prints profile from committed snapshot; `npm run character:explain`)
- Tests: `/home/user/portfolio-app/tests/unit/github-snapshot-fixtures.ts` (builders: `ownerLike`, `pureMage`, `pureArcher`, `sparse`, `tie`, `xamarinOnly`, `noLanguageAspnet`, `notebookHeavy`), `classify-character.test.ts`, `repo-archetype-vote.test.ts`, `gear-tiers.test.ts`, `character-rules.test.ts`
Modify: `/home/user/portfolio-app/package.json` (script `character:explain`)

## Implementation Steps
1. Rules files with typed interfaces + single exported const (copy `xp-rules.ts` style; `as const` id arrays, no enums).
2. `repo-tokens.ts`: `QrCodeScanner` → `qr code scanner`; `aspnet_framework_docker_ex` → `aspnet framework docker ex`.
3. `repo-archetype-vote.ts`: returns `{ vote: Record<ArchetypeId, number>, reasons: ClassSignal[] }`; zero vote when no language and no keyword.
4. `archetype-scores.ts` + `classify-character.ts` per pseudocode; signals sorted points desc, then repo name.
5. `gear-tiers.ts`: per slot, set of repos matching any signal; tier = thresholds reached; result keeps matched repo names for legend tooltip/why.
6. `character-rules.test.ts`: 9 unique job ids, each class has 3 jobs (one pure), every motif used 3x, thresholds ascending, keyword matches lowercase, no language in both `languages` and `ignoredLanguages`.
7. Classifier tests: each fixture → expected class/job; tie → deterministic by order; sparse → adventurer; Xamarin C# repo votes frontend; no-language aspnet repo votes backend via keyword; notebook capped; fork/private never present (01 guarantee) but classifier ignores `isArchived` weight correctly; recency uses `asOf` (same snapshot, different build `now` → same result).
8. Gear tests: zero signals → all tier 0; thresholds boundaries; signal counted once per repo.
9. Run `npm run character:explain` on committed snapshot; paste output in `reports/03-classifier-dry-run-report.md`; **user confirms** (Q2) before 03.

## Todo List
- [ ] 3 rules files
- [ ] tokens, vote, scores, classify, gear modules
- [ ] fixtures + 4 test files
- [ ] explain script + dry-run report
- [ ] user confirmation of owner result

## Success Criteria
- All fixtures classify as expected; comparison profiles from 00 still pass with final params
- Same snapshot → identical `CharacterProfile` (deep equal) for any `now`
- Each module <200 lines; no magic numbers outside rules files

## Risk Assessment
- Rules overfit owner → fixture suite of other archetypes guards; changes need fixture update + rationale comment.
- Language map gaps (unknown language) → ignored with zero weight; test that unknown never throws.
- Keyword false positives ("api" in description) → points small, capped by per-repo max 1.

## Security Considerations
- Pure functions on committed data; descriptions are plain text, rendered escaped by Astro (no `set:html`).

## Next Steps
- 03 adds `character` to `CareerState`; 04 maps `classId`/`motif`/gear tiers to layers.
- Unresolved: job names (Q4); amulet slot (Q5); owner class acceptance (Q2).
