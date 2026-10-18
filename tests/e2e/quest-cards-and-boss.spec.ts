import { expect, test } from '@playwright/test';
import { BOSS_SLUG, PROJECT_SLUGS } from './test-helpers';

const cardFor = (page: import('@playwright/test').Page, slug: string) =>
  page.locator('.project-card').filter({ has: page.locator(`h3 a[href$="/projects/${slug}/"]`) });

test.describe('project quests', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('one card per quest repo, each with one tier badge and its XP', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('.project-card')).toHaveCount(PROJECT_SLUGS.length);
    for (const slug of PROJECT_SLUGS) {
      const card = cardFor(page, slug);
      await expect(card.locator('.quest-badge')).toHaveCount(1);
      await expect(card.locator('.quest-badge')).toHaveText(/^(Side quest|Main quest|Raid|Boss · (Side quest|Main quest|Raid))$/);
      await expect(card.locator('.quest-xp')).toHaveText(/^\+\d+ XP$/);
    }
  });

  test('the boss card comes first, is marked, and spans two columns', async ({ page }) => {
    await page.goto('./');
    const cards = page.locator('.project-card');
    await expect(cards.first()).toHaveAttribute('data-boss', '');
    await expect(cards.first().locator('h3 a')).toHaveAttribute('href', new RegExp(`/projects/${BOSS_SLUG}/$`));
    await expect(page.locator('.project-card[data-boss]')).toHaveCount(1);
    await expect(cards.first().locator('.quest-badge')).toHaveText(/^Boss · /);

    const [bossWidth, otherWidth] = await Promise.all([
      cards.nth(0).evaluate((card) => card.getBoundingClientRect().width),
      cards.nth(1).evaluate((card) => card.getBoundingClientRect().width),
    ]);
    expect(bossWidth).toBeGreaterThan(otherWidth * 1.8);
  });
});

test.describe('quest cards on mobile', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('the boss card does not span (single column)', async ({ page }) => {
    await page.goto('./');
    const widths = await page
      .locator('.project-card')
      .evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().width)));
    expect(new Set(widths).size).toBe(1);
  });
});
