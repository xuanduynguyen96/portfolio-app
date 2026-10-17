/**
 * Pointer-follow spotlight for `.glass[data-spotlight]` cards.
 * Sets --spot-x / --spot-y (consumed by effects.css). No GSAP needed.
 * Returns an unbind function. Skipped on touch-only devices.
 */
export function bindCardSpotlight(): () => void {
  if (!window.matchMedia('(hover: hover)').matches) return () => {};

  const onPointerMove = (event: PointerEvent) => {
    const card = (event.target as Element | null)?.closest<HTMLElement>('.glass[data-spotlight]');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    card.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  };

  document.addEventListener('pointermove', onPointerMove, { passive: true });
  return () => document.removeEventListener('pointermove', onPointerMove);
}
