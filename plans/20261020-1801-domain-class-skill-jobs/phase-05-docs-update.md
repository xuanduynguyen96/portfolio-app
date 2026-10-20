# Phase 05: Docs update + changelog decision

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 02, 03, 04 (counts + owner result) · Blocks: 06
- Docs map: `CLAUDE.md` (Documentation Management), `docs/code-standards.md`
- Reports: [current state](reports/01-current-state-report.md), `reports/02-real-data-check-report.md` (phase 04)

## Overview
- Date: 2026-10-20 · Priority: P1 · Effort: M (3h)
- Implementation status: Done (2026-10-20) · Review status: Pending
- Update every doc that describes the old archetype model. Plans under `plans/` are historical: do not edit older plans. Link rules files instead of copying numbers (code-standards rule).

## Key Insights
- Docs list in the request omitted `docs/project-overview-pdr.md` and `docs/deployment-guide.md` (test count 261); both mention the old model/counts.
- Old terms to eliminate: Sorcerer, Battlemage, Spellblade, Druid, Arcane Archer, Vanguard, secondary, archetype, "class x secondary archetype", "9 jobs (class x motif)", "language/keyword weights", `ARCHETYPE_IDS`, and any text that makes **Mage = Data** (Mage now means DevOps; `mage/data` is an invalid key). "Mage" itself stays.
- Test counts are placeholders until phases 02-03 finish: use recorded numbers (was 261 unit / 120 e2e).
- Roadmap convention: new version block + changelog row + Known limitations refresh.

## Requirements
- Functional: each doc matches the code after phases 01-04; model stated once in system-architecture, others link to it (DRY).
- Non-functional: concise, grammar-light; docs files stay <~200-300 lines as today; no owner hardcode in rules docs (owner result only as dated example in roadmap).

## Architecture
Single source of truth for the model: `docs/system-architecture.md#github-derived-pipeline`. README and others summarise in 1-2 lines + link.

