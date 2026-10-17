# Phase 09: Docs Update

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [phase-08](phase-08-e2e-a11y-perf-verification.md) (measured numbers)
- Docs: `.claude/workflows/documentation-management.md`, all `docs/*.md`, `README.md`

## Overview
- Date: 2026-10-17 · Priority: P1 · Effort: S · Implementation: Not started · Review: Not reviewed
- Bring README + 7 docs in line with the Career RPG layer; record rules, anti-gaming policy, test commands, cron.

## Key Insights
- Docs are hand-maintained from real tree (codebase-summary says so) => update from final file list, not plan.
- Content authors need one table: what to edit, where, which fields score XP, what the build rejects.

## Requirements
- Functional: every new file/route/script/collection/env var documented once (DRY: link, don't repeat).
- Non-functional: concise; version history + changelog rows dated via `date +%y%m%d` / ISO.

## Architecture (doc -> changes)
| Doc | Changes |
|---|---|
| `README.md` | Scripts table + `test:unit`; Edit-content table rows: `src/data/xp-rules.ts` (weights), `src/data/skills-data.ts` (node fields), `src/content/changelog/*.md`, project quest fields (`difficulty`, `isBoss`, `skills`, `obstacles`, `metrics`, `evidence`); note `repoUrl`/`demoUrl` removed; "XP is computed, never set" |
| `docs/project-overview-pdr.md` | Scope v1.1 (6 features), F6-F12 requirements (strict schemas, single boss, evidence-only XP, streak, HUD, speedrun), non-goals (no backend, no leaderboard), version history |
| `docs/project-roadmap.md` | v1.1 phases table + status; known limitations (streak refresh weekly, backdating unverifiable); changelog row |
| `docs/codebase-summary.md` | new dirs `src/components/career-rpg/`, `src/utils/career-rpg/`, `src/content/changelog/`, `tests/unit/`; new pages; new specs + mirrors (`SECTION_IDS`, `BOSS_SLUG`, streak "3-week" tied to `CAREER_RPG_NOW`) |
| `docs/system-architecture.md` | build pipeline step: `load-career-state` -> pure fns -> `CareerRuleError`; mermaid flow; `CAREER_RPG_NOW`; scoring pseudocode summary (link to `xp-rules.ts`); CI: unit step + weekly schedule |
| `docs/design-guidelines.md` | quest badge variants, boss card, `xp-progress-bar` styling, skill-tree connectors/pips, speedrun countdown motion policy |
| `docs/code-standards.md` | pure-module rules (`.ts` specifiers, `import type`, erasable syntax, no `astro:*`/`import.meta.env` in `src/utils/career-rpg/` except loader); strict schemas; unit tests location + runner |
| `docs/deployment-guide.md` | verify job adds `test:unit`; schedule trigger + 60-day inactivity caveat |

## Related Code Files
Modify:
- `/home/user/portfolio-app/README.md`
- `/home/user/portfolio-app/docs/project-overview-pdr.md`
- `/home/user/portfolio-app/docs/project-roadmap.md`
- `/home/user/portfolio-app/docs/codebase-summary.md`
- `/home/user/portfolio-app/docs/system-architecture.md`
- `/home/user/portfolio-app/docs/design-guidelines.md`
- `/home/user/portfolio-app/docs/code-standards.md`
- `/home/user/portfolio-app/docs/deployment-guide.md`
- `/home/user/portfolio-app/plans/20261017-0432-career-rpg-gamification-layer/plan.md` (statuses, deviations)

## Implementation Steps
1. Diff final tree vs docs (`git diff --stat master`); list new/changed files.
2. Update docs per table; keep sections, append rows.
3. Lighthouse + test counts from tester report.
4. Update plan.md statuses + "Implementation Notes / Deviations" (mirror prior plan).
5. Proofread links (relative paths resolve).

## Todo List
- [ ] README
- [ ] PDR, roadmap
- [ ] codebase-summary, system-architecture
- [ ] design-guidelines, code-standards, deployment-guide
- [ ] plan.md statuses/deviations

## Success Criteria
- New contributor can add a quest/skill/changelog entry using README only.
- No doc references `repoUrl`/`demoUrl` or old `SkillGroup` shape.

## Risk Assessment
- Docs drift from code => done last, from real tree.

## Security Considerations
- No emails/secrets beyond existing public config in docs.

## Next Steps
- Hand back to user for review; commit/push only after explicit approval (conventional commits, e.g. `feat: add career rpg layer`).
