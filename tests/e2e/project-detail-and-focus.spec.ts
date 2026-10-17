import { expect, test } from '@playwright/test';
import { SITE_NAME, trackPageErrors } from './test-helpers';

// Mirrors the real markdown frontmatter in src/content/projects/*.md.
const PROJECTS = [
  {
    slug: 'neon-dashboard',
    title: 'Neon Analytics Dashboard',
    tags: ['TypeScript', 'Astro', 'GSAP', 'D3'],
    coverAlt: /dark dashboard layout/i,
  },
  {
    slug: 'realtime-chat',
    title: 'Realtime Chat',
    tags: ['Node.js', 'WebSockets', 'TypeScript'],
    coverAlt: /chat bubbles/i,
  },
  {
    slug: 'cli-toolkit',
    title: 'Developer CLI Toolkit',
    tags: ['CLI', 'Node.js', 'DX'],
    coverAlt: /terminal window/i,
  },
];

for (const project of PROJECTS) {
  test(`project detail renders full content for ${project.slug}`, async ({ page }) => {
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

    const tags = page.getByRole('list', { name: 'Technologies' }).getByRole('listitem');
    await expect(tags).toHaveText(project.tags);

    // Cover image: alt text present and the image actually decoded.
    const cover = page.locator('img.project-cover');
    await expect(cover).toHaveAttribute('alt', project.coverAlt);
    await expect.poll(() => cover.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

    // Markdown body rendered.
    await expect(page.locator('.prose').getByRole('heading', { level: 2, name: 'Overview' })).toBeVisible();
    await expect(page.locator('.prose').getByRole('heading', { level: 2, name: 'Highlights' })).toBeVisible();
    expect(await page.locator('.prose li').count()).toBeGreaterThan(0);

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
