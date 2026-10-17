// What the site must show, computed with the same pure engine from the committed snapshot and the
// override files, so e2e expectations never drift from the data (no hard-coded project lists).
import { readdirSync, readFileSync } from 'node:fs';
import type { GithubSnapshot } from '../../src/utils/github-character/github-snapshot-types.ts';
import { pickBossRepo, selectQuestRepos, toRepoSlug } from '../../src/utils/github-character/repo-quests.ts';

export const SNAPSHOT = JSON.parse(readFileSync('src/data/github/github-snapshot.json', 'utf8')) as GithubSnapshot;

const OVERRIDE_DIR = 'src/content/projects';
/** Override files: id = file name; title/isBoss/body from a minimal frontmatter read. */
export const OVERRIDES = readdirSync(OVERRIDE_DIR)
  .filter((file) => file.endsWith('.md'))
  .map((file) => {
    const text = readFileSync(`${OVERRIDE_DIR}/${file}`, 'utf8');
    const [, frontmatter = '', body = ''] = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text) ?? [];
    return {
      id: file.replace(/\.md$/, ''),
      isBoss: /^isBoss:\s*true\s*$/m.test(frontmatter),
      title: /^title:\s*(.+)$/m.exec(frontmatter)?.[1].trim(),
      hasBody: body.trim().length > 0,
    };
  });

const questRepos = selectQuestRepos(SNAPSHOT, OVERRIDES);
const bossRepo = pickBossRepo(questRepos, SNAPSHOT, OVERRIDES);

export interface ExpectedProject {
  slug: string;
  repo: string;
  title: string;
  isBoss: boolean;
  hasCaseStudy: boolean;
}

export const PROJECTS: ExpectedProject[] = questRepos.map((repo) => {
  const slug = toRepoSlug(repo.name);
  const override = OVERRIDES.find((item) => item.id === slug);
  return { slug, repo: repo.name, title: override?.title ?? repo.name, isBoss: repo === bossRepo, hasCaseStudy: override?.hasBody ?? false };
});
export const PROJECT_SLUGS = PROJECTS.map((project) => project.slug);
export const BOSS = PROJECTS.find((project) => project.isBoss) ?? PROJECTS[0];
export const BOSS_SLUG = BOSS.slug;
/** A quest without a written case study (repo facts only), if any. */
export const DERIVED_PROJECT = PROJECTS.find((project) => !project.hasCaseStudy);
