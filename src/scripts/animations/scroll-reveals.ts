import { gsap, PIXEL_STEP, ScrollTrigger } from './gsap-setup';

/**
 * Fade-up every [data-reveal] element the first time it scrolls into view.
 * Uses `opacity` (not `autoAlpha`): visibility:hidden would remove unrevealed content
 * from the accessibility tree, hiding it from screen-reader navigation.
 * ScrollTrigger.batch groups elements entering together so grids stagger nicely.
 * Must run inside a gsap.matchMedia() context so mm.revert() undoes everything.
 */
export function scrollReveals(): void {
  const targets = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  if (targets.length === 0) return;

  gsap.set(targets, { opacity: 0, y: PIXEL_STEP * 4 });
  ScrollTrigger.batch(targets, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08, overwrite: true }),
  });
}