## Related code files
Modify (docs only; do NOT touch `src/`, `scripts/`, `tests/` here):
- `README.md`: Career RPG "Class" bullet (class = domain from skill matches; Warrior backend, Archer frontend, Mage devops; Adventurer; job = specific skills, 3 per class), "Tuning rule" (fixtures in `classify-character.test.ts`), switcher bullet (10 looks: Warrior/Archer/Mage x 3 jobs + Adventurer; saved `portfolio-look` from older versions is ignored), file table rows "Class rules" (`skillDomains`, recency, fallback) and "Class + job names" (9 jobs; each domain skill in exactly one job), "Skill tree" row (matches also decide class), Scripts table counts (unit N, e2e M), `character:explain` description.
- `docs/system-architecture.md`: pipeline diagram label (line ~58), Classifier row (`classify-character`, `repo-domain-vote`, `repo-skill-matches`), Quests row (score = repo weight + hygiene + pinned), Avatar data line (4 poses: Warrior, Archer, Mage, Adventurer; 3 job props = job slots), switcher section (10 looks, key `class/motif`, saved-key example `mage/hawk`, invalidation of old keys such as `mage/data`), honesty/anti-gaming line, decisions table + 1 row "Class from skill matches, job from skills" (why: class follows what the code does; Python/TS alone don't vote).
- `docs/code-standards.md`: "GitHub character modules" (signals `domain`), "Tuning class, job and gear rules" steps (skillDomains; every domain skill in exactly one job; unit invariant), Avatar sprites how-to "Add a job prop" (motif = job slot, not archetype; new domain = id in `DOMAIN_IDS` + class + 3 jobs + pose + tests), switcher rule 4 (`mage/data` -> `mage/hawk`: same class, new motif ids), Testing counts.
- `docs/design-guidelines.md`: ClassWhyPanel row (two lists), Class = silhouette (Warrior plumed great helm + sword, Mage pointed hat + beard + orb + crystal staff, Archer hood + bow, Adventurer walking stick), Job = prop by job slot (banner/crystal/hawk), switcher control (Job options with specialty hint; status example "Showing Mage · Seer. Your GitHub pick is Warrior · Knight."), review sheet line.
- `docs/codebase-summary.md`: rules rows, `avatar-class-{warrior,archer,mage,adventurer}` (Mage unchanged file, now the DevOps class), `repo-domain-vote.ts` replaces `repo-archetype-vote.ts`, class-looks key example, test file list (`repo-domain-vote.test.ts`), counts, e2e table (switcher spec wording), "Last updated".
- `docs/project-roadmap.md`: add "v1.5 class = domain, job = skills" block (plan link, phases 01-06 table, what shipped, behaviour changes), changelog row, Known limitations ("Class accuracy depends on skill matches; generic whole-word keywords can mis-vote; Python-only profiles are Adventurer; recency half-life 48 months"), v2 ideas ("More classes": a data/ML domain needs data skills in `skills-data.ts` and its own class, since Mage is now DevOps), follow-up list, "Last updated".
- `docs/project-overview-pdr.md`: lines ~47, 57, F15 (class/job description), F17, changelog row.
- `docs/deployment-guide.md`: test count line (~74).
Create (decision, needs user OK): `src/content/changelog/2026-10-20-domain-classes.md` with strict frontmatter `date` + `summary` (<=160 chars); body: class now follows what the code does (backend/frontend/devops), Mage is now the DevOps class (was Data), jobs come from specific skills, saved looks reset. Rationale for yes: visitor-visible identity change. Rationale for no: build-log noise. Default if no answer: create it (cheap, dated, reversible). Do not edit the 2026-10-18 entry.
Delete: none.

## Implementation Steps
1. Get final counts from phases 02-03 and the owner result from phase 04 report.
2. `grep -rniE "sorcerer|battlemage|spellblade|druid|arcane archer|vanguard|archetype|secondary|ARCHETYPE|9 jobs|class x" README.md docs` -> list all hits; then `grep -rniE "mage" README.md docs | grep -viE "image"` and check each says Mage = DevOps, never Data.
3. Edit system-architecture first (source of truth), then README, code-standards, design-guidelines, codebase-summary, pdr, deployment-guide, roadmap.
4. Re-run the grep: no stale hits except historical changelog rows ("v1.3 ... Vanguard" in the roadmap v1.3 table may stay as history; prefer neutral wording "(then: Warrior · Vanguard)").
5. Verify links/anchors (`#github-derived-pipeline`, `#classjob-switcher`, `#avatar-sprites`) still exist; check relative link names.
6. Changelog entry: if approved, create the file; `npm run build` validates frontmatter (strict schema).
7. `git diff --stat -- README.md docs src/content` review: only intended files.

## Todo list
- [x] system-architecture
- [x] README (bullets, tables, counts)
- [x] code-standards (tuning steps, sprite how-to, switcher rule 4, counts)
- [x] design-guidelines
- [x] codebase-summary
- [x] project-overview-pdr, deployment-guide counts
- [x] project-roadmap (v1.5 block, limitations, changelog row)
- [x] changelog entry decision applied (created `2026-10-20-domain-classes.md`; `npm run build` passes)
- [x] stale-term grep clean

## Success Criteria
- Zero stale old-model terms outside historical rows; counts equal the real runs; anchors resolve.
- `npm run build` passes with the changelog file (if added).
- A new contributor can add a domain/job from code-standards alone (steps list files).

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Counts drift after review fixes | wrong docs | fill counts last, rerun in phase 06 |
| Docs claim owner class | goes stale on refresh | state as dated example only in roadmap |
| Anchor rename breaks links | broken nav | grep anchors before/after |
| Changelog frontmatter invalid | build fails | schema is strict: only `date`, `summary` |

## Security Considerations
No secrets, tokens or emails in docs. Do not paste snapshot contents beyond repo names already public.

## Next steps
Phase 06 final gate and commit.
