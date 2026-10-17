// Pure: raw GraphQL data -> normalized snapshot. Only stable, public, week-granular fields survive,
// so weekly re-runs without real changes produce byte-identical JSON.
import { weekStartUtc } from '../career-rpg/consistency-streak.ts';
import type { GithubSnapshot, RawGithubData, RawRepo, SnapshotRepo } from './github-snapshot-types.ts';

export const DESCRIPTION_MAX = 200;
export const ROOT_ENTRIES_MAX = 60;
export const DIR_ENTRIES_MAX = 100;

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const weekOf = (timestamp: string) => isoDate(weekStartUtc(new Date(timestamp)));
// Code-unit compare (not localeCompare): ICU collation can differ across Node versions -> spurious diffs.
const compare = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const byName = (a: string, b: string) => compare(a.toLowerCase(), b.toLowerCase()) || compare(a, b);
const names = (tree: { entries: { name: string }[] } | null, max = Infinity) =>
  (tree?.entries ?? []).map((entry) => entry.name).sort(byName).slice(0, max);

/** https only (values end up in href attributes); anything else becomes null. */
export function httpsOrNull(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function cleanDescription(value: string | null): string | null {
  const text = value?.replace(/\s+/g, ' ').trim() ?? '';
  if (!text) return null;
  const chars = Array.from(text); // code points: never split a surrogate pair
  return chars.length > DESCRIPTION_MAX ? `${chars.slice(0, DESCRIPTION_MAX - 1).join('').trimEnd()}…` : text;
}

function normalizeRepo(repo: RawRepo, commits: number): SnapshotRepo {
  const languages = (repo.languages?.edges ?? [])
    .map((edge) => ({ name: edge.node.name, bytes: edge.size }))
    .filter((language) => language.bytes > 0)
    .sort((a, b) => b.bytes - a.bytes || byName(a.name, b.name));
  const spdx = repo.licenseInfo?.spdxId;
  return {
    name: repo.name,
    url: httpsOrNull(repo.url) as string, // filtered in normalizeSnapshot
    description: cleanDescription(repo.description),
    homepage: httpsOrNull(repo.homepageUrl),
    createdWeek: weekOf(repo.createdAt),
    pushedWeek: weekOf(repo.pushedAt ?? repo.createdAt),
    isArchived: repo.isArchived,
    stars: repo.stargazerCount,
    primaryLanguage: repo.primaryLanguage?.name ?? null,
    languages,
    topics: repo.repositoryTopics.nodes.map((node) => node.topic.name).sort(byName),
    license: spdx && spdx !== 'NOASSERTION' ? spdx : null,
    rootEntries: names(repo.root, ROOT_ENTRIES_MAX),
    githubEntries: names(repo.dotGithub, DIR_ENTRIES_MAX),
    workflowFiles: names(repo.workflows, DIR_ENTRIES_MAX),
    commits,
  };
}

export function normalizeSnapshot(raw: RawGithubData, fetchedAt: Date): GithubSnapshot {
  const login = raw.login;
  // Defense in depth: the query asks for public non-forks only; filter again anyway.
  const publicRepos = raw.repos.filter((repo) => !repo.isPrivate && !repo.isFork && httpsOrNull(repo.url) !== null);
  const publicNames = new Set(publicRepos.map((repo) => repo.name.toLowerCase()));

  const commitsByRepo = new Map<string, number>();
  const days = new Map<string, number>();
  const totals = { commits: 0, pullRequests: 0, reviews: 0, issues: 0 };
  for (const window of raw.contributions) {
    totals.commits += window.totalCommitContributions;
    totals.pullRequests += window.totalPullRequestContributions;
    totals.reviews += window.totalPullRequestReviewContributions;
    totals.issues += window.totalIssueContributions;
    for (const entry of window.commitContributionsByRepository) {
      const [owner, name = ''] = entry.repository.nameWithOwner.toLowerCase().split('/');
      if (entry.repository.isPrivate || owner !== login.toLowerCase() || !publicNames.has(name)) continue;
      commitsByRepo.set(name, (commitsByRepo.get(name) ?? 0) + entry.contributions.totalCount);
    }
    // Windows are contiguous whole UTC days (fetch-github-data.ts), so a day appears in one window only.
    for (const week of window.contributionCalendar.weeks) {
      for (const day of week.contributionDays) days.set(day.date, (days.get(day.date) ?? 0) + day.contributionCount);
    }
  }

  const weekCounts = new Map<string, number>();
  for (const [date, count] of days) {
    if (count <= 0) continue;
    const week = weekOf(`${date}T00:00:00Z`);
    weekCounts.set(week, (weekCounts.get(week) ?? 0) + count);
  }

  return {
    schemaVersion: 1,
    login,
    asOf: isoDate(weekStartUtc(fetchedAt)),
    accountCreated: raw.createdAt.slice(0, 10),
    pinned: raw.pinned
      .filter((pin) => !pin.isPrivate && pin.owner.login.toLowerCase() === login.toLowerCase() && publicNames.has(pin.name.toLowerCase()))
      .map((pin) => pin.name),
    repos: publicRepos
      .map((repo) => normalizeRepo(repo, commitsByRepo.get(repo.name.toLowerCase()) ?? 0))
      .sort((a, b) => byName(a.name, b.name)),
    activity: {
      weeks: [...weekCounts].sort(([a], [b]) => (a < b ? -1 : 1)).map(([start, count]) => ({ start, count })),
      totals,
    },
  };
}

/** Stable text form: fixed key order (object literal order above), 2-space indent, trailing newline. */
export function serializeSnapshot(snapshot: GithubSnapshot): string {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}
