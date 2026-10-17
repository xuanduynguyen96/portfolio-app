import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectAllRevealsVisible } from './test-helpers';

const PAGES = [
  { name: 'home', path: './', hasReveals: true },
  { name: 'project detail', path: './projects/neon-dashboard/', hasReveals: false },
  { name: 'unverified project detail', path: './projects/cli-toolkit/', hasReveals: false },
  { name: 'speedrun', path: './speedrun/', hasReveals: true },
  { name: 'changelog', path: './changelog/', hasReveals: false },
  { name: 'credits', path: './credits/', hasReveals: false },
  { name: '404', path: './missing-page', hasReveals: false },
];

// Audit both themes: parchment (light) and dungeon (dark) have separate contrast pairs.
for (const colorScheme of ['dark', 'light'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    for (const { name, path, hasReveals } of PAGES) {
      test(`${name} has no serious or critical axe violations`, async ({ page }) => {
        await page.goto(path);
        // Audit the final, fully revealed state (contrast checks need opacity 1).
        if (hasReveals) await expectAllRevealsVisible(page);
        await expect(page.locator('h1')).toHaveCSS('opacity', '1');
        // Audit disclosure content too (HUD missing list, skill evidence).
        await page.evaluate(() => document.querySelectorAll('details').forEach((details) => (details.open = true)));

        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']).analyze();
        const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(
          blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`),
        ).toEqual([]);
      });
    }
  });
}
