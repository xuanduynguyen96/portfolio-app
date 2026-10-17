import { expect, test } from '@playwright/test';
import { CAREER_PAGES, PROJECT_SLUGS } from './test-helpers';

const PAGES = ['./', ...PROJECT_SLUGS.map((slug) => `./projects/${slug}/`), ...CAREER_PAGES];

test('every internal link and asset on every page resolves under the base path', async ({ page, request }) => {
  const checked = new Set<string>();

  for (const path of PAGES) {
    const response = await page.goto(path);
    expect(response?.status(), `page ${path}`).toBe(200);

    const urls = await page.evaluate(() => {
      const values = [
        ...Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'), (a) => a.href),
        ...Array.from(document.querySelectorAll<HTMLImageElement>('img[src]'), (img) => img.src),
        ...Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'), (s) => s.src),
        ...Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"], link[rel="icon"]'), (l) => l.href),
      ];
      return values.filter((url) => url.startsWith(location.origin)).map((url) => url.split('#')[0]);
    });

    for (const url of urls) {
      expect(new URL(url).pathname, `${url} on ${path} must include base`).toMatch(/^\/portfolio-app\//);
      if (checked.has(url)) continue;
      checked.add(url);
      const linkResponse = await request.get(url);
      expect(linkResponse.status(), `${url} linked from ${path}`).toBe(200);
    }
  }

  expect(checked.size).toBeGreaterThan(5);
});

test('unknown paths serve the custom 404 page', async ({ page }) => {
  const response = await page.goto('./this-page-does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: /signal lost/i })).toBeVisible();
  await page.getByRole('link', { name: 'Return to base' }).click();
  await expect(page).toHaveURL(/\/portfolio-app\/$/);
});
