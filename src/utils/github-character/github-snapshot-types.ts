// Plain-data shapes of the GitHub snapshot: raw GraphQL nodes in, normalized snapshot out (no Astro types).

/** Normalized, committed snapshot: the only GitHub input of the build and the tests. */
export interface GithubSnapshot {
  schemaVersion: 1;
  login: string;
  /** YYYY-MM-DD, Monday (UTC) of the fetch week: re-runs in the same week stay byte-identical. */
  asOf: string;
  accountCreated: string;
  /** Public pinned repo names, pin order. */
  pinned: string[];
  /** Public, owned, non-fork repos sorted by name (case-insensitive). */
  repos: SnapshotRepo[];
  activity: {
    /** ISO weeks (Monday start) with at least one contribution, ascending. */
    weeks: { start: string; count: number }[];
    totals: { commits: number; pullRequests: number; reviews: number; issues: number };
  };
}

export interface SnapshotRepo {
  name: string;
  url: string;
  description: string | null;
  homepage: string | null;
  /** Monday (UTC) of the week the repo was created / last pushed. */
  createdWeek: string;
  pushedWeek: string;
  isArchived: boolean;
  stars: number;
  primaryLanguage: string | null;
  /** Bytes per language (GitHub linguist), > 0; sorted by bytes desc, then name. */
  languages: { name: string; bytes: number }[];
  topics: string[];
  /** SPDX id; null when GitHub cannot detect one (or NOASSERTION). */
  license: string | null;
  /** Names in the default-branch root, sorted, capped. */
  rootEntries: string[];
  /** Names in `.github/`, sorted. */
  githubEntries: string[];
  /** Names in `.github/workflows/`, sorted. */
  workflowFiles: string[];
  /** Owner commit contributions to this repo across all fetched windows. */
  commits: number;
}

interface RawTree {
  entries: { name: string }[];
}

/** One repository node as returned by the repos query (extra fields are ignored). */
export interface RawRepo {
  name: string;
  url: string;
  description: string | null;
  homepageUrl: string | null;
  isArchived: boolean;
  isFork: boolean;
  isPrivate: boolean;
  createdAt: string;
  pushedAt: string | null;
  stargazerCount: number;
  licenseInfo: { spdxId: string | null } | null;
  primaryLanguage: { name: string } | null;
  repositoryTopics: { nodes: { topic: { name: string } }[] };
  languages: { edges: { size: number; node: { name: string } }[] } | null;
  root: RawTree | null;
  dotGithub: RawTree | null;
  workflows: RawTree | null;
}

/** One `contributionsCollection` (max 1 year span). */
export interface RawContributions {
  totalCommitContributions: number;
  totalPullRequestContributions: number;
  totalIssueContributions: number;
  totalPullRequestReviewContributions: number;
  contributionCalendar: { weeks: { contributionDays: { date: string; contributionCount: number }[] }[] };
  commitContributionsByRepository: {
    repository: { nameWithOwner: string; isPrivate: boolean };
    contributions: { totalCount: number };
  }[];
}

/** Everything the fetch script collected, before normalization. */
export interface RawGithubData {
  login: string;
  createdAt: string;
  pinned: { name: string; isPrivate: boolean; owner: { login: string } }[];
  repos: RawRepo[];
  contributions: RawContributions[];
}
