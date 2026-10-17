import { expect, type Page } from '@playwright/test';

export const SITE_NAME = 'Xuan Duy Nguyen';
export const SECTION_IDS = ['about', 'skills', 'projects', 'experience', 'contact'] as const;
export const PROJECT_SLUGS = ['neon-dashboard', 'realtime-chat', 'cli-toolkit'] as const;

/** Collects console errors + uncaught exceptions for the page's lifetime. */
export function trackPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

/**
 * Scrolls through the whole page like a reader (half a viewport per step, two frames
 * per step so ScrollTrigger sees each position), then asserts every [data-reveal]
 * element finished its reveal. Assertions run in parallel to keep the suite fast.
 */
export async function expectAllRevealsVisible(page: Page): Promise<void> {
  const items = page.locator('[data-reveal]');
  await expect(items.first()).toBeAttached(); // ClientRouter may still be swapping the DOM
  expect(await items.count()).toBeGreaterThan(0);

  await page.evaluate(async () => {
    const nextFrames = () =>
      new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const step = Math.max(window.innerHeight / 2, 100);
    for (let y = 0; y <= document.documentElement.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await nextFrames();
    }
  });

  await Promise.all((await items.all()).map((item) => expect(item).toHaveCSS('opacity', '1')));
}

/** Waits until the hero intro has finished: every [data-hero] element fully opaque. */
export async function expectHeroVisible(page: Page): Promise<void> {
  await expect(page.locator('[data-hero-title]')).toBeAttached(); // ClientRouter may still be swapping the DOM
  const heroItems = page.locator('[data-hero]');
  const count = await heroItems.count();
  expect(count).toBeGreaterThan(0);
  for (let index = 0; index < count; index += 1) {
    await expect(heroItems.nth(index)).toHaveCSS('opacity', '1');
  }
  await expect(page.locator('[data-hero-title]')).toHaveText(SITE_NAME);
}
