import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectAllRevealsVisible } from './test-helpers';

const PAGES = [
  { name: 'home', path: './', hasReveals: true },
  { name: 'project detail', path: './projects/neon-dashboard/', hasReveals: false },
  { name: '404', path: './missing-page', hasReveals: false },
];

for (const { name, path, hasReveals } of PAGES) {
  test(`${name} has no serious or critical axe violations`, async ({ page }) => {
    await page.goto(path);
    // Audit the final, fully revealed state (contrast checks need opacity 1).
    if (hasReveals) await expectAllRevealsVisible(page);
    await expect(page.locator('h1')).toHaveCSS('opacity', '1');

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']).analyze();
    const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(
      blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`),
    ).toEqual([]);
  });
}
