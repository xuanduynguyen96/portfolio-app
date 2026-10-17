import { expect, test } from '@playwright/test';
import { BOSS_SLUG } from './test-helpers';

// Every rendered pixel icon: integer multiple of the 8px grid (crisp), crispEdges, no text, and
// either decorative (aria-hidden) or a labelled image. Hidden icons (e.g. inactive theme glyph) are skipped.
for (const path of ['./', `./projects/${BOSS_SLUG}/`, './speedrun/', './credits/']) {
  test(`pixel icons are crisp and accessible on ${path}`, async ({ page }) => {
    await page.goto(path);
    const icons = await page.locator('svg.pixel-icon').evaluateAll((elements) =>
      elements
        .filter((element) => element.checkVisibility())
        .map((element) => ({
          name: element.getAttribute('data-icon'),
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
          hidden: element.getAttribute('aria-hidden'),
          role: element.getAttribute('role'),
          label: element.getAttribute('aria-label'),
          text: element.textContent,
          shape: getComputedStyle(element).shapeRendering,
        })),
    );

    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect([16, 24, 32, 48], `${icon.name} size`).toContain(icon.width);
      expect(icon.height, `${icon.name} square`).toBe(icon.width);
      expect(icon.text, `${icon.name} has no text`).toBe('');
      expect(icon.shape, `${icon.name} crisp`).toBe('crispedges');
      expect(icon.hidden === 'true' || (icon.role === 'img' && !!icon.label), `${icon.name} a11y`).toBe(true);
    }
  });
}
