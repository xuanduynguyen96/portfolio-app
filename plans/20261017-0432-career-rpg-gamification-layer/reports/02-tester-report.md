# Test Report: Career RPG layer

Date: 2026-10-17 · Node 22.22 · Chromium 1194 (Playwright 1.56.1)

## Results
- `npm run check`: 0 errors / 0 warnings / 0 hints
- `npm run test:unit` (node:test, type stripping): **94/94** pass, ~1s, zero new deps
- `npm run test:e2e`: **56/56** pass, ~37s (30 original updated + 26 new); 2 consecutive clean runs pre-review, 1 post-review
- Timing-sensitive specs: speedrun x8 + lifecycle x3 repeats, all green
- Negative builds (all fail with named entry): `xp` key, leftover `repoUrl`, 2 bosses, http evidence, unknown skill parent, skill `xp` key, future changelog date, skill URL reuse, duplicate quest skill

## Lighthouse (local preview, perf/a11y/bp/seo)
| Page | Mobile | Desktop |
|---|---|---|
| / | 98/100/100/100 | 100/100/100/100 |
| /projects/neon-dashboard/ | 99/100/100/100 | 100/100/100/100 |
| /speedrun/ | 99/100/100/100 | 100/100/100/100 |
| /changelog/ | 99/100/100/100 | 100/100/100/100 |

CLS: mobile 0; desktop 0.0001 (header nav, web-font swap). Pre-existing on master (0.00007); 6th nav item adds ~0.00003. Displays as 0.

## Notes
- Playwright `page.clock` fake time proved unreliable with this page (page `Date.now()` lost earlier jumps) -> countdown math moved to pure `countdown-clock.ts` (unit-tested incl. "GG"); e2e checks real ticking + static under reduced motion/no JS.
- e2e does not pin `CAREER_RPG_NOW`; streak assertions accept every valid state so weekly cron builds can't go red over time.

## Unresolved questions
- None test-related.
