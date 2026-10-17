import { expect, test } from '@playwright/test';
import { creditGroups } from '../../src/data/credits-data.ts';
import { PIXEL_ICON_NAMES } from '../../src/data/pixel-icons.ts';
import { PROJECT_SLUGS } from './test-helpers';

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('credits page lists every group, entry and license link', async ({ page }) => {
  await page.goto('./credits/');
  await expect(page.getByRole('heading', { level: 1, name: 'Credits' })).toBeVisible();

  for (const group of creditGroups) {
    const section = page.getByRole('region', { name: group.title });
    await expect(section.getByRole('heading', { level: 2, name: group.title })).toBeVisible();
    for (const entry of group.entries) {
      const item = section.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 3, name: entry.name }) });
      await expect(item).toHaveCount(1);
      await expect(item.locator('.credit-meta')).toHaveText(new RegExp(`^${escapeRegExp(entry.author)} · ${escapeRegExp(entry.license)}`));
      if (entry.url) await expect(item.getByRole('link', { name: entry.name })).toHaveAttribute('href', entry.url);
      if (entry.licenseUrl) {
        await expect(item.getByRole('link', { name: entry.license })).toHaveAttribute('href', entry.licenseUrl);
      }
    }
  }

  // External links open safely in a new tab and announce it.
  const external = page.locator('main a[target="_blank"]');
  expect(await external.count()).toBeGreaterThan(0);
  for (const link of await external.all()) {
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toContainText('(opens in new tab)');
  }
});

test('icon gallery shows every pixel icon with its name', async ({ page }) => {
  await page.goto('./credits/');
  const gallery = page.getByRole('list', { name: 'Pixel icon set' });
  await expect(gallery.getByRole('listitem')).toHaveCount(PIXEL_ICON_NAMES.length);
  for (const name of PIXEL_ICON_NAMES) {
    const tile = gallery.getByRole('listitem').filter({ has: page.locator(`svg[data-icon="${name}"]`) });
    await expect(tile).toHaveCount(1);
    await expect(tile.locator('code')).toHaveText(name);
    await expect(tile.locator('svg')).toHaveAttribute('aria-hidden', 'true');
  }
});

for (const path of ['./', `./projects/${PROJECT_SLUGS[0]}/`, './speedrun/']) {
  test(`footer Credits link on ${path} opens the credits page`, async ({ page }) => {
    await page.goto(path);
    await page.getByRole('contentinfo').getByRole('link', { name: 'Credits' }).click();
    await expect(page).toHaveURL(/\/portfolio-app\/credits\/$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Credits' })).toBeVisible();
  });
}
