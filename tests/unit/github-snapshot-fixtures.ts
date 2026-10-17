// Normalized-snapshot builders for classifier/gear tests: synthetic profiles of each archetype.
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

/** Single-language repo shorthand: `lang('api', 'Go', 50)` = 50 KiB of Go. */
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

/** Like the owner: older C#/Java backend work + recent TS/HTML web work. */
export const ownerLike = () => snapshot([
  lang('MiniWebServer', 'C#', 7, { pushedWeek: '2023-07-17', commits: 4 }),
  lang('WeatherApp', 'C#', 4, { pushedWeek: '2023-08-14', commits: 2 }),
  lang('spring-jenkins', 'Java', 1, { pushedWeek: '2024-06-24', description: 'Sample spring boot rest api for jenkins demo', commits: 1 }),
  repo({ name: 'aspnet_framework_docker_ex', pushedWeek: '2023-02-20', description: 'Just a example asp.net MVC source code for Docker playground', commits: 0 }),
  repo({ name: 'portfolio-app', primaryLanguage: 'TypeScript', pushedWeek: AS_OF, commits: 18,
    languages: [{ name: 'TypeScript', bytes: 163 * KIB }, { name: 'Astro', bytes: 76 * KIB }, { name: 'JavaScript', bytes: 58 * KIB }],
    rootEntries: ['README.md', 'docs', 'src', 'tests'], githubEntries: ['workflows'], workflowFiles: ['deploy.yml'] }),
  lang('online-resume', 'HTML', 22, { pushedWeek: '2023-06-12', commits: 5 }),
]);

/** Notebooks + Python: a data scientist. */
export const pureMage = () => snapshot([
  lang('ml-course', 'Jupyter Notebook', 900), lang('stats-notes', 'Jupyter Notebook', 300),
  lang('pandas-tools', 'Python', 80, { description: 'data analysis helpers' }), lang('astro-ml', 'Python', 40),
]);

/** JS/TS libraries and sites. */
export const pureArcher = () => snapshot([
  lang('ui-kit', 'TypeScript', 60), lang('landing', 'HTML', 30), lang('react-hooks', 'JavaScript', 25),
  lang('ios-widget', 'Swift', 20),
]);

/** Go/Rust services. */
export const pureWarrior = () => snapshot([
  lang('api-gateway', 'Go', 120), lang('queue', 'Rust', 80), lang('billing', 'Java', 60), lang('cli', 'Go', 30),
]);

/** One tiny repo: not enough evidence for a class. */
export const sparse = () => snapshot([lang('hello', 'Go', 1)]);
