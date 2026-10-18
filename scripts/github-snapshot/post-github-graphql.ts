// Minimal GraphQL client on global fetch (no dependencies: runs in the refresh job without npm ci).
const ENDPOINT = 'https://api.github.com/graphql';
const TIMEOUT_MS = 20_000;
/** GraphQL reports permission problems as HTTP 200 + typed errors. */
const AUTH_ERROR_TYPES = new Set(['FORBIDDEN', 'INSUFFICIENT_SCOPES', 'UNAUTHORIZED']);

export class GithubGraphqlError extends Error {
  readonly status: number;
  /** 401/403 or a typed permission error: a different token may succeed. */
  readonly isAuth: boolean;
  constructor(message: string, status: number, isAuth = status === 401 || status === 403) {
    super(message);
    this.status = status;
    this.isAuth = isAuth;
  }
}

export interface GraphqlResult<T> {
  data: T;
  cost: number;
}

interface GraphqlBody<T> {
  data?: T & { rateLimit?: { cost: number } };
  errors?: { type?: string; message: string }[];
}

export async function postGithubGraphql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<GraphqlResult<T>> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { authorization: `bearer ${token}`, 'content-type': 'application/json', 'user-agent': 'portfolio-snapshot' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new GithubGraphqlError(`GitHub GraphQL HTTP ${response.status}`, response.status);
  const body = (await response.json()) as GraphqlBody<T>;
  // Partial data with errors is still an error: never snapshot a half-answered query.
  if (body.errors?.length || !body.data) {
    const errors = body.errors ?? [];
    const isAuth = errors.some((e) => AUTH_ERROR_TYPES.has(e.type ?? '') || /not accessible by integration/i.test(e.message));
    const message = errors.map((e) => (e.type ? `${e.type}: ${e.message}` : e.message)).join('; ') || 'no data';
    throw new GithubGraphqlError(`GitHub GraphQL errors: ${message}`, 200, isAuth);
  }
  return { data: body.data, cost: body.data.rateLimit?.cost ?? 0 };
}
