# Phase 01: Pure try-on looks + labels module, unit tests

## Context Links
- Parent: [plan.md](plan.md) · Depends on: none (delivery-agnostic) · Blocks: 02
- Inputs: [report 01](reports/01-scout-and-baseline-report.md) (valid looks, Adventurer facts)
- Docs: `docs/code-standards.md#career-rpg-modules-srcutilscareer-rpg` (pure-module rules), `#avatar-sprites`

## Overview
- Date: 2026-10-18 · Priority: P0 · Effort: S (3h) · Implementation: Not started · Review: Not started
- One pure source of truth for: which looks exist, which jobs are valid per class, state transitions, display strings, actual-vs-preview. Used by the Astro component (build), the eager client stub, the model builder and tests. Also removes two copies of "enumerate the 10 looks".

## Key Insights
- Job identity = motif (`ArchetypeId`); `JOBS[class][motif]` gives the name. Adventurer: `jobName null, motif null` in classifier output (`classify-character.ts` L39); production never combines Adventurer with a motif (test helper `LOOK_KEYS` does, test-only).
- Looks are enumerated three times today: `avatar-gallery.astro`, `scripts/render-avatar-sheet.ts` (`LOOKS`), `tests/unit/avatar-test-helpers.ts` (`LOOK_KEYS`, superset). DRY: first two switch to `allTryonLooks()`.
- Eager client graph must stay light: these two modules may import only `character-job-rules`, `character-class-rules` (ids; rule tables tree-shake), `character-title`, and types. No `data/avatar/*`, no `avatar-description` (it pulls sprites + gear rules), so the "Description" strings are built in phase 02.
- `tsconfig` `erasableSyntaxOnly`, `.ts` import specifiers, `import type` (code-standards).

## Requirements
- `TryonLook = { classId: ClassId; motif: ArchetypeId | null }`.
- Valid: combat class + one of `ARCHETYPE_IDS`; Adventurer + `null`. Anything else invalid.
- Transitions never leave the valid set; selecting a class keeps the current job archetype when the new class has jobs.
- Gear is passed through unchanged from the actual profile (try-on never edits gear).
- Strings: title via the existing `characterTitle()` (single place), preview markers and status messages here.
- Pure: no DOM, no Astro, no clock; returns new values.

## Architecture
```ts
// src/utils/avatar/tryon-looks.ts
export interface TryonLook { classId: ClassId; motif: ArchetypeId | null }
export function motifsFor(classId: ClassId): readonly ArchetypeId[]      // adventurer -> []
export function isValidLook(look: TryonLook): boolean
export function allTryonLooks(): TryonLook[]                              // CLASS_IDS x ARCHETYPE_IDS + adventurer = 10
export function lookKey(look): string                                     // 'mage/data' | 'adventurer'
export function parseLookKey(key: string): TryonLook | null               // validates DOM-supplied values
export function parseClassId(value: string): ClassId | null              // radio values from the DOM
export function parseMotif(value: string): ArchetypeId | null
export function actualLook(actual: Pick<AvatarProfile, 'classId' | 'motif'>): TryonLook
export function sameLook(a: TryonLook, b: TryonLook): boolean
export function changeClass(current: TryonLook, classId: ClassId, actual: TryonLook): TryonLook
export function changeMotif(current: TryonLook, motif: ArchetypeId): TryonLook   // adventurer / invalid -> current
export function lookProfile(look: TryonLook, gear: AvatarProfile['gear']): AvatarProfile

// src/utils/avatar/tryon-labels.ts
export const TRYON_BADGE_TEXT = 'Preview · try-on';
export function lookTitle(look: TryonLook): string                                 // characterTitle(lookProfile(look, [])) -> 'Mage · Sorcerer'
export function avatarTitleFor(profile: AvatarProfile, isActual: boolean): string   // 'Mage · Sorcerer (preview)'
export const TRYON_DESC_PREFIX = 'Try-on preview, not the real class. ';
export function actualLine(actualTitle: string): string                              // 'Actual (from public GitHub): Warrior · Vanguard'
export function statusMessage(preview: string, actual: string, isActual: boolean): string
// isActual -> 'Showing your actual class: X.'  else -> 'Previewing X. Try-on only; your actual class is Y.'
```
`changeClass` rule: Adventurer -> `{adventurer, null}`; else motif = `current.motif ?? actual.motif ?? ARCHETYPE_IDS[0]`.

