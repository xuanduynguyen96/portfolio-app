# Phase 06: Docs + changelog (v1.4)

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 05 (real numbers) · Blocks: none
- Inputs: phase 00 decision report, `reports/03-verification-report.md`
- Docs: all of `README.md`, `docs/*.md`; precedent [v1.3 docs phase](../20261017-1617-github-derived-character-avatar/phase-07-docs-update.md)

## Overview
- Date: 2026-10-18 · Priority: P1 · Effort: S (2h) · Implementation: In progress (docs-manager) · Review: Not started

## Status
- In progress by docs-manager. No docs/README/changelog edits recorded yet; all todos open.
- Docs must use the as-built values: plan.md "Measured vs budget" + "Deviations" (is:global styles, `switcher-body.ts` on-open radios, no retry after failed import, equivalent (not byte-identical) Reset, eager <= 3 KB gz, compose <= 16 ms warm, counts unit 261 / e2e 120).
- Update every place that claims "no client JS" for the avatar or lists files/tests/versions, document the class/job switcher, the "GitHub pick" default and the stats-derived gear, add the v1.4 roadmap entry and a changelog entry. Run by the **docs-manager** agent. No source or test edits in this phase.

## Key Insights
- The v1.3 sentence "avatar: no client JS" is now wrong in 6 places (found by grep): `README.md` L97, `docs/system-architecture.md` L5 + L271, `docs/code-standards.md` L149, `docs/project-roadmap.md` L79 (historical v1.3 row: keep, it was true then), `docs/project-overview-pdr.md` L105 + L113. New truth: the avatar is still composed at build time and `character-avatar.astro` is still pure markup + CSS; the switcher adds one small eager script and an on-demand chunk. Rule kept: the GitHub-derived class/job/gear/XP are computed, never hand-set; the visitor only chooses which class/job sprite + name is displayed, and the derived pick is always shown as "GitHub pick". Gear tiers stay a function of the stats and are drawn on any class/job.
- `src/data/credits-data.ts`: NO change (no new library, font or asset; sprites reused). State this in the PR.
- `src/content/changelog/*.md` needs `date` (ISO, not future beyond tolerance) + `summary` (<= 160 chars) + body; it no longer feeds the streak, it is a build log.
- Use real numbers from phase 05 (counts, KB), not the estimates in this plan. Link, do not copy rule numbers.

## Requirements
- README: Career RPG "Avatar" bullet (L97) + scripts table counts (L33-34: unit/e2e) + one line on the switcher (visitor picks any class/job; default = GitHub pick; gear always from stats; choice saved in this browser only).
- `docs/system-architecture.md`: overview sentence (L5); page/component tree (hero/sheet + `ClassJobSwitcher`); Avatar render: new "Class/job switcher" subsection with a mermaid sequence (details open or saved choice -> lazy chunk -> model -> DOM swap -> status) and the lifecycle (bind `astro:page-load`, cleanup `astro:before-swap`, `localStorage` key `portfolio-look`); data-flow note: gear = f(snapshot), look = f(visitor); Root-flags note (control uses `data-ready`, not a root flag); Key decisions table (L271 row reworded + rows: "Switcher composes in the browser on demand", "Choice persisted per browser, derived pick is the default", "Gear independent of class/job").
- `docs/design-guidelines.md`: Character avatar section (switcher behaviour, "GitHub pick" tag, reset, reduced-motion/forced-colors/focus rules for the control); Components table row `ClassJobSwitcher`, `SwitcherOption`; motion policy line (loop restarts on the new frames, same gating).
- `docs/code-standards.md`: Animation hooks table + `data-look*` rows; rule for eager modules (`class-looks`/`class-labels` and the stub must not import `src/data/avatar/*`, guarded by `switcher-eager-imports.test.ts`); Avatar sprites note (L149) reworded; "How to: add a class/job" now also feeds the switcher lists automatically (derived from rules); Testing counts (L153-154); DOM-writing rule (no `innerHTML`, CSSOM for fills).
- `docs/codebase-summary.md`: components/avatar (+2), scripts (+2), utils/avatar (+4), tests lists + counts, e2e table row for `class-job-switcher.spec.ts`, "Last updated" line.
- `docs/project-overview-pdr.md`: Scope v1.4 block, F17 (class/job switcher: any look selectable, default = GitHub pick, gear from stats, saved locally, JS optional), NFR Privacy/Performance lines (L105 "zero client JS added by the character", L113 "client JS unchanged") with measured values, success metrics, version history row.
- `docs/project-roadmap.md`: v1.4 section (phase table 00-06), changelog row, Known limitations ("choice is client-only, per browser, sprite + name only; hero/sheet only; attributes + Why panel describe the GitHub-derived class"), v2 ideas (follow-ups below), "Last updated".
- Follow-ups to list (out of scope): attributes/Why panel for the chosen class, theme accents, `/speedrun/` + `/credits/` propagation, hero entry link / reset, shareable `?look=` link, class-specific gear art, visitor-supplied GitHub username (needs a runtime API: rate limits, privacy).
- New `src/content/changelog/<date>-class-job-switcher.md` (date from `date -u`, real).

