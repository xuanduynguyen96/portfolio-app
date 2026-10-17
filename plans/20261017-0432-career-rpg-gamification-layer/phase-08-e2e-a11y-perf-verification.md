# Phase 08: E2E, Accessibility, Performance Verification

## Context Links
- Parent: [plan.md](plan.md) · Depends on: phases [03](phase-03-quests-and-boss-battle-ui.md)-[07](phase-07-recruiter-speedrun-route.md)
- Docs: `docs/codebase-summary.md` (test mirrors), `docs/code-standards.md` (Testing), https://playwright.dev/docs/clock

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: M · Implementation: Not started · Review: Not reviewed
- Update content-mirroring e2e, add specs for new features, axe on new pages, no-JS/reduced-motion visibility, Lighthouse >=95 + CLS 0. Code review via `code-reviewer` agent.

## Key Insights
- Fixed `CAREER_RPG_NOW=2026-10-17` (playwright webServer env, phase 02) => streak/HUD numbers deterministic.
- Local `reuseExistingServer: true` may reuse a dev/preview built without env => kill stray servers before runs (note in tester report).
- `page.clock.install()` + `fastForward('01:01')` tests countdown in ms, not 60s waits.
- Prefer relational assertions (e.g. HUD `value < 100` => missing list non-empty) over hardcoded numbers; hardcode only where mirrors already exist (documented in codebase-summary).
- `expectStaticContentVisible` in `reduced-motion.spec.ts` already covers all `[data-reveal]`; extend to new routes.

## Requirements
- Functional: all existing 30 green after updates; new specs below green on 2 consecutive runs.
- Non-functional: suite <60s locally; no `test.skip`/loosened asserts; Lighthouse mobile+desktop >=95 all categories on `/`, `/projects/neon-dashboard/`, `/speedrun/`; CLS 0.

## Architecture (test matrix)
| Spec | Change | Cases |
|---|---|---|
| `tests/e2e/test-helpers.ts` | modify | `SECTION_IDS` += `character`; add `NEW_PAGES = ['./speedrun/', './changelog/']`, `BOSS_SLUG = 'neon-dashboard'` |
| `home-page-smoke.spec.ts` | modify | section loop covers `character`; card count 3 unchanged |
| `internal-links.spec.ts` | modify | `PAGES` += speedrun, changelog |
| `accessibility-axe.spec.ts` | modify | `PAGES` += speedrun (hasReveals true), changelog; home audit includes open `<details>` state (click summary first) |
| `responsive-layout.spec.ts` | modify | 360px no h-scroll on speedrun, changelog |
| `reduced-motion.spec.ts` | modify | no-JS + reduce: `/speedrun/` content visible; countdown static `01:00` |
| `project-detail-and-focus.spec.ts` | modify | `PROJECTS` += `difficulty`, badge text; boss slug has "Boss Battle" h2, others "Quest Log" |
| `quest-cards-and-boss.spec.ts` | create | one badge per card; boss card first + `data-boss`; boss spans 2 cols at 1280; `cli-toolkit` shows "Unverified" |
| `character-sheet-and-hud.spec.ts` | create | level/title text; every `progress` has accessible name (`getByRole('progressbar', { name })`); attribute count = 4; HUD value 0-100 and missing count > 0 while placeholders; `<details>` toggles without JS (keyboard Enter on summary) |
| `skill-tree.spec.ts` | create | nested `#skills li ul li` exists; each node exposes "level N of 3"; connector/pips `aria-hidden`; no-JS identical node count |
| `changelog-and-streak.spec.ts` | create | `/changelog/` 3 entries newest first (`time[datetime]` desc); home streak badge "3-week streak"; link navigates |
| `speedrun-page.spec.ts` | create | h1; 3 achievements; availability text; mailto CTA; header nav + hero link reach it; clock fastForward 61s => "GG", content still visible; reduce => no ticking after 2s; soft nav away/back no console errors |
| `tests/unit/*` | phase 01-03 | rerun |

## Related Code Files
Modify:
- `/home/user/portfolio-app/tests/e2e/test-helpers.ts`
- `/home/user/portfolio-app/tests/e2e/home-page-smoke.spec.ts`
- `/home/user/portfolio-app/tests/e2e/internal-links.spec.ts`
- `/home/user/portfolio-app/tests/e2e/accessibility-axe.spec.ts`
- `/home/user/portfolio-app/tests/e2e/responsive-layout.spec.ts`
- `/home/user/portfolio-app/tests/e2e/reduced-motion.spec.ts`
- `/home/user/portfolio-app/tests/e2e/project-detail-and-focus.spec.ts`
- `/home/user/portfolio-app/tests/e2e/page-navigation-lifecycle.spec.ts` (only if boss-first order changes link targets; title mirror stays)
Create:
- `/home/user/portfolio-app/tests/e2e/quest-cards-and-boss.spec.ts`
- `/home/user/portfolio-app/tests/e2e/character-sheet-and-hud.spec.ts`
- `/home/user/portfolio-app/tests/e2e/skill-tree.spec.ts`
- `/home/user/portfolio-app/tests/e2e/changelog-and-streak.spec.ts`
- `/home/user/portfolio-app/tests/e2e/speedrun-page.spec.ts`
- `/home/user/portfolio-app/plans/20261017-0432-career-rpg-gamification-layer/reports/02-tester-report.md`, `03-code-review-report.md`

## Implementation Steps
1. Update helpers + existing specs (mirrors); run suite => green before adding new.
2. Add new specs one at a time; each must fail first against a deliberately broken build (sanity) then pass.
3. Run `npm run test:unit && npm run test:e2e` twice; repeat timing-sensitive specs (`--repeat-each=3` for speedrun/lifecycle).
4. Lighthouse (same method as v1, local preview, mobile + desktop) on 3 pages; record numbers.
5. Negative build checks from phase 02 step 9 re-run on final code.
6. `code-reviewer` agent review; fix critical/high; log deferred lows.
7. Write tester + review reports.

## Todo List
- [ ] mirrors updated, 30 green
- [ ] 5 new specs
- [ ] axe new pages 0 serious/critical
- [ ] no-JS + reduced-motion on new routes
- [ ] 2 green runs + repeat-each
- [ ] Lighthouse >=95, CLS 0 (3 pages x 2 form factors)
- [ ] negative build checks
- [ ] code review + fixes
- [ ] reports written

## Success Criteria
- Full suite green twice; ~45+ tests; unit + e2e in CI verify job.
- axe 0 serious/critical on home, project, speedrun, changelog, 404.
- Lighthouse >=95 all, CLS 0.

## Risk Assessment
- Clock API + GSAP ScrollTrigger interplay (fake timers freeze rAF) => install clock only in countdown test, after reveals asserted, or `clock.install` before goto and `runFor`.
- Flaky reveals on longer home page => existing `expectAllRevealsVisible` scroll helper; keep.
- Lighthouse drop from extra DOM => skill tree evidence lists in `<details>` (not rendered open); measure.

## Security Considerations
- Tests assert external links `rel="noopener noreferrer"` (existing check covers new pages via home + add speedrun loop).

## Next Steps
- Phase 09 docs with measured numbers.
