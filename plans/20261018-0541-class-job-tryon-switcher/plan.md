# Plan: Class/job "try-on" switcher (hero + character sheet)

Created: 2026-10-18 · Status: **Planned; awaiting user go + phase 00 delivery gate** · Target: v1.4 · Inputs: [scout + baseline](reports/01-scout-and-baseline-report.md) · Prior: [GitHub-derived character + avatar](../20261017-1617-github-derived-character-avatar/plan.md)

## Goal
Visitor picks any class/job (preview only) and sees avatar sprite + displayed name "Class · Job" change in the hero and the character-sheet portrait. Scope = sprite + name (SVG title/desc stay in sync; gear = owner's real gear). Out (follow-ups): attributes/Why panel, theme accents, `/speedrun/` + `/credits/` propagation, hero entry link, shareable URL.

## Key Decisions
- **Real identity is never touched.** Class/job/gear stay build-time derived; the preview is DOM-only, per page visit. Always labelled: control shows "Actual (from public GitHub): X", the actual radio carries an "Actual" tag, preview shows a "Preview · try-on" badge by both nameplates, SVG title gets "(preview)", live region says "Previewing X. Your actual class is Y."
- **Valid looks = 10** (3 combat classes x 3 jobs + Adventurer, which has no job/motif in code). Pure module owns combos, keys, labels.
- **Delivery (measured, recommend ONE): compose in the browser from the existing pure modules, lazy `import()` on first intent (open the disclosure).** A inline templates = +7.8 KB gz on every home load (fails 6 KB HTML budget); B per-look fetch = 14.2 KB gz for all, 10 endpoints, error/race states; C = 0 B initially, one ~4.1 KB gz chunk on use, ~1.5 ms/switch, no new build outputs, no drift. Phase 00 confirms with a prototype (fallback B; model is JSON-serializable so only transport changes).
- **Progressive enhancement:** control in server HTML (so its box is reserved, CLS 0) but `visibility:hidden` until the script sets `data-ready`; `@media (scripting: none)` removes it. No JS / bundle failure = actual identity only, control invisible + inert. SVG element stays; only `<title>`, `<desc>`, frame `<g>` are replaced (new `<g>` restarts the CSS-only loop, gated by `data-motion=ok` + no reduced motion).
- **Choice UI:** native radiogroups (class: 4, job: the 3 valid for that class, Adventurer shows "no job" note) in a `<details class="pixel-details">` in the portrait panel; polite `role=status`; "Reset to actual" (focus returns to actual class radio). Native radios = arrow keys for free.
- **Persistence: none.** Reload/navigation = actual (anti-gaming default, no flash, no shared misleading links). URL param / sessionStorage rejected for now (follow-up).
- **Lifecycle:** bind `astro:page-load`, cleanup `astro:before-swap` (AbortController; listeners live on swapped DOM; stale-import guard).
- **Phase split change:** original "02 build-time variant generation" becomes "variant model + DOM applier" (option C needs no build step). If phase 00 picks B, phase 02 emits `src/pages/tryon/[look].json.ts` from the same model.

## Phases

| # | Phase | Priority | Effort | Status | Progress |
|---|---|---|---|---|---|
| 00 | [Spike: variant payload budget + delivery decision](phase-00-spike-variant-size-budget-delivery-decision.md) | P0 | S (2h) | Not started (baseline measured, see report) | 25% |
| 01 | [Pure try-on looks + labels module, unit tests](phase-01-pure-tryon-looks-and-labels-module.md) | P0 | S (3h) | Not started | 0% |
| 02 | [Variant model + DOM applier (lazy chunk)](phase-02-variant-model-and-dom-applier.md) | P0 | S (3h) | Not started | 0% |
| 03 | [Switcher component + tiny client script](phase-03-switcher-component-and-client-script.md) | P0 | M (5h) | Not started | 0% |
| 04 | [Integration: hero + character sheet](phase-04-hero-and-character-sheet-integration.md) | P0 | S (3h) | Not started | 0% |
| 05 | [Verification: e2e, a11y, motion, lifecycle, perf](phase-05-verification-e2e-a11y-perf.md) | P0 | M (5h) | Not started | 0% |
| 06 | [Docs + changelog (v1.4)](phase-06-docs-update.md) | P1 | S (2h) | Not started | 0% |

## Dependencies
```
00 ─→ 01 ─→ 02 ─→ 03 ─→ 04 ─→ 05 ─→ 06
```
- 01 is delivery-agnostic (could start before 00 ends); 02+ wait for the 00 decision.
- Each phase ends green: `npm run check`, `npm run test:unit`, `npm run test:e2e`.
- Rollback: branch-only; feature is additive (remove `<ClassTryonSwitcher />` + `tryon` flags and the page is v1.3).

## Implementation workflow (CLAUDE.md)
Read `README.md` + `.claude/workflows/*` first; follow `development-rules.md` (kebab-case, files <200 lines, YAGNI/KISS/DRY, real code, no mocks). Per phase: implement -> **tester** agent (check, unit, e2e, report in `reports/`) -> **code-reviewer** agent (fix criticals) -> next. Phase 05 includes Lighthouse. Phase 06 by **docs-manager** agent. Dates via `bash -c 'date +%y%m%d'`. Conventional commits, no AI references; commit only on user approval.

## Definition of Done
- Hero + sheet switch together for all 10 looks; reset restores byte-identical SVG; actual always labelled; gear untouched
- check/unit/e2e green (231 unit + 94 e2e kept, new ones added); axe 0 serious/critical both themes incl. preview state
- Budgets: home HTML gzip growth from this feature <= 2 KB, eager script <= 1.5 KB gz, lazy chunk <= 5 KB gz, nothing but the stub before intent; Lighthouse mobile unchanged (99-100), CLS <= 0.002
- No-JS, reduced motion, forced colors, 360px, light/dark, soft-nav lifecycle verified; docs + changelog updated

## Unresolved Questions
1. Delivery option C (lazy chunk, sprite data reaches the browser, "zero client JS" docs reworded) acceptable, or must the avatar stay JS-free (then B)?
2. Control only in the character sheet (rec, hero is crowded at 360x640) or also a hero entry link/button?
3. Hero shows only a "Preview" badge; add a one-tap reset there too?
4. Adventurer allowed as a try-on target (no job picker, explanatory note)? Assumed yes.
5. Wording: "Preview · try-on" badge, "Actual" tag, "(preview)" in SVG title: OK?
6. Add an "Actual" micro-label to the no-JS nameplate too (assumed no: "Based on public GitHub activity" already says it)?
7. Chunk budget thresholds (<=5 KB gz lazy, <=1.5 KB gz eager): OK?
8. Changelog entry + roadmap version v1.4 and date at merge time.
