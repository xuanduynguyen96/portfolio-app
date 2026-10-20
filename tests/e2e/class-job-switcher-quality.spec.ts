import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { lookKey } from '../../src/utils/avatar/class-looks.ts';
import { expectAllRevealsVisible } from './test-helpers';
import { HERO, LOOKS, SHEET, STORAGE_KEY, chooseLook, closedSwitcherReady, openSwitcher, resetButton, root, status } from './switcher-helpers';
import { lookTitle } from '../../src/utils/avatar/class-labels.ts';

// The longest title (computed, not hardcoded) is the worst case for a saved look rewrapping the hero caption.
const longest = LOOKS.reduce((a, b) => (lookTitle(b).length > lookTitle(a).length ? b : a));
const other = LOOKS.find((look) => look.classId === 'mage' && look.motif === 'hawk')!;

test.describe('motion', () => {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`${reducedMotion}: hero loop follows the preference after a switch, sheet stays static`, async ({ browser }) => {
      const context = await browser.newContext({ reducedMotion });
      const page = await context.newPage();
      await openSwitcher(page);
      await expect(page.locator('html')).toHaveAttribute('data-motion-ready', '');
      await chooseLook(page, other);
      await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(lookTitle(other));
      const animation = (selector: string) => page.locator(selector).evaluate((el) => getComputedStyle(el).animationName);
      if (reducedMotion === 'reduce') expect(await animation(`${HERO} .avatar-frame-a`)).toBe('none');
      else expect(await animation(`${HERO} .avatar-frame-a`)).not.toBe('none');
      await expect(page.locator(`${SHEET} .avatar-frame-b`)).toHaveCount(0);
      if (reducedMotion === 'reduce') await expect(page.locator(`${HERO} .avatar-frame-b`)).toHaveCSS('visibility', 'hidden');
      await context.close();
    });
  }
});

test.describe('layout stability', () => {
  for (const [name, viewport] of [['360px', { width: 360, height: 640 }], ['1280px', { width: 1280, height: 800 }]] as const) {
    test(`${name}: restoring a saved ${lookKey(longest)} look adds almost no layout shift`, async ({ browser }) => {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      await page.addInitScript(([key, value]) => {
        localStorage.setItem(key, value);
        const w = window as unknown as { __cls: number };
        w.__cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!entry.hadRecentInput) w.__cls += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      }, [STORAGE_KEY, lookKey(longest)]);
      await page.goto('./');
      await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(lookTitle(longest));
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThanOrEqual(0.005);
      // The sheet SVG box is fixed at 216.
      const sheetBox = await page.locator(`${SHEET} svg.character-avatar`).boundingBox();
      expect(Math.round(sheetBox!.width)).toBe(216);
      await context.close();
    });
  }

  test('360px: open control with a chosen look has no horizontal scroll and 44px targets', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 640 } });
    const page = await context.newPage();
    await openSwitcher(page);
    await chooseLook(page, longest);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    for (const box of await root(page).locator('.switcher-option:visible').all()) expect((await box.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect((await resetButton(page).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await context.close();
  });
});

test.describe('forced colors', () => {
  test('options keep a border, the checked one is thicker, the avatar keeps its colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await openSwitcher(page);
    await chooseLook(page, other);
    const border = (selector: string) => page.locator(selector).first().evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
    const checked = await root(page).locator('.switcher-option:has(input:checked)').first().evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
    const plain = await root(page).locator('.switcher-option:has(input:not(:checked))').first().evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth));
    expect(plain).toBeGreaterThan(0);
    expect(checked).toBeGreaterThan(plain);
    expect(await border('.switcher-reset')).toBeGreaterThan(0);
    const fills = await page.locator(`${HERO} svg.character-avatar`).locator('.avatar-frame-a path')
      .evaluateAll((paths) => new Set(paths.map((path) => getComputedStyle(path).fill)).size);
    expect(fills).toBeGreaterThan(4);
  });
});

for (const colorScheme of ['dark', 'light'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    test.use({ colorScheme });

    for (const chosen of [false, true]) {
      test(`axe: open switcher${chosen ? ' with a chosen look' : ''} has no serious or critical violations`, async ({ page }) => {
        await openSwitcher(page);
        if (chosen) await chooseLook(page, other);
        await expectAllRevealsVisible(page);
        await page.evaluate(() => document.querySelectorAll('details').forEach((details) => (details.open = true)));
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']).analyze();
        const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(blocking.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
      });
    }
  });
}

test('keyboard: summary toggles with Enter, Tab reaches the class radios with a visible focus ring', async ({ page }) => {
  await page.goto('./');
  await closedSwitcherReady(page);
  await root(page).locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(root(page)).toHaveAttribute('open', '');
  await expect(root(page).locator('input[name="switcher-class"]')).toHaveCount(4); // built on open
  await page.keyboard.press('Tab');
  const focused = page.locator('input[name="switcher-class"]:focus');
  await expect(focused).toHaveCount(1);
  const ring = await focused.locator('xpath=ancestor::label').evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(ring).not.toBe('none');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('input[name="switcher-class"]:checked')).toHaveCount(1);
  await expect(status(page)).toContainText('Showing');
});
