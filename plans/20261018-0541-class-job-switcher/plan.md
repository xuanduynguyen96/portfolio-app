# Plan: Class/job switcher (hero + character sheet)

Created: 2026-10-18 · Rev 2: 2026-10-18 · Status: **Planned; awaiting user go + phase 00 delivery gate** · Target: v1.4 · Inputs: [scout + baseline](reports/01-scout-and-baseline-report.md) · Prior: [GitHub-derived character + avatar](../20261017-1617-github-derived-character-avatar/plan.md)

## Goal
Visitor is not locked to the GitHub-derived class/job. They pick any of the 10 looks (3 combat classes x 3 jobs + Adventurer) and the hero + character-sheet avatar sprite and "Class · Job" name change. Equipment is earned from the GitHub stats (armor=security, shield=testing, boots=automation, amulet=docs, tiers 0-3) and is drawn on whichever look is chosen. Default = the class/job derived from GitHub, shown as "GitHub pick".

## Rev 2 changes (user correction: portfolio does not force a class/job)
- **Dropped** "Preview / try-on" framing: no badge, no "(preview)" in SVG title, no desc prefix, no "Actual" tag. Chosen look is just the displayed look.
- **Kept** anti-gaming where it matters: class/job/gear/XP stay computed from the snapshot, never hand-set. The derived look is labelled "GitHub pick" in the control and is the default + reset target.
- **Gear in scope, stats-driven:** tiers = f(GitHub stats) only, never f(class/job); same earned gear rendered on all 10 looks; unit + e2e check gear layers per look x tier set.
- **Persistence added:** choice saved in `localStorage` (`portfolio-look`, allow-listed key, try/catch), restored on load and soft nav; Reset clears it. No-JS and fresh visitors = GitHub pick.
- Renamed modules/tests/hooks `tryon-*` -> `class-looks`, `class-labels`, `look-avatar-model`, `look-apply-model`, `class-job-switcher`, `data-look*`.

## Key Decisions
- **Valid looks = 10.** Adventurer has no job/motif in code: job picker hidden with a note. Pure module owns combos, keys, labels.
- **Delivery (measured, recommend ONE): compose in the browser from the existing pure modules, lazy `import()` on first open of the control (or on load when a saved look exists).** A inline templates +7.8 KB gz on every home load (fails budget); B per-look fetch 14.2 KB gz for all 10; C 0 B initially, ~4.1 KB gz chunk on use, ~1.5 ms/switch, no drift. Phase 00 confirms; fallback B.
- **Progressive enhancement:** control in server HTML but `visibility:hidden` until `data-ready`; `@media (scripting: none)` removes it. No JS / bundle failure = GitHub pick only. Only SVG `<title>`, `<desc>`, frame `<g>` are replaced (new `<g>` restarts the CSS-only loop, gated by motion rules).
- **Choice UI:** native radiogroups (class: 4, job: the 3 valid for the class) in a `<details>` in the portrait panel; polite `role=status`; "Reset to GitHub pick".
- **Lifecycle:** bind `astro:page-load`, cleanup `astro:before-swap` (AbortController, stale-import guard).
- **Out of scope (follow-ups):** attributes / Why panel for the chosen class, theme accents, `/speedrun/` + `/credits/` propagation, hero entry link, shareable URL, class-specific gear art, visitor-supplied GitHub username.

## Phases

| # | Phase | Priority | Effort | Status | Progress |
|---|---|---|---|---|---|
| 00 | [Spike: variant payload budget + delivery decision](phase-00-spike-variant-size-budget-delivery-decision.md) | P0 | S (2h) | Not started (baseline measured, see report) | 25% |
| 01 | [Pure class/job looks + labels module, unit tests](phase-01-pure-class-looks-and-labels-module.md) | P0 | S (3h) | Not started | 0% |
| 02 | [Look model + DOM applier (lazy chunk), gear-on-every-look tests](phase-02-variant-model-and-dom-applier.md) | P0 | S (3h) | Not started | 0% |
| 03 | [Switcher component + client script + saved choice](phase-03-switcher-component-and-client-script.md) | P0 | M (5h) | Not started | 0% |
| 04 | [Integration: hero + character sheet](phase-04-hero-and-character-sheet-integration.md) | P0 | S (3h) | Not started | 0% |
| 05 | [Verification: e2e, a11y, perf](phase-05-verification-e2e-a11y-perf.md) | P0 | M (5h) | Not started | 0% |
| 06 | [Docs + changelog (v1.4)](phase-06-docs-update.md) | P1 | S (2h) | Not started | 0% |

## Dependencies
```
00 ─→ 01 ─→ 02 ─→ 03 ─→ 04 ─→ 05 ─→ 06
```
- 01 is delivery-agnostic; 02+ wait for the 00 decision.
- Each phase ends green: `npm run check`, `npm run test:unit`, `npm run test:e2e`.
- Rollback: branch-only, additive (remove `<ClassJobSwitcher />` + `switchable` flags and the page is v1.3).

## Implementation workflow (CLAUDE.md)
Read `README.md` + `.claude/workflows/*` first; follow `development-rules.md` (kebab-case, files <200 lines, YAGNI/KISS/DRY, real code, no mocks). Per phase: implement -> **tester** agent -> **code-reviewer** agent (fix criticals) -> next. Phase 05 includes Lighthouse. Phase 06 by **docs-manager** agent. Dates via `bash -c 'date +%y%m%d'`. Conventional commits, no AI references; commit only on user approval.

## Definition of Done
- Hero + sheet switch together for all 10 looks; Reset restores byte-identical SVG; derived pick always labelled; gear tiers identical across looks and drawn on each
- Saved choice survives reload + soft nav; invalid/blocked storage harmless
- check/unit/e2e green (231 unit + 94 e2e kept, new added); axe 0 serious/critical both themes
- Budgets: home HTML gzip growth <= 2 KB, eager script <= 1.5 KB gz, lazy chunk <= 5 KB gz, no chunk request for a fresh visitor before opening; Lighthouse mobile unchanged (99-100), CLS <= 0.002 (fresh), <= 0.005 with a saved look
- No-JS, reduced motion, forced colors, 360px, light/dark, soft-nav lifecycle verified; docs + changelog updated

## Unresolved Questions
1. "Their stats" = the portfolio owner's GitHub (assumed, build-time snapshot), or should a visitor enter their OWN GitHub username to get gear from their stats (runtime GitHub API: rate limits, privacy, breaks "build never calls GitHub", large scope)?
2. Gear = same stat tiers on every class/job (assumed). Or class/job-specific rules (e.g. Mage weights docs, Warrior weights security)? Would change `gear-rules.ts` + classifier tests.
3. Attributes + "Why Warrior?" panel keep describing the GitHub-derived class (assumed). Switch them to the chosen class too, or only relabel (e.g. "Why GitHub picked Warrior")?
4. Delivery option C (lazy chunk; sprite data reaches the browser; "no client JS" docs reworded) OK, or keep avatar JS-free (then B)?
5. Control only in the character sheet (rec) or also a hero entry link/button?
6. Persist choice in `localStorage` (assumed) or session/none? Returning visitor sees one avatar swap after load.
7. Propagate the choice to `/speedrun/` and `/credits/` now (cheap with the saved key) or later?
8. Adventurer selectable (no job picker, note)? Assumed yes. Wording "GitHub pick" / "Reset to GitHub pick" OK?
9. Budgets (<=5 KB gz lazy, <=1.5 KB gz eager) and v1.4 version/changelog OK?
