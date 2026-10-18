import { expect, test } from '@playwright/test';
import { ARCHETYPE_IDS } from '../../src/data/character-class-rules.ts';
import { gearRules } from '../../src/data/gear-rules.ts';
import { AVATAR_VIEWBOX } from '../../src/utils/avatar/avatar-svg-markup.ts';
import { characterTitle } from '../../src/utils/github-character/character-title.ts';
import { classifyCharacter } from '../../src/utils/github-character/classify-character.ts';
import { SNAPSHOT } from './career-mirror';

// Wiring check: expected character from the same pure classifier over the committed snapshot
// (the classifier itself is unit-tested against literal fixtures).
const character = classifyCharacter(SNAPSHOT);
const title = characterTitle(character);
const maxTier = (slot: string) => gearRules.find((rule) => rule.slot === slot)?.thresholds.length;
/** Hero CSS: 4 px per art pixel below 48rem, 8 above (integer scales of the sticker viewBox). */
const HERO_PX = { phone: 4, wide: 8 };
const WIDE_MIN = 768;

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
      await expect(rows.nth(index).locator('dt')).toHaveText(`${slot.label} ${slot.axis}`);
      await expect(rows.nth(index).locator('dd')).toContainText(slot.tier === 0 ? 'Starter gear' : `Tier ${slot.tier} of ${maxTier(slot.slot)}`);
    }
    const why = portrait.locator('details.why');
    await why.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(why).toHaveAttribute('open', '');
    // An Adventurer has no class evidence yet: the panel explains that instead of listing signals.
    if (character.primary) await expect(why.getByRole('listitem').first()).toBeVisible();
    else await expect(why).toContainText('Not enough public signal yet');
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
      expect(box?.width).toBe(AVATAR_VIEWBOX * (width < WIDE_MIN ? HERO_PX.phone : HERO_PX.wide));
      expect(box?.height).toBe(box?.width);
      await context.close();
    }
  });

  test('speedrun header and credits gallery show avatars', async ({ page }) => {
    await page.goto('./speedrun/');
    await expect(page.getByRole('img', { name: title, exact: true })).toBeVisible();
    await page.goto('./credits/');
    // Every class x job (3 x 3) plus the Adventurer; one avatar per gear tier 0..max.
    await expect(page.getByRole('list', { name: 'Avatar looks' }).getByRole('img')).toHaveCount(ARCHETYPE_IDS.length ** 2 + 1);
    await expect(page.getByRole('list', { name: 'Gear tiers' }).getByRole('img')).toHaveCount(gearRules[0].thresholds.length + 1);
  });
});
