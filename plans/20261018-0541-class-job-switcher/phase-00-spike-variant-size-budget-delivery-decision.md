# Phase 00: Spike: variant payload budget + delivery decision

## Context Links
- Parent: [plan.md](plan.md) · Blocks: 02-06 (01 may start in parallel)
- Inputs: [scout + baseline](reports/01-scout-and-baseline-report.md), [measure script](reports/assets/measure-variant-sizes.ts)
- Docs: README (Lighthouse + "no client JS"), `docs/project-overview-pdr.md#success-metrics` (HTML +3.4 KB of 6 KB), `docs/code-standards.md#avatar-sprites`

## Overview
- Date: 2026-10-18 · Priority: P0 · Effort: S (2h) · Implementation: Not started (baseline numbers already measured) · Review: Not started
- Decide ONE way to ship the 10 class x job looks. Prototype in a scratch copy (never commit the prototype), write `reports/02-spike-delivery-decision.md`, get the user's go.

## Key Insights
- Measured (report 01): A inline templates +7,819 B gz on every home load (home 13,476 -> 21,295 B gz; 111.7 -> 198.9 KB raw). B per-look ~1.25-1.5 KB gz, 14.2 KB for all 10 separately. C lazy chunk 17.2 KB raw / 4.1 KB gz, ~1.5 ms to compose 2 frames.
- Existing budget: avatar already used +3.4 KB of 6 KB on home HTML; A alone busts it, B/C add 0 before intent.
- Astro inlines small scripts (`speedrun-countdown.ts` is inline in `speedrun/index.html`); a script with a dynamic `import()` is probably emitted as an external module: confirm the stub's real cost.
- Tree-shaking decides whether the eager stub drags `data/avatar/*` or the big `classRules` tables in; the lazy boundary must sit above all sprite/rule imports.

## Requirements
- Compare A/B/C on: payload (initial + on use), CLS, JS size, no-JS fallback, CSP, complexity, drift risk, failure modes.
- Pass thresholds for C: lazy chunk <= 5 KB gz, eager stub <= 1.5 KB gz, compose <= 5 ms at 4x CPU throttle, no chunk request/work before intent for a visitor with no saved look (Lighthouse = fresh visitor), Lighthouse mobile unchanged. Returning visitor with a saved look: chunk fetched on load (measure its CLS/LCP effect too).
- Verify `import()` chunk URL works under base `/portfolio-app/` and after ClientRouter soft nav.
- Also measure the persisted-look path: stub reads `localStorage`, imports the chunk on `astro:page-load`, swaps the avatar + name; record CLS (nameplate rewrap) and time-to-swap.
- Output: one-page decision + exact budgets used by phases 02-05.

## Architecture
```
eager stub (class-job-switcher.ts)  ──(first <details> open)──►  import('./look-apply-model')  ──►  look-avatar-model → select-avatar-layers → compose → svg-paths + sprites
   imports ONLY class-looks / class-labels (job rules, names)        lazy chunk ≈ 17 KB raw / 4 KB gz
```
| Criterion | A templates | B fetch JSON | C lazy compose |
|-----------|-------------|--------------|----------------|
| Initial payload | +7.8 KB gz | 0 | 0 (+stub) |
| On use | 0 | 1.3-1.5 KB gz/look | 4.1 KB gz once |
| CLS | 0 (swap children) | 0 | 0 |
| No JS | GitHub pick only | GitHub pick only | GitHub pick only |
| CSP | inert `<template>`, inline module | `connect-src 'self'` | `script-src 'self'`; set styles via CSSOM |
| Failure modes | none | per-look fetch fail, race, offline | one chunk fail |
| Drift/maintenance | build only | + endpoints | none (same modules) |

## Related Code Files
Read-only inputs:
- `/home/user/portfolio-app/src/utils/avatar/avatar-svg-markup.ts`, `avatar-svg-paths.ts`, `select-avatar-layers.ts`, `compose-avatar-grid.ts`, `avatar-description.ts`
- `/home/user/portfolio-app/src/scripts/speedrun-countdown.ts` (inline-script precedent), `astro.config.mjs`
Create (plan folder only):
- `/home/user/portfolio-app/plans/20261018-0541-class-job-switcher/reports/02-spike-delivery-decision.md`

## Implementation Steps
1. Scratch copy of the repo outside the working tree (tar, no `.git`, `npm ci --ignore-scripts`); baseline `astro build`; record home HTML raw/gz, `_astro/*.js` sizes (report 01 numbers).
2. Prototype C: stub `<script>` in a throwaway component with `details toggle -> import('../scripts/x')` where x imports `avatarFrameGrid`+`avatarPaths`; rebuild; record emitted chunks, stub size (inline or file), URLs under base, and that no sprite data is in the eager graph.
3. Run `esbuild --bundle --minify` on the lazy entry for the gzip number (done: 4,104 B incl. description); repeat after tree-shaking in the real Vite output.
4. Time compose+apply with CPU 4x throttle (chrome-devtools skill or Playwright CDP `Emulation.setCPUThrottlingRate`).
5. Lighthouse (mobile + desktop) on `/` preview: baseline vs prototype; confirm no change (nothing runs pre-intent), CLS <= 0.002.
6. Prototype B only if C fails a threshold (one `src/pages/look/[look].json.ts` + fetch stub) and compare.
7. Write the decision report; fix budgets for 05; ask user (plan Unresolved Q1). STOP for go.

## Todo List
- [ ] Scratch build baseline recorded
- [ ] C prototype: chunk graph, sizes, base-path URL
- [ ] Compose time at 4x throttle
- [ ] Lighthouse baseline vs prototype
- [ ] Decision report + user go

## Success Criteria
- A single option chosen with numbers; thresholds above met (or fallback B justified with numbers)
- Eager graph proven free of `src/data/avatar/*`
- Prototype discarded; repo working tree unchanged

## Risk Assessment
- Astro emits the dynamic import inside the page bundle (no split) -> move the `import()` into a tiny dedicated entry or use `?url` + manual import; else fall back to B.
- Lighthouse noise (±1) hides regressions -> compare 3-run medians.
- Chunk hash changes per build: never hardcode URLs in tests; match on `/_astro/` + `look-apply` in the chunk name.

## Security Considerations
- Prototype in scratch dir only; no secrets involved. C ships only already-public sprite art and rule tables.

## Next Steps
- 01 (pure module) then 02 per the decision. Unresolved: user confirms C vs B (docs wording "zero client JS").
