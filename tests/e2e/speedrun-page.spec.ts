import { expect, test } from '@playwright/test';
import { xpRules } from '../../src/data/xp-rules';
import { siteConfig } from '../../src/data/site-config';
import { SITE_NAME, trackPageErrors } from './test-helpers';

const clock = (page: import('@playwright/test').Page) => page.locator('[data-speedrun-countdown]');

test.describe('recruiter speedrun', () => {
  test('shows identity, availability, up to 3 achievements and contact CTAs', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('./speedrun/');
    await expect(page).toHaveTitle(`Speedrun | ${SITE_NAME}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(SITE_NAME);
    await expect(page.locator('.speedrun-identity')).toHaveText(new RegExp(`^${siteConfig.role} · Level \\d+ .+$`));
    await expect(page.locator('.availability-note')).toHaveText(siteConfig.availability.note);
    await expect(page.locator('.availability-status')).toHaveText(/^(Open to work|Limited availability|Not available)$/);

    const cards = page.getByRole('region', { name: 'Top achievements' }).getByRole('listitem');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(xpRules.speedrun.achievements);
    for (const card of await cards.all()) {
      await expect(card.locator('.achievement-value')).toHaveText(/\d/);
      await expect(card.locator('.achievement-label')).not.toBeEmpty();
      await expect(card.getByRole('link')).toHaveAttribute('href', /^\/portfolio-app\/projects\/[a-z0-9-]+\/$/);
    }

    const next = page.getByRole('region', { name: 'Next step' });
    await expect(next.getByRole('link', { name: 'Email me' })).toHaveAttribute('href', `mailto:${siteConfig.email}`);
    await expect(next.getByRole('link', { name: 'Full portfolio' })).toHaveAttribute('href', '/portfolio-app/');
    expect(errors).toEqual([]);
  });

  test('is reachable from the header nav and the hero CTA', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('./');
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Speedrun' }).click();
    await expect(page).toHaveURL(/\/portfolio-app\/speedrun\/$/);
    await page.goto('./');
    await page.getByRole('link', { name: '60s recruiter view' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(SITE_NAME);
    await expect(page).toHaveURL(/\/portfolio-app\/speedrun\/$/);
  });

  // Countdown math (incl. "GG" at zero) is unit-tested in countdown-clock.test.ts; here: real ticking.
  test('countdown is decorative and ticks down in real time', async ({ page }) => {
    await page.goto('./speedrun/');
    await expect(clock(page)).toHaveAttribute('aria-hidden', 'true');
    await expect(clock(page)).toHaveAttribute('data-state', 'running');
    await expect(clock(page)).toHaveText(/^00:5[6-8]$/, { timeout: 5_000 });
    await expect(page.getByRole('region', { name: 'Top achievements' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Email me' })).toBeVisible();
  });

  test('soft navigation away and back restarts the countdown without errors', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto('./speedrun/');
    await expect(clock(page)).toHaveText(/^00:5[0-8]$/, { timeout: 5_000 });
    await page.getByRole('link', { name: 'Full portfolio' }).click();
    await expect(page).toHaveURL(/\/portfolio-app\/$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/speedrun\/$/);
    await expect(clock(page)).toHaveAttribute('data-state', 'running');
    await expect(clock(page)).toHaveText(/^(01:00|00:59)$/);
    expect(errors).toEqual([]);
  });
});

test.describe('speedrun with reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('the countdown stays static', async ({ page }) => {
    await page.goto('./speedrun/');
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', '');
    await page.waitForTimeout(2_500); // longer than two ticks: a running clock would have changed
    await expect(clock(page)).toHaveText('01:00');
    await expect(clock(page)).not.toHaveAttribute('data-state', /.*/);
  });
});