## Related Code Files
Create:
- `/home/user/portfolio-app/src/utils/avatar/tryon-looks.ts`
- `/home/user/portfolio-app/src/utils/avatar/tryon-labels.ts`
- `/home/user/portfolio-app/tests/unit/tryon-looks.test.ts`
- `/home/user/portfolio-app/tests/unit/tryon-labels.test.ts`
- `/home/user/portfolio-app/tests/unit/tryon-eager-imports.test.ts`
Modify:
- `/home/user/portfolio-app/src/components/avatar/avatar-gallery.astro` (use `allTryonLooks` + `lookProfile`)
- `/home/user/portfolio-app/scripts/render-avatar-sheet.ts` (`LOOKS`/`PURE`/`profileOf` -> shared helpers; keep output identical)
Read: `src/data/character-job-rules.ts`, `src/data/character-class-rules.ts` (`ARCHETYPE_IDS`), `src/utils/github-character/character-title.ts`, `tests/unit/avatar-test-helpers.ts`, `tests/unit/github-snapshot-fixtures.ts`, `src/utils/github-character/classify-character.ts`.

## Implementation Steps
1. Baseline: `node scripts/render-avatar-sheet.ts /tmp-scratch/before.html`; keep for the diff in step 7.
2. Write `tryon-looks.ts` (<100 lines). `lookProfile` takes names from `CLASS_NAMES` / `JOBS[classId][motif]` (narrow `CombatClassId`), `motif` null for Adventurer, `gear` passed through.
3. Write `tryon-labels.ts` (<60 lines), reusing `characterTitle`.
4. Unit tests (`node:test`, build profiles with `avatarProfile` from `avatar-test-helpers.ts` where handy):
   - `allTryonLooks`: 10 entries, unique keys, 9 combat + 1 Adventurer, all valid; set equals gallery enumeration.
   - `motifsFor`/`isValidLook`: Adventurer -> none; Adventurer + motif invalid; combat + null invalid; unknown motif invalid.
   - `parseClassId`/`parseMotif`: accept only rule ids (reject `''`, `'Warrior'`, `'constructor'`).
   - `lookKey`/`parseLookKey`: round trip for all 10; rejects `''`, `'warrior'`, `'warrior/x'`, `'adventurer/data'`, `'__proto__/data'`, non-strings.
   - `actualLook`: classifier output of the committed-shape fixture and of an empty snapshot (Adventurer) are valid looks.
   - `changeClass`: keeps motif across combat classes; from Adventurer uses actual motif, else first archetype; to Adventurer drops motif; never invalid (exhaustive over 4 x 10).
   - `changeMotif`: valid change; ignored for Adventurer / unknown.
   - `lookProfile`: names equal `JOBS` entries; gear deep-equal and not the mutated input; Adventurer `jobName null`.
   - labels: titles ("Mage · Sorcerer", "Adventurer"), preview suffix only when not actual, status strings name both titles and the words "Previewing" / "actual", `actualLine`.
   - `tryon-eager-imports.test.ts`: read `tryon-looks.ts` + `tryon-labels.ts`, follow relative non-type imports transitively, assert none resolves under `src/data/avatar/` or to `avatar-description|select-avatar-layers|compose-avatar-grid|avatar-svg-*` (guard for the tiny eager bundle).
5. Replace the inline enumeration in `avatar-gallery.astro` and `render-avatar-sheet.ts`; keep `AvatarProfile` shapes.
6. `npm run check`, `npm run test:unit` (231 + new), e2e `credits-page`/`character-avatar` specs still pass (gallery count 10).
7. Re-run the sheet script; `diff before.html after.html` must be empty.

## Todo List
- [ ] tryon-looks.ts
- [ ] tryon-labels.ts
- [ ] 3 unit test files
- [ ] gallery + sheet script de-duplicated, sheet output identical
- [ ] check + unit + e2e green

## Success Criteria
- All 10 looks and only those are reachable via transitions (exhaustive test)
- No hardcoded class/job names in the new files (read from rules)
- Sheet script output byte-identical before/after refactor
- Files <200 lines, erasable syntax, `.ts` imports

## Risk Assessment
- Rule change adds a 4th archetype/class later -> `motifsFor`/`allTryonLooks` are derived from rules, tests are exhaustive (no hardcoded 10 except one assertion tied to `ARCHETYPE_IDS.length ** 2 + 1`).
- Client bundle grows silently -> `tryon-eager-imports.test.ts` + phase 05 size check.

## Security Considerations
- `parseLookKey` validates every DOM-supplied value (radio `value`, `data-*`) against the valid set; no value is ever interpolated into HTML or used as an object key unchecked (use `Object.hasOwn`/array membership).

## Next Steps
- 02 consumes `TryonLook`, `lookProfile`, labels. Unresolved: badge/status wording (plan Q5).
