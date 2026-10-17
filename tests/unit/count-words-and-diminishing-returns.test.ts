import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { countWords } from '../../src/utils/career-rpg/count-words.ts';
import {
  decayedSum,
  normalizeEvidenceUrl,
  uniqueEvidenceUrls,
} from '../../src/utils/career-rpg/diminishing-returns.ts';

describe('countWords', () => {
  it('counts prose words, keeping hyphenated and apostrophe words whole', () => {
    assert.equal(countWords("I shipped a real-time chat that doesn't drop messages."), 9);
  });

  it('returns 0 for empty or syntax-only input', () => {
    assert.equal(countWords(''), 0);
    assert.equal(countWords('---\n***\n| --- | --- |\n#'), 0);
  });

  it('ignores fenced code, inline code, comments, tags, images and URLs', () => {
    const md = [
      '## Heading here',
      '```ts\nconst lots = of + code + words;\n```',
      'Use `npm run build` today.',
      '<!-- hidden padding words -->',
      '![alt text words](cover.png)',
      'See https://example.com/a/b and <span>tag</span>.',
    ].join('\n');
    // Heading here | Use today | See and tag
    assert.equal(countWords(md), 7);
  });

  it('keeps link text but drops the link target', () => {
    assert.equal(countWords('Read [the case study](https://example.com/long/path) now'), 5);
  });
});

describe('decayedSum', () => {
  it('weights values in descending order by decay^i', () => {
    assert.equal(decayedSum([10, 100], 0.5, 1000), 100 + 10 * 0.5);
  });

  it('clamps to cap no matter how many values', () => {
    assert.equal(decayedSum(Array(50).fill(40), 0.9, 120), 120);
  });

  it('returns 0 for no values', () => {
    assert.equal(decayedSum([], 0.7, 120), 0);
  });
});

describe('normalizeEvidenceUrl', () => {
  it('lowercases host, drops hash, utm params and trailing slash', () => {
    assert.equal(
      normalizeEvidenceUrl('https://GitHub.com/User/Repo/?utm_source=x&tab=readme#top'),
      'https://github.com/User/Repo?tab=readme',
    );
  });

  it('treats root with and without slash as the same URL', () => {
    assert.equal(normalizeEvidenceUrl('https://example.dev/'), normalizeEvidenceUrl('https://example.dev'));
  });

  it('rejects non-https and invalid URLs', () => {
    assert.equal(normalizeEvidenceUrl('http://example.dev'), null);
    assert.equal(normalizeEvidenceUrl('javascript:alert(1)'), null);
    assert.equal(normalizeEvidenceUrl('not a url'), null);
  });

  it('uniqueEvidenceUrls dedupes equivalent URLs and drops invalid ones', () => {
    assert.deepEqual(
      uniqueEvidenceUrls(['https://a.dev/x/', 'https://A.dev/x#y', 'ftp://a.dev', 'https://a.dev/z']),
      ['https://a.dev/x', 'https://a.dev/z'],
    );
  });
});
