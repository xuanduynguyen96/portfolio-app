# Phase 03: E2E updates + run

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 01, 02 · Blocks: 06
- Docs: `docs/code-standards.md#testing` (e2e vs production build; mirror, no hardcoded project lists), README (`npm run test:e2e` builds + previews)
- Report: [current state](reports/01-current-state-report.md) item 6

## Overview
- Date: 2026-10-20 · Priority: P0 · Effort: M (3h)
- Implementation status: Done · Review status: Reviewed (code-reviewer: no critical/important findings)
- Fix 3 specs that reference removed exports / old keys, add the Why-panel two-list check, run the full suite on the production build. Expected count stays 120 (+0..1).

## Key Insights
- Only 3 specs are stale (tsc errors): `class-job-switcher.spec.ts`, `class-job-switcher-quality.spec.ts`, `character-avatar.spec.ts`.
- `switcher-helpers.ts`, `page-navigation-lifecycle.spec.ts`, `career-mirror.ts` already generic (`allClassLooks`, `classifyCharacter`, `selectQuestRepos`): no edit; `career-mirror.ts` follows the new quest ranking automatically (needs `repoWeight`, shipped).
- Radio values are now job **slots** (`banner|crystal|hawk`), names are class-specific; hints are job `specialty` text, no longer archetype labels.
- Changing class keeps the job slot (`warrior/crystal` Paladin -> `mage/crystal` Summoner).
- Chromium preinstalled at `/opt/pw-browsers`; do not run `playwright install`.

## Requirements
- Functional: switcher e2e covers 3 combat classes + Adventurer, 10 looks, new names; saved-look invalid key ignored.
- Non-functional: no hardcoded owner class/job in specs (derive from `character`/`pick`); do not loosen assertions or skip tests.

## Architecture
Specs import rules (`CLASS_NAMES`, `JOBS`, `MOTIF_IDS`) and pure modules (`lookTitle`, `allClassLooks`); expectations computed from the same modules the build uses, as today.

## Related code files
Modify:
- `tests/e2e/class-job-switcher.spec.ts`: drop `ARCHETYPE_LABELS`; class loop `['warrior','archer','mage']`; hint assertion `JOBS[classId].map(j => j.specialty)` (+ label regex from job names); "changing class keeps the job slot" test: `chooseLook({warrior, banner})` -> `classRadio('mage')` -> `jobRadio('mage','banner')` checked, title `lookTitle({mage, banner})` (Mage · Enchanter); arrow-key test moves warrior -> archer (class order) so status mentions `lookTitle({archer, banner})`. Line 53, 63-70 need edits (9 refs).
- `tests/e2e/class-job-switcher-quality.spec.ts`: `other` = `mage/hawk` (derive: first look whose class != pick and motif hawk); fix the "longest name" comment (computed value stays dynamic).
- `tests/e2e/character-avatar.spec.ts`: import `allClassLooks`; gallery count `allClassLooks().length` (10) instead of `ARCHETYPE_IDS.length ** 2 + 1`. ADD in "why" test: when `character.jobName`, panel has 2 lists (class + job) via `why.getByRole('list')` count = non-empty lists of `[character.signals, character.jobSignals]`.
Verify only (run, no edit expected): `switcher-helpers.ts`, `page-navigation-lifecycle.spec.ts`, `career-mirror.ts`, `quest-cards-and-boss.spec.ts`, `character-sheet-and-hud.spec.ts`, `speedrun-page.spec.ts`, `credits-page.spec.ts` (gallery of 10 looks), `accessibility-axe.spec.ts`.
Create/Delete: none.

## Implementation Steps
1. `npm run check`: confirm only the 3 specs error in `tests/e2e`.
2. Edit the 3 specs as above; `npm run check` -> 0 errors.
3. Add a saved-look test line (in existing "saved look" test or quality spec): `localStorage['portfolio-look'] = 'mage/data'` before load -> page shows GitHub pick, key cleaned up when possible (matches accepted behaviour + `parseLookKey`).
4. Run targeted first: `npx playwright test tests/e2e/class-job-switcher.spec.ts tests/e2e/class-job-switcher-quality.spec.ts tests/e2e/character-avatar.spec.ts` (note `playwright.config` may build via webServer; if not, `npm run build && npm run preview` per README). Prefer `npm run test:e2e` for the final run (builds + previews).
5. Triage failures: mirror/engine drift (quest order) -> check `career-mirror.ts` uses `selectQuestRepos` unchanged; axe contrast on Mage art not applicable (SVG); layout-shift spec with longest name -> verify `longest` recomputes.
6. Full run `npm run test:e2e`; record count (expected 120) and any flake (re-run once, report).
7. Eyeball: `npm run build && npm run preview`, open `/#character`, switch through all 10 looks at 360px and desktop, both themes (screenshot via playwright script in scratchpad). Check the hint text wraps, "GitHub pick" tag shows once.

## Todo list
- [x] 3 specs fixed; `npm run check` clean
- [x] Why-panel two-list assertion added
- [x] Invalid saved key (`mage/data`; valid class, removed motif) assertion
- [x] Targeted run green
- [x] Full `npm run test:e2e` green; count recorded
- [x] Manual 10-look pass at 360px + desktop

## Success Criteria
- `npm run test:e2e` all pass (expected 120/121), no skipped/loosened test, no console/page errors (`trackPageErrors` unchanged).
- All 10 looks render with correct names/pixels vs pure modules; layout shift with saved look <= 0.005 still holds.

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Quest order changes -> mirror mismatch | false red | mirror reuses engine; confirm both import `selectQuestRepos` |
| Longest-name CLS regression (longest title is now `Archer · Skirmisher`, 19 chars, shorter than the old 23-char `Artificer · Forgemaster`; `Mage · Enchanter` is 16) | layout shift | quality spec computes longest dynamically; adjust CSS only if red |
| Flaky timing in switcher spec | noise | re-run once; do not add sleeps; investigate if repeat |
| Build slow/timeout in sandbox | none | run in background, poll |

## Security Considerations
Storage input remains allow-listed; the invalid-key test proves `mage/data` / `warrior/data` never reach the composer. No `innerHTML` introduced (guarded by code-standards rule 3).

## Next steps
Phase 06 final gate. Phase 05 docs need the final unit/e2e counts from phases 02-03.
