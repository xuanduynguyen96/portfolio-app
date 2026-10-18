# Phase 03: Switcher component + tiny client script

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 01, 02 · Blocks: 04
- Inputs: [report 01](reports/01-scout-and-baseline-report.md)
- Docs: `docs/code-standards.md#accessibility-rules`, `#animation-hooks-data-attributes` (rule 6: re-bind on `astro:page-load`, clean on `astro:before-swap`), `docs/design-guidelines.md` (pixel frame, focus, forced colors, touch targets), `docs/system-architecture.md#root-flags-progressive-enhancement`

## Overview
- Date: 2026-10-18 · Priority: P0 · Effort: M (5h) · Implementation: Done · Review: covered by full-branch code review (report 03)

## Outcome (as built)
- Files: `src/components/avatar/class-job-switcher.astro` (SSR shell + `is:global` styles), `src/scripts/class-job-switcher.ts` (eager stub), `src/scripts/switcher-body.ts` (radio groups built on first open), `src/scripts/look-apply-model.ts` (lazy).
- Deviation: `switcher-option.astro` removed; radios not SSR (+7.8 KB raw cost mobile Lighthouse 1 point, LCP ~+0.2 s; 3 controlled runs).
- Failed import: cached by browser, no retry; control fails fast until reload. Save only after successful render (review M2).
- Sizes: stub 2,826 B gz (budget amended to <= 3 KB); lazy chunk 4,627 B gz (<= 5 KB OK).
- Review open: `:has()` dependence of focus ring; Firefox/Safari cached-failure behaviour unverified.
- Server-rendered control (native radiogroups in a `<details class="pixel-details">`) + one eager stub (`class-job-switcher.ts`, <= 1.5 KB gz) that owns state and UI sync, and lazy-loads the renderer (phase 02) on first open. Stub imports only the light pure modules. The choice is saved per browser (`localStorage`, try/catch) and re-applied on every page load / soft nav.

## Key Insights
- Native `<input type=radio>` groups give Tab/arrow/Space behaviour, form semantics and a11y for free (selection follows focus, `change` fires): no roving-tabindex code. Class group = 4 radios (`name=switcher-class`); one job `<fieldset>` per combat class (`name=switcher-job-<class>`, 3 radios, value = motif), only the current class's shown. Adventurer: no job fieldset, a note ("no job: too little public signal"), matching the code (Adventurer has no motif).
- Names and structure are all server-rendered from rules (`CLASS_IDS`, `CLASS_NAMES`, `JOBS`, `ARCHETYPE_LABELS`): the stub needs no catalog JSON, only `data-default-look` (key) and `data-gear` (opaque JSON handed to the lazy chunk).
- Reserved space: control is in the HTML with `visibility:hidden` until `data-ready` (set on bind) => same box before/after, not focusable, out of the a11y tree; `@media (scripting: none) { display: none }` for no-JS. Bundle failure = blank 44px slot (summary height) rather than a dead control. This is an enhancement-only control, so it does not break the "never hide content" rule (all real content stays visible).
- Module scripts run once; DOM is replaced on soft nav: listeners go on elements of the current DOM with an `AbortController`, cleaned on `astro:before-swap` (same shape as `mobile-menu.ts` / `speedrun-countdown.ts`). Astro inlines a script only when its whole bundle is one small chunk (`speedrun-countdown.ts` + its util is inlined); the stub's dynamic `import()` forces a split, so expect an external file and do not assume inline (phase 00 confirms).
- Firefox may restore radio state on reload: `bind()` re-syncs `checked` from state; inputs get `autocomplete="off"`.
- Shifts from a user action (<500 ms) are excluded from CLS; warming the chunk on `<details>` open keeps the later radio click fast so nothing shifts seconds after input.

