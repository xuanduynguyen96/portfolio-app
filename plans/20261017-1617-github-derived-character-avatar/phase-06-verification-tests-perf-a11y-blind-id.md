# Phase 06: Verification: tests, perf, a11y, blind-ID, refresh workflow live run

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 01-05 · Blocks: 07
- Inputs: [researcher-02 §5](research/researcher-02-report.md), prior [verification phase](../20261017-0821-rpg-theme-redesign/phase-09-verification-docs-changelog.md)
- Docs: `docs/project-overview-pdr.md#non-functional-requirements`, `.claude/workflows/development-rules.md`

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: M (4h) · Implementation: Not started · Review: Not started
- Prove NFRs hold after pivot, avatar is recognizable by humans, refresh pipeline works on real GitHub. Reports: `reports/04-tester-report.md`, `reports/05-blind-id-report.md`, `reports/06-code-review-report.md`.

## Key Insights
- Prior baseline: check 0 errors, unit 116, e2e 86, Lighthouse mobile 98-99/100/100/100, CLS 0. Counts will change; no test skipped or loosened.
- Determinism is now testable end-to-end: pinned `CAREER_RPG_NOW` + committed snapshot → identical `dist/`.
- Blind-ID is the only real proof of "instant recognition"; unit IoU is a proxy.

## Requirements
- Automated: `npm run check`, `npm run test:unit`, `npm run test:e2e` green.
- axe 0 serious/critical on `/`, project (boss + derived), `/speedrun/`, `/changelog/`, `/credits/`, 404 in both themes.
- Lighthouse (local preview, mobile + desktop): `/`, boss project, `/speedrun/`, `/credits/` >= 95 all categories (target unchanged 98+ perf mobile), CLS 0.
- No-JS: avatar, nameplate, legend, why panel present (server HTML). Reduced motion: no bob. Forced colors: avatar visible or legend sufficient; frames intact. 360px: no h-scroll both themes.
- Budgets: avatar SVG <= 3 KB each; home HTML gzip growth <= 6 KB vs master; no new client JS.
- Contrast: avatar outline vs plate >= 3:1 both themes (computed from token hexes); nameplate/legend text AA.
- Determinism: `CAREER_RPG_NOW=2026-10-19 npm run build` twice → `diff -r dist-a dist-b` empty.
- Refresh workflow on GitHub: (a) dispatch → snapshot commit + deploy dispatched; (b) re-dispatch same week → no commit, deploy dispatched; (c) dispatch with token disabled input → warning, exit 0, no commit.
- Blind-ID: >= 5 people, 128px thumbnails (3 pure jobs at tier 0 + owner avatar + 2 hybrid), shown <= 2s each, name class → >= 80% correct overall; gear question ("which looks better equipped", tier 0 vs 3) >= 80%.

## Architecture
```
local:   check → unit → e2e(build+preview) → lighthouse (preview) → determinism diff → size budget script
github:  refresh-github-snapshot (dispatch x3) → deploy-to-github-pages (dispatched) → live smoke
human:   render-avatar-sheet.ts → thumbnails → 5 testers → results table
review:  code-reviewer agent on full diff
```

## Related Code Files
Create:
- `/home/user/portfolio-app/plans/20261017-1617-github-derived-character-avatar/reports/04-tester-report.md`
- `/home/user/portfolio-app/plans/20261017-1617-github-derived-character-avatar/reports/05-blind-id-report.md`
- `/home/user/portfolio-app/plans/20261017-1617-github-derived-character-avatar/reports/06-code-review-report.md`
Modify (only if a check fails): files from 01-05; `tests/e2e/accessibility-axe.spec.ts`, `forced-colors.spec.ts`, `reduced-motion.spec.ts`, `responsive-layout.spec.ts` (add avatar assertions)
Delete: none

## Implementation Steps
1. Run full local suite; fix root causes (debugging skill), never weaken assertions.
2. Add avatar assertions to axe/forced-colors/reduced-motion/responsive specs if missing from 05.
3. Lighthouse runs (same method as v1.2 baseline); record table.
4. Determinism diff; size budget (gzip home HTML master vs branch; max avatar bytes from unit test output).
5. Contrast computation for `--avatar-outline` vs `--avatar-plate` both themes; record.
6. Push branch, open PR (after user approval to push); confirm verify passes from snapshot (no secrets on PR).
7. After merge: refresh dispatch scenarios a-c; check Actions logs show no token echo; live site smoke (hero avatar).
8. Blind-ID session; record per-tester answers + time; if < 80%: iterate silhouettes (04), re-test.
9. Code review via `code-reviewer` agent; fix critical/high; record.

## Todo List
- [ ] check + unit + e2e green
- [ ] axe both themes, all pages
- [ ] Lighthouse table
- [ ] no-JS, reduced-motion, forced-colors, 360px
- [ ] determinism diff empty
- [ ] budgets + contrast recorded
- [ ] refresh workflow scenarios a-c
- [ ] blind-ID >= 80%
- [ ] code review done, findings resolved

## Success Criteria
- All Requirements met with evidence in reports (numbers, not claims)
- User approves results before docs + commit

## Risk Assessment
- Blind-ID fails → art iteration loop (budget 2h); worst case add class emblem pixel on chest (shape, not color).
- Lighthouse dips from extra SVG nodes → `<symbol>/<use>` for second home instance.
- Forced-colors flattens avatar → `forced-color-adjust: none` on plate with contrast proof, legend unchanged.
- Workflow scenario (a) blocked by branch protection → Q7 decision.

## Security Considerations
- Review checks: token only in fetch step env; no `npm ci` in write job; snapshot has no private repos; external links rel attrs; no `set:html` with repo data.

## Next Steps
- 07 docs; then commit per phase (user approval). Unresolved: blind-ID testers (Q10).
