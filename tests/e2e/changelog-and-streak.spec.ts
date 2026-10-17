import { readdirSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { SITE_NAME, trackPageErrors } from './test-helpers';

const entryCount = readdirSync('src/content/changelog').filter((file) => file.endsWith('.md')).length;
const STREAK_TEXT = /^(\d+-week streak · best \d+|Streak paused · last entry \w{3} \d{1,2}, \d{4}|No changelog entries yet) \(view changelog\)$/;

test('changelog lists every entry newest first with machine-readable dates', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('./changelog/');
  await expect(page).toHaveTitle(`Changelog | ${SITE_NAME}`);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Changelog');

  const entries = page.locator('article.entry');
  await expect(entries).toHaveCount(entryCount);
  const dates = await page.locator('article.entry time').evaluateAll((times) => times.map((time) => time.getAttribute('datetime') ?? ''));
  for (const date of dates) expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  expect(dates).toEqual([...dates].sort().reverse());

  for (const entry of await entries.all()) {
    await expect(entry.getByRole('heading', { level: 2 })).not.toBeEmpty();
    await expect(entry.locator('.entry-body p').first()).not.toBeEmpty();
  }
  await expect(page.locator('.streak-badge')).toHaveText(STREAK_TEXT);
  expect(errors).toEqual([]);
});

test('home streak badge links to the changelog', async ({ page }) => {
  await page.goto('./');
  const badge = page.locator('#character .streak-badge');
  await expect(badge).toHaveText(STREAK_TEXT);
  await badge.click();
  await expect(page).toHaveURL(/\/portfolio-app\/changelog\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Changelog' })).toBeVisible();
});

test('footer links to the changelog on every page', async ({ page }) => {
  for (const path of ['./', './speedrun/', './projects/neon-dashboard/']) {
    await page.goto(path);
    await expect(page.locator('.site-footer').getByRole('link', { name: 'Changelog' })).toHaveAttribute(
      'href',
      '/portfolio-app/changelog/',
    );
  }
});