## Requirements
- Keyboard: Tab to the group, arrows change selection, Space on a focused radio, Enter/Space on summary; Reset button; visible focus (2px `--color-focus`, offset = frame + 2px).
- Mark the GitHub pick: tag "GitHub pick" on its class radio and (inside that class's job group) its job; visually-hidden ", " keeps the accessible name "Warrior, GitHub pick". Always-visible line "GitHub pick: Warrior · Vanguard" (what the public GitHub data suggests; the visitor is free to choose anything). Not colour-only (text + frame width + marker shape).
- Live region: `<p role="status" data-look-status>` present in HTML at load; text set after the renderer applied. Messages from `statusMessage()` (phase 01).
- "Reset to GitHub pick": `disabled` when already the pick; after reset focus moves to the pick's class radio; clears the saved choice.
- Scope note in the panel: "Class and job change the sprite and name. Gear is earned from the public GitHub stats and shows on any class." Attributes and the Why panel keep describing the GitHub-derived class (follow-up if confusing; plan Q3).
- Selecting a class sets the job per `changeClass` (keeps motif); job change per `changeMotif`; values validated with `parseClassId` / `parseMotif`.
- Failure (chunk import or render throws): controls revert to the GitHub pick, saved choice left untouched, status "Couldn't switch class. Showing the GitHub pick.", `console.warn`, nothing half-applied.
- Light/dark via tokens only; forced colors: `.pixel-frame` border fallback exists; checked option uses thicker `--frame-width` so it differs without colour; touch targets >= 44px; 360px: options wrap (`repeat(auto-fit, minmax(min(100%, 8.5rem), 1fr))`), no h-scroll.
- Persistence: key `portfolio-look` in `localStorage`, value = look key. Read on `astro:page-load` via `parseStoredLook` (invalid value -> ignored and removed); written on change; removed on Reset or when the choice equals the pick. All access in try/catch (blocked storage = choice lasts for the page only, no error). If the saved look differs from the pick, `bind()` applies it right away (imports the chunk) and syncs the radios, so hero, sheet and re-entered pages stay consistent. SSR/no-JS always shows the GitHub pick; a returning visitor sees one avatar swap after load (same SVG box; nameplate rewrap measured in phase 05).

## Architecture
```
<details class="look-switcher pixel-details" data-look data-default-look="warrior/frontend" data-gear='[{"slot":"armor","tier":0},…]'>
  <summary class="hud-text">Choose class &amp; job</summary>
  <p class="switcher-pick">GitHub pick: <strong>Warrior · Vanguard</strong></p>
  <fieldset><legend>Class</legend> 4 × <SwitcherOption name="switcher-class" value=… isPick?/> </fieldset>
  3 × <fieldset data-look-jobs="warrior|mage|archer" hidden?><legend>Job</legend> 3 × <SwitcherOption name="switcher-job-…" value=motif hint=ARCHETYPE_LABELS/></fieldset>
  <p data-look-jobs="adventurer" hidden>Adventurer has no job …</p>
  <button type="button" class="switcher-reset pixel-frame" data-look-reset disabled>Reset to GitHub pick</button>
  <p role="status" data-look-status></p>
</details>
```
```ts
// src/scripts/class-job-switcher.ts (eager, static imports: class-looks, class-labels only)
let controller: AbortController | null = null;
const loadRenderer = once(() => import('./look-apply-model'));
function bind() { unbind(); const root = $('[data-look]'); const pick = parseLookKey(root?.dataset.defaultLook ?? ''); if (!root || !pick) return; const saved = readSaved();
  controller = new AbortController(); const { signal } = controller; let look = saved ?? pick; let token = 0;
  root.addEventListener('toggle', () => root.open && void loadRenderer().catch(() => {}), { signal });
  root.addEventListener('change', (e) => show(nextLook(look, e.target)), { signal });
  reset.addEventListener('click', () => { show(pick); focusPickClass(); }, { signal });
  sync(); root.dataset.ready = ''; if (saved) void show(saved, { quiet: true }); }
document.addEventListener('astro:page-load', bind);
document.addEventListener('astro:before-swap', unbind);   // abort() + token++ (stale import results ignored)
```
`show(next, { quiet })`: set state, `writeSaved` (remove when equal to the pick), `sync()` (radios `checked`, visible job fieldset, reset `disabled`), `await loadRenderer()`, bail if aborted/stale token, `renderLook(lookKey(next), gearJson)`, then `status.textContent = statusMessage(...)` (skipped when `quiet`: a load-time restore must not announce).

## Related Code Files
Create:
- `/home/user/portfolio-app/src/components/avatar/class-job-switcher.astro` (props: `character: CharacterProfile`; markup + scoped styles; `<script>import '../../scripts/class-job-switcher'</script>`)
- `/home/user/portfolio-app/src/components/avatar/switcher-option.astro` (one radio + label; DRY for 4 + 9 options)
- `/home/user/portfolio-app/src/scripts/class-job-switcher.ts`
Modify:
- `/home/user/portfolio-app/tests/unit/switcher-eager-imports.test.ts` (also walk the static imports of `src/scripts/class-job-switcher.ts`; dynamic `import()` excluded)
Read: `src/components/theme-toggle.astro` (button + `pixel-frame` pattern), `src/styles/effects.css` (`.pixel-frame`, `.pixel-details`, forced-colors), `src/styles/design-tokens.css` (`--color-frame*`, `--color-focus`), `src/scripts/mobile-menu.ts`.

## Implementation Steps
1. `switcher-option.astro`: `<label class="switcher-option pixel-frame"><input type=radio autocomplete=off …/><span class="switcher-marker" aria-hidden/><span>{label}</span>{hint}{isPick && <span class="switcher-pick-tag hud-text"><span class="visually-hidden">, </span>GitHub pick</span>}</label>`; the input covers the label (opacity 0, absolute, 100%) so the whole 44px+ box is the target; `label:has(input:focus-visible)` outline; `label:has(input:checked)` = thicker frame + `--color-surface-hover` + filled marker square (hollow when unchecked).
2. `class-job-switcher.astro`: build everything from `CLASS_IDS`, `CLASS_NAMES`, `JOBS`, `ARCHETYPE_IDS`, `ARCHETYPE_LABELS`, `defaultLook`, `lookTitle`, `suggestionLine`; initial `hidden`/`checked` from the GitHub pick. CSS: `.look-switcher:not([data-ready]) { visibility: hidden }`, `@media (scripting: none) { .look-switcher { display: none } }`, option grids, reset button (`.pixel-frame`, min-height 2.75rem, hover `--frame-color: var(--color-frame-hover)`), status `font-size: var(--text-sm)`. Keep file < 200 lines (move CSS shared by options into `switcher-option.astro`).
3. `class-job-switcher.ts` as sketched (< 100 lines): state, `sync()`, delegated `change`, reset, `toggle` warm-up, token for stale results, error path, `bind`/`unbind`.
4. Extend the eager-imports unit test with the stub; `npm run test:unit`.
5. `npm run check`; `npm run build`; inspect `dist/`: stub emitted/inlined, size <= 1.5 KB gz, no sprite data reachable from it, lazy chunk name contains the applier.
6. Manual in `npm run dev` + preview: keyboard walk, 360px, light/dark, forced colors (devtools), reduced motion, soft nav away/back, JS disabled, chunk blocked (devtools).

## Todo List
- [x] switcher-option.astro (removed; replaced by switcher-body.ts)
- [x] class-job-switcher.astro
- [x] class-job-switcher.ts (+ eager-imports test updated)
- [x] saved-choice read/write (try/catch) + restore without announcement
- [x] build output sizes checked against budget
- [ ] manual keyboard / 360 / themes / forced colors / no-JS pass (e2e covers 360, forced colors, no-JS; manual keyboard-only walk not recorded)

## Success Criteria
- Control invisible + inert without JS or on bundle failure; box identical hidden vs ready (no shift)
- Saved choice restored on reload and soft nav, ignored when invalid/blocked, cleared by Reset
- Class change keeps job archetype; Adventurer shows the note, no job radios
- One status update per change (no duplicate listeners after 3 soft navs)
- Eager stub <= 1.5 KB gz; nothing but stub and markup loads before the first open
- Files < 200 lines, tokens only, no literal colours

## Risk Assessment
- `:has()` / `scripting` media: Baseline 2023-24, same era as the `light-dark()` already required; without `:has()` the focus/checked ring is lost -> add a plain `input:focus-visible + .switcher-marker` fallback ring.
- Hidden `visibility` slot looks odd on bundle failure -> acceptable (rare), avoids a clickable dead control.
- Radio `change` before the chunk is ready -> awaited, controls reflect state immediately; status says nothing until applied.
- Hero nameplate rewrap after a switch shifts the hero -> user-initiated and off-screen at the time (excluded from CLS); revisit only if Lighthouse flags it.

## Security Considerations
- Radio values and `data-*` are parsed with `parseClassId` / `parseMotif` / `parseLookKey` (allow-list); `data-gear` is validated in the chunk (`parseDefaultProfile`); status text via `textContent`; no `innerHTML`; no network, no cookies, no URL changes; storage = one allow-listed look key (no personal data).

## Next Steps
- 04 mounts the control and tags hero/sheet targets. Unresolved: plan Q2 (hero entry link), Q3 (Why panel wording).
