import { expect, test } from '@playwright/test';

// Regression: CSS smooth scrolling + ScrollTrigger init used to cancel scroll restoration,
// so deep links and reloads landed at the top of the page (motion enabled only).

test('hash deep link lands on the target section', async ({ page }) => {
  await page.goto('./#contact');
  await expect(page.locator('html')).toHaveAttribute('data-motion-ready', '');
  await expect(page.locator('#contact-title')).toBeInViewport();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
});

test('reload keeps the reader scroll position', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-motion-ready', '');
  await page.evaluate(() => window.scrollTo({ top: 2000, behavior: 'instant' }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(2000);
  // ClientRouter persists scroll into history.state on `scrollend`; wait for it like a real reader would.
  await expect.poll(() => page.evaluate(() => history.state?.scrollY)).toBe(2000);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-motion-ready', '');
  // Let ScrollTrigger's first refresh run, then confirm the position survived it.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1900);
});
