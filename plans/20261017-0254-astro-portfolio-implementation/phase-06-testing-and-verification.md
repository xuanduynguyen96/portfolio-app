# Phase 06: Testing & Verification

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [phase-05](phase-05-animation-module.md)
- Env: Chromium pre-installed at `/opt/pw-browsers` (`PLAYWRIGHT_BROWSERS_PATH`); never run `playwright install`
- Agents at implementation: `tester`, then `code-reviewer`

## Overview
- Date: 2026-10-17 · Priority: P0 · Status: Done · Review: Code-reviewed + tester-validated
- Type check, build, Playwright e2e (smoke, links, a11y via axe, reduced motion, responsive, nav lifecycle), manual Lighthouse.

## Key Insights
- Test the built site (`astro preview`) — catches base-path bugs dev server hides.
- axe catches contrast/landmark issues automatically.
- Lighthouse CI = extra infra (YAGNI); run Lighthouse once manually against preview.

## Requirements
- Functional: tests cover all sections render, internal links resolve 200, no console errors, a11y, reduced motion, 360px layout, ClientRouter navigation.
- Non-functional: suite <60s locally; deterministic (no timing flakiness: wait on states, not sleeps).

## Architecture
```
playwright.config.ts   webServer: npm run build && npm run preview (port 4321), baseURL http://localhost:4321/portfolio-app/
tests/e2e/
├── home-page-smoke.spec.ts         sections visible, no console errors, title/meta
├── internal-links.spec.ts          crawl same-origin hrefs → 200
├── accessibility-axe.spec.ts       index, project page, 404: 0 serious/critical
├── reduced-motion.spec.ts          emulate reduce → all [data-reveal]/[data-hero] visible, opacity 1
├── responsive-layout.spec.ts       360px: scrollWidth <= innerWidth; mobile menu opens/closes
└── page-navigation-lifecycle.spec.ts  index → project → back x3: content visible, ScrollTrigger count stable
```

Config sketch:
```ts
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:4321/portfolio-app/',
    ...devices['Desktop Chrome'],
    // fallback if bundled version mismatches pre-installed browser:
    // launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
  },
  webServer: { command: 'npm run build && npm run preview', url: 'http://localhost:4321/portfolio-app/', reuseExistingServer: true },
});
```
Lifecycle spec asserts via DOM only (no debug hooks in prod bundle): after round-trips, every `[data-reveal]` reaches opacity 1 once scrolled into view, hero visible, mobile menu still toggles.

## Related Code Files
Create:
- `/home/user/portfolio-app/playwright.config.ts`
- `/home/user/portfolio-app/tests/e2e/*.spec.ts` (6 files above)

## Implementation Steps
1. `npm run check` → 0 errors.
2. `npm run build` → 0 errors/warnings worth fixing.
3. Write Playwright config + specs.
4. `npm run test:e2e`; fix failures at root cause (never skip tests).
5. Manual Lighthouse against preview: `npx --yes lighthouse http://localhost:4321/portfolio-app/ --chrome-path=<chromium binary found via ls /opt/pw-browsers> --chrome-flags="--headless" --output=json --output-path=<scratchpad>/lighthouse.json`; targets Perf ≥90, A11y ≥95, BP ≥95, SEO ≥95. Record scores in phase notes.
6. `npm audit` → note findings.
7. Run `code-reviewer` agent over the implementation; address findings.

## Todo List
- [x] check + build clean
- [x] playwright.config.ts
- [x] 6 e2e specs
- [x] all tests green (30/30)
- [x] Lighthouse manual run, scores recorded (mobile 99/100/100/100, desktop 100×4)
- [x] npm audit (0 vulns)
- [x] code review pass + fixes

## Success Criteria
- All e2e tests pass on built site with base path.
- axe: 0 serious/critical violations.
- Lighthouse targets met (or gaps documented with cause).

## Risk Assessment
- Chromium/Playwright version mismatch → `executablePath` fallback.
- Animation timing flakiness → assert final state with `toHaveCSS('opacity','1')` + auto-wait; scroll into view first.
- Exact Chromium binary path differs → `ls /opt/pw-browsers` at implementation time.

## Security Considerations
- No secrets in tests. `npm audit` high/critical → upgrade or document.

## Next Steps
- Phase 07 runs check + build + tests in CI before deploy.
