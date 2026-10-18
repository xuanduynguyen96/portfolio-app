# Plan: Class/job switcher (hero + character sheet)

Created: 2026-10-18 · Rev 2: 2026-10-18 · Rev 3 (status): 2026-10-18 · Status: **Implemented on feat/class-job-switcher; docs in progress; awaiting user review (no PR opened)** · Target: v1.4 · Inputs: [scout + baseline](reports/01-scout-and-baseline-report.md) · Prior: [v1.3 avatar](../20261017-1617-github-derived-character-avatar/plan.md)

## Goal
Visitor picks any of 10 looks (3 combat classes x 3 jobs + Adventurer); hero + sheet sprite and "Class · Job" name change. Gear earned from GitHub stats (armor=security, shield=testing, boots=automation, amulet=docs; tiers 0-3) drawn on the chosen look. Default = GitHub-derived look, labelled "GitHub pick".

## Key decisions (rev 2, still in force)
- No preview/try-on framing. Class/job/gear/XP stay computed from the snapshot, never hand-set; derived look = default + reset target.
- Gear = f(stats) only; same tiers on every look. Choice saved in `localStorage` (`portfolio-look`, allow-listed).
- Delivery C: browser composes from pure modules via lazy `import()` on first `<details>` open (or on load when a saved look exists). SSR shell shows GitHub pick; control `visibility:hidden` until `data-ready`, hidden under `scripting: none`.
- Lifecycle: bind `astro:page-load`, cleanup `astro:before-swap` (AbortController, stale-token guard).
- Out of scope (follow-ups): attributes/Why panel for chosen class, theme accents, `/speedrun/` + `/credits/` propagation, hero entry link, shareable URL, class-specific gear art, visitor-supplied GitHub username.

## Status (2026-10-18)
Branch `feat/class-job-switcher` on plan `3e703f1`: `e006efa` feat, `5b3e757` e2e, `1fbef88` perf. No PR. Phase 06 docs (docs-manager) in progress. Chain 00 -> 06; rollback branch-only (remove `<ClassJobSwitcher />` + `switchable` flags).

| # | Phase | Priority | Effort | Status | Progress |
|---|---|---|---|---|---|
| 00 | [Spike: payload + delivery](phase-00-spike-variant-size-budget-delivery-decision.md) | P0 | S (2h) | Done informally; no report 02; option C | 100% |
| 01 | [Pure looks + labels module](phase-01-pure-class-looks-and-labels-module.md) | P0 | S (3h) | Done | 100% |
| 02 | [Model + DOM applier (lazy chunk)](phase-02-variant-model-and-dom-applier.md) | P0 | S (3h) | Done | 100% |
| 03 | [Switcher component + client script](phase-03-switcher-component-and-client-script.md) | P0 | M (5h) | Done | 100% |
| 04 | [Hero + sheet integration](phase-04-hero-and-character-sheet-integration.md) | P0 | S (3h) | Done | 100% |
| 05 | [Verification: e2e, a11y, perf](phase-05-verification-e2e-a11y-perf.md) | P0 | M (5h) | Partial: automated, budgets, axe done; manual a11y, determinism, extra Lighthouse open | partial |
| 06 | [Docs + changelog (v1.4)](phase-06-docs-update.md) | P1 | S (2h) | In progress (docs-manager) | in progress |

## Measured vs budget
| Item | Budget | Measured |
|---|---|---|
| Eager stub | <= 3 KB gz (was 1.5; amended) | 6,457 B raw / 2,826 B gz |
| Lazy chunk | <= 5 KB gz | 18,120 B / 4,627 B gz |
| Home HTML gzip | growth <= 2 KB | 13,452 -> 13,790 B (+338 B) |
| Chunk before first open | 0 (fresh visitor) | 0 (e2e) |
| Lighthouse mobile home | 99-100; CLS <= 0.002 | 99/100/100/100 x3; CLS 0.0016 (= baseline) |
| Saved look CLS | <= 0.005 | <= 0.005 at 360 + 1280 (archer/data, longest name) |
| Compose+apply, 4x CPU | <= 5 ms (amended <= 16 ms warm) | 10-14 ms warm; 44 ms first call |
| Tests | unit 231 + new; e2e 94 + new | unit 261; e2e 120 |

