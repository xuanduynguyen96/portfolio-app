# Phase 09: Verification, a11y/perf audit, docs, changelog

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 01-08 (07/08-B optional)
- Prior verification method: [career RPG phase 08](../20261017-0432-career-rpg-gamification-layer/phase-08-e2e-a11y-perf-verification.md)
- Docs to update: `docs/design-guidelines.md`, `docs/codebase-summary.md`, `docs/system-architecture.md`, `docs/code-standards.md`, `docs/project-roadmap.md`, `docs/project-overview-pdr.md` (theme line), `README.md`

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: M (4h) · Implementation: Done (docs/README/package description updated; user approval received for commit; manual no-JS/zoom captures and full Lighthouse matrix not recorded) · Review: Done ([03 report](reports/03-code-review-report.md); M2 docs resolved)
- Cross-cutting checks (pixel icon crispness, both-theme contrast, perf, no-JS/reduced-motion), docs rewrite, changelog entry, code review. Ends with handoff to user for approval (no commit before).

## Key Insights
- Feature specs already land per phase (01 theme, 03 unit, 07 SFX, 08 credits); 09 adds the cross-cutting pixel-icon spec + audits.
- Changelog entry feeds the streak (body >=40 prose words, date <= build + 24h); `changelog-and-streak.spec` counts files automatically.
- Lighthouse headless defaults to light scheme → run dark separately (`--chrome-flags="--force-dark-mode"`, verify it flips `prefers-color-scheme`; else puppeteer `emulateMediaFeatures`).

## Requirements
- All suites green; axe both themes; Lighthouse targets (plan DoD); docs reflect new theme, tokens, hooks, files; README stack + edit-content rows.

## Architecture
New spec `tests/e2e/pixel-icons.spec.ts`:
```ts
for (const path of ['./', `./projects/${BOSS_SLUG}/`, './speedrun/', './credits/']) test(`pixel icons crisp + decorative on ${path}`, async ({ page }) => {
  await page.goto(path);
  const icons = await page.locator('svg.pixel-icon').evaluateAll((els) => els.map((el) => ({
    w: el.getBoundingClientRect().width, hidden: el.getAttribute('aria-hidden'), role: el.getAttribute('role'),
    label: el.getAttribute('aria-label'), text: el.textContent, shape: getComputedStyle(el).shapeRendering })));
  expect(icons.length).toBeGreaterThan(0);
  for (const i of icons) { expect([16, 24, 32, 48]).toContain(i.w); expect(i.text).toBe(''); expect(i.shape).toBe('crispedges');
    expect(i.hidden === 'true' || (i.role === 'img' && !!i.label)).toBe(true); }
});
```
Note: icons inside hidden mobile nav / `display:none` toggles report width 0 → filter visible (`el.checkVisibility()`).

## Related Code Files
Create:
- `/home/user/portfolio-app/tests/e2e/pixel-icons.spec.ts`
- `/home/user/portfolio-app/src/content/changelog/<YYYY-MM-DD>-rpg-theme-redesign.md` (date via `date +%F` at implementation)
Modify:
- `/home/user/portfolio-app/docs/design-guidelines.md`: rewrite Theme, Color (both palettes + contrast table), Typography (3 roles), Surfaces (pixel frame, texture), Components (rarity colors, icons, pips), Motion (stepped hero, caret), Icons section (grid rules, sizes, a11y), favicon literal exception
- `/home/user/portfolio-app/docs/code-standards.md`: hooks table + `data-theme-toggle`, `data-sfx`, `data-sfx-toggle`, `data-caret`; pixel icon rules (sizes, add icon = grid + unit test); `.hud-text` utility
- `/home/user/portfolio-app/docs/system-architecture.md`: root flags table + `data-theme` (set by head script, copied on before-swap), theme + SFX lifecycle mermaid, 404 copy, `/credits/` route
- `/home/user/portfolio-app/docs/codebase-summary.md`: new files (pixel-icons*, pixel-icon-map, pixel-icon-path, pixel-icon(.astro), theme-*, header-controls, menu-toggle-button, sfx-*, credits, to-roman-numeral), test counts
- `/home/user/portfolio-app/docs/project-roadmap.md`: light theme done; v2 ideas (sprite sheet, external packs)
- `/home/user/portfolio-app/README.md`: tagline "RPG-themed", stack fonts, Edit-content rows (icons, credits), test counts
- `/home/user/portfolio-app/package.json`: `description`

## Implementation Steps
1. `pixel-icons.spec.ts` (above); run.
2. Full suite: `npm run check && npm run test:unit && npm run test:e2e`; record counts.
3. Contrast audit: axe both themes (in suite) + manual non-text check: control frames `--color-border-strong` >=3:1 vs bg/surface, focus ring >=3:1 vs adjacent, boss crimson frame visible in light; record ratios in design-guidelines table (compute with a scratch script, WCAG formula).
4. No-JS + reduced-motion manual pass both schemes (Playwright `javaScriptEnabled: false`, `reducedMotion: 'reduce'`): content visible, toggles hidden, system theme.
5. HTML weight: `gzip -c dist/index.html | wc -c` before (git stash / master build) vs after; >10 KB growth → switch PixelIcon to `<symbol>` sprite (follow-up).
6. Lighthouse mobile + desktop, light + dark: `/`, boss project, `/speedrun/`, `/changelog/`, `/credits/`; targets perf >=98 mobile, 100 others, CLS 0. Fix regressions (fonts preload, texture cost).
7. 200% zoom + 360px screenshots both themes, attach to report.
8. Docs updates (list above); keep each doc concise, link not copy numbers.
9. Changelog entry (>=40 prose words, `summary` <=160): what changed (theme, icons, fonts, credits), why.
10. Code review via `code-reviewer` agent (development-rules); fix findings.
11. Write `reports/02-tester-report.md` + `reports/03-code-review-report.md`; update plan.md statuses.
12. Handoff: summary + screenshots to user; **no commit/push until approval**; then conventional commits per phase (`feat:`, `docs:`, `test:`).

## Todo List
- [x] pixel-icons.spec.ts
- [x] full suite green, counts recorded (unit 116/116, e2e 86/86)
- [x] contrast audit both themes (+ non-text; axe in suite, ratios in 03 report)
- [ ] no-JS / reduced-motion pass (partial: theme-toggle.spec (f); manual not recorded)
- [x] HTML weight check (gzip home 8073→10273 B, <10 KB)
- [ ] Lighthouse 5 pages x 2 themes x 2 form factors (partial: mobile 5 pages; dark+light home+credits; desktop home)
- [ ] zoom/360 screenshots (not recorded)
- [x] docs + README + package description (M2 resolved; SFX docs omitted, phase 07 deferred)
- [x] changelog entry
- [x] code review + reports (03 done; 02 written)
- [x] user approval gate (received; commit still pending)

## Success Criteria
- Plan DoD met; reports written; user has screenshots + numbers to approve

## Risk Assessment
- Lighthouse dark emulation flag unreliable → puppeteer fallback (chrome-devtools skill).
- Changelog date in future vs build tolerance → use real date command.
- Doc drift → codebase-summary built from `ls` of actual tree.

## Security Considerations
- No secrets; review confirms no new external requests (fonts self-hosted, no CDN), storage keys whitelisted.

## Next Steps
- On approval: commit, PR to `master` (CI verify), deploy. Follow-ups: sprite sheet if weight grows, optional packs (08 B), cover/OG recolor (Q6).
