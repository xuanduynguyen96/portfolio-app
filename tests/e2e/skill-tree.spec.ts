import { expect, test, type Page } from '@playwright/test';
import { skillNodes } from '../../src/data/skills-data';
import { xpRules } from '../../src/data/xp-rules';

const maxLevel = xpRules.skillEvidence.levelThresholds.length;
const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nodeLabels = (page: Page) => page.locator('#skills .skill-node-label');

test.describe('skill tree', () => {
  test('renders every node as nested lists with a level in its accessible text', async ({ page }) => {
    await page.goto('./');
    await expect(nodeLabels(page)).toHaveCount(skillNodes.length);

    const roots = skillNodes.filter((node) => !node.parent);
    await expect(page.locator('#skills').getByRole('heading', { level: 3 })).toHaveCount(roots.length);
    for (const root of roots) {
      const heading = page.getByRole('heading', { level: 3, name: new RegExp(`^${escapeRegExp(root.label)}\\s*, level [0-${maxLevel}] of ${maxLevel}`) });
      await expect(heading).toBeVisible();
      const children = page.getByRole('list', { name: `${root.label} sub-skills` }).locator(':scope > li');
      await expect(children).toHaveCount(skillNodes.filter((node) => node.parent === root.id).length);
    }

    for (const label of await nodeLabels(page).allTextContents()) {
      expect(label.trim()).toMatch(new RegExp(`, level [0-${maxLevel}] of ${maxLevel}( \\(locked\\))?$`));
    }
  });

  test('locked nodes are labelled and level pips are decorative', async ({ page }) => {
    await page.goto('./');
    const unproven = skillNodes.filter((node) => node.parent && !node.evidence?.length);
    expect(unproven.length).toBeGreaterThan(0);
    await expect(page.locator('#skills .skill-node--locked').first()).toContainText('(locked)');
    const pips = page.locator('#skills .skill-pips');
    await expect(pips).toHaveCount(skillNodes.length);
    for (const group of await pips.all()) await expect(group).toHaveAttribute('aria-hidden', 'true');
  });

  test('evidence links open safely and verified quests link to their case study', async ({ page }) => {
    await page.goto('./');
    const evidence = page.locator('#skills details.skill-evidence');
    expect(await evidence.count()).toBe(skillNodes.filter((node) => node.evidence?.length).length);
    await evidence.first().locator('summary').click();
    const link = evidence.first().getByRole('link');
    await expect(link.first()).toHaveAttribute('href', /^https:\/\//);
    await expect(link.first()).toHaveAttribute('rel', 'noopener noreferrer');

    const proven = page.locator('#skills .skill-quests a').first();
    await expect(proven).toHaveAttribute('href', /^\/portfolio-app\/projects\/[a-z0-9-]+\/$/);
  });

  test('without JavaScript the full tree is present', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('./');
    await expect(nodeLabels(page)).toHaveCount(skillNodes.length);
    await context.close();
  });
});
