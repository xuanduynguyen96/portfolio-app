# Phase 02: Content Schema Extensions + Placeholder Content

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [phase-01](phase-01-rules-config-scoring-utils-unit-tests.md) · Scout: [reports/01-codebase-scout-report.md](reports/01-codebase-scout-report.md)
- Docs: `docs/code-standards.md` (Content collection), https://docs.astro.build/en/guides/content-collections/, https://zod.dev/api (strictObject, url)

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: M · Implementation: Not started · Review: Not reviewed
- Strict schemas for projects (quest fields + evidence), new `changelog` collection, skill nodes, `siteConfig.availability`; migrate 3 projects; Astro-side loader that feeds phase-01 pure fns and fails build on rule violations.

## Key Insights
- Today `z.object` silently strips unknown keys => an author could add `xp: 9999` with no error. `z.strictObject` errors: `Unrecognized key: "xp"`.
- `repoUrl`/`demoUrl` decision: **migrate into `evidence[]`**. Why: one source of truth (DRY), scoring reads one list, strict schema turns any leftover `repoUrl` into a build error (forced, visible migration), only 3 files. Display links derived from evidence by type.
- Current `z.url()` accepts any scheme (e.g. `javascript:`) and URLs reach `href` => restrict to `https`.
- Case-study word count needs `entry.body` (not visible to schema) => enforced in loader/pure fns, not zod.
- All 3 projects use profile root `https://github.com/xuanduynguyen96` => global URL dedupe means only 1 earns XP. Honest; HUD will flag.
- Cross-entry rules (exactly one boss, skill refs, cycles) can't live in per-entry schema => `build-career-state` (phase 01) throws aggregated `CareerRuleError`.
- `TODO(content)` lives in comments => detect via raw-source scan (`import.meta.glob(..., { query: '?raw' })`), build-time only.

## Requirements
- Functional: schema fields `difficulty` (side|main|raid, required), `isBoss` (default false), `skills[]` (skill ids, min 1), `obstacles[]`, `metrics[] {label,value,unit?}`, `evidence[] {type,url}`; changelog `{date, summary}` + body; skill node `{id,label,attribute,parent?,evidence[]}`; availability `{status: open|limited|closed, note}`.
- Non-functional: build fails with entry-named messages; no hand-set xp/level anywhere; files <200 lines.

## Architecture
```
src/data/career-schemas.ts        evidenceSchema, metricSchema, skillNodeSchema (z from 'astro/zod', enums from xp-rules)
src/content.config.ts             projects (strict + quest fields) + changelog collection
src/data/skills-data.ts           SkillNode[] flat list (parent refs), TS-typed
src/data/site-config.ts           + availability
src/utils/career-rpg/load-career-state.ts   Astro-only: getCollection + raw scan + now -> buildCareerState (memoized)
```
Schemas:
```ts
// src/data/career-schemas.ts
export const httpsUrl = z.url({ protocol: /^https$/ });            // verify option name for zod 4.6
export const evidenceSchema = z.strictObject({ type: z.enum(EVIDENCE_TYPES), url: httpsUrl });
export const metricSchema = z.strictObject({ label: z.string().min(1).max(40), value: z.number().finite(), unit: z.string().max(12).optional() });
export const skillIdSchema = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/);
export const skillNodeSchema = z.strictObject({ id: skillIdSchema, label: z.string().min(1).max(40),
  attribute: z.enum(ATTRIBUTE_IDS), parent: skillIdSchema.optional(), evidence: z.array(httpsUrl).max(10).default([]) });

// src/content.config.ts (projects)
z.strictObject({ title, summary, tags, cover, coverAlt, featured, order,           // unchanged fields
  difficulty: z.enum(QUEST_DIFFICULTIES), isBoss: z.boolean().default(false),
  skills: z.array(skillIdSchema).min(1).max(6),
  obstacles: z.array(z.string().min(1).max(140)).max(6).default([]),
  metrics: z.array(metricSchema).max(6).default([]),
  evidence: z.array(evidenceSchema).max(8).default([]),
}).refine(coverAlt rule).refine(p => !p.isBoss || (p.metrics.length > 0 && p.obstacles.length > 0),
  { message: 'boss quest needs >=1 metric and >=1 obstacle', path: ['isBoss'] })

// changelog
const changelog = defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/changelog' }),
  schema: z.strictObject({ date: z.coerce.date(), summary: z.string().min(1).max(160) }) });
```
Loader:
```ts
// load-career-state.ts (not unit-tested; thin)
let cached: Promise<CareerState> | undefined;
export function loadCareerState() { return (cached ??= build()); }
async function build() {
  const now = resolveBuildNow(process.env.CAREER_RPG_NOW);              // ISO date or new Date(); invalid => throw
  const raw = import.meta.glob(['/src/data/*.ts', '/src/content/**/*.md'], { query: '?raw', import: 'default', eager: true });
  const skills = z.array(skillNodeSchema).parse(skillNodes);             // strict => rejects xp/level keys
  return buildCareerState({ quests: toQuestInputs(await getCollection('projects')), skills,
    changelog: toChangelogInputs(await getCollection('changelog')), profile: siteConfig, rawSources: raw, now });
}
```
Helper for links: `getEvidenceLink(evidence, 'repo' | 'demo')` in `src/utils/career-rpg/evidence-links.ts` (pure).

