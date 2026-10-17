# Phase 01: Rules Config, Pure Scoring Utils, Unit Test Runner

## Context Links
- Parent: [plan.md](plan.md) · Depends on: none (first phase) · Scout: [reports/01-codebase-scout-report.md](reports/01-codebase-scout-report.md)
- Docs: `docs/code-standards.md`, `docs/system-architecture.md`, https://nodejs.org/docs/latest-v22.x/api/test.html, https://nodejs.org/docs/latest-v22.x/api/typescript.html

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: M · Implementation: Not started · Review: Not reviewed
- One rules file + framework-free scoring modules (XP, level, skill-tree validation, streak, completeness, achievements) + `node:test` unit runner + CI step. No UI.

## Key Insights
- Node v22.22 strips TS natively (`process.features.typescript === 'strip'`); probe: `node --test "*.test.ts"` passes, extensionless relative import fails `ERR_MODULE_NOT_FOUND`.
- => Pure modules: explicit `.ts` specifiers, `import type` for types, erasable syntax only (no `enum`, `namespace`, ctor param properties).
- Must NOT import `astro:content`, `astro:assets`, `import.meta.env`, `with-base-path.ts` (Vite-only). Astro-aware wiring lives in phase 02 loader.
- Runner choice: **node:test** vs Vitest:
  - node:test: 0 deps, already in Node 22, fast, matches "add deps only when needed". Cost: `.ts` specifiers, no `astro:*` (we don't want them in pure fns anyway).
  - Vitest: extensionless imports, nicer watch/coverage, `getViteConfig` for astro modules; +1 devDep tree, slower cold start.
  - Pick node:test. Revisit only if tests need astro modules (they shouldn't).
- Diminishing returns + caps are the core anti-gaming lever; all numbers in `xp-rules.ts` so tuning never touches logic.

## Requirements
- Functional: rules config; pure fns for quest XP, skill-node XP + level, attribute totals, level curve + title, skill-tree validation (unique ids, parent refs, cycles, quest->skill refs), ISO-week streak with injected `now`, completeness checklist, top-3 achievements, aggregated rule errors.
- Non-functional: deterministic (no `Date.now()` inside fns), each file <200 lines, kebab-case, TS strict, `npm run test:unit` <5s.

## Architecture
```
src/data/xp-rules.ts                       ALL weights, caps, thresholds, titles, enums (as const tuples)
src/utils/career-rpg/
  career-types.ts                          input/output types only (QuestInput, SkillNodeInput, ChangelogInput, CareerState, RuleIssue)
  count-words.ts                           countWords(markdown): strips code fences, inline code, md syntax, urls
  diminishing-returns.ts                   decayedSum(values, decay, cap), normalizeEvidenceUrl(url)
  quest-scoring.ts                         scoreQuest(), applyTierDecay(), validateQuestLog() (boss rule, dup ids)
  skill-tree.ts                            validateSkillTree(), buildSkillTree() (nested), skillNodeLevel()
  xp-and-level.ts                          computeAttributeXp(), xpForLevel(), levelFromXp(), titleForLevel()
  consistency-streak.ts                    weekStartUtc(), computeStreak(dates, now)
  profile-completeness.ts                  evaluateCompleteness(snapshot) -> {percent, items, missing}
  speedrun-achievements.ts                 pickTopAchievements(quests, n)
  build-career-state.ts                    pure orchestrator -> CareerState; throws CareerRuleError(issues[])
tests/unit/*.test.ts                       node:test + node:assert/strict
```
Flow: `inputs + rules + now` -> validate (collect issues) -> throw if issues -> score quests (sorted boss>featured>order>title, global seen-URL set) -> skill XP (pre-order, same seen set) -> attributes (capped) -> total -> level/title/progress -> streak -> completeness -> achievements -> `CareerState`.

### `xp-rules.ts` sketch (values = starting point, tune later)
```ts
export const ATTRIBUTE_IDS = ['code-efficiency', 'ui-polish', 'communication', 'reliability'] as const;
export const QUEST_DIFFICULTIES = ['side', 'main', 'raid'] as const;
export const EVIDENCE_TYPES = ['repo', 'demo', 'figma', 'article', 'other'] as const;
export const PLACEHOLDER_MARKER = ['TODO', '(content)'].join(''); // split so this file never self-matches grep/scan
export const xpRules = {
  attributes: { 'code-efficiency': 'Code Efficiency', 'ui-polish': 'UI Polish', communication: 'Communication', reliability: 'Reliability' },
  attributeCap: 2500,
  quest: { baseXp: { side: 100, main: 250, raid: 500 }, minBodyWords: 150, metricBonus: 0.25, obstacleBonus: 0.1, bossBonus: 0.5,
           tierDecay: 0.8, tierCap: { side: 300, main: 1000, raid: 1500 } },
  skillEvidence: { xpPerUrl: 40, decay: 0.7, nodeCap: 120, levelThresholds: [1, 3, 6] }, // node level 0..3
  level: { base: 100, exponent: 1.5, max: 50 },
  titles: [ { minLevel: 1, title: 'Novice Coder' }, { minLevel: 5, title: 'Journeyman Engineer' },
            { minLevel: 10, title: 'Senior Adventurer' }, { minLevel: 20, title: 'Principal Archmage' } ],
  streak: { minBodyWords: 40 },
  completeness: { minBioWords: 60, placeholderEmailDomains: ['example.com', 'example.org', 'example.net', 'test'] },
  speedrun: { achievements: 3, countdownSeconds: 60 },
} as const;
```

### Pseudocode: XP formula
```
norm(url) = URL(url): lowercase host, drop hash, drop utm_* params, strip trailing "/"
seen = Set()                                   // global: a URL earns XP once site-wide
for q in sortQuests(quests):                   // boss > featured > order > title (deterministic)
  fresh = unique(q.evidence.map(e => norm(e.url))).filter(u => !seen.has(u))
  words = countWords(q.body)
  if fresh.empty or words < R.quest.minBodyWords: q.raw = 0; q.verified = false; q.reason = 'no-new-evidence' | 'body-too-short'
  else: fresh.forEach(seen.add); q.verified = true
        mult = 1 + (q.metrics.length ? metricBonus : 0) + (q.obstacles.length ? obstacleBonus : 0) + (q.isBoss ? bossBonus : 0)
        q.raw = baseXp[q.difficulty] * mult
for tier in QUEST_DIFFICULTIES:                // tier decay + cap
  qs = quests in tier sorted by raw desc; eff_i = raw_i * tierDecay^i
  if sum(eff) > tierCap[tier]: scale every eff_i by tierCap[tier] / sum(eff)
attr = {id: 0 for id in ATTRIBUTE_IDS}
for q in verified quests: share = q.eff / q.skills.length; for s in q.skills: attr[node(s).attribute] += share
for n in preorder(tree):                       // skill evidence
  fresh = unique(n.evidence.map(norm)).filter(u => !seen.has(u)); fresh.forEach(seen.add)
  attr[n.attribute] += decayedSum(fresh.map(() => xpPerUrl), decay, nodeCap)
decayedSum(vs, d, cap) = min(cap, Σ_i sortDesc(vs)[i] * d^i)
attrXp[id] = round(min(attributeCap, attr[id])); totalXp = Σ attrXp
```
Bound: 10 tiny side quests => ≤ tierCap.side (300) regardless of count; pasting one URL into 20 skills => 40 XP once.

### Pseudocode: level curve
```
xpForLevel(L) = L <= 1 ? 0 : round(base * (L - 1) ** exponent)   // L2=100, L5=800, L10=2700, L20=8282
levelFromXp(xp): L = 1; while L < max and xp >= xpForLevel(L + 1): L++; return L
progress = L == max ? 1 : (xp - xpForLevel(L)) / (xpForLevel(L + 1) - xpForLevel(L))
titleForLevel(L) = last titles[] entry with minLevel <= L
```

### Pseudocode: skill node level + validation
```
validate: ids unique + kebab; every parent exists; no cycles (walk parent chain, visited set, report path a -> b -> a);
          every attribute in ATTRIBUTE_IDS; every quest.skills id exists
evidenceSet(n) = norm(own urls) ∪ {"quest:" + q.id for verified q linking n} ∪ evidenceSet(children)   // roll-up
skillNodeLevel(n) = count of levelThresholds t where |evidenceSet(n)| >= t     // 0 = locked, max 3
```

### Pseudocode: streak (inject now)
```
DAY = 86_400_000; WEEK = 7 * DAY
weekStartUtc(d) = Date.UTC(d.y, d.m, d.d) - ((d.getUTCDay() + 6) % 7) * DAY   // Monday 00:00 UTC (ISO week)
if any entry.date > now: issue 'changelog <id>: date in future'
weeks = Set(entries.filter(words >= R.streak.minBodyWords).map(e => weekStartUtc(e.date)))
cursor = weekStartUtc(now); if !weeks.has(cursor): cursor -= WEEK       // grace: current week still open
current = 0; while weeks.has(cursor): current++; cursor -= WEEK
longest = max run in sorted(weeks) where consecutive diff == WEEK
return { current, longest, lastEntryDate, totalWeeks: weeks.size }
```
UTC week-start arithmetic avoids ISO-year (week 53) edge cases; diff == WEEK is DST-proof in UTC.

### Pseudocode: completeness
```
items = [
  { id: 'no-placeholders', label: 'No TODO(content) placeholders left', passed: placeholderFileCount == 0 },
  { id: 'real-email',      label: 'Real contact email',                  passed: domain(email) not in placeholderEmailDomains },
  { id: 'bio-length',      label: `Bio >= ${minBioWords} words`,        passed: countWords(bio.join(' ')) >= minBioWords },
  { id: 'availability',    label: 'Availability note set',               passed: availability.note.trim() != '' },
  { id: 'socials',         label: 'At least one social link',            passed: socials.length >= 1 },
  { id: 'quest-evidence',  label: 'Every project has evidence',          passed: quests.every(q => q.evidence.length > 0) },
  { id: 'quest-verified',  label: 'Every case study meets word minimum', passed: quests.every(q => q.verified) },
  { id: 'quest-metrics',   label: 'Every project has a metric',          passed: quests.every(q => q.metrics.length > 0) },
  { id: 'skill-evidence',  label: 'Every leaf skill has evidence',       passed: leaves.every(n => evidenceSet(n).size > 0) },
  { id: 'streak-alive',    label: 'Changelog entry this or last week',   passed: streak.current > 0 },
]
percent = round(100 * passedCount / items.length); missing = items.filter(i => !i.passed)
```

### Achievements
```
candidates = [boss, ...featured.filter(!boss).sortBy(eff desc)]; pick first metric per candidate, then 2nd metrics round-robin, until n
achievement = { questId, questTitle, label, value, unit }
```

## Related Code Files
Create:
- `/home/user/portfolio-app/src/data/xp-rules.ts`
- `/home/user/portfolio-app/src/utils/career-rpg/{career-types,count-words,diminishing-returns,quest-scoring,skill-tree,xp-and-level,consistency-streak,profile-completeness,speedrun-achievements,build-career-state}.ts`
- `/home/user/portfolio-app/tests/unit/{count-words,diminishing-returns,quest-scoring,skill-tree,xp-and-level,consistency-streak,profile-completeness,speedrun-achievements,build-career-state}.test.ts`
- `/home/user/portfolio-app/tests/unit/career-fixtures.ts` (shared input builders)
Modify:
- `/home/user/portfolio-app/package.json`: `"test:unit": "node --test --disable-warning=ExperimentalWarning \"tests/unit/**/*.test.ts\""`
- `/home/user/portfolio-app/tsconfig.json`: ensure `allowImportingTsExtensions: true` (verify Astro strict preset) + `erasableSyntaxOnly: true`
- `/home/user/portfolio-app/.github/workflows/deploy-to-github-pages.yml`: verify job step `npm run test:unit` after `npm run check`

## Implementation Steps
1. `git switch -c feat/career-rpg-layer`; `npm ci` (node_modules absent in checkout).
2. Inspect `node_modules/astro/tsconfigs/{base,strict}.json`; add missing `allowImportingTsExtensions`/`erasableSyntaxOnly` to `tsconfig.json`. Run `npm run check` (baseline 0 errors).
3. Write `xp-rules.ts` (sketch above). `PLACEHOLDER_MARKER` built by join so README `grep` + raw scan never hit it.
4. Write `career-types.ts` (types only). Inputs are plain data (no `CollectionEntry`): `QuestInput {id,title,difficulty,isBoss,featured,order,skills,obstacles,metrics,evidence,body}`, `SkillNodeInput {id,label,attribute,parent?,evidence}`, `ChangelogInput {id,date,summary,body}`, `ProfileInput {email,bio,socials,availability}`.
5. Implement modules bottom-up: count-words -> diminishing-returns -> skill-tree -> quest-scoring -> xp-and-level -> consistency-streak -> profile-completeness -> speedrun-achievements -> build-career-state. Each fn takes `rules` param defaulting to `xpRules` (tests can pass tweaked rules).
6. `CareerRuleError extends Error` (plain class field, no param properties) with `issues: RuleIssue[]`; message lists all issues `- <source> <id>: <problem>`.
7. Tests per module: happy, edge, failure. Must-haves:
   - XP: 10 side quests <= tierCap; duplicate URL across quests earns once; body below min => 0 + reason; boss bonus applied; attribute cap; result integers.
   - Level: xp 0 => L1; exactly at threshold => level up; max clamp; progress 0..1; titles bands.
   - Skill tree: unknown parent, self-parent, 3-node cycle (path in message), dup id, bad attribute, quest refs unknown skill; roll-up level.
   - Streak: `now` Sat 2026-10-17; entries in 3 consecutive weeks => 3; gap => resets; current week empty => grace; two entries same week => 1; Sunday/Monday boundary; year boundary 2026-12-31 -> 2027-01-04; future date => issue; short body ignored.
   - Completeness: all-pass 100; placeholder email; marker count; percent rounding.
   - Achievements: boss first; <3 metrics total => returns fewer, no throw.
8. Add `test:unit` script + CI step; run `npm run test:unit`, `npm run check`.

## Todo List
- [ ] Feature branch + `npm ci`
- [ ] tsconfig flags verified/added
- [ ] `xp-rules.ts`
- [ ] 10 pure modules under `src/utils/career-rpg/`
- [ ] Unit tests + fixtures
- [ ] `test:unit` script + CI verify step
- [ ] check + unit green

## Success Criteria
- `npm run test:unit` green, <5s, zero new deps.
- `grep -rln "astro:\|import.meta" src/utils/career-rpg` => only `load-career-state.ts` (phase 02 Astro-only loader; never imported by tests).
- Changing a weight in `xp-rules.ts` is the only edit needed to retune.

## Risk Assessment
- Astro preset lacks `allowImportingTsExtensions` / conflicts => add explicitly (requires `noEmit`, which Astro sets). Fallback: Vitest.
- Node `--test` glob quoting differs across shells => quoted pattern in script; CI is bash.
- Weights produce silly levels on real content => tune after phase 02 content; rules isolated.
- Float drift => round only at attribute/total stage; tests use exact integers.

## Security Considerations
- `normalizeEvidenceUrl` uses `new URL()` in try/catch; invalid => issue, never throws raw.
- No I/O, no env reads in pure modules.

## Next Steps
- Phase 02 maps content collections + `skills-data.ts` to these inputs and wires `load-career-state.ts`.