## Architecture
```
README.md ──┬─ docs/system-architecture.md (pipeline + lifecycle)   ┬─ docs/project-roadmap.md (v1.4)
            ├─ docs/design-guidelines.md (UI + a11y)                ├─ docs/project-overview-pdr.md (scope, F17, NFR)
            └─ docs/code-standards.md (hooks, import rule, tests)   └─ docs/codebase-summary.md (tree, tests)
src/content/changelog/<date>-class-job-switcher.md
```

## Related Code Files
Modify:
- `/home/user/portfolio-app/README.md`
- `/home/user/portfolio-app/docs/system-architecture.md`
- `/home/user/portfolio-app/docs/design-guidelines.md`
- `/home/user/portfolio-app/docs/code-standards.md`
- `/home/user/portfolio-app/docs/codebase-summary.md`
- `/home/user/portfolio-app/docs/project-overview-pdr.md`
- `/home/user/portfolio-app/docs/project-roadmap.md`
Create:
- `/home/user/portfolio-app/src/content/changelog/<YYYY-MM-DD>-class-job-switcher.md`
Unchanged (verify): `/home/user/portfolio-app/src/data/credits-data.ts`, `docs/deployment-guide.md`

## Implementation Steps
1. `grep -rn -i "client js\|zero client\|no client" README.md docs src` to list every claim; fix each (leave dated historical rows).
2. Edit docs as listed, copying measured numbers from `reports/03-verification-report.md`.
3. Add the changelog entry (summary <= 160 chars, plain, no AI wording).
4. Re-grep for stale counts (`231`, `94`) and "v1.3 (latest)" mentions; update version text to v1.4 where it names the current state.
5. `npm run check` (content schema validates the changelog entry) and `npm run test:e2e -- changelog-and-streak internal-links` (changelog count test counts `src/content/changelog/*.md`).
6. Run the **docs-manager** agent review; confirm links resolve.

## Todo List
- [ ] README
- [ ] system-architecture (incl. mermaid + decisions)
- [ ] design-guidelines
- [ ] code-standards
- [ ] codebase-summary
- [ ] project-overview-pdr
- [ ] project-roadmap (v1.4)
- [ ] changelog entry
- [ ] stale-claim grep clean

## Success Criteria
- No doc says the avatar has no client JS without the switcher qualifier
- Counts and KB figures match the verification report
- Anti-gaming rule documented: class/job/gear/XP derived from GitHub, never hand-set; the visitor only picks the displayed look; derived pick always labelled "GitHub pick"; gear never a function of the chosen class/job
- `npm run check` + changelog/internal-link e2e green

## Risk Assessment
- Number drift between docs and reports -> single source: copy from the verification report only.
- Changelog date in the future vs build time fails the build -> use the real current UTC time.

## Security Considerations
- Docs must not include tokens or personal data; the user email is not referenced.

## Next Steps
- Hand over for user review; commit per phase only after approval (conventional commits, no AI references). Unresolved: plan Q8 (version/date at merge).
