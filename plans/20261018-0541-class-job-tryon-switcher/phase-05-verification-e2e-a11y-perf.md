# Phase 05: Verification: e2e, a11y, motion, lifecycle, perf

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 04 · Blocks: 06
- Inputs: [report 01](reports/01-scout-and-baseline-report.md) (baseline numbers), phase 00 decision report (budgets)
- Specs to mirror: `tests/e2e/character-avatar.spec.ts` (classifier-derived expectations, no-JS size check), `page-navigation-lifecycle.spec.ts`, `reduced-motion.spec.ts`, `forced-colors.spec.ts`, `accessibility-axe.spec.ts`
- Docs: `docs/code-standards.md#testing`, `docs/project-overview-pdr.md#non-functional-requirements`

## Overview
- Date: 2026-10-18 · Priority: P0 · Effort: M (5h) · Implementation: Not started · Review: Not started
- Prove the feature: correctness for all 10 looks, hero/sheet sync, actual-vs-preview labelling, reset, keyboard, axe, reduced motion, no-JS, forced colors, 360px, soft-nav lifecycle, failure paths, and the performance budgets. Run via the **tester** agent, then **code-reviewer**. Reports: `reports/03-verification-report.md`, `reports/04-code-review-report.md`.

## Key Insights
- Expectations come from the same pure modules (no hardcoded class names): `classifyCharacter(SNAPSHOT)` + `characterTitle` + `allTryonLooks`/`lookTitle`/`lookProfile`/`avatarPaths`, like `character-avatar.spec.ts`. A snapshot refresh changes the actual look, tests must not care.
- Strongest sync check: compare the DOM `<path d>` list of each frame to `avatarPaths(avatarFrameGrid(profile, frame))` computed in the test; and `outerHTML` of both SVGs after Reset equals the server render (captured at load).
- axe only audits visible content: the control is `visibility:hidden` until `data-ready`; wait for it before opening `details`. The existing axe spec already opens all `details` on home, so it covers the open default state once the wait exists.
- Chunk file name is hashed: match `/_astro/` + `tryon-apply` (confirm pattern in phase 00), never a full URL.
- Chromium only (project convention); `scripting: none` is exercised through `javaScriptEnabled: false`.

## Requirements
Automated (all existing 231 unit / 94 e2e stay green, nothing skipped or loosened; new counts recorded):
- Unit (phases 01-02): looks, labels, model, eager-imports.
- E2E new `tests/e2e/class-tryon-switcher.spec.ts`:
  1. No JS: control not visible, no `data-ready`, avatars + nameplates = actual; bundle blocked (abort `_astro/*.js` except ClientRouter): control hidden, page intact.
  2. Lazy: initial load makes no request to the try-on chunk; first `<details>` open requests it once; later opens/switches add none.
  3. Labelling: open control shows "Actual (from public GitHub): <title>"; actual class radio (and its actual job) tagged; accessible name "<Class>, Actual".
  4. Constraint: for each combat class the job group shows exactly `JOBS[class]` names (3); Adventurer hides job radios and shows the note; a class change keeps the job archetype.
  5. Keyboard: Tab to class group, ArrowRight/Down change selection, Space/Enter on summary and reset; visible focus ring (`outline-style` not none, offset); focus lands on the actual class radio after Reset.
  6. All 10 looks: for each, hero + sheet `getByRole('img', { name: "<title> (preview)" })`, both `.nameplate-class` texts = `lookTitle`, badge visible in both, status text names preview + actual, DOM path data of frames equals `avatarPaths` (hero A+B, sheet A only).
  7. Reset: preview then Reset -> hero/sheet `outerHTML` equals load-time server render, badge hidden, Reset disabled, status "Showing your actual class".
  8. Scope: gear legend rows, Why summary and the `Gear:` tail of the SVG `<desc>` unchanged during preview; preview `<desc>` starts with the try-on prefix.
  9. Live region: `role=status` exists at load; exactly one text update per change (MutationObserver), none on Reset when already actual.
  10. Motion: `reducedMotion: 'reduce'` -> hero `.avatar-frame-a` `animationName: none` after a switch; `no-preference` -> animation present (loop restarts on the new `<g>`) and sheet stays static; frame B `visibility: hidden` when static.
  11. Layout stability: SVG boxes stay 288 (hero) / 216 (sheet); sum of `layout-shift` entries (no recent input excluded) during open + 3 switches <= 0.002 at 360 and 1280.
  12. No persistence: reload after a preview -> actual in radios and avatars.
  13. Failure: block the chunk, change class -> controls revert, status "Preview unavailable. Showing your actual class.", avatars unchanged, no `pageerror`.
  14. Forced colors: options keep a border; checked option border wider than unchecked; avatar still `forced-color-adjust: none` with > 4 fills after a swap.
  15. 360px: no horizontal scroll with the control open + a preview; options and Reset >= 44px tall.
  16. axe (serious/critical = 0) with control open, default and with a preview active, dark + light.
