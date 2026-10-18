import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { GITHUB_LOGIN } from '../../src/data/github/github-login.ts';
import { githubSnapshotSchema } from '../../src/data/github/github-snapshot-schema.ts';
import { normalizeSnapshot, serializeSnapshot } from '../../src/utils/github-character/normalize-snapshot.ts';
import { ownerLikeRaw } from './github-raw-fixtures.ts';

const committedText = readFileSync(new URL('../../src/data/github/github-snapshot.json', import.meta.url), 'utf8');

describe('github snapshot schema', () => {
  it('accepts normalizer output', () => {
    assert.equal(githubSnapshotSchema.safeParse(normalizeSnapshot(ownerLikeRaw(), new Date())).success, true);
  });

  it('rejects unknown keys, bad dates and non-https links', () => {
    const base = normalizeSnapshot(ownerLikeRaw(), new Date());
    assert.equal(githubSnapshotSchema.safeParse({ ...base, isPrivate: true }).success, false);
    assert.equal(githubSnapshotSchema.safeParse({ ...base, asOf: '12/10/2026' }).success, false);
    const repo = { ...base.repos[0], homepage: 'http://example.dev' };
    assert.equal(githubSnapshotSchema.safeParse({ ...base, repos: [repo] }).success, false);
    assert.equal(githubSnapshotSchema.safeParse({ ...base, repos: [{ ...base.repos[0], isPrivate: false }] }).success, false);
  });

  it('the committed snapshot is valid, normalized and for the configured login', () => {
    const parsed = githubSnapshotSchema.parse(JSON.parse(committedText));
    assert.equal(parsed.login, GITHUB_LOGIN);
    assert.equal(serializeSnapshot(parsed), committedText, 'committed file must be normalizer output (key order, newline)');
  });
});
