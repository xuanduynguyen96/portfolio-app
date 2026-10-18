import { expect, type Locator, type Page } from '@playwright/test';
import { avatarFrameGrid } from '../../src/utils/avatar/avatar-svg-markup.ts';
import { avatarPaths } from '../../src/utils/avatar/avatar-svg-paths.ts';
import { lookTitle } from '../../src/utils/avatar/class-labels.ts';
import { allClassLooks, defaultLook, lookProfile, type ClassLook } from '../../src/utils/avatar/class-looks.ts';
import { classifyCharacter } from '../../src/utils/github-character/classify-character.ts';
import { SNAPSHOT } from './career-mirror';

// Expectations come from the same pure modules over the committed snapshot, never hardcoded names:
// a snapshot refresh changes the GitHub pick and the gear tiers, and these tests must not care.
export const character = classifyCharacter(SNAPSHOT);
export const pick = defaultLook(character);
export const pickTitle = lookTitle(pick);
export const LOOKS = allClassLooks();
export const STORAGE_KEY = 'portfolio-look';
export const HERO = '.hero';
export const SHEET = '#character .portrait';

export const root = (page: Page) => page.locator('[data-look]');
export const status = (page: Page) => page.locator('[data-look-status]');
export const classRadio = (page: Page, classId: string) => root(page).locator(`input[name="switcher-class"][value="${classId}"]`);
export const jobRadio = (page: Page, classId: string, motif: string) => root(page).locator(`input[name="switcher-job-${classId}"][value="${motif}"]`);
export const resetButton = (page: Page) => page.getByRole('button', { name: 'Reset to GitHub pick' });

/** Loads home, waits for the control to bind and opens it. */
export async function openSwitcher(page: Page): Promise<void> {
  await page.goto('./');
  await closedSwitcherReady(page);
  await root(page).locator('summary').click();
  await expect(root(page)).toHaveAttribute('open', '');
}

export async function closedSwitcherReady(page: Page): Promise<void> {
  await expect(page.locator('[data-look][data-ready]')).toBeAttached();
  await page.locator('#character').scrollIntoViewIfNeeded();
}

export async function chooseLook(page: Page, look: ClassLook): Promise<void> {
  await classRadio(page, look.classId).check();
  if (look.motif) await jobRadio(page, look.classId, look.motif).check();
}

export interface SvgState {
  title: string;
  desc: string;
  frames: { a: { d: string; fill: string }[]; b: { d: string; fill: string }[] };
}

/** What a rendered avatar contains: accessible text and every frame path with its fill. */
export function svgState(scope: Locator): Promise<SvgState> {
  return scope.locator('svg.character-avatar').evaluate((svg) => {
    const read = (cls: string) => [...svg.querySelectorAll(`:scope > g.${cls} > path`)].map((path) => ({
      d: path.getAttribute('d') ?? '',
      fill: (path as SVGPathElement).style.getPropertyValue('fill'),
    }));
    return {
      title: svg.querySelector(':scope > title')?.textContent ?? '',
      desc: svg.querySelector(':scope > desc')?.textContent ?? '',
      frames: { a: read('avatar-frame-a'), b: read('avatar-frame-b') },
    };
  });
}

/** The same state computed from the pure modules for `look` wearing the stat-derived gear. */
export function expectedState(look: ClassLook, animated: boolean): Pick<SvgState, 'frames'> & { title: string } {
  const profile = lookProfile(look, character.gear);
  const frame = (index: 0 | 1) => avatarPaths(avatarFrameGrid(profile, index)).map(({ d, cssVar }) => ({ d, fill: `var(${cssVar})` }));
  return { title: lookTitle(look), frames: { a: frame(0), b: animated ? frame(1) : [] } };
}
