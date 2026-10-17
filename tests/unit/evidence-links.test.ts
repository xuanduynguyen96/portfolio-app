import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getEvidenceLink } from '../../src/utils/career-rpg/evidence-links.ts';

describe('getEvidenceLink', () => {
  const evidence = [
    { type: 'article' as const, url: 'https://blog.dev/post' },
    { type: 'repo' as const, url: 'https://github.com/u/one' },
    { type: 'repo' as const, url: 'https://github.com/u/two' },
  ];

  it('returns the first URL of the requested type', () => {
    assert.equal(getEvidenceLink(evidence, 'repo'), 'https://github.com/u/one');
    assert.equal(getEvidenceLink(evidence, 'article'), 'https://blog.dev/post');
  });

  it('returns undefined when the type is missing', () => {
    assert.equal(getEvidenceLink(evidence, 'demo'), undefined);
    assert.equal(getEvidenceLink([], 'repo'), undefined);
  });
});
