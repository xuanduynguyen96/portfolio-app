import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { fetchGithubData, fetchWithFallback, MAX_REPOS } from '../../scripts/github-snapshot/fetch-github-data.ts';
import { GithubGraphqlError, postGithubGraphql } from '../../scripts/github-snapshot/post-github-graphql.ts';
import { LOGIN, rawRepo, rawWindow } from './github-raw-fixtures.ts';

const NOW = new Date('2026-10-17T16:58:00Z');
type Request = { token: string; query: string; variables: Record<string, unknown> };
type Responder = (request: Request) => { status?: number; body?: unknown };

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const profile = { data: { rateLimit: { cost: 1 }, user: { login: LOGIN, createdAt: '2025-06-01T00:00:00Z', pinnedItems: { nodes: [] } } } };
const page = (names: string[], hasNextPage: boolean) => ({
  data: { rateLimit: { cost: 1 }, user: { repositories: { pageInfo: { hasNextPage, endCursor: hasNextPage ? names.at(-1) : null }, nodes: names.map((name) => rawRepo({ name })) } } },
});
const contributions = { data: { rateLimit: { cost: 1 }, user: { contributionsCollection: rawWindow([['2026-10-12', 1]]) } } };

/** Stubs global fetch; routes by query shape; records every request. */
function stub(respond: Responder) {
  const requests: Request[] = [];
  mock.method(globalThis, 'fetch', async (_url: string, init: RequestInit) => {
    const { query, variables } = JSON.parse(String(init.body));
    const request = { token: String((init.headers as Record<string, string>).authorization), query, variables };
    requests.push(request);
    const { status = 200, body } = respond(request);
    return json(body ?? {}, status);
  });
  return requests;
}
const route = (overrides: Partial<Record<'profile' | 'repos' | 'contrib', Responder>> = {}): Responder => (request) => {
  if (request.query.includes('pinnedItems')) return overrides.profile?.(request) ?? { body: profile };
  if (request.query.includes('repositories(')) return overrides.repos?.(request) ?? { body: page(['a'], false) };
  return overrides.contrib?.(request) ?? { body: contributions };
};

afterEach(() => mock.restoreAll());

describe('postGithubGraphql', () => {
  it('maps HTTP 403 and typed GraphQL permission errors to isAuth', async () => {
    stub(() => ({ status: 403 }));
    await assert.rejects(postGithubGraphql('t', 'q', {}), (e: GithubGraphqlError) => e.isAuth && e.status === 403);
    mock.restoreAll();
    stub(() => ({ body: { data: null, errors: [{ type: 'FORBIDDEN', message: 'Resource not accessible by integration' }] } }));
    await assert.rejects(postGithubGraphql('t', 'q', {}), (e: GithubGraphqlError) => e.isAuth && e.status === 200);
  });

  it('partial data with errors is an error (never half a snapshot); non-auth errors are not auth', async () => {
    stub(() => ({ body: { data: { user: {} }, errors: [{ type: 'RESOURCE_LIMITS_EXCEEDED', message: 'too big' }] } }));
    await assert.rejects(postGithubGraphql('t', 'q', {}), (e: GithubGraphqlError) => !e.isAuth && /RESOURCE_LIMITS_EXCEEDED/.test(e.message));
  });
});

describe('fetchGithubData', () => {
  it('pages repos, dedupes by name, fetches every contribution window, sums cost', async () => {
    const requests = stub(route({
      repos: (r) => ({ body: r.variables.after ? page(['b', 'A'], false) : page(['a', 'b'], true) }),
    }));
    const { raw, cost } = await fetchGithubData('t', LOGIN, NOW);
    assert.deepEqual(raw.repos.map((r) => r.name), ['A', 'b'], 'a/A and b deduped (last page wins)');
    assert.equal(raw.contributions.length, 2, 'created 2025-06-01 -> 2 windows');
    assert.equal(cost, 1 + 2 + 2);
    assert.equal(requests.filter((r) => r.query.includes('repositories(')).length, 2);
  });

  it('retries a failed repo page with a smaller page size', async () => {
    const requests = stub(route({ repos: (r) => (r.variables.first === 25 ? { status: 502 } : { body: page(['a'], false) }) }));
    const { raw } = await fetchGithubData('t', LOGIN, NOW);
    assert.equal(raw.repos.length, 1);
    assert.deepEqual(requests.filter((r) => r.query.includes('repositories(')).map((r) => r.variables.first), [25, 10]);
  });

  it('refuses to truncate: more than MAX_REPOS public repos throws', async () => {
    let n = 0;
    stub(route({ repos: () => ({ body: page(Array.from({ length: 25 }, () => `r${n++}`), true) }) }));
    await assert.rejects(fetchGithubData('t', LOGIN, NOW), new RegExp(`more than ${MAX_REPOS}`));
  });

  it('unknown user is an error', async () => {
    stub(route({ profile: () => ({ body: { data: { user: null } } }) }));
    await assert.rejects(fetchGithubData('t', LOGIN, NOW), /not found/);
  });
});

describe('fetchWithFallback', () => {
  const tokens = [{ label: 'GITHUB_TOKEN', value: 'gh' }, { label: 'GH_SNAPSHOT_PAT', value: 'pat' }];

  it('falls back to the PAT on a permission error', async () => {
    const requests = stub((r) => (r.token === 'bearer gh'
      ? { body: { errors: [{ type: 'FORBIDDEN', message: 'nope' }] } }
      : route()(r)));
    const logs: string[] = [];
    const { raw } = await fetchWithFallback(tokens, LOGIN, NOW, (m) => logs.push(m));
    assert.equal(raw.login, LOGIN);
    assert.ok(requests.some((r) => r.token === 'bearer pat'));
    assert.match(logs.join('\n'), /trying GH_SNAPSHOT_PAT/);
    assert.ok(!logs.join('\n').includes('pat '), 'token values never logged');
  });

  it('does not fall back on non-permission errors', async () => {
    const requests = stub(() => ({ status: 500 }));
    await assert.rejects(fetchWithFallback(tokens, LOGIN, NOW, () => {}), /HTTP 500/);
    assert.ok(requests.every((r) => r.token === 'bearer gh'));
  });
});
