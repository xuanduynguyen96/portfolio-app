import { expect, test } from '@playwright/test';

// Pixel frames are box-shadows, which forced colors (Windows High Contrast) removes:
// controls and panels must keep a visible boundary from a real border instead.
test.describe('forced colors', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
  });

  test('framed controls and panels keep a border', async ({ page }) => {
    await page.goto('./');
    for (const locator of [
      page.getByRole('button', { name: 'Dark theme' }),
      page.getByRole('link', { name: 'Home' }),
      page.getByRole('link', { name: 'View projects' }),
      page.locator('.glass').first(),
    ]) {
      const width = await locator.evaluate((element) => parseFloat(getComputedStyle(element).borderTopWidth));
      expect(width).toBeGreaterThan(0);
    }
  });

  test.describe('mobile', () => {
    test.use({ viewport: { width: 360, height: 740 } });

    test('menu icon bars stay visible', async ({ page }) => {
      await page.goto('./');
      const toggle = page.getByRole('button', { name: 'Menu' });
      await expect(toggle).toBeVisible();
      const bar = await toggle.locator('.menu-icon').evaluate((element) => getComputedStyle(element).backgroundColor);
      expect(bar).not.toBe('rgba(0, 0, 0, 0)');
      expect(await toggle.evaluate((element) => parseFloat(getComputedStyle(element).borderTopWidth))).toBeGreaterThan(0);
    });
  });
});
