# Phase 03: Switcher component + tiny client script

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 01, 02 · Blocks: 04
- Inputs: [report 01](reports/01-scout-and-baseline-report.md)
- Docs: `docs/code-standards.md#accessibility-rules`, `#animation-hooks-data-attributes` (rule 6: re-bind on `astro:page-load`, clean on `astro:before-swap`), `docs/design-guidelines.md` (pixel frame, focus, forced colors, touch targets), `docs/system-architecture.md#root-flags-progressive-enhancement`

## Overview
- Date: 2026-10-18 · Priority: P0 · Effort: M (5h) · Implementation: Not started · Review: Not started
- Server-rendered control (native radiogroups in a `<details class="pixel-details">`) + one eager stub (`tryon-switcher.ts`, <= 1.5 KB gz) that owns state and UI sync, and lazy-loads the renderer (phase 02) on first open. Stub imports only the light pure modules.

## Key Insights
- Native `<input type=radio>` groups give Tab/arrow/Space behaviour, form semantics and a11y for free (selection follows focus, `change` fires): no roving-tabindex code. Class group = 4 radios (`name=tryon-class`); one job `<fieldset>` per combat class (`name=tryon-job-<class>`, 3 radios, value = motif), only the current class's shown. Adventurer: no job fieldset, a note ("no job: too little public signal"), matching the code (Adventurer has no motif).
- Names and structure are all server-rendered from rules (`CLASS_IDS`, `CLASS_NAMES`, `JOBS`, `ARCHETYPE_LABELS`): the stub needs no catalog JSON, only `data-actual-look` (key) and `data-actual-gear` (opaque JSON handed to the lazy chunk).
- Reserved space: control is in the HTML with `visibility:hidden` until `data-ready` (set on bind) => same box before/after, not focusable, out of the a11y tree; `@media (scripting: none) { display: none }` for no-JS. Bundle failure = blank 44px slot (summary height) rather than a dead control. This is an enhancement-only control, so it does not break the "never hide content" rule (all real content stays visible).
- Module scripts run once; DOM is replaced on soft nav: listeners go on elements of the current DOM with an `AbortController`, cleaned on `astro:before-swap` (same shape as `mobile-menu.ts` / `speedrun-countdown.ts`). Astro inlines a script only when its whole bundle is one small chunk (`speedrun-countdown.ts` + its util is inlined); the stub's dynamic `import()` forces a split, so expect an external file and do not assume inline (phase 00 confirms).
- Firefox may restore radio state on reload: `bind()` re-syncs `checked` from state; inputs get `autocomplete="off"`.
- Shifts from a user action (<500 ms) are excluded from CLS; warming the chunk on `<details>` open keeps the later radio click fast so nothing shifts seconds after input.

