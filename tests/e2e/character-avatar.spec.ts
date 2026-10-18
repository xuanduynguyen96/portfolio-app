import { expect, test } from '@playwright/test';
import { classifyCharacter } from '../../src/utils/github-character/classify-character.ts';
import { SNAPSHOT } from './career-mirror';

// Expected character computed by the same pure classifier from the committed snapshot (no literals).
const character = classifyCharacter(SNAPSHOT);
const title = character.jobName ? `${character.className} · ${character.jobName}` : character.className;

test.describe('character avatar', () => {
  test('hero avatar is an image named by class and job, with a matching visible nameplate', async ({ page }) => {
    await page.goto('./');
    const avatar = page.locator('.hero').getByRole('img', { name: title, exact: true });
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute('data-animate', '');
    await expect(page.locator('.hero .nameplate-class')).toHaveText(title);
    await expect(page.locator('.hero .github-note a')).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('character sheet: static avatar, gear legend per slot, "why" opens with the keyboard', async ({ page }) => {
    await page.goto('./');
    const portrait = page.locator('#character .portrait');
    await expect(portrait.getByRole('img', { name: title, exact: true })).toBeVisible();
    await expect(portrait.locator('[data-animate]')).toHaveCount(0);
    const rows = portrait.locator('.gear-row');
    await expect(rows).toHaveCount(character.gear.length);
    for (const [index, slot] of character.gear.entries()) {
      await expect(rows.nth(index).locator('dt')).toContainText(`${slot.label}${slot.axis}`);
      await expect(rows.nth(index).locator('dd')).toContainText(slot.tier === 0 ? 'Starter gear' : `Tier ${slot.tier} of 3`);
    }
    const why = portrait.locator('details.why');
    await why.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(why).toHaveAttribute('open', '');
    await expect(why.getByRole('listitem').first()).toBeVisible();
  });

  test('frames swap only when motion is allowed', async ({ browser }) => {
    for (const reducedMotion of ['no-preference', 'reduce'] as const) {
      const context = await browser.newContext({ reducedMotion });
      const page = await context.newPage();
      await page.goto('./');
      await expect(page.locator('html')).toHaveAttribute('data-motion-ready', '');
      const name = await page.locator('.hero .avatar-frame-a').evaluate((el) => getComputedStyle(el).animationName);
      if (reducedMotion === 'reduce') expect(name).toBe('none');
      else expect(name).not.toBe('none');
      await context.close();
    }
  });

  test('renders without JavaScript at a fixed integer-scaled size (no layout shift)', async ({ browser }) => {
    for (const width of [360, 1280]) {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: 800 } });
      const page = await context.newPage();
      await page.goto('./');
      const avatar = page.locator('.hero svg.character-avatar');
      await expect(avatar).toBeVisible();
      await expect(page.locator('.hero .avatar-frame-b')).toHaveCSS('visibility', 'hidden');
      const box = await avatar.boundingBox();
      expect(box?.width).toBe(width < 768 ? 144 : 288);
      expect(box?.height).toBe(box?.width);
      await context.close();
    }
  });

  test('speedrun header and credits gallery show avatars', async ({ page }) => {
    await page.goto('./speedrun/');
    await expect(page.getByRole('img', { name: title, exact: true })).toBeVisible();
    await page.goto('./credits/');
    await expect(page.getByRole('list', { name: 'Avatar looks' }).getByRole('img')).toHaveCount(10);
    await expect(page.getByRole('list', { name: 'Gear tiers' }).getByRole('img')).toHaveCount(4);
  });
});
