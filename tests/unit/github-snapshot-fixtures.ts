// Normalized-snapshot builders for classifier/gear tests: synthetic profiles of each domain class.
import { skillNodes } from '../../src/data/skills-data.ts';
import type { GithubSnapshot, SnapshotRepo } from '../../src/utils/github-character/github-snapshot-types.ts';

export const AS_OF = '2026-10-12';
const KIB = 1024;

export function repo(overrides: Partial<SnapshotRepo> & { name: string }): SnapshotRepo {
  return {
    url: `https://github.com/example-user/${overrides.name}`,
    description: null,
    homepage: null,
    createdWeek: '2026-01-05',
    pushedWeek: '2026-09-07',
    isArchived: false,
    stars: 0,
    primaryLanguage: null,
    languages: [],
    topics: [],
    license: null,
    rootEntries: ['README.md', 'src'],
    githubEntries: [],
    workflowFiles: [],
    commits: 10,
    ...overrides,
  };
}

/** Single-language repo shorthand: `lang('api', 'C#', 50)` = 50 KiB of Go. */
export function lang(name: string, language: string, kib = 20, overrides: Partial<SnapshotRepo> = {}): SnapshotRepo {
  return repo({ name, primaryLanguage: language, languages: [{ name: language, bytes: kib * KIB }], ...overrides });
}

export function snapshot(repos: SnapshotRepo[], asOf = AS_OF): GithubSnapshot {
  return {
    schemaVersion: 1,
    login: 'example-user',
    asOf,
    accountCreated: '2019-11-24',
    pinned: [],
    repos,
    activity: { weeks: [], totals: { commits: 0, pullRequests: 0, reviews: 0, issues: 0 } },
  };
}

/**
 * A repo that proves exactly one skill, built from that skill's own `match` (file, keyword, language,
 * workflow in that order) so tests never hardcode per-skill strings. Names must not contain skill keywords.
 */
export function provingRepo(name: string, skillId: string, overrides: Partial<SnapshotRepo> = {}): SnapshotRepo {
  const match = skillNodes.find((node) => node.id === skillId)?.match;
  if (!match) throw new Error(`skill ${skillId} has no match rule`);
  const [file] = match.files ?? [];
  const [keyword] = match.keywords ?? [];
  const [language] = match.languages ?? [];
  if (file) return repo({ name, rootEntries: ['README.md', file], ...overrides });
  if (keyword) return repo({ name, description: `${keyword} sample`, ...overrides });
  if (language) return lang(name, language, 20, overrides);
  if (match.workflows) return repo({ name, githubEntries: ['workflows'], workflowFiles: ['ci.yml'], ...overrides });
  throw new Error(`skill ${skillId} has an empty match rule`);
}

/** Backend work: two C# repos and one Java repo (Spring files). Expected Warrior · Knight. */
export const pureBackend = () => snapshot([
  provingRepo('alpha', 'csharp'), provingRepo('beta', 'csharp'), provingRepo('gamma', 'java'),
]);

/** Frontend work: Astro, React, HTML. Expected Archer · Ranger. */
export const pureFrontend = () => snapshot([
  provingRepo('alpha', 'astro'), provingRepo('beta', 'react'), provingRepo('gamma', 'html'),
]);

/** Automation work: Jenkins, Actions, Docker, Playwright. Expected Mage · Enchanter. */
export const pureDevops = () => snapshot([
  provingRepo('alpha', 'jenkins'), provingRepo('beta', 'github-actions'), provingRepo('gamma', 'docker'),
  provingRepo('delta', 'playwright'),
]);

/** Notebooks + Python: data work no skill votes for. Expected Adventurer. */
export const dataOnly = () => snapshot([
  lang('ml-course', 'Jupyter Notebook', 900), lang('stats-notes', 'Jupyter Notebook', 300),
  lang('pandas-tools', 'Python', 80, { description: 'data analysis helpers' }),
]);

/** Older C#/Java backend work + a recent Astro site with a deploy workflow (hybrid, no named owner). */
export const hybridStack = () => snapshot([
  lang('alpha', 'C#', 7, { pushedWeek: '2023-07-17', commits: 4 }),
  lang('beta', 'C#', 4, { pushedWeek: '2023-08-14', commits: 2 }),
  repo({ name: 'gamma', pushedWeek: '2024-06-24', description: 'Spring sample service', commits: 1,
    languages: [{ name: 'Java', bytes: 1024 }], primaryLanguage: 'Java', rootEntries: ['README.md', 'pom.xml'] }),
  repo({ name: 'delta', primaryLanguage: 'TypeScript', pushedWeek: AS_OF, commits: 18,
    languages: [{ name: 'TypeScript', bytes: 163 * KIB }, { name: 'Astro', bytes: 76 * KIB }],
    rootEntries: ['README.md', 'docs', 'src', 'astro.config.mjs'], githubEntries: ['workflows'], workflowFiles: ['deploy.yml'] }),
  lang('epsilon', 'HTML', 22, { pushedWeek: '2023-06-12', commits: 5 }),
]);

/** One tiny repo: not enough evidence for a class. */
export const sparse = () => snapshot([provingRepo('hello', 'csharp')]);
