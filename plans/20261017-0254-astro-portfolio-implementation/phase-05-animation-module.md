# Phase 05: Animation Module (GSAP)

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [phase-04](phase-04-layout-components-and-pages.md)
- Docs: https://gsap.com/docs/v3/ (ScrollTrigger, SplitText, gsap.matchMedia) · https://docs.astro.build/en/guides/view-transitions
- Reference: Codrops Astro + GSAP transitions https://tympanus.net/codrops/?p=123511

## Overview
- Date: 2026-10-17 · Priority: P0 · Status: Done · Review: Code-reviewed + tester-validated
- Hero text reveal, scroll section reveals, card hover spotlight, init/cleanup across ClientRouter navigations, reduced-motion + failure safety.

## Key Insights
- Astro bundled `<script>` runs once; with ClientRouter must init on `astro:page-load`, clean up on `astro:before-swap`.
- `gsap.matchMedia()` scopes animations to `(prefers-reduced-motion: no-preference)`; `mm.revert()` kills tweens, ScrollTriggers, SplitText splits created inside.
- Content pre-hidden by CSS only when `data-motion='ok'` → must always be revealed: on success via tween, on error via catch, plus timeout failsafe.
- Animate only `transform`/`opacity`. Use `autoAlpha` for reveals.
- SplitText (3.13+) supports masking + aria handling; verify options in current docs.

## Requirements
- Functional: hero title chars/lines reveal on load; `[data-reveal]` fade-up on scroll (once); staggered children for card grids; card pointer spotlight (CSS var driven); works after page navigation.
- Non-functional: no jank (60fps target); total animation JS small (gsap core + ScrollTrigger + SplitText only); reduced motion → zero tweens, content visible.

## Architecture
```
src/scripts/animations/
├── gsap-setup.ts             import gsap + plugins, registerPlugin once, export
├── hero-text-reveal.ts       SplitText on [data-hero-title], timeline
├── scroll-reveals.ts         batch [data-reveal] with ScrollTrigger.batch
├── card-spotlight.ts         pointermove → --spot-x/--spot-y on .glass cards (no GSAP needed)
└── init-animations.ts        lifecycle: page-load init, before-swap cleanup, error/timeout failsafe
```
Imported once from `base-layout.astro`: `<script>import '../scripts/animations/init-animations';</script>`

Lifecycle sketch:
```ts
// init-animations.ts
import { gsap } from './gsap-setup';
import { heroTextReveal } from './hero-text-reveal';
import { scrollReveals } from './scroll-reveals';
import { bindCardSpotlight } from './card-spotlight';

let mm: gsap.MatchMedia | null = null;
let unbindSpotlight: (() => void) | null = null;

function revealAllImmediately() {
  delete document.documentElement.dataset.motion; // CSS pre-hide off
}

function init() {
  const failsafe = window.setTimeout(revealAllImmediately, 3000);
  try {
    mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      heroTextReveal();
      scrollReveals();
    });
    unbindSpotlight = bindCardSpotlight();
    window.clearTimeout(failsafe);
  } catch (error) {
    console.error('[animations] init failed', error);
    revealAllImmediately();
  }
}

function cleanup() {
  mm?.revert();
  mm = null;
  unbindSpotlight?.();
  unbindSpotlight = null;
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', cleanup);
```

Scroll reveal sketch:
```ts
export function scrollReveals() {
  gsap.set('[data-reveal]', { autoAlpha: 0, y: 32 });
  ScrollTrigger.batch('[data-reveal]', {
    start: 'top 85%',
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08 }),
  });
}
```
Note: `gsap.set` takes over from CSS pre-hide; on `mm.revert()` inline styles are removed.

## Related Code Files
Create:
- `/home/user/portfolio-app/src/scripts/animations/gsap-setup.ts`
- `/home/user/portfolio-app/src/scripts/animations/hero-text-reveal.ts`
- `/home/user/portfolio-app/src/scripts/animations/scroll-reveals.ts`
- `/home/user/portfolio-app/src/scripts/animations/card-spotlight.ts`
- `/home/user/portfolio-app/src/scripts/animations/init-animations.ts`
Modify:
- `/home/user/portfolio-app/src/layouts/base-layout.astro`: import init script
- `/home/user/portfolio-app/src/styles/effects.css`: `.glass` spotlight radial gradient using `--spot-x/--spot-y`; hover glow transitions (CSS)

## Implementation Steps
1. `gsap-setup.ts`: `gsap.registerPlugin(ScrollTrigger, SplitText)`; export all three.
2. `hero-text-reveal.ts`: `SplitText.create('[data-hero-title]', { type: 'lines,chars', mask: 'lines' })`; timeline: chars `yPercent: 110 → 0`, stagger 0.02; then other `[data-hero]` elements (tagline, CTAs) fade-up. Hero uses `[data-hero]`, never `[data-reveal]`, so scroll reveals don't touch it.
3. `scroll-reveals.ts` as above; exclude hero.
4. `card-spotlight.ts`: delegate `pointermove` on `document` for `.glass[data-spotlight]`; set CSS vars; return unbind fn. Skip on `(hover: none)`.
5. `init-animations.ts` lifecycle (above).
6. CSS hover micro-interactions: buttons glow + `translateY(-2px)`, tag chips border glow, nav underline scale — CSS transitions, covered by reduced-motion guard.
7. Test manually: load, scroll, navigate to project and back (no duplicate triggers, no hidden content), toggle reduced-motion in DevTools.

## Todo List
- [x] gsap-setup.ts
- [x] hero-text-reveal.ts
- [x] scroll-reveals.ts
- [x] card-spotlight.ts + CSS
- [x] init-animations.ts lifecycle + failsafe
- [x] CSS hover micro-interactions
- [x] Manual nav/back + reduced-motion check (covered by e2e lifecycle + reduced-motion specs)

## Success Criteria
- After 3 nav round-trips: content visible, reveals fire once per element, no stacked inline styles (manual DevTools check: `ScrollTrigger.getAll().length` stable via a temporary breakpoint).
- Reduced motion emulated: no inline transforms, all content visible.
- Throwing inside init (temporary test) → content still visible.
- Each file <200 lines.

## Risk Assessment
- FOUC on hero before JS → CSS pre-hide via `data-motion` flag set in head.
- Content permanently hidden on JS failure → try/catch + 3s failsafe.
- SplitText re-split on resize breaking layout → use `autoSplit`/`onSplit` per current docs, or keep line split only.
- Duplicate listeners across swaps → module-level single registration (script runs once).

## Security Considerations
- No dynamic HTML injection; SplitText operates on author text.
- GSAP from npm (bundled), not CDN → no third-party script origin.

## Next Steps
- Phase 06 automates these checks.
