// Collects every raw page for one login: profile, public repos (paged), 1-year contribution windows.
// Requests run one at a time (GitHub asks clients not to parallelize).
import type { RawContributions, RawGithubData, RawRepo } from '../../src/utils/github-character/github-snapshot-types.ts';
import { CONTRIBUTIONS_QUERY, PROFILE_QUERY, REPOS_QUERY } from './github-graphql-queries.ts';
import { GithubGraphqlError, postGithubGraphql } from './post-github-graphql.ts';

/** 50 per page returned 502 for a large account in the spike; 25 worked. Smaller page on any non-auth failure. */
export const PAGE_SIZES = [25, 10] as const;
/** Matches the snapshot schema cap; more repos = refuse (keep the old file) rather than truncate silently. */
export const MAX_REPOS = 300;
const DAY_MS = 86_400_000;
const YEAR_DAYS = 365;

interface RepoPage {
  user: { repositories: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: RawRepo[] } };
}
interface Profile {
  user: { login: string; createdAt: string; pinnedItems: { nodes: RawGithubData['pinned'] } } | null;
}

export interface FetchResult {
  raw: RawGithubData;
  cost: number;
}

async function fetchRepoPage(token: string, login: string, after: string | null) {
  for (const first of PAGE_SIZES) {
    try {
      return await postGithubGraphql<RepoPage>(token, REPOS_QUERY, { login, first, after });
    } catch (error) {
      const isAuth = error instanceof GithubGraphqlError && error.isAuth;
      if (isAuth || first === PAGE_SIZES.at(-1)) throw error; // timeouts, 5xx, resource limits: retry smaller
    }
  }
  throw new Error('unreachable');
}

/** Whole-UTC-day windows of 365 days (API max is 1 year), contiguous, newest first, back to account creation. */
export function contributionWindows(createdAt: Date, now: Date): { from: string; to: string }[] {
  const windows: { from: string; to: string }[] = [];
  const created = Date.UTC(createdAt.getUTCFullYear(), createdAt.getUTCMonth(), createdAt.getUTCDate());
  let end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + DAY_MS; // start of tomorrow
  while (end > created) {
    const from = Math.max(end - YEAR_DAYS * DAY_MS, created);
    windows.push({ from: new Date(from).toISOString(), to: new Date(end - 1000).toISOString() });
    end = from;
  }
  return windows;
}

export async function fetchGithubData(token: string, login: string, now: Date): Promise<FetchResult> {
  let cost = 0;
  const profile = await postGithubGraphql<Profile>(token, PROFILE_QUERY, { login });
  cost += profile.cost;
  const user = profile.data.user;
  if (!user) throw new GithubGraphqlError(`GitHub user ${login} not found`, 404);

  const repos = new Map<string, RawRepo>();
  let after: string | null = null;
  for (;;) {
    const result = await fetchRepoPage(token, login, after);
    cost += result.cost;
    const { nodes, pageInfo } = result.data.user.repositories;
    for (const node of nodes) repos.set(node.name.toLowerCase(), node);
    if (!pageInfo.hasNextPage) break;
    if (repos.size >= MAX_REPOS) throw new Error(`more than ${MAX_REPOS} public repos: snapshot not refreshed`);
    after = pageInfo.endCursor;
  }

  const contributions: RawContributions[] = [];
  for (const window of contributionWindows(new Date(user.createdAt), now)) {
    const result = await postGithubGraphql<{ user: { contributionsCollection: RawContributions } }>(
      token, CONTRIBUTIONS_QUERY, { login, ...window });
    cost += result.cost;
    contributions.push(result.data.user.contributionsCollection);
  }

  return {
    raw: { login: user.login, createdAt: user.createdAt, pinned: user.pinnedItems.nodes, repos: [...repos.values()], contributions },
    cost,
  };
}

export interface TokenOption {
  label: string;
  value: string;
}

/** First token that can read the profile; a permission error moves on to the next token. */
export async function fetchWithFallback(
  tokens: TokenOption[], login: string, now: Date, log: (message: string) => void,
): Promise<FetchResult> {
  for (const [index, token] of tokens.entries()) {
    try {
      const result = await fetchGithubData(token.value, login, now);
      log(`Fetched with ${token.label}: ${result.raw.repos.length} repos, cost ${result.cost} points`);
      return result;
    } catch (error) {
      const canFallBack = error instanceof GithubGraphqlError && error.isAuth && index < tokens.length - 1;
      if (!canFallBack) throw error;
      log(`${token.label} cannot read the profile (${error.message}); trying ${tokens[index + 1].label}`);
    }
  }
  throw new Error('no token');
}
