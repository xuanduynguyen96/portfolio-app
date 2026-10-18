import { expect, test, type Page } from '@playwright/test';
import { classRadio, closedSwitcherReady, jobRadio, root, status, HERO, LOOKS, pick, STORAGE_KEY } from './switcher-helpers';
import { lookTitle } from '../../src/utils/avatar/class-labels.ts';
import { BOSS, SITE_NAME, expectAllRevealsVisible, expectHeroVisible, trackPageErrors } from './test-helpers';

const PROJECT_TITLE = BOSS.title;
// Skill tree "Proven in" links share the title, so target the project card link.
const projectLink = (page: Page) => page.locator('#projects').getByRole('link', { name: PROJECT_TITLE, exact: true });

test('animations re-initialise cleanly across ClientRouter navigations', async ({ page }) => {
  const errors = trackPageErrors(page);
  await page.goto('./');
  await expectHeroVisible(page);
  // Survives only soft (ClientRouter) navigations; a hard reload would reset it.
  await page.evaluate(() => Object.assign(window, { __softNavMarker: true }));
  const isSameDocument = () => page.evaluate(() => '__softNavMarker' in window);

  for (let round = 1; round <= 3; round += 1) {
    await projectLink(page).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${BOSS.slug}/$`));
    await expect(page.getByRole('heading', { level: 1, name: PROJECT_TITLE })).toBeVisible();
    expect(await isSameDocument()).toBe(true);
    // Animation module re-ran and flagged itself ready after the swap.
    await expect(page.locator('html')).toHaveAttribute('data-motion-ready', '');

    await page.getByRole('link', { name: '← All projects' }).click();
    await expect(page).toHaveURL(/\/portfolio-app\/#projects$/);
    expect(await isSameDocument()).toBe(true);
    await expectHeroVisible(page);
    await expectAllRevealsVisible(page);
    // SplitText must not duplicate text across re-inits.
    await expect(page.locator('[data-hero-title]')).toHaveText(SITE_NAME);
  }

  expect(errors).toEqual([]);
});

test('browser back/forward keeps content visible', async ({ page }) => {
  await page.goto('./');
  await expectHeroVisible(page);
  await projectLink(page).click();
  await expect(page.getByRole('heading', { level: 1, name: PROJECT_TITLE })).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/portfolio-app\/$/);
  await expectHeroVisible(page);
  await expectAllRevealsVisible(page);

  await page.goForward();
  await expect(page.getByRole('heading', { level: 1, name: PROJECT_TITLE })).toBeVisible();
});

test('mobile menu still works after a soft navigation', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto(`./projects/${BOSS.slug}/`);
  await page.getByRole('link', { name: '← All projects' }).click();
  await expect(page).toHaveURL(/#projects$/);

  const toggle = page.getByRole('button', { name: 'Menu' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible();
});

test('class/job switcher re-binds across soft navigations and keeps the saved look', async ({ page }) => {
  const errors = trackPageErrors(page);
  const other = LOOKS.find((look) => look.classId !== pick.classId && look.motif !== null)!;
  await page.goto('./');
  await closedSwitcherReady(page);
  await root(page).locator('summary').click();
  await classRadio(page, other.classId).check();
  await jobRadio(page, other.classId, other.motif!).check();
  await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(lookTitle(other));
  await page.evaluate(() => Object.assign(window, { __softNavMarker: true }));

  for (let round = 1; round <= 3; round += 1) {
    await projectLink(page).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${BOSS.slug}/$`));
    await page.getByRole('link', { name: '← All projects' }).click();
    await expect(page).toHaveURL(/\/portfolio-app\/#projects$/);
    expect(await page.evaluate(() => '__softNavMarker' in window)).toBe(true);
    // New DOM: control bound again, saved look applied, no stale or duplicated listeners.
    await expect(page.locator('[data-look][data-ready]')).toBeAttached();
    await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(lookTitle(other));
    await expect(status(page)).toHaveText('');
    await page.evaluate(() => {
      const el = document.querySelector('[data-look-status]')!;
      (window as unknown as { __log: string[] }).__log = [];
      new MutationObserver(() => (window as unknown as { __log: string[] }).__log.push(el.textContent ?? '')).observe(el, { childList: true, characterData: true, subtree: true });
    });
    await root(page).locator('summary').click();
    await expect(classRadio(page, other.classId)).toBeChecked(); // radios are built on open from the saved look
    await classRadio(page, pick.classId).check();
    await expect(status(page)).toContainText('Showing');
    expect(await page.evaluate(() => (window as unknown as { __log: string[] }).__log.length)).toBe(1);
    await classRadio(page, other.classId).check();
    await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(lookTitle(other));
    await jobRadio(page, other.classId, other.motif!).check();
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).not.toBeNull();
  }

  await page.goBack();
  await page.goForward();
  await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(lookTitle(other));
  expect(errors).toEqual([]);
});
