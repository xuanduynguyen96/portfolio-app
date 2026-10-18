# Phase 02: Variant model + DOM applier (lazy chunk)

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 00 (decision), 01 · Blocks: 03
- Inputs: [report 01](reports/01-scout-and-baseline-report.md), phase 00 decision report
- Docs: `docs/code-standards.md#avatar-sprites`, `docs/design-guidelines.md#character-avatar` (loop gating, forced colors)

## Overview
- Date: 2026-10-18 · Priority: P0 · Effort: S (3h) · Implementation: Not started · Review: Not started
- Replaces the originally planned "build-time variant generation" (option C needs none). Two files: a pure, JSON-serializable **variant model** (same build modules as the server render) and a small **DOM applier** that is the lazy chunk's entry. If phase 00 picks option B, this phase instead emits `src/pages/tryon/[look].json.ts` (`getStaticPaths` over `allTryonLooks()`, same model) and the applier fetches it; everything else is unchanged.

## Key Insights
- The SVG element, its size attrs, ids and `aria-labelledby/-describedby` stay; only `<title>`, `<desc>` text and the frame `<g>` children change => reserved box, CLS 0, no id rewriting.
- New `<g class="avatar-frame-a|b">` elements restart the CSS-only loop (`character-avatar.astro` rules need `html[data-motion=ok]` + `no-preference` + `[data-animate]`); the sheet svg has no `data-animate`, so it stays static. No JS motion code.
- Parity rule: the applier mirrors the server markup exactly (hero: both frames; sheet: frame A only, decided by `data-animate`), so "Reset to actual" can be asserted byte-identical to the SSR output.
- Build markup with DOM APIs (`createElementNS`, `path.style.setProperty('fill', 'var(--avatar-x)')`), never `innerHTML` / `setAttribute('style')`: stays valid under a future strict CSP and removes HTML-injection surface.
- Compose cost ~1.5 ms/switch (measured in Node); string work stays out of the hot path.

## Requirements
- `tryonAvatarModel(look, actual)` -> `{ key, isActual, className, jobName, title, svgTitle, svgDesc, frames: [AvatarPath[], AvatarPath[]] }`; JSON-serializable; uses `lookProfile`, `avatarFrameGrid`, `avatarPaths`, `avatarDescription`.
- Preview: `svgTitle` = "X (preview)", `svgDesc` = `TRYON_DESC_PREFIX` + normal desc (gear text of the REAL gear). Actual: identical to the server's `<title>`/`<desc>`.
- `parseActualProfile(lookKey, gearJson)`: validates slot ids against `gearRules`, tier 0-3 integers; throws on bad input.
- `renderTryon(lookKey, gearJson)` (lazy entry): model -> apply to every `[data-tryon-avatar] svg.character-avatar` and `[data-tryon-name]`; null-safe on pages without targets; idempotent.
- No `astro:*` imports; erasable TS; `.ts` specifiers in the pure file.

## Architecture
```
tryon-switcher.ts (eager) ─ import() ─► tryon-apply-model.ts ── renderTryon(look, gearJson)
                                          ├─ tryon-avatar-model.ts  (pure)  ──► lookProfile, avatarFrameGrid, avatarPaths, avatarDescription, labels
                                          └─ DOM: for each target svg:
                                               title/desc.textContent = model.svgTitle/svgDesc
                                               svg.querySelectorAll(':scope > g').forEach(remove)
                                               append g.avatar-frame-a (+ g.avatar-frame-b when svg[data-animate])
                                               paths: createElementNS + setAttribute('d') + style.setProperty('fill','var(--avatar-…)')
                                             [data-tryon-name]: [data-tryon-class].textContent, [data-tryon-job] (hidden when no job), [data-tryon-badge].hidden = isActual
```

## Related Code Files
Create:
- `/home/user/portfolio-app/src/utils/avatar/tryon-avatar-model.ts` (pure)
- `/home/user/portfolio-app/src/scripts/tryon-apply-model.ts` (DOM, lazy entry; <80 lines)
- `/home/user/portfolio-app/tests/unit/tryon-avatar-model.test.ts`
Read: `src/utils/avatar/avatar-svg-markup.ts` (`avatarFrameGrid`, markup shape), `avatar-svg-paths.ts` (`avatarPaths`, `AvatarPath`), `avatar-description.ts`, `src/data/gear-rules.ts` (`gearRules`, `GEAR_SLOT_IDS`), `src/components/avatar/character-avatar.astro`.

## Implementation Steps
1. `tryon-avatar-model.ts`: `tryonAvatarModel`, `parseActualProfile`; `isActual = sameLook(look, actualLook(actual))`.
2. Unit tests (`tryon-avatar-model.test.ts`):
   - all 10 looks: 2 frames, non-empty, palette keys valid (`avatarPaths` throws otherwise), names/title match `lookProfile`.
   - parity: for the owner-like actual profile, model frames/`svgTitle`/`svgDesc` equal the pieces of `avatarSvgMarkup({animate:true})` (compare `<path style="fill:var(..)" d="..">` strings and unescaped title/desc).
   - preview desc keeps the exact "Gear: ..." text of the real gear for every look (gear never changes with the look).
   - `JSON.parse(JSON.stringify(model))` deep-equals model (option B stays open).
   - size guard: `JSON.stringify(model).length` <= 12 KB for all looks.
   - `parseActualProfile`: accepts the real shape; rejects unknown slot, tier 4/-1/1.5, non-array, bad look key.
3. `tryon-apply-model.ts`: write the applier as above; export only `renderTryon`. Guard every query for null; wrap nothing in try/catch (the caller handles failure).
4. Local manual check in `npm run dev`: call `renderTryon` from the console for all 10 keys; hero loop restarts, sheet static, names change.
5. `npm run check` (types for DOM code), `npm run test:unit`.

## Todo List
- [ ] tryon-avatar-model.ts + unit tests
- [ ] tryon-apply-model.ts
- [ ] dev-console smoke for 10 looks
- [ ] check + unit green

## Success Criteria
- Actual-look model reproduces the SSR title, desc and paths exactly (unit)
- Applier output for the actual look equals SSR innerHTML (asserted in e2e, phase 05)
- Lazy chunk (esbuild/Vite) <= 5 KB gz (budget from phase 00)
- No `innerHTML`, `insertAdjacentHTML`, `setAttribute('style')`, `eval` in `src/scripts/tryon-*`

## Risk Assessment
- Server markup changes later (new `<g>` structure) and drifts from the applier -> e2e byte-identical reset test fails loudly.
- Repeated switching leaks nodes -> applier removes old `<g>` before appending; e2e counts `<g>` children = 1 or 2 after many switches.
- A frame-B-less sheet svg gets frame B by mistake -> parity rule on `[data-animate]` + e2e asserts sheet has no `.avatar-frame-b`.

## Security Considerations
- All text via `textContent`; path data comes from build-time typed sprite data only; `fill` via CSSOM with `--avatar-*` tokens from `avatarCssVar` (no user input reaches the DOM except a validated look key).

## Next Steps
- 03 wires UI + eager stub to `renderTryon`. Unresolved: none new.
