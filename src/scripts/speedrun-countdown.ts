// Decorative countdown on /speedrun/ ([data-speedrun-countdown data-seconds], sets data-state
// running|done). The element is aria-hidden and server-rendered with its start value, so without
// JS or with reduced motion it simply stays static; it never hides or gates content.
import { formatClock, remainingSeconds } from '../utils/career-rpg/countdown-clock';

let timer: number | undefined;

function stopCountdown() {
  if (timer !== undefined) window.clearInterval(timer);
  timer = undefined;
}

function startCountdown() {
  stopCountdown();
  const clock = document.querySelector<HTMLElement>('[data-speedrun-countdown]');
  if (!clock || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const total = Number(clock.dataset.seconds);
  if (!Number.isInteger(total) || total <= 0) return;

  // Derive remaining time from the start timestamp so throttled tabs don't drift.
  const startedAt = Date.now();
  const tick = () => {
    const remaining = remainingSeconds(total, Date.now() - startedAt);
    clock.textContent = formatClock(remaining);
    if (remaining === 0) {
      stopCountdown();
      clock.dataset.state = 'done';
    }
  };
  clock.dataset.state = 'running';
  tick();
  timer = window.setInterval(tick, 250);
}

// ClientRouter replaces the DOM: restart on each page load, stop before leaving.
document.addEventListener('astro:page-load', startCountdown);
document.addEventListener('astro:before-swap', stopCountdown);
