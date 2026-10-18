// Raw GraphQL builders for snapshot tests: valid public defaults, override what a test needs.
import type { RawContributions, RawGithubData, RawRepo } from '../../src/utils/github-character/github-snapshot-types.ts';

export const LOGIN = 'example-user';

export function rawRepo(overrides: Partial<RawRepo> & { name: string }): RawRepo {
  return {
    url: `https://github.com/${LOGIN}/${overrides.name}`,
    description: null,
    homepageUrl: null,
    isArchived: false,
    isFork: false,
    isPrivate: false,
    createdAt: '2024-03-05T10:00:00Z',
    pushedAt: '2024-03-07T10:00:00Z',
    stargazerCount: 0,
    licenseInfo: null,
    primaryLanguage: { name: 'TypeScript' },
    repositoryTopics: { nodes: [] },
    languages: { edges: [{ size: 4096, node: { name: 'TypeScript' } }] },
    root: { entries: [{ name: 'README.md' }, { name: 'src' }] },
    dotGithub: null,
    workflows: null,
    ...overrides,
  };
}

/** Days as [date, count]; GitHub calendar weeks start on Sunday. */
export function rawWindow(days: [string, number][], byRepo: [string, number, boolean?][] = []): RawContributions {
  return {
    totalCommitContributions: byRepo.reduce((sum, [, count]) => sum + count, 0),
    totalPullRequestContributions: 1,
    totalIssueContributions: 2,
    totalPullRequestReviewContributions: 3,
    contributionCalendar: { weeks: [{ contributionDays: days.map(([date, contributionCount]) => ({ date, contributionCount })) }] },
    commitContributionsByRepository: byRepo.map(([nameWithOwner, totalCount, isPrivate = false]) => ({
      repository: { nameWithOwner, isPrivate },
      contributions: { totalCount },
    })),
  };
}

/** Owner-like account: one private repo, one fork, an empty repo, a notebook repo, odd metadata. */
export function ownerLikeRaw(): RawGithubData {
  return {
    login: LOGIN,
    createdAt: '2019-11-24T09:52:26Z',
    pinned: [
      { name: 'web-app', isPrivate: false, owner: { login: LOGIN } },
      { name: 'secret-app', isPrivate: true, owner: { login: LOGIN } },
      { name: 'Data-Notebooks', isPrivate: false, owner: { login: 'some-org' } },
    ],
    repos: [
      rawRepo({
        name: 'web-app',
        description: '  My   portfolio\nsite  ',
        homepageUrl: 'https://example.dev/',
        pushedAt: '2026-10-14T08:00:00Z',
        licenseInfo: { spdxId: 'MIT' },
        repositoryTopics: { nodes: [{ topic: { name: 'web' } }, { topic: { name: 'astro' } }] },
        languages: { edges: [{ size: 2047, node: { name: 'CSS' } }, { size: 10_240, node: { name: 'TypeScript' } }, { size: 1023, node: { name: 'Shell' } }] },
        dotGithub: { entries: [{ name: 'workflows' }, { name: 'dependabot.yml' }] },
        workflows: { entries: [{ name: 'deploy.yml' }, { name: 'codeql.yml' }] },
      }),
      rawRepo({ name: 'secret-app', isPrivate: true, description: 'private plans' }),
      rawRepo({ name: 'forked-lib', isFork: true }),
      rawRepo({ name: 'empty_repo', primaryLanguage: null, languages: null, root: null, pushedAt: null, licenseInfo: { spdxId: 'NOASSERTION' } }),
      rawRepo({
        name: 'Data-Notebooks',
        homepageUrl: 'http://insecure.example.dev',
        description: 'x'.repeat(300),
        isArchived: true,
        primaryLanguage: { name: 'Jupyter Notebook' },
        languages: { edges: [{ size: 900_000, node: { name: 'Jupyter Notebook' } }, { size: 5000, node: { name: 'Python' } }] },
      }),
    ],
    contributions: [
      // Newest window first, as fetched. 2026-10-11 is a Sunday: belongs to the ISO week of 2026-10-05.
      rawWindow([['2026-10-11', 2], ['2026-10-12', 3], ['2026-10-17', 1], ['2025-10-18', 4]], [
        [`${LOGIN}/web-app`, 5], [`${LOGIN}/secret-app`, 7, true], ['someone-else/web-app', 9], [`${LOGIN}/Data-Notebooks`, 1],
      ]),
      // Older contiguous window.
      rawWindow([['2025-10-17', 0], ['2024-01-01', 0], ['2024-01-02', 6]], [[`${LOGIN}/web-app`, 2], [`${LOGIN}/forked-lib`, 3]]),
    ],
  };
}
