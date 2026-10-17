import { expect, test } from '@playwright/test';
import { SECTION_IDS, SITE_NAME, expectAllRevealsVisible, expectHeroVisible, trackPageErrors } from './test-helpers';

test.describe('home page', () => {
  test('renders metadata, hero and every section without errors', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('./');

    await expect(page).toHaveTitle(new RegExp(SITE_NAME));
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://xuanduynguyen96.github.io/portfolio-app/',
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/portfolio-app\/og-image\.png$/);

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expectHeroVisible(page);

    for (const id of SECTION_IDS) {
      const section = page.locator(`section#${id}`);
      await expect(section).toHaveCount(1);
      await expect(section.getByRole('heading', { level: 2 })).toBeVisible();
    }

    await expectAllRevealsVisible(page);
    await expect(page.locator('.project-card')).toHaveCount(3);
    await expect(page.locator('.timeline-item')).toHaveCount(3);
    expect(errors).toEqual([]);
  });

  test('animations initialise and mark themselves ready', async ({ page }) => {
    await page.goto('./');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-motion', 'ok');
    await expect(html).toHaveAttribute('data-motion-ready', '');
  });

  test('skip link is the first focusable element and moves focus to main', async ({ page }) => {
    await page.goto('./');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: 'Skip to content' });
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
  });

  test('hero CTA scrolls to the projects section', async ({ page }) => {
    await page.goto('./');
    await expectHeroVisible(page);
    await page.getByRole('link', { name: 'View projects' }).click();
    await expect(page).toHaveURL(/#projects$/);
    await expect(page.locator('#projects-title')).toBeInViewport();
  });

  test('contact section exposes mailto and external social links safely', async ({ page }) => {
    await page.goto('./');
    const contact = page.locator('#contact');
    await expect(contact.getByRole('link', { name: 'Email me' })).toHaveAttribute('href', /^mailto:.+@.+/);
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();
    expect(count).toBeGreaterThan(0);
    for (let index = 0; index < count; index += 1) {
      await expect(externalLinks.nth(index)).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });
});
