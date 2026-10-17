import { expect, test, type Page } from '@playwright/test';
import { PROJECT_SLUGS } from './test-helpers';

async function expectNoHorizontalScroll(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
}

test.describe('mobile 360px', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const path of ['./', `./projects/${PROJECT_SLUGS[0]}/`, './missing-page']) {
    test(`no horizontal scroll on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expectNoHorizontalScroll(page);
    });
  }

  test('menu still works when the animation bundle fails to load', async ({ page }) => {
    // The menu script is small enough for Astro to inline it, so it is independent of the bundle.
    await page.route('**/_astro/*.js', (route) =>
      route.request().url().includes('ClientRouter') ? route.continue() : route.abort(),
    );
    await page.goto('./');
    const nav = page.getByRole('navigation', { name: 'Primary' });
    await expect(nav).toBeHidden(); // collapsed before first paint: no layout shift
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(nav).toBeVisible();
  });

  test('menu toggle opens, closes on link click and on Escape', async ({ page }) => {
    await page.goto('./');
    const toggle = page.getByRole('button', { name: 'Menu' });
    const nav = page.getByRole('navigation', { name: 'Primary' });

    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(nav).toBeVisible();
    await nav.getByRole('link', { name: 'Skills' }).click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
    await expect(page.locator('#skills-title')).toBeInViewport();

    await toggle.click();
    await expect(nav).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(nav).toBeHidden();
    await expect(toggle).toBeFocused();
  });
});

test.describe('desktop 1280px', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('nav is inline and the menu toggle is hidden', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
    await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link')).toHaveCount(5);
    await expectNoHorizontalScroll(page);
  });

  test('project grid shows multiple columns', async ({ page }) => {
    await page.goto('./');
    const tops = await page
      .locator('.project-card')
      .evaluateAll((cards) => cards.map((card) => Math.round(card.getBoundingClientRect().top)));
    expect(new Set(tops).size).toBeLessThan(tops.length);
  });
});
