# Phase 01: Job-keyed data model (pixel-neutral refactor)

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 00 (go) · Blocks: 02-07
- Inputs: [report 01](reports/01-scout-and-baseline-report.md) sections 1 and 7, [hash-look-grids.ts](reports/assets/hash-look-grids.ts)
- Docs: `docs/code-standards.md#classjob-switcher` (rules 3, 4, 6, 8), `#avatar-sprites`, `#career-rpg-modules-srcutilscareer-rpg` (pure module rules)

## Overview
- Date: 2026-10-21 · Priority: P0 · Effort: M (4h) · Implementation status: Todo · Review status: Pending
- Replace slot ids (`banner|crystal|hawk`) by job ids as the key of the prop, the look and the radio value. The 9 jobs still draw the 3 legacy arts at their legacy anchors, so the composed pixels are identical (golden digest). Art comes in 03-05.

## Key Insights
- `CharacterProfile.jobId` already exists (`string | null`); `motif` duplicates it, so drop `motif` instead of renaming it.
- Props move from "id + class anchor" to "id + own placement": the pose anchor `motif` is deleted, each prop frame carries `{x, y, rows}`. Needed because Mage props live in a different box than Warrior props and per-job anchors in pose files would add 18 fields.
- A look is only valid when the job belongs to the class (`mage/seer` yes, `mage/knight` no). Today every slot is valid on every class; `changeClass` keeps the slot, so it must map slot index -> job of the new class.
- Eager graph: `class-looks.ts`, `class-labels.ts`, `switcher-body.ts` and `character-job-rules.ts` may only gain ids, never art. Prop names/accents go in `src/data/avatar/` (lazy).
- Saved keys `class/slot` (`mage/hawk`, `warrior/banner`) become invalid and fall back to the GitHub pick once; same precedent as v1.5 `mage/data`.
- Adventurer has stale `anchors.motif` data (no job): delete it, YAGNI.

## Requirements
- Functional: `JobId` union of 9 ids; look = `{classId, jobId | null}`, key `class/jobId` or `adventurer`; allow-list parse accepts only the 10 exact keys; `changeClass` keeps the job slot; `changeJob` ignores Adventurer and jobs not in the class; desc says `Job prop: <prop name>.`; accessible name "Class · Job" unchanged.
- Non-functional: golden digest unchanged; 279 unit tests green after the edits (count may differ by deliberate test changes); `switcher-eager-imports` green; every file < 200 lines.

## Architecture
```
character-job-rules.ts   JOB_IDS (9), JobId, JobDefinition{id: JobId, name, skills, specialty}, jobSlot(), jobAtSlot()   [eager, ids only]
        │
class-looks.ts           ClassLook{classId, jobId}  key 'mage/seer'  parseJobId  changeClass(slot) changeJob            [eager]
        │
avatar-types.ts          PlacedSprite{x,y,rows}, JobPropFrames = [PlacedSprite, PlacedSprite]   (PoseAnchors.motif removed) [lazy]
avatar-job-props-{warrior,archer,mage}.ts   legacy art re-keyed per job id with the old class anchors baked in           [lazy]
avatar-sprites.ts        jobPropSprites: Record<JobId, JobPropFrames> (spread of the 3 files)
avatar-job-style.ts      JOB_PROP_NAMES: Record<JobId,string>  (accent map is added in phase 02)
select-avatar-layers.ts  job layer = jobPropSprites[look.jobId][frame] if the job belongs to the class
```
Legacy mapping (art only): knight/ranger/enchanter = banner, paladin/skirmisher/summoner = crystal, sentinel/herald/seer = hawk, each at its class's old anchor (warrior (23,1)/(23,2), archer (23,1)/(23,1), mage (26,4)/(26,4)).

