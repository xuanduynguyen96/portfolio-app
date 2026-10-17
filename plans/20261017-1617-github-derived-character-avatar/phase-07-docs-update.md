# Phase 07: Docs update

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 06 · Blocks: commit/PR
- Docs: `./docs/*`, `README.md`, `.claude/workflows/documentation-management.md`

## Overview
- Date: 2026-10-17 · Priority: P1 · Effort: S (3h) · Implementation: Not started · Review: Not started
- Docs describe the GitHub-derived pipeline, avatar system, refresh workflow, revised rules. Version bump v1.3. Link to rules files, never copy numbers.

## Key Insights
- Many docs state "self-attested", "changelog streak", "evidence URLs", "weekly cron in deploy" → all now wrong; grep for them.
- README "Edit content" table is the owner's main entry point → must say what is derived vs hand-written.

## Requirements
- `docs/project-overview-pdr.md`: v1.3 scope; remove "self-attested" non-goal; new non-goals (private repo data, multi-user, runtime fetch); FRs: F13 snapshot-only build input, F14 refresh workflow keeps old snapshot on failure, F15 class/job/gear deterministic + explained, F16 avatar text equivalents; revise F6-F10 (overrides, taxonomy, contribution streak); privacy NFR (public data only); version history row.
- `docs/system-architecture.md`: new mermaid (fetch → normalize → snapshot → loader → classify/gear → quests/skills/streak → avatar compose → pages); refresh + deploy dispatch sequence; scoring table revised; build-failing rules revised; key decisions rows (snapshot, dispatch, honesty rule).
- `docs/codebase-summary.md`: new dirs `src/data/github/`, `src/data/avatar/`, `src/utils/github-character/`, `src/utils/avatar/`, `src/components/avatar/`, `scripts/`; removed placeholder projects.
- `docs/code-standards.md`: avatar grid rules (regions, z-order, palette keys, tier monotonic, sub-rect layers, tests to update), `github-character` modules follow career-rpg purity rules, rules-file tuning + fixture requirement.
- `docs/design-guidelines.md`: avatar section (sizes 128/192/256, silhouettes per class, motif props, tier materials, palette tokens + plate, bob motion policy update: "only motion: speedrun countdown + avatar bob").
- `docs/deployment-guide.md`: refresh workflow, permissions, optional `GH_SNAPSHOT_PAT` setup (fine-grained, public read), branch protection note, re-enable disabled schedule, local `GH_TOKEN=... npm run snapshot:fetch`.
- `docs/project-roadmap.md`: v1.3 done items, known limitations (public-only, linguist accuracy, contribution counts aggregate), v2 ideas (OG image from avatar, aggregate private, more classes).
- `README.md`: Career RPG section rewrite, Edit content table (snapshot, overrides, rules files, taxonomy), scripts (`snapshot:fetch`, `character:explain`), test counts, Deploy section.
- Changelog entry `src/content/changelog/2026-10-xx-github-derived-character.md` (>= 40 words prose).

## Architecture
```
grep -rn "self-attested\|evidence URL\|changelog entry whose\|17 3 \* \* 1\|repoUrl" docs README.md → fix each hit
```

## Related Code Files
Modify:
- `/home/user/portfolio-app/docs/project-overview-pdr.md`, `system-architecture.md`, `codebase-summary.md`, `code-standards.md`, `design-guidelines.md`, `deployment-guide.md`, `project-roadmap.md`
- `/home/user/portfolio-app/README.md`
- `/home/user/portfolio-app/plans/20261017-1617-github-derived-character-avatar/plan.md` (status, progress)
Create:
- `/home/user/portfolio-app/src/content/changelog/<date>-github-derived-character.md` (date via `date +%Y-%m-%d`)

## Implementation Steps
1. Grep stale phrases; list hits.
2. Update PDR, architecture (mermaid validated by mermaid-diagrams skill), codebase summary.
3. Update code standards + design guidelines (avatar rules).
4. Update deployment guide + roadmap + README.
5. Changelog entry; plan.md statuses.
6. `npm run check` + unit + e2e (changelog spec counts entries).

## Todo List
- [ ] stale-phrase grep fixed
- [ ] PDR + architecture + summary
- [ ] standards + design guidelines
- [ ] deployment + roadmap + README
- [ ] changelog entry; plan.md updated
- [ ] suites green

## Success Criteria
- No stale phrase hits; every new file/dir documented; README tells owner how to add a case-study override and refresh data

## Risk Assessment
- Docs drift from rules values → link to rules files only.

## Security Considerations
- Deployment guide: PAT least privilege; never commit tokens; snapshot public-only.

## Next Steps
- User approval → per-phase conventional commits → PR. Unresolved: none phase-specific.
