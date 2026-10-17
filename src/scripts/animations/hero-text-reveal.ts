import { gsap, SplitText } from './gsap-setup';

/**
 * Hero intro: title characters rise out of line masks, then the remaining
 * [data-hero] elements (eyebrow, role, tagline, CTAs) fade up in sequence.
 * Must run inside a gsap.matchMedia() context so mm.revert() undoes everything.
 */
export function heroTextReveal(): void {
  const title = document.querySelector<HTMLElement>('[data-hero-title]');
  const others = gsap.utils.toArray<HTMLElement>('[data-hero]:not([data-hero-title])');

  if (title) {
    gsap.set(title, { opacity: 1 });
    SplitText.create(title, {
      type: 'lines,chars',
      mask: 'lines',
      autoSplit: true, // re-split after font load / resize so line breaks stay correct
      onSplit: (self) =>
        gsap.from(self.chars, {
          yPercent: 110,
          duration: 0.9,
          ease: 'expo.out',
          stagger: 0.025,
        }),
    });
  }

  if (others.length > 0) {
    gsap.fromTo(
      others,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.1, delay: title ? 0.35 : 0 },
    );
  }
}
