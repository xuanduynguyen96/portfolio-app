import { expect, test, type Page } from '@playwright/test';
import { SITE_NAME } from './test-helpers';

/** Every animatable element must be visible with no inline transform, without any scrolling. */
async function expectStaticContentVisible(page: Page, minTargets = 11) {
  const targets = page.locator('[data-reveal], [data-hero]');
  const count = await targets.count();
  expect(count).toBeGreaterThanOrEqual(minTargets);
  for (let index = 0; index < count; index += 1) {
    const target = targets.nth(index);
    await expect(target).toHaveCSS('opacity', '1');
    await expect(target).toHaveCSS('transform', 'none');
  }
}

test.describe('prefers-reduced-motion: reduce', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('shows all content immediately with no motion applied', async ({ page }) => {
    await page.goto('./');
    // Wait for init so the assertions below run after the animation module had its chance.
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', '');
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.*/);
    await expectStaticContentVisible(page);
    // Hero title is not split into animated characters.
    await expect(page.locator('[data-hero-title]')).toHaveText(SITE_NAME);
    expect(await page.locator('[data-hero-title] *').count()).toBe(0);
  });
});

test.describe('motion fallbacks', () => {
  test('without JavaScript all content is visible', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('./');
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.*/);
    await expectStaticContentVisible(page);
    await context.close();
  });

  test('without JavaScript the speedrun page is complete and its clock is static', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('./speedrun/');
    await expectStaticContentVisible(page, 3);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(SITE_NAME);
    await expect(page.locator('[data-speedrun-countdown]')).toHaveText('01:00');
    await context.close();
  });

  test('if the animation bundle fails to load, the failsafe reveals content', async ({ page }) => {
    // Block every bundled module script except the router; the animation module never runs.
    await page.route('**/_astro/*.js', (route) =>
      route.request().url().includes('ClientRouter') ? route.continue() : route.abort(),
    );
    await page.goto('./');
    // Content starts pre-hidden, then the 3s failsafe removes the flag.
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'ok');
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.*/, { timeout: 6_000 });
    await expectStaticContentVisible(page);
  });

  test('switching to reduced motion mid-session reveals everything', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', '');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(page.locator('html')).not.toHaveAttribute('data-motion', /.*/);
    await expectStaticContentVisible(page);
  });
});
