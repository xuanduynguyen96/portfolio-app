import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { contributionWindows } from '../../scripts/github-snapshot/fetch-github-data.ts';
import { DESCRIPTION_MAX, httpsOrNull, normalizeSnapshot, serializeSnapshot } from '../../src/utils/github-character/normalize-snapshot.ts';
import { LOGIN, ownerLikeRaw, rawRepo } from './github-raw-fixtures.ts';

const FETCHED = new Date('2026-10-17T16:58:00Z'); // Saturday
const snapshot = () => normalizeSnapshot(ownerLikeRaw(), FETCHED);
const repo = (name: string) => {
  const found = snapshot().repos.find((r) => r.name === name);
  assert.ok(found, `repo ${name}`);
  return found;
};

describe('normalizeSnapshot', () => {
  it('drops private and forked repos, even if the query let them through', () => {
    const names = snapshot().repos.map((r) => r.name);
    assert.deepEqual(names, ['Data-Notebooks', 'empty_repo', 'web-app']);
    assert.ok(!serializeSnapshot(snapshot()).includes('secret'), 'no private name or description anywhere');
  });

  it('sorts repos case-insensitively and keeps only public pins of own repos', () => {
    assert.deepEqual(snapshot().pinned, ['web-app'], 'private pin and same-named org repo dropped');
    const raw = ownerLikeRaw();
    raw.repos.push(rawRepo({ name: 'apple' }), rawRepo({ name: 'Banana' }));
    assert.deepEqual(normalizeSnapshot(raw, FETCHED).repos.map((r) => r.name), ['apple', 'Banana', 'Data-Notebooks', 'empty_repo', 'web-app']);
  });

  it('asOf is the Monday of the fetch week; dates are week-granular', () => {
    assert.equal(snapshot().asOf, '2026-10-12');
    assert.equal(snapshot().accountCreated, '2019-11-24');
    assert.equal(repo('web-app').pushedWeek, '2026-10-12');
    assert.equal(repo('web-app').createdWeek, '2024-03-04');
    assert.equal(repo('empty_repo').pushedWeek, repo('empty_repo').createdWeek, 'never pushed falls back to created');
  });

  it('languages: exact bytes, empty dropped, sorted by size', () => {
    assert.deepEqual(repo('web-app').languages, [{ name: 'TypeScript', bytes: 10_240 }, { name: 'CSS', bytes: 2047 }, { name: 'Shell', bytes: 1023 }]);
    assert.deepEqual(repo('empty_repo').languages, []);
    assert.equal(repo('empty_repo').primaryLanguage, null);
  });

  it('cleans text and links: whitespace, length cap, https only, no NOASSERTION', () => {
    assert.equal(repo('web-app').description, 'My portfolio site');
    assert.equal(repo('Data-Notebooks').description?.length, DESCRIPTION_MAX);
    assert.equal(repo('Data-Notebooks').homepage, null);
    assert.equal(repo('web-app').homepage, 'https://example.dev/');
    assert.equal(repo('web-app').license, 'MIT');
    assert.equal(repo('empty_repo').license, null);
    assert.equal(httpsOrNull('javascript:alert(1)'), null);
    assert.equal(httpsOrNull('https://user:pw@example.dev'), null);
    const emoji = normalizeSnapshot({ ...ownerLikeRaw(), repos: [rawRepo({ name: 'e', description: '😀'.repeat(250) })] }, FETCHED);
    assert.equal(Array.from(emoji.repos[0].description ?? '').length, DESCRIPTION_MAX, 'cut on code points');
    assert.ok(!emoji.repos[0].description?.includes('\uFFFD'));
  });

  it('tree entries and topics are sorted; missing trees become empty lists', () => {
    assert.deepEqual(repo('web-app').topics, ['astro', 'web']);
    assert.deepEqual(repo('web-app').githubEntries, ['dependabot.yml', 'workflows']);
    assert.deepEqual(repo('web-app').workflowFiles, ['codeql.yml', 'deploy.yml']);
    assert.deepEqual(repo('empty_repo').rootEntries, []);
  });

  it('commits per repo: own public repos only, summed across windows', () => {
    assert.equal(repo('web-app').commits, 7, 'someone-else/web-app and private repos ignored');
    assert.equal(repo('Data-Notebooks').commits, 1);
    assert.equal(repo('empty_repo').commits, 0);
  });

  it('activity: Sunday days join the previous ISO week, zero weeks omitted', () => {
    assert.deepEqual(snapshot().activity.weeks, [
      { start: '2024-01-01', count: 6 },
      { start: '2025-10-13', count: 4 },
      { start: '2026-10-05', count: 2 },
      { start: '2026-10-12', count: 4 },
    ]);
    // Totals are GitHub's own per-window aggregates, passed through (never per-repo, so no private names).
    assert.deepEqual(snapshot().activity.totals, { commits: 27, pullRequests: 2, reviews: 6, issues: 4 });
  });

  it('is deterministic: same data later in the same week serializes byte-identically', () => {
    const monday = serializeSnapshot(normalizeSnapshot(ownerLikeRaw(), new Date('2026-10-12T00:00:00Z')));
    const sunday = serializeSnapshot(normalizeSnapshot(ownerLikeRaw(), new Date('2026-10-18T23:59:59Z')));
    assert.equal(monday, sunday);
    assert.ok(monday.endsWith('}\n'));
    assert.equal(normalizeSnapshot(ownerLikeRaw(), FETCHED).login, LOGIN);
  });
});

describe('contributionWindows', () => {
  it('contiguous whole-UTC-day windows of <= 1 year, newest first, back to creation', () => {
    const windows = contributionWindows(new Date('2024-06-01T13:00:00Z'), new Date('2026-10-17T16:58:00Z'));
    assert.equal(windows.length, 3);
    assert.equal(windows[0].to, '2026-10-17T23:59:59.000Z');
    assert.equal(windows.at(-1)?.from, '2024-06-01T00:00:00.000Z');
    for (const [i, w] of windows.entries()) {
      assert.ok(Date.parse(w.to) - Date.parse(w.from) < 365 * 86_400_000);
      assert.match(w.from, /T00:00:00\.000Z$/);
      if (i > 0) assert.equal(Date.parse(windows[i - 1].from) - Date.parse(w.to), 1000, 'no gap, no overlap');
    }
  });
});
