import { expect, test } from '@playwright/test';
import { PROJECTS, SITE_NAME, trackPageErrors } from './test-helpers';

// One page per quest repo (mirrored from the snapshot + override files, see career-mirror.ts).
for (const project of PROJECTS) {
  test(`project detail renders for ${project.slug}`, async ({ page }) => {
    const errors = trackPageErrors(page);
    await page.goto(`./projects/${project.slug}/`);

    await expect(page).toHaveTitle(`${project.title} | ${SITE_NAME}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(project.title);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);

    // Summary is both the visible lede and the meta description.
    const summary = page.locator('.project-summary');
    await expect(summary).not.toBeEmpty();
    const summaryText = (await summary.textContent())?.trim() ?? '';
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', summaryText);
    // Tags come from languages/topics; a repo with neither renders no (empty) list.
    const tags = page.getByRole('list', { name: 'Technologies' }).getByRole('listitem');
    for (const tag of await tags.all()) await expect(tag).not.toBeEmpty();

    // Quest panel: boss vs regular heading, tier badge, XP with its basis.
    const heading = project.isBoss ? 'Boss Battle' : 'Quest Log';
    const panel = page.getByRole('region', { name: heading });
    await expect(panel.getByRole('heading', { level: 2 })).toHaveText(heading);
    await expect(panel.locator('.quest-badge')).toHaveText(project.isBoss ? /^Boss · / : /^(Side quest|Main quest|Raid)$/);
    await expect(panel.locator('.quest-xp')).toHaveText(/^\+\d+ XP earned · .+$/);
    const evidence = panel.getByRole('list', { name: 'Evidence' }).getByRole('link');
    await expect(evidence.first()).toHaveAttribute('href', new RegExp(`^https://github\\.com/[\\w-]+/${project.repo}$`));
    await expect(evidence.first()).toHaveAttribute('rel', 'noopener noreferrer');

    // Body: the written case study, or repo facts when there is none.
    const prose = page.locator('.prose');
    if (project.hasCaseStudy) await expect(prose.getByRole('heading', { level: 2, name: 'Overview' })).toBeVisible();
    else await expect(prose.getByRole('heading', { level: 2, name: 'About this repo' })).toBeVisible();

    // Repo link is external + safe; back link keeps the base path.
    const repo = page.getByRole('link', { name: /View code/ });
    await expect(repo).toHaveAttribute('href', /^https:\/\/github\.com\//);
    await expect(repo).toHaveAttribute('target', '_blank');
    await expect(repo).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(page.getByRole('link', { name: '← All projects' })).toHaveAttribute('href', '/portfolio-app/#projects');

    expect(errors).toEqual([]);
  });
}

test.describe('keyboard focus visibility', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('every element reached by Tab shows a visible focus indicator', async ({ page }) => {
    await page.goto('./');
    const seen = new Set<string>();

    // Header logo/nav, hero CTAs and first section links: 10 Tab stops is enough to cover several component types.
    for (let stop = 0; stop < 10; stop += 1) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        const style = getComputedStyle(el);
        return {
          label: `${el.tagName.toLowerCase()}:${(el.textContent ?? '').trim().slice(0, 30)}`,
          outlineStyle: style.outlineStyle,
          outlineWidth: parseFloat(style.outlineWidth),
          outlineColor: style.outlineColor,
        };
      });
      expect(info.outlineStyle, `${info.label} outline-style`).not.toBe('none');
      expect(info.outlineWidth, `${info.label} outline-width`).toBeGreaterThanOrEqual(2);
      expect(info.outlineColor, `${info.label} outline-color`).not.toBe('rgba(0, 0, 0, 0)');
      // Focus scroll may be smooth (animated), so wait for the focused element to settle in view.
      await expect(page.locator(':focus')).toBeInViewport();
      seen.add(info.label);
    }

    expect(seen.size).toBeGreaterThanOrEqual(8); // focus actually moved between distinct controls
  });
});