## Related Code Files
Modify (src):
- `/home/user/portfolio-app/src/data/character-job-rules.ts`: add `JOB_IDS`/`JobId`, `jobSlot(classId, jobId)`, `jobAtSlot(classId, slot)`; `JobDefinition.id: JobId`; remove `MOTIF_IDS`, `MotifId`, `motif` field + comment.
- `/home/user/portfolio-app/src/data/avatar/avatar-types.ts`: add `PlacedSprite`, `JobPropFrames`; delete `PoseAnchors.motif`.
- `/home/user/portfolio-app/src/data/avatar/avatar-class-{warrior,archer,mage,adventurer}.ts`: delete the 8 `motif:` anchor lines (copy the values into the new prop files first).
- `/home/user/portfolio-app/src/data/avatar/avatar-sprites.ts`: replace `motifSprites` by `jobPropSprites`.
- `/home/user/portfolio-app/src/utils/avatar/select-avatar-layers.ts`, `avatar-description.ts` (`Job prop:` text), `class-looks.ts`, `class-labels.ts` (type only).
- `/home/user/portfolio-app/src/utils/github-character/{character-types,classify-character}.ts`: drop `motif`, type `jobId: JobId | null`.
- `/home/user/portfolio-app/src/scripts/class-job-switcher.ts` (`parseJobId`, `changeJob`, `look.jobId`), `switcher-body.ts` (radio `value = job.id`).
- `/home/user/portfolio-app/scripts/render-avatar-sheet.ts` (`profileOf(classId, jobId, tiers)`, hero uses `'knight'`, `PURE` uses `JOBS[c][0].id`), `scripts/explain-character.ts` L17.
Create (src): `src/data/avatar/avatar-job-props-{warrior,archer,mage}.ts`, `src/data/avatar/avatar-job-style.ts`.
Delete: `src/data/avatar/avatar-job-motifs.ts`.
Modify (tests): `tests/unit/{avatar-test-helpers,class-looks,class-labels,character-rules,classify-character,compose-avatar-grid,avatar-svg-paths,avatar-silhouette,avatar-sprites,look-avatar-model}.test.ts`; e2e: `switcher-helpers.ts` (L22 param name, L40 `look.jobId`), `class-job-switcher.spec.ts` (L12/45/62-70 slot ids -> job ids; add legacy-key case), `class-job-switcher-quality.spec.ts` (L10 -> `jobId === 'seer'`), `page-navigation-lifecycle.spec.ts` (L67-98).

## Implementation Steps
1. Baseline: `node --disable-warning=ExperimentalWarning plans/20261021-0208-distinct-job-art-per-job-props/reports/assets/hash-look-grids.ts` on the clean tree must print `120 grids, sha256 f642d3a8b5825837b18da966191bb7ace7ccc1f7b0180011de1f879cda9d83f7`.
2. Rules: in `character-job-rules.ts` add `export const JOB_IDS = ['knight','paladin','sentinel','ranger','skirmisher','herald','enchanter','summoner','seer'] as const; export type JobId = (typeof JOB_IDS)[number];` Type `JobDefinition.id` as `JobId`, delete `motif` and `MOTIF_IDS`. Helpers: `jobSlot(classId, jobId)` = index in `JOBS[classId]` or -1; `jobAtSlot(classId, slot)` = `JOBS[classId][slot]?.id ?? JOBS[classId][0].id`.
3. Types: in `avatar-types.ts` add `export interface PlacedSprite { x: number; y: number; rows: SpriteRows }` and `export type JobPropFrames = readonly [PlacedSprite, PlacedSprite]`; delete `motif` from `PoseAnchors`.
4. Props (placeholder = legacy art): create the 3 class files. Each exports e.g. `warriorProps: Readonly<Record<'knight'|'paladin'|'sentinel', JobPropFrames>>`, importing the legacy rows by copying them from `avatar-job-motifs.ts` (6x11, unchanged) and placing frame 0/1 at the class's old anchors. Then delete `avatar-job-motifs.ts`. `avatar-sprites.ts`: `export const jobPropSprites: Readonly<Record<JobId, JobPropFrames>> = { ...warriorProps, ...archerProps, ...mageProps };`.
5. Style: `avatar-job-style.ts` exports `JOB_PROP_NAMES: Readonly<Record<JobId, string>>` with the final names (crest shield, leaf and sword, watchtower, atom, phone and winged boots, horn and tabard, rune circle, container crate, floating eye). They describe the target art; the legacy art differs until 03-05 (branch-only).
6. Layers: `selectAvatarLayers`: `AvatarLook = {classId, jobId: JobId | null, gear}`; push the job layer only when `look.jobId` belongs to `JOBS[look.classId]` (guards a stray job on Adventurer); `at('job', {x, y}, sprite.rows)` from `jobPropSprites[look.jobId][frame]`.
7. Description: ``Job prop: ${JOB_PROP_NAMES[profile.jobId]}.`` when a job is set. `AvatarProfile = Pick<CharacterProfile, 'classId'|'className'|'jobName'|'jobId'> & {gear}`.
8. Looks (`class-looks.ts`): `ClassLook {classId; jobId: JobId | null}`; `jobsFor(classId)` (replaces `motifsFor`, returns `JOBS[classId].map(j => j.id)`); `isValidLook` = Adventurer with null, or job in `JOBS[classId]`; `allClassLooks` from `JOBS`; `lookKey` `class/jobId`; `parseJobId` (any of the 9, `JOB_IDS.find`); `parseLookKey` unchanged shape (still requires exact round trip); `defaultLook` copies `jobId`; `changeClass(current, classId, pick)`: Adventurer -> null; else slot = `jobSlot(current.classId, current.jobId)`, falling back to `jobSlot(pick.classId, pick.jobId)`, then 0, result `jobAtSlot(classId, slot)`; `changeJob(current, jobId)`: ignore if Adventurer or the job is not in `current.classId`; `lookProfile` finds the job by id.
9. Classifier/types: `CharacterProfile` loses `motif` and `jobId: JobId | null`; `classify-character.ts` returns `jobId: job.id` (L76 `jobId: null` already there; remove `motif: null`/`motif: job.motif`).
10. Switcher: `class-job-switcher.ts` swap `parseMotif/changeMotif/look.motif` for `parseJobId/changeJob/look.jobId`; `switcher-body.ts` option `value` = `id`, `sameLook({classId, jobId: id}, pick)`. Keep the eager graph free of `src/data/avatar/*` (the rules file must not import props).
11. Scripts: update `render-avatar-sheet.ts` and `explain-character.ts` to the new field names; no behaviour change.
12. Tests (unit): `avatar-test-helpers.ts`: `avatarProfile(classId, jobId, tiers)`; `LOOK_KEYS` = every combat class x (its 3 jobs + null) plus Adventurer x null (the old Adventurer x motif combos were test-only). `class-looks.test.ts`: 10 looks; keys `mage/seer`; `mage/knight` invalid; legacy `mage/hawk`, `warrior/banner`, `archer/crystal` invalid (replaces the old "archer/crystal accepted" line); `changeClass` keeps the slot (warrior/sentinel -> archer/herald); adventurer -> mage takes the pick's slot; `changeJob` ignores adventurer and a job of another class. `character-rules.test.ts` L27: ids across `JOBS` are unique and equal `JOB_IDS`. `classify-character.test.ts` L108/126: `profile.jobId`. `compose-avatar-grid`/`avatar-svg-paths`/`look-avatar-model`: job ids (`'knight'`, `'sentinel'` ...); add `Job prop: crest shield` assertion for knight. `avatar-silhouette.test.ts`: loop slot index `0..2` (job `JOBS[c][i].id` across classes) instead of `MOTIF_IDS`. `avatar-sprites.test.ts`: `placements()` takes the 3 jobs of the class from `jobPropSprites` (use the prop's own x/y) and the "6x11 motif" block becomes a shape check per job (width/height consistent across frames); move prop tests to the file created in phase 02 if `avatar-sprites.test.ts` nears 200 lines.
13. Tests (e2e): update helper param names and slot ids as listed; add `mage/hawk` to the older-version-key test next to `mage/data`; keep assertions derived from `LOOKS`/`pick` where they already are.
14. Gate: `npm run check && npm run test:unit`; digest script again must print the identical sha256; then `npm run build && npm run test:e2e` (fix only selector/value fallout).

