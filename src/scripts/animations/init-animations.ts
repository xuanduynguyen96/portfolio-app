/**
 * Animation lifecycle across Astro <ClientRouter /> navigations.
 * - init on `astro:page-load` (fires on first load and after every navigation)
 * - cleanup on `astro:before-swap` (kills tweens, ScrollTriggers, SplitText splits)
 * Content is pre-hidden by CSS only while html[data-motion="ok"]; on any failure,
 * or when the user prefers reduced motion, the flag is removed so nothing stays hidden.
 */
import { gsap } from './gsap-setup';
import { heroTextReveal } from './hero-text-reveal';
import { scrollReveals } from './scroll-reveals';
import { bindCardSpotlight } from './card-spotlight';

let mm: gsap.MatchMedia | null = null;
let unbindSpotlight: (() => void) | null = null;

function revealAllImmediately(): void {
  delete document.documentElement.dataset.motion;
}

function init(): void {
  cleanup(); // idempotent if page-load ever fires twice without a before-swap
  const root = document.documentElement;
  try {
    unbindSpotlight = bindCardSpotlight();
    // Failsafe already revealed content (slow bundle): don't re-hide it, just stay static.
    if (root.dataset.motion !== 'ok' && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      root.dataset.motionReady = '';
      return;
    }
    mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      heroTextReveal();
      scrollReveals();
    });
    // Covers a reduced-motion preference turned on while the page is open.
    mm.add('(prefers-reduced-motion: reduce)', revealAllImmediately);
    // Tells the inline failsafe in base-layout that animations took over.
    root.dataset.motionReady = '';
  } catch (error) {
    console.error('[animations] init failed; showing all content without motion', error);
    revealAllImmediately();
  }
}

function cleanup(): void {
  mm?.revert();
  mm = null;
  unbindSpotlight?.();
  unbindSpotlight = null;
}

document.addEventListener('astro:page-load', init);
document.addEventListener('astro:before-swap', cleanup);
