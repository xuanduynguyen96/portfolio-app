import { expect, test, type Page } from '@playwright/test';
import { trackPageErrors } from './test-helpers';

// Mirrors --color-bg (design-tokens.css) and BG (theme-head-script.astro).
const BG = { light: 'rgb(244, 236, 216)', dark: 'rgb(20, 17, 15)' } as const;
const toggle = (page: Page) => page.getByRole('button', { name: 'Dark theme' });
const html = (page: Page) => page.locator('html');

function hexToRgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  return `rgb(${r}, ${g}, ${b})`;
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`system ${colorScheme}`, () => {
    test.use({ colorScheme });

    test('follows the system scheme with no stored choice', async ({ page }) => {
      await page.goto('./');
      await expect(html(page)).toHaveAttribute('data-theme', colorScheme);
      await expect(toggle(page)).toHaveAttribute('aria-pressed', String(colorScheme === 'dark'));
      await expect(page.locator('body')).toHaveCSS('background-color', BG[colorScheme]);
    });

    test('theme-color metas match the page background', async ({ page }) => {
      await page.goto('./');
      for (const theme of [colorScheme, colorScheme === 'dark' ? 'light' : 'dark'] as const) {
        if (theme !== colorScheme) await toggle(page).click();
        await expect(page.locator('body')).toHaveCSS('background-color', BG[theme]);
        const metas = await page.locator('meta[name="theme-color"]').evaluateAll((nodes) =>
          nodes.map((node) => node.getAttribute('content') ?? ''),
        );
        expect(metas).toHaveLength(2);
        for (const content of metas) expect(hexToRgb(content)).toBe(BG[theme]);
      }
    });

    test('no-JS: system scheme applies and the toggle is hidden', async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, colorScheme });
      const page = await context.newPage();
      await page.goto('./');
      await expect(page.locator('body')).toHaveCSS('background-color', BG[colorScheme]);
      await expect(page.locator('[data-theme-toggle]')).toBeHidden();
      await context.close();
    });
  });
}

test.describe('toggle', () => {
  test.use({ colorScheme: 'dark' });

  test('switches theme and the choice survives a reload', async ({ page }) => {
    await page.goto('./');
    await toggle(page).click();
    await expect(html(page)).toHaveAttribute('data-theme', 'light');
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
    await page.reload();
    await expect(html(page)).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('body')).toHaveCSS('background-color', BG.light);
    await toggle(page).click();
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
  });

  test('stored choice applies while parsing <head>, before <body> exists (no flash)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('rpg-theme', 'light');
      // Records the first moment html[data-theme] is set and whether <body> was parsed yet.
      const observer = new MutationObserver(() => {
        const theme = document.documentElement?.dataset.theme;
        if (!theme) return;
        Object.assign(window, { __themeApplied: { theme, bodyParsed: document.body !== null } });
        observer.disconnect();
      });
      observer.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-theme'] });
    });
    await page.goto('./');
    const applied = await page.evaluate(() => (window as { __themeApplied?: unknown }).__themeApplied);
    expect(applied).toEqual({ theme: 'light', bodyParsed: false });
  });

  test('theme is kept on every DOM mutation across soft navigations', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('./');
    await toggle(page).click();
    await page.evaluate(() => {
      const seen: (string | undefined)[] = [];
      Object.assign(window, { __themeSeen: seen, __softNavMarker: true });
      new MutationObserver(() => seen.push(document.documentElement.dataset.theme)).observe(document.documentElement, {
        attributes: true,
      });
    });
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Speedrun' }).click();
    await expect(page).toHaveURL(/\/speedrun\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const { seen, sameDocument } = await page.evaluate(() => ({
      seen: (window as { __themeSeen?: (string | undefined)[] }).__themeSeen ?? [],
      sameDocument: '__softNavMarker' in window,
    }));
    expect(sameDocument).toBe(true);
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((theme) => theme === 'light')).toBe(true);
    // Toggle in the swapped-in header still works and reflects state.
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
    await toggle(page).click();
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    expect(errors).toEqual([]);
  });

  test('blocked storage: themed from system, toggle still works for the tab', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.addInitScript(() => {
      const blocked = () => {
        throw new DOMException('blocked', 'SecurityError');
      };
      Storage.prototype.getItem = blocked;
      Storage.prototype.setItem = blocked;
    });
    await page.goto('./');
    await expect(html(page)).toHaveAttribute('data-theme', 'dark');
    await toggle(page).click();
    await expect(html(page)).toHaveAttribute('data-theme', 'light');
    expect(errors).toEqual([]);
  });
});