## Todo list
- [ ] Baseline digest reproduced
- [ ] `JobId`, helpers, `JobDefinition` updated; `MOTIF_IDS` gone (`grep -rn "MOTIF_IDS\|MotifId\|\.motif" src scripts tests` empty)
- [ ] `PlacedSprite`/`JobPropFrames`; `PoseAnchors.motif` removed from type + 4 pose files
- [ ] 3 class prop files (legacy art) + registry + `avatar-job-style.ts`; `avatar-job-motifs.ts` deleted
- [ ] `select-avatar-layers`, `avatar-description`, `class-looks`, classifier, switcher scripts, sheet/explain scripts migrated
- [ ] Unit tests migrated; legacy-key cases added
- [ ] e2e helpers/specs migrated
- [ ] Digest identical; check, unit, e2e green

## Success Criteria
- `hash-look-grids.ts` prints the same sha256 as step 1 (pixel-neutral).
- `npm run check`, `npm run test:unit`, `npm run test:e2e` green; `switcher-eager-imports` green.
- `parseLookKey('mage/hawk') === null`, `parseLookKey('mage/seer')` valid, `parseLookKey('mage/knight') === null`; `allClassLooks().length === 10`.
- No file > 200 lines; hero/sheet markup identical to before except the `<desc>` prop wording.

## Risk Assessment
| Risk | Impact | Mitigation |
|---|---|---|
| Missed `.motif` consumer (Astro files, scripts) | build/type error | `grep -rn "motif" src scripts tests` after the edit; `npm run check` |
| Radio value change breaks e2e selectors | red e2e | helpers take job ids; run e2e at the end of the phase |
| Slot mapping edge cases (Adventurer -> class, pick = Adventurer) | invalid look | exhaustive test: every look x every class stays valid (existing test pattern) |
| Visitors with saved legacy keys | choice resets once | accepted; changelog (phase 07); optional migration map is open question 6 |
| Placeholder `Job prop:` names mismatch legacy art | wrong desc on branch | branch-only; fixed as art lands; reviewer note |

## Security Considerations
Allow-list parsing stays the only path from storage/DOM to the composer (rule 4): `parseJobId` + class membership check; invalid input returns null and the key is removed (existing `readSaved`). No `innerHTML`; text stays from rules/labels. No new inputs.

## Next steps
Phase 02 adds the accent palette, trim layer and the prop geometry/collision tests that the art phases rely on.
