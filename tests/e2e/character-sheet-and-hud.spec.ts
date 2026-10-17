import { expect, test } from '@playwright/test';
import { xpRules } from '../../src/data/xp-rules';
import { levelInfo } from '../../src/utils/career-rpg/xp-and-level.ts';

const toNumber = (text: string | null) => Number((text ?? '').replace(/[^\d]/g, ''));

test.describe('character sheet', () => {
  test('shows a level and title consistent with the attribute XP it lists', async ({ page }) => {
    await page.goto('./');
    const sheet = page.locator('section#character');
    await expect(sheet.getByRole('heading', { level: 2, name: 'Character sheet' })).toBeVisible();

    const attributes = sheet.getByRole('list', { name: 'Attributes' }).getByRole('progressbar');
    await expect(attributes).toHaveCount(Object.keys(xpRules.attributes).length);
    for (const label of Object.values(xpRules.attributes)) {
      await expect(sheet.getByRole('progressbar', { name: label, exact: true })).toBeVisible();
    }

    // Displayed total = sum of displayed attributes, and level/title follow the curve in xp-rules.
    const attributeXp = await attributes.evaluateAll((bars) => bars.map((bar) => (bar as HTMLProgressElement).value));
    const total = attributeXp.reduce((sum, xp) => sum + xp, 0);
    expect(toNumber(await sheet.locator('.char-xp').textContent())).toBe(total);
    const expected = levelInfo(total);
    await expect(sheet.locator('.identity .eyebrow')).toHaveText(`Level ${expected.level}`);
    await expect(sheet.locator('.char-title')).toHaveText(expected.title);

    for (const xp of attributeXp) expect(xp).toBeLessThanOrEqual(xpRules.attributeCap);
  });

  test('every progress bar has an accessible name and value text', async ({ page }) => {
    await page.goto('./');
    const bars = page.locator('section#character progress');
    expect(await bars.count()).toBe(Object.keys(xpRules.attributes).length + 2);
    for (const bar of await bars.all()) {
      await expect(bar).toHaveAccessibleName(/\S/);
      await expect(bar).toHaveAttribute('aria-valuetext', /\S/);
    }
    await expect(page.getByRole('progressbar', { name: /^Progress to level \d+$|^Max level reached$/ })).toBeVisible();
  });
});

test.describe('profile HUD', () => {
  test('reports completeness 0-100 and lists what is missing', async ({ page }) => {
    await page.goto('./');
    const hud = page.locator('section#character .hud');
    const bar = hud.getByRole('progressbar', { name: 'Profile completeness' });
    const percent = await bar.evaluate((element) => (element as HTMLProgressElement).value);
    expect(percent).toBeGreaterThanOrEqual(0);
    expect(percent).toBeLessThanOrEqual(100);
    await expect(bar).toHaveAttribute('aria-valuetext', new RegExp(`^${percent}% · \\d+ / \\d+ checks$`));

    // Placeholder content is still present, so the HUD cannot be complete.
    const summary = hud.locator('summary');
    await expect(summary).toHaveText(/^\d+ items? missing$/);
    const missing = hud.locator('details li');
    await expect(missing).toHaveCount(toNumber(await summary.textContent()));
    await expect(missing.filter({ hasText: /^No placeholder content left/ })).toHaveCount(1);
  });

  test('the missing list opens with the keyboard without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('./');
    const details = page.locator('section#character .hud details');
    await expect(details).not.toHaveAttribute('open', /.*/);
    await details.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(details).toHaveAttribute('open', '');
    await expect(details.locator('li').first()).toBeVisible();
    await context.close();
  });
});