## Related Code Files
Create:
- `/home/user/portfolio-app/src/data/career-schemas.ts`
- `/home/user/portfolio-app/src/utils/career-rpg/load-career-state.ts`
- `/home/user/portfolio-app/src/utils/career-rpg/evidence-links.ts` (+ `tests/unit/evidence-links.test.ts`)
- `/home/user/portfolio-app/src/content/changelog/2026-09-30-*.md`, `2026-10-07-*.md`, `2026-10-14-*.md` (placeholders, `TODO(content)`, >=40 words)
Modify:
- `/home/user/portfolio-app/src/content.config.ts`: strict projects + changelog
- `/home/user/portfolio-app/src/content/projects/neon-dashboard.md`: `difficulty: raid`, `isBoss: true`, obstacles, metrics, evidence (repo = `https://github.com/xuanduynguyen96/portfolio-app`), body >=150 words
- `/home/user/portfolio-app/src/content/projects/realtime-chat.md`: `difficulty: main`, metrics, evidence, body >=150 words
- `/home/user/portfolio-app/src/content/projects/cli-toolkit.md`: `difficulty: side`, keep body short (exercises "unverified" state)
- `/home/user/portfolio-app/src/data/skills-data.ts`: `SkillNode[]`; roots = Languages/Frontend/Backend/Tooling + new Collaboration (communication attr); existing 21 items become children
- `/home/user/portfolio-app/src/data/site-config.ts`: `availability: { status: 'open', note: 'Available for new projects' }`
- `/home/user/portfolio-app/src/components/project-card.astro`, `/home/user/portfolio-app/src/pages/projects/[slug].astro`: swap `repoUrl`/`demoUrl` reads for `getEvidenceLink()` (minimal; UI additions in phase 03)
- `/home/user/portfolio-app/src/components/sections/skills-section.astro`: interim: group by root node so build passes (replaced in phase 05)
- `/home/user/portfolio-app/src/components/sections/hero-section.astro`: eyebrow text from `siteConfig.availability.note`
- `/home/user/portfolio-app/playwright.config.ts`: `webServer.env: { CAREER_RPG_NOW: '2026-10-17' }`

## Implementation Steps
1. `career-schemas.ts`; verify `z.url({ protocol })` + `z.strictObject` signatures in installed zod 4.6 (`node_modules/zod`).
2. Update `content.config.ts` (strict, quest fields, boss refine, changelog).
3. Migrate 3 project files (frontmatter + bodies). Keep `# TODO(content)` comments; placeholder metric values marked.
4. Reshape `skills-data.ts`; keep labels identical so visible text unchanged.
5. Add `availability` to `SiteConfig`; hero eyebrow reads it.
6. `evidence-links.ts` + test; swap card/detail link reads.
7. `load-career-state.ts`: memoized; `resolveBuildNow` validates `CAREER_RPG_NOW` (`/^\d{4}-\d{2}-\d{2}$/`), else `new Date()`. Call it once from `index.astro` frontmatter (no render yet) to surface errors early.
8. 3 changelog placeholders in consecutive ISO weeks before 2026-10-17 (expected streak 3 with fixed now).
9. Negative checks (manually, revert after): add `xp: 1` to a project -> build fails `Unrecognized key`; second `isBoss: true` -> `CareerRuleError` naming both ids; `parent: nope` -> named error; `repoUrl:` -> unrecognized key.
10. `npm run check`, `npm run test:unit`, `npm run build`, `npm run test:e2e` (existing 30 must stay green).

## Todo List
- [ ] career-schemas.ts
- [ ] content.config.ts strict + changelog
- [ ] migrate 3 projects
- [ ] skills-data.ts tree shape
- [ ] site-config availability + hero eyebrow
- [ ] evidence-links.ts + test; card/detail use it
- [ ] load-career-state.ts + env now
- [ ] 3 changelog placeholders
- [ ] negative build checks done
- [ ] all suites green

## Success Criteria
- Unknown keys (`xp`, `level`, `repoUrl`) fail build with field + file in message.
- Boss/skill/changelog rule violations fail build listing every issue at once.
- Visible site unchanged except hero eyebrow source (same text); 30 e2e green.

## Risk Assessment
- `image()` inside `z.strictObject` or `.refine` chain typing quirks in Astro 7 => fallback `z.object(...).strict()`.
- `import.meta.glob` raw of `.ts` could be transformed by Vite => `?raw` returns source; verify once with a marker.
- `process.env` in Astro build code: fine for static build; never in client scripts.
- Placeholder bodies padded to pass min words = "fake verified" => clearly `TODO(content)`; HUD `no-placeholders` item stays failing until real content.

## Security Considerations
- https-only evidence => no `javascript:`/`data:` hrefs; external links keep `rel="noopener noreferrer"`.
- `CAREER_RPG_NOW` build-only, validated format; no secrets.

## Next Steps
- Phases 03-06 render `CareerState` (parallel-safe).