## Requirements
- Keyboard: Tab to the group, arrows change selection, Space on a focused radio, Enter/Space on summary; Reset button; visible focus (2px `--color-focus`, offset = frame + 2px).
- Mark actual: tag "Actual" on the actual class radio and (inside that class's job group) the actual job; visually-hidden ", " keeps the accessible name "Warrior, Actual". Always-visible line "Actual (from public GitHub): Warrior · Vanguard". Not colour-only (text + frame width + marker shape).
- Live region: `<p role="status" data-tryon-status>` present in HTML at load; text set after the renderer applied. Messages from `statusMessage()` (phase 01).
- "Reset to actual": `disabled` when already actual; after reset focus moves to the actual class radio.
- Scope note in the panel: "Preview changes the sprite and name only. Gear, attributes and the Why panel stay real."
- Selecting a class sets the job per `changeClass` (keeps motif); job change per `changeMotif`; values validated with `parseClassId` / `parseMotif`.
- Failure (chunk import or render throws): controls revert to actual, status "Preview unavailable. Showing your actual class.", `console.warn`, nothing half-applied.
- Light/dark via tokens only; forced colors: `.pixel-frame` border fallback exists; checked option uses thicker `--frame-width` so it differs without colour; touch targets >= 44px; 360px: options wrap (`repeat(auto-fit, minmax(min(100%, 8.5rem), 1fr))`), no h-scroll.
- No persistence (module state only; every page load starts at actual).

## Architecture
```
<details class="tryon pixel-details" data-tryon data-actual-look="warrior/frontend" data-actual-gear='[{"slot":"armor","tier":0},…]'>
  <summary class="hud-text">Try on a class (preview)</summary>
  <p class="tryon-actual">Actual (from public GitHub): <strong>Warrior · Vanguard</strong></p>
  <fieldset><legend>Class</legend> 4 × <TryonOption name="tryon-class" value=… actual?/> </fieldset>
  3 × <fieldset data-tryon-jobs="warrior|mage|archer" hidden?><legend>Job</legend> 3 × <TryonOption name="tryon-job-…" value=motif hint=ARCHETYPE_LABELS/></fieldset>
  <p data-tryon-jobs="adventurer" hidden>Adventurer has no job …</p>
  <button type="button" class="tryon-reset pixel-frame" data-tryon-reset disabled>Reset to actual</button>
  <p role="status" data-tryon-status></p>
</details>
```
```ts
// src/scripts/tryon-switcher.ts (eager, static imports: tryon-looks, tryon-labels only)
let controller: AbortController | null = null;
const loadRenderer = once(() => import('./tryon-apply-model'));
function bind() { unbind(); const root = $('[data-tryon]'); const actual = parseLookKey(root?.dataset.actualLook ?? ''); if (!root || !actual) return;
  controller = new AbortController(); const { signal } = controller; let look = actual; let token = 0;
  root.addEventListener('toggle', () => root.open && void loadRenderer().catch(() => {}), { signal });
  root.addEventListener('change', (e) => show(nextLook(look, e.target)), { signal });
  reset.addEventListener('click', () => { show(actual); focusActualClass(); }, { signal });
  sync(); root.dataset.ready = ''; }
document.addEventListener('astro:page-load', bind);
document.addEventListener('astro:before-swap', unbind);   // abort() + token++ (stale import results ignored)
```
`show(next)`: set state, `sync()` (radios `checked`, visible job fieldset, reset `disabled`), `await loadRenderer()`, bail if aborted/stale token, `renderTryon(lookKey(next), gearJson)`, then `status.textContent = statusMessage(...)`.

## Related Code Files
Create:
- `/home/user/portfolio-app/src/components/avatar/class-tryon-switcher.astro` (props: `character: CharacterProfile`; markup + scoped styles; `<script>import '../../scripts/tryon-switcher'</script>`)
- `/home/user/portfolio-app/src/components/avatar/tryon-option.astro` (one radio + label; DRY for 4 + 9 options)
- `/home/user/portfolio-app/src/scripts/tryon-switcher.ts`
Modify:
- `/home/user/portfolio-app/tests/unit/tryon-eager-imports.test.ts` (also walk the static imports of `src/scripts/tryon-switcher.ts`; dynamic `import()` excluded)
Read: `src/components/theme-toggle.astro` (button + `pixel-frame` pattern), `src/styles/effects.css` (`.pixel-frame`, `.pixel-details`, forced-colors), `src/styles/design-tokens.css` (`--color-frame*`, `--color-focus`), `src/scripts/mobile-menu.ts`.

## Implementation Steps
1. `tryon-option.astro`: `<label class="tryon-option pixel-frame"><input type=radio autocomplete=off …/><span class="tryon-marker" aria-hidden/><span>{label}</span>{hint}{actual && <span class="tryon-actual-tag hud-text"><span class="visually-hidden">, </span>Actual</span>}</label>`; the input covers the label (opacity 0, absolute, 100%) so the whole 44px+ box is the target; `label:has(input:focus-visible)` outline; `label:has(input:checked)` = thicker frame + `--color-surface-hover` + filled marker square (hollow when unchecked).
2. `class-tryon-switcher.astro`: build everything from `CLASS_IDS`, `CLASS_NAMES`, `JOBS`, `ARCHETYPE_IDS`, `ARCHETYPE_LABELS`, `actualLook`, `lookTitle`, `actualLine`; initial `hidden`/`checked` from the actual look. CSS: `.tryon:not([data-ready]) { visibility: hidden }`, `@media (scripting: none) { .tryon { display: none } }`, option grids, reset button (`.pixel-frame`, min-height 2.75rem, hover `--frame-color: var(--color-frame-hover)`), status `font-size: var(--text-sm)`. Keep file < 200 lines (move CSS shared by options into `tryon-option.astro`).
3. `tryon-switcher.ts` as sketched (< 100 lines): state, `sync()`, delegated `change`, reset, `toggle` warm-up, token for stale results, error path, `bind`/`unbind`.
4. Extend the eager-imports unit test with the stub; `npm run test:unit`.
5. `npm run check`; `npm run build`; inspect `dist/`: stub emitted/inlined, size <= 1.5 KB gz, no sprite data reachable from it, lazy chunk name contains the applier.
6. Manual in `npm run dev` + preview: keyboard walk, 360px, light/dark, forced colors (devtools), reduced motion, soft nav away/back, JS disabled, chunk blocked (devtools).

## Todo List
- [ ] tryon-option.astro
- [ ] class-tryon-switcher.astro
- [ ] tryon-switcher.ts (+ eager-imports test updated)
- [ ] build output sizes checked against budget
- [ ] manual keyboard / 360 / themes / forced colors / no-JS pass

## Success Criteria
- Control invisible + inert without JS or on bundle failure; box identical hidden vs ready (no shift)
- Class change keeps job archetype; Adventurer shows the note, no job radios
- One status update per change (no duplicate listeners after 3 soft navs)
- Eager stub <= 1.5 KB gz; nothing but stub and markup loads before the first open
- Files < 200 lines, tokens only, no literal colours

## Risk Assessment
- `:has()` / `scripting` media: Baseline 2023-24, same era as the `light-dark()` already required; without `:has()` the focus/checked ring is lost -> add a plain `input:focus-visible + .tryon-marker` fallback ring.
- Hidden `visibility` slot looks odd on bundle failure -> acceptable (rare), avoids a clickable dead control.
- Radio `change` before the chunk is ready -> awaited, controls reflect state immediately; status says nothing until applied.
- Hero nameplate rewrap after a switch shifts the hero -> user-initiated and off-screen at the time (excluded from CLS); revisit only if Lighthouse flags it.

## Security Considerations
- Radio values and `data-*` are parsed with `parseClassId` / `parseMotif` / `parseLookKey` (allow-list); `data-actual-gear` is validated in the chunk (`parseActualProfile`); status text via `textContent`; no `innerHTML`; no network, no storage, no cookies, no URL changes.

## Next Steps
- 04 mounts the control and tags hero/sheet targets. Unresolved: plan Q2 (hero entry link), Q3 (hero reset).
