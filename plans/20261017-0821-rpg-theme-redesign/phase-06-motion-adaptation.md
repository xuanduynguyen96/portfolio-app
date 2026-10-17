# Phase 06: Motion adaptation

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [05](phase-05-career-rpg-components-restyle.md) (and 04) · Next: [09](phase-09-verification-docs-changelog.md)
- Docs: `docs/design-guidelines.md#motion-principles`, `#reduced-motion-policy`; `docs/code-standards.md#animation-hooks-data-attributes`; `docs/system-architecture.md#animation-lifecycle`
- Specs: `reduced-motion.spec.ts`, `page-navigation-lifecycle.spec.ts`, `home-page-smoke.spec.ts` (motion-ready flag), `test-helpers.ts` (`expectAllRevealsVisible`, `expectHeroVisible`)

## Overview
- Date: 2026-10-17 · Priority: P2 · Effort: S (2h) · Implementation: Done (taste capture open, Q11) · Review: Done ([03 report](reports/03-code-review-report.md): L6 caret infinite blink open)
- Keep GSAP architecture; give motion a light 8-bit flavor: pixel-grid travel distances, stepped ease on hero title chars, blinking pixel caret on nav/button hover-focus (CSS, motion-ok only). Spotlight recolor already done (04). Reduced-motion + failsafe behavior unchanged.

## Key Insights
- Current: reveals `y: 32` (= 8 x 4 ✓), hero items `y: 24` ✓, title chars `expo.out` 0.9s. Distances already multiples of 8 → just name them (`PIXEL_STEP = 8`) and keep.
- `steps(n)` ease on title chars = "typed in" retro feel without new deps; reveals keep `expo.out` (stepped opacity on big cards looks janky, hurts perceived perf).
- Caret = CSS `::before` stepped triangle via `clip-path` (no text content → not read by AT), animation `steps(1)` blink, only under `html[data-motion="ok"]` → reduced-motion and no-JS show static caret or none.
- No new animation module needed (YAGNI); rule 1 of code-standards only applies if new JS motion added.
- All final states `opacity: 1` → axe + `expectAllRevealsVisible` unaffected.

## Requirements
- Functional: hero title chars rise with stepped ease; nav links / primary buttons show caret on `:hover`/`:focus-visible`; caret blinks only when motion ok.
- Non-functional: animate `opacity`/`transform` only; CLS 0; reduced-motion => no GSAP, caret static; failsafe untouched.

## Architecture
```
hero-text-reveal.ts   chars: ease 'steps(4)' (const HERO_CHAR_EASE), duration 0.6
scroll-reveals.ts     y: PIXEL_STEP * 4 (unchanged value 32), expo.out
gsap-setup.ts         export const PIXEL_STEP = 8   (shared constant, plugins stay registered here)
effects.css           .pixel-caret pattern: [data-caret]::before + @keyframes pixel-blink
```
```css
[data-caret] { position: relative; }
[data-caret]::before { content: ''; position: absolute; inset-inline-start: calc(-1 * var(--space-4)); inset-block-start: 50%;
  inline-size: var(--space-2); block-size: var(--space-3); translate: 0 -50%; background: currentColor; opacity: 0;
  clip-path: polygon(0 0, 50% 0, 50% 17%, 75% 17%, 75% 33%, 100% 33%, 100% 67%, 75% 67%, 75% 83%, 50% 83%, 50% 100%, 0 100%); }
[data-caret]:is(:hover, :focus-visible)::before { opacity: 1; }
html[data-motion='ok'] [data-caret]:is(:hover, :focus-visible)::before { animation: pixel-blink 1s steps(1) infinite; }
@keyframes pixel-blink { 50% { opacity: 0; } }
```
`data-caret` = new data-attribute hook (document in code-standards table, 09).

## Related Code Files
Modify:
- `/home/user/portfolio-app/src/scripts/animations/gsap-setup.ts`: export `PIXEL_STEP`
- `/home/user/portfolio-app/src/scripts/animations/hero-text-reveal.ts`: stepped char ease
- `/home/user/portfolio-app/src/scripts/animations/scroll-reveals.ts`: use `PIXEL_STEP` (no value change)
- `/home/user/portfolio-app/src/styles/effects.css`: caret rules (keep file <200 lines)
- `/home/user/portfolio-app/src/components/site-header.astro`: `data-caret` on nav links (inline nav ≥48rem only; mobile panel has room → check)
- `/home/user/portfolio-app/src/components/neon-button.astro`: `data-caret` on primary variant only
Create / Delete: none

## Implementation Steps
1. `gsap-setup.ts`: `export const PIXEL_STEP = 8;` with comment (matches `--pixel` grid art scale 8).
2. `hero-text-reveal.ts`: chars tween `ease: 'steps(4)'`, `duration: 0.6`, keep stagger 0.025, `y` from `PIXEL_STEP * 2`; non-title `[data-hero]` unchanged.
3. `scroll-reveals.ts`: `y: PIXEL_STEP * 4`.
4. effects.css caret rules; caret offset must not cause h-scroll at 360px (left side inside container padding; `inset-inline-start` within gutter) — else hide caret under 48rem.
5. Add `data-caret` to nav links + primary NeonButton.
6. Run reduced-motion, navigation-lifecycle, smoke, responsive specs; manual check: Chrome DevTools emulate reduce → no blink.
7. Taste gate: record short screen capture (scratchpad) for user (Unresolved Q11). If rejected → revert step 2 only.

## Todo List
- [x] PIXEL_STEP const
- [x] hero stepped ease
- [x] scroll-reveals constant
- [x] caret CSS + data-caret hooks
- [x] reduced-motion/lifecycle/responsive specs green
- [ ] capture for user taste review (not recorded; Q11 open)

## Success Criteria
- Suite green; no new JS module; motion-ready flag still set; caret never blinks under reduce
- Lighthouse CLS 0, TBT unchanged (±10ms)

## Risk Assessment
- Stepped ease + SplitText `autoSplit` re-split on font load → re-run tween; verify `expectHeroVisible` end state.
- Caret `::before` collides with existing nav underline pseudo → use `::before` only if free; else `::after` swap.
- Taste risk → step 7 gate.

## Security Considerations
- None (presentation only).

## Next Steps
- 07 may play `select` cue on same elements; 09 docs motion section.
