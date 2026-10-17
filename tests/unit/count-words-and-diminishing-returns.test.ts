import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { countUniqueWords, countWords } from '../../src/utils/career-rpg/count-words.ts';
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

  it('ignores hidden elements and link reference definitions', () => {
    const md = 'Real words here.\n<span hidden>padding padding padding</span>\n<div aria-hidden="true">more pad</div>\n[ref]: https://x.dev "Title words"';
    assert.equal(countWords(md), 3);
  });

  it('countUniqueWords ignores case and repetition', () => {
    assert.equal(countUniqueWords('Ship it. ship IT, ship it!'), 2);
    assert.equal(countUniqueWords(Array(200).fill('a').join(' ')), 1);
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
  it('lowercases host and path, drops query, hash and trailing slash', () => {
    assert.equal(normalizeEvidenceUrl('https://GitHub.com/User/Repo/?utm_source=x&tab=readme#top'), 'https://github.com/user/repo');
  });

  it('collapses common variants of one page into one key', () => {
    const variants = [
      'https://github.com/u?a=1',
      'https://github.com/u?a=2',
      'https://www.github.com/u',
      'https://github.com./u',
      'https://github.com/U/',
      'https://github.com/u/index.html',
    ];
    assert.deepEqual(new Set(variants.map(normalizeEvidenceUrl)), new Set(['https://github.com/u']));
  });

  it('keeps explicit ports and distinct paths apart', () => {
    assert.equal(normalizeEvidenceUrl('https://a.dev:8443/x'), 'https://a.dev:8443/x');
    assert.notEqual(normalizeEvidenceUrl('https://a.dev/x'), normalizeEvidenceUrl('https://a.dev/y'));
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