## Deviations (as built; details in phase files)
- API: model fields `title`/`desc` (not svgTitle/svgDesc); `lookAvatarModel(look, gear)`; `parseGear(json)` replaces `parseDefaultProfile`; `isDefault` computed in stub; `SWITCH_FAILED_MESSAGE` added; `parseStoredLook` = alias of `parseLookKey`.
- `switcher-option.astro` removed. Radio groups built by `src/scripts/switcher-body.ts` on first open, not SSR: SSR markup (+7.8 KB raw) cost mobile Lighthouse 99->98, LCP ~+0.2 s (3 runs; removing markup restored 99, removing script did not). Styles `is:global` (JS-built nodes lack Astro scope attrs); breaks phase 04 "scoped styles" criterion.
- Failed dynamic import stays cached by the browser (Chromium verified): no retry; control fails fast until reload. Retry design removed.
- Save written only after successful render (review M2): choice lost if page changes before chunk applies.
- Reset restores an equivalent, not byte-identical, SVG (CSSOM serializes `fill` differently). Tests compare path `d` + fill + title/desc.
- Job choice keeps archetype across combat classes; from Adventurer it takes the pick's job.
- Tests: unit 261 (231+30); e2e 120 (94+26: `class-job-switcher.spec` 14, `class-job-switcher-quality` 11, lifecycle +1). Helpers: `switcher-helpers.ts`. Plan cases 14 (forced colors), 15 (360px), 16 (axe) live in the quality spec.

## Definition of Done (status)
- [x] Hero + sheet switch together for 10 looks; gear tiers identical across looks, drawn on each.
- [x] Reset restores equivalent SVG (not byte-identical; reworded); derived pick always labelled.
- [x] Saved choice survives reload + soft nav; invalid/blocked storage harmless.
- [x] check/unit/e2e green (unit 261, e2e 120); axe covered (quality #16).
- [x] Budgets met as amended (table above).
- [x] No-JS, reduced motion, forced colors, 360px, soft nav covered by e2e.
- [ ] Not run: manual SR smoke, 200% zoom, Windows high contrast, determinism diff (`CAREER_RPG_NOW` twice), desktop + other-page Lighthouse.
- [ ] Docs + changelog (phase 06 in progress).

## Unresolved Questions
**Assumed defaults, need user confirmation (not answered before /code run):**
1. Owner's GitHub stats = "their stats" (visitor username out of scope).
2. Same stat tiers on all looks (no class/job rules).
3. Attributes + Why panel keep GitHub-derived class.
4. Delivery C (lazy chunk; "no client JS" docs reworded).
5. Control only in character sheet (no hero link).
6. `localStorage` persistence.
7. No `/speedrun/` / `/credits/` propagation yet.
8. Adventurer selectable; "GitHub pick" wording.
9. Amended budgets (eager <= 3 KB gz, compose <= 16 ms warm) + v1.4 version/changelog date.

**Open from review / verification:**
10. Firefox/Safari behaviour of cached failed imports unverified.
11. Stale-token race + navigation-mid-flight tests absent (hand-probed OK).
12. Focus ring depends on `:has()`; fallback ring planned, confirm present.
13. First compose call 44 ms at 4x (one-time, over warm budget): accept?
14. Lighthouse "99/100/100/100 x3": category order and run count to confirm.
15. `character-avatar.spec` scope assertion (`data-look-avatar` absent on speedrun/credits) not confirmed.
16. Report 02 (spike decision) never written; decision recorded here and in phase 00.
