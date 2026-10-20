import { expect, test, type Page } from '@playwright/test';
import { CLASS_NAMES, JOBS } from '../../src/data/character-job-rules.ts';
import { gearRules } from '../../src/data/gear-rules.ts';
import { lookKey, sameLook } from '../../src/utils/avatar/class-looks.ts';
import { lookTitle } from '../../src/utils/avatar/class-labels.ts';
import { trackPageErrors } from './test-helpers';
import {
  HERO, LOOKS, SHEET, STORAGE_KEY, character, chooseLook, classRadio, closedSwitcherReady, expectedState, jobRadio, openSwitcher,
  pick, pickTitle, resetButton, root, status, svgState,
} from './switcher-helpers';

const other = LOOKS.find((look) => look.classId !== pick.classId && look.motif !== null)!;
const classRadioByName = (page: Page, name: string) => root(page).getByRole('radio', { name, exact: true });
const chunkRequests = (requests: string[]) => requests.filter((url) => url.includes('look-apply-model'));

test.describe('class/job switcher', () => {
  test('without JavaScript the control is absent and the GitHub pick shows', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('./');
    await expect(root(page)).toBeHidden();
    await expect(root(page)).not.toHaveAttribute('data-ready', '');
    await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(pickTitle);
    await expect(page.locator(`${SHEET} .nameplate-class`)).toHaveText(pickTitle);
    await context.close();
  });

  test('the look chunk loads only after the control is opened', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('./');
    await closedSwitcherReady(page);
    expect(chunkRequests(requests)).toEqual([]);
    await root(page).locator('summary').click();
    await expect.poll(() => chunkRequests(requests).length).toBe(1);
    await chooseLook(page, other);
    await expect(status(page)).toContainText('Showing');
    expect(chunkRequests(requests).length).toBe(1);
  });

  test('marks the GitHub pick and offers exactly the valid jobs per class', async ({ page }) => {
    await openSwitcher(page);
    await expect(root(page).locator('.switcher-pick')).toHaveText(`GitHub pick: ${pickTitle}`);
    await expect(classRadioByName(page, `${CLASS_NAMES[pick.classId]} GitHub pick`)).toBeChecked();
    await expect(root(page).getByRole('radio', { name: /GitHub pick/ })).toHaveCount(pick.motif ? 2 : 1);
    await expect(resetButton(page)).toBeDisabled();

    for (const classId of ['warrior', 'archer', 'mage'] as const) {
      await classRadio(page, classId).check();
      const group = root(page).locator(`[data-look-jobs="${classId}"]`);
      await expect(group).toBeVisible();
      await expect(group.locator('.switcher-label')).toHaveText(JOBS[classId].map((job) => new RegExp(`^${job.name}`)));
      await expect(group.locator('.switcher-hint')).toHaveText(JOBS[classId].map((job) => job.specialty));
    }
    await classRadio(page, 'adventurer').check();
    await expect(root(page).locator('[data-look-jobs="adventurer"]')).toBeVisible();
    await expect(root(page).locator('input[name^="switcher-job-"]:visible')).toHaveCount(0);
  });

  test('changing class keeps the job slot (prop); arrow keys move the selection', async ({ page }) => {
    await openSwitcher(page);
    await chooseLook(page, { classId: 'warrior', motif: 'banner' });
    await classRadio(page, 'mage').check();
    await expect(jobRadio(page, 'mage', 'banner')).toBeChecked();
    await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(lookTitle({ classId: 'mage', motif: 'banner' }));

    await classRadio(page, 'warrior').focus();
    await page.keyboard.press('ArrowDown');
    await expect(classRadio(page, 'archer')).toBeChecked();
    await expect(status(page)).toContainText(lookTitle({ classId: 'archer', motif: 'banner' }));
  });

  test('all 10 looks: hero + sheet names, accessible names, status and pixels match the pure modules', async ({ page }) => {
    await openSwitcher(page);
    // Re-selecting the checked look fires no change event (no status): start from a look that is not first.
    await chooseLook(page, LOOKS[LOOKS.length - 1]);
    for (const look of LOOKS) {
      await chooseLook(page, look);
      const title = lookTitle(look);
      await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(title);
      await expect(page.locator(`${SHEET} .nameplate-class`)).toHaveText(title);
      await expect(page.locator(HERO).getByRole('img', { name: title, exact: true })).toBeVisible();
      await expect(page.locator(SHEET).getByRole('img', { name: title, exact: true })).toBeVisible();
      await expect(status(page)).toContainText(sameLook(look, pick) ? `Showing the GitHub pick: ${title}.` : `Showing ${title}. Your GitHub pick is ${pickTitle}.`);

      const hero = await svgState(page.locator(HERO));
      const sheet = await svgState(page.locator(SHEET));
      expect({ title: hero.title, frames: hero.frames }, lookKey(look)).toEqual(expectedState(look, true));
      expect({ title: sheet.title, frames: sheet.frames }, lookKey(look)).toEqual(expectedState(look, false));
      expect(sheet.desc).toBe(hero.desc);
      // Gear is earned from the GitHub stats on every look: the description lists the stat-derived tiers.
      for (const { slot, tier } of character.gear) {
        const rule = gearRules.find((r) => r.slot === slot)!;
        expect(hero.desc, `${lookKey(look)} ${slot}`).toContain(`${rule.label} tier ${tier} of ${rule.thresholds.length}`);
      }
    }
  });

  test('gear legend and "why" panel keep describing the GitHub-derived character', async ({ page }) => {
    await openSwitcher(page);
    const legend = await page.locator(`${SHEET} .gear-row`).allInnerTexts();
    const why = await page.locator(`${SHEET} details.why summary`).innerText();
    await chooseLook(page, other);
    await expect(page.locator(`${SHEET} .nameplate-class`)).toHaveText(lookTitle(other));
    expect(await page.locator(`${SHEET} .gear-row`).allInnerTexts()).toEqual(legend);
    expect(await page.locator(`${SHEET} details.why summary`).innerText()).toBe(why);
  });

  test('Reset returns to the GitHub pick, restores the server render and moves focus', async ({ page }) => {
    await openSwitcher(page);
    const before = { hero: await svgState(page.locator(HERO)), sheet: await svgState(page.locator(SHEET)) };
    await chooseLook(page, other);
    await expect(resetButton(page)).toBeEnabled();
    await resetButton(page).click();
    await expect(status(page)).toHaveText(`Showing the GitHub pick: ${pickTitle}.`);
    expect(await svgState(page.locator(HERO))).toEqual(before.hero);
    expect(await svgState(page.locator(SHEET))).toEqual(before.sheet);
    await expect(resetButton(page)).toBeDisabled();
    await expect(classRadio(page, pick.classId)).toBeFocused();
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
  });

  test('one live-region update per change, none for a silent restore', async ({ page }) => {
    await openSwitcher(page);
    await page.evaluate(() => {
      const el = document.querySelector('[data-look-status]')!;
      (window as unknown as { __statusLog: string[] }).__statusLog = [];
      new MutationObserver(() => (window as unknown as { __statusLog: string[] }).__statusLog.push(el.textContent ?? '')).observe(el, { childList: true, characterData: true, subtree: true });
    });
    await expect(root(page).locator('[role="status"]')).toHaveCount(1);
    await classRadio(page, other.classId).check(); // one change event
    await expect(status(page)).toContainText('Showing');
    const log = await page.evaluate(() => (window as unknown as { __statusLog: string[] }).__statusLog);
    expect(log).toHaveLength(1);
    await chooseLook(page, other);

    await page.reload();
    await closedSwitcherReady(page);
    await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(lookTitle(other));
    await expect(status(page)).toHaveText('');
  });

  test('the choice is saved, restored on reload and cleared by choosing the pick', async ({ page }) => {
    const errors = trackPageErrors(page);
    await openSwitcher(page);
    await chooseLook(page, other);
    await expect(status(page)).toContainText('Showing');
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBe(lookKey(other));

    await page.reload();
    await closedSwitcherReady(page);
    await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(lookTitle(other));
    await expect(page.locator(`${SHEET} .nameplate-class`)).toHaveText(lookTitle(other));
    expect(await svgState(page.locator(HERO))).toMatchObject(expectedState(other, true));
    await root(page).locator('summary').click();
    await expect(classRadio(page, other.classId)).toBeChecked();

    await chooseLook(page, pick);
    await expect(status(page)).toContainText('GitHub pick');
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
    expect(errors).toEqual([]);
  });

  test('an invalid stored value is ignored and removed; unrelated keys stay', async ({ page }) => {
    await page.addInitScript(([key]) => { localStorage.setItem(key, 'warrior/<img src=x>'); localStorage.setItem('unrelated', 'keep'); }, [STORAGE_KEY]);
    await page.goto('./');
    await closedSwitcherReady(page);
    expect(await page.evaluate(() => localStorage.getItem('unrelated'))).toBe('keep');
    await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(pickTitle);
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
  });

  test('a key saved by an older version (class/archetype motif) is ignored and removed', async ({ page }) => {
    await page.addInitScript(([key]) => localStorage.setItem(key, 'mage/data'), [STORAGE_KEY]);
    await page.goto('./');
    await closedSwitcherReady(page);
    await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(pickTitle);
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
  });

  test('blocked storage: switching still works for the page, no errors', async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
    });
    await openSwitcher(page);
    await chooseLook(page, other);
    await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(lookTitle(other));
    expect(errors).toEqual([]);
  });

  test('speedrun and credits keep showing the GitHub pick', async ({ page }) => {
    await openSwitcher(page);
    await chooseLook(page, other);
    await expect(status(page)).toContainText('Showing');
    await page.goto('./speedrun/');
    await expect(page.getByRole('img', { name: pickTitle, exact: true })).toBeVisible();
    await expect(page.locator('.speedrun-class')).toHaveText(pickTitle);
    await expect(page.locator('[data-look-avatar]')).toHaveCount(0);
  });

  test('a failed chunk load reverts the controls, keeps the page intact and says so', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('**/look-apply-model*.js', (route) => route.abort());
    await openSwitcher(page);
    await classRadio(page, other.classId).click();
    await expect(status(page)).toHaveText("Couldn't switch class. Showing the GitHub pick.");
    await expect(classRadio(page, pick.classId)).toBeChecked();
    await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(pickTitle);
    expect(await page.evaluate((key) => localStorage.getItem(key), STORAGE_KEY)).toBeNull();
    // The browser caches a failed module import: the control fails fast (no retry) until a reload.
    await page.unroute('**/look-apply-model*.js');
    await classRadio(page, other.classId).click();
    await expect(status(page)).toHaveText("Couldn't switch class. Showing the GitHub pick.");
    await page.reload();
    await openSwitcher(page);
    await chooseLook(page, other);
    await expect(page.locator(`${HERO} .nameplate-class`)).toHaveText(lookTitle(other));
    expect(errors).toEqual([]);
  });
});

test('switchable targets are the hero and sheet avatars only', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('[data-look-avatar]')).toHaveCount(2);
  await expect(page.locator('[data-look-name]')).toHaveCount(2);
  await page.goto('./credits/');
  await expect(page.locator('[data-look-avatar]')).toHaveCount(0);
});