- E2E edits: `page-navigation-lifecycle.spec.ts` + test "try-on re-binds across soft navigation" (preview, go to boss project and back, control ready and reset to actual, one status update per change after 3 rounds, no page errors, also back/forward; delayed chunk + navigate away does not apply to the next page); `character-avatar.spec.ts` + assert `data-tryon-avatar` on hero/sheet avatars and absent on `/speedrun/` and `/credits/`.
- Perf (production build, scratch copy or CI): see budgets in Success Criteria; Lighthouse mobile + desktop on `/`, boss project, `/speedrun/`, `/credits/`.
- Reuse `scripts/render-avatar-sheet.ts` enumeration (now `allTryonLooks`): sheet output unchanged vs v1.3 and a visual pass over all 10 looks in both themes.
- Manual: keyboard-only pass; screen reader smoke (control name/role, radios announce "Warrior, Actual", polite status once per change); 200% zoom + text-spacing reflow; Windows high contrast if available.

## Architecture
```
npm run check → test:unit → test:e2e (build+preview) → size/budget script → Lighthouse (preview) → determinism diff
reports/assets: lighthouse json/summary, screenshots (360/1280, light/dark, preview), size table
```

## Related Code Files
Create:
- `/home/user/portfolio-app/tests/e2e/class-tryon-switcher.spec.ts`
- `/home/user/portfolio-app/plans/20261018-0541-class-job-tryon-switcher/reports/03-verification-report.md`
- `/home/user/portfolio-app/plans/20261018-0541-class-job-tryon-switcher/reports/04-code-review-report.md`
Modify:
- `/home/user/portfolio-app/tests/e2e/page-navigation-lifecycle.spec.ts`
- `/home/user/portfolio-app/tests/e2e/character-avatar.spec.ts`
- `/home/user/portfolio-app/tests/e2e/test-helpers.ts` (shared `openTryon(page)` helper if reused by > 1 spec)
Read: `tests/e2e/career-mirror.ts` (`SNAPSHOT`), `accessibility-axe.spec.ts`, `reduced-motion.spec.ts`, `forced-colors.spec.ts`, `responsive-layout.spec.ts`.

## Implementation Steps
1. Write the new spec using classifier-derived expectations; helper `openTryon(page)` scrolls to `#character`, waits for `[data-tryon][data-ready]`, opens the summary.
2. Add the lifecycle test and the avatar-scope assertion.
3. `npm run check && npm run test:unit && npm run test:e2e`; fix, never loosen.
4. Build in a scratch copy; table: home HTML raw/gz vs baseline (13,452 B gz), `_astro/*.js` list, stub gz, lazy chunk gz, requests before/after open (devtools network).
5. Lighthouse x3 medians (mobile + desktop) for the 4 pages; CLS; confirm no change before interaction.
6. Chrome trace / CDP 4x CPU throttle: open + switch time <= 5 ms scripting for compose+apply.
7. `CAREER_RPG_NOW=2026-10-19` build twice, `diff -r` empty; `node scripts/render-avatar-sheet.ts` output identical to phase 01 baseline.
8. Manual a11y list; screenshots into `reports/assets/`.
9. Run **code-reviewer** agent over the full diff (focus: lifecycle leaks, stale async results, focus management, allow-list parsing, budget regressions); apply fixes; re-run steps 3-5.

## Todo List
- [ ] new e2e spec (16 cases)
- [ ] lifecycle + avatar-scope edits
- [ ] check/unit/e2e green, counts recorded
- [ ] size + request table vs baseline
- [ ] Lighthouse mobile/desktop, CLS
- [ ] determinism + sheet parity
- [ ] manual a11y pass + screenshots
- [ ] code review fixes

## Success Criteria
- All checks green; counts: unit 231 + new, e2e 94 + new (recorded)
- axe 0 serious/critical on home in both themes, default and preview states
- Budgets: home HTML gzip growth <= 2 KB; eager stub <= 1.5 KB gz; lazy chunk <= 5 KB gz; 0 try-on chunk requests before the first open; compose+apply <= 5 ms at 4x throttle
- Lighthouse mobile 99-100 (unchanged vs README), desktop 100, CLS <= 0.002; builds deterministic
- No-JS, bundle-failure, reduced-motion, forced-colors, 360px, light/dark, soft-nav all pass

## Risk Assessment
- Flaky hover/animation timing: assert computed `animationName` and DOM, never time-based frames.
- Hashed chunk name pattern drifts -> single constant in the spec, derived in phase 00.
- Lighthouse variance -> median of 3, compare against same-machine baseline.
- Layout-shift observer noise from font swap -> start observing after `load` + `document.fonts.ready`.

## Security Considerations
- Tests include malformed inputs only at the unit level (`parseLookKey`, `parseActualProfile`); e2e confirms no network beyond same-origin chunk, no storage writes (assert `localStorage`/`sessionStorage` untouched by the feature, theme key excluded).

## Next Steps
- 06 docs with the measured numbers. Unresolved: none new.
