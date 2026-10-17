import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { xpRules } from '../../src/data/xp-rules.ts';
import { scoreQuests, sortQuests, validateQuestLog } from '../../src/utils/career-rpg/quest-scoring.ts';
import { bossQuest, quest, words } from './career-fixtures.ts';

const skills = new Set(['typescript', 'css']);
const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

describe('sortQuests', () => {
  it('orders boss, then featured, then order, then title', () => {
    const sorted = sortQuests([
      quest({ id: 'b', order: 1 }),
      quest({ id: 'a', order: 1 }),
      quest({ id: 'featured', featured: true, order: 50 }),
      bossQuest({ id: 'boss', order: 999 }),
    ]);
    assert.deepEqual(sorted.map((item) => item.id), ['boss', 'featured', 'a', 'b']);
  });
});

describe('scoreQuests', () => {
  it('applies metric, obstacle and boss bonuses to base XP', () => {
    const [boss] = scoreQuests([bossQuest({ id: 'boss' })], new Set());
    assert.equal(boss.status, 'verified');
    assert.equal(boss.rawXp, 500 * (1 + 0.25 + 0.1 + 0.5));
    assert.equal(boss.xp, boss.rawXp);
  });

  it('gives 0 XP when the case study is below the word minimum', () => {
    const [short] = scoreQuests([quest({ id: 'short', body: words(xpRules.quest.minBodyWords - 1) })], new Set());
    assert.equal(short.status, 'body-too-short');
    assert.equal(short.verified, false);
    assert.equal(short.xp, 0);
  });

  it('gives 0 XP to a long but repetitive case study', () => {
    const body = Array(300).fill('synergy').join(' ');
    const [padded] = scoreQuests([quest({ id: 'padded', body })], new Set());
    assert.equal(padded.status, 'body-too-repetitive');
    assert.equal(padded.uniqueWordCount, 1);
    assert.equal(padded.xp, 0);
  });

  it('scores exactly at the word minimum', () => {
    const [ok] = scoreQuests([quest({ id: 'ok', body: words(xpRules.quest.minBodyWords) })], new Set());
    assert.equal(ok.status, 'verified');
  });

  it('awards a shared evidence URL only once, to the first quest in sort order', () => {
    const shared = [{ type: 'repo' as const, url: 'https://github.com/example-user' }];
    const scored = scoreQuests(
      [quest({ id: 'second', order: 2, evidence: shared }), quest({ id: 'first', order: 1, evidence: shared })],
      new Set(),
    );
    assert.deepEqual(
      scored.map((item) => [item.id, item.status]),
      [['first', 'verified'], ['second', 'no-new-evidence']],
    );
    assert.equal(scored[1].xp, 0);
  });

  it('treats equivalent URLs (slash, case, query, hash) as the same evidence', () => {
    const scored = scoreQuests(
      [
        quest({ id: 'a', order: 1, evidence: [{ type: 'demo', url: 'https://demo.dev/app/' }] }),
        quest({ id: 'b', order: 2, evidence: [{ type: 'demo', url: 'https://www.DEMO.dev/App?v=2#x' }] }),
      ],
      new Set(),
    );
    assert.equal(scored[1].status, 'no-new-evidence');
  });

  it('gives 0 XP to a quest without any evidence', () => {
    const [none] = scoreQuests([quest({ id: 'none', evidence: [] })], new Set());
    assert.equal(none.status, 'no-evidence');
  });

  it('caps a tier: ten side quests never exceed the side cap', () => {
    const sides = Array.from({ length: 10 }, (_, index) => quest({ id: `side-${index}`, difficulty: 'side' }));
    const scored = scoreQuests(sides, new Set());
    assert.ok(scored.every((item) => item.verified));
    assert.ok(Math.abs(sum(scored.map((item) => item.xp)) - xpRules.quest.tierCap.side) < 1e-9);
  });

  it('decays the Nth best quest in a tier below the cap', () => {
    const scored = scoreQuests(
      [
        quest({ id: 'plain', order: 1 }),
        quest({ id: 'measured', order: 2, metrics: [{ label: 'Users', value: 10 }] }),
      ],
      new Set(),
    );
    const xpById = Object.fromEntries(scored.map((item) => [item.id, item.xp]));
    assert.equal(xpById.measured, 250 * 1.25);
    assert.equal(xpById.plain, 250 * xpRules.quest.tierDecay);
  });

  it('marks claimed URLs in the shared seen set', () => {
    const seen = new Set<string>();
    scoreQuests([quest({ id: 'a' })], seen);
    assert.deepEqual([...seen], ['https://github.com/example-user/a']);
  });
});

describe('validateQuestLog', () => {
  it('accepts a log with exactly one valid boss', () => {
    assert.deepEqual(validateQuestLog([bossQuest({ id: 'boss' }), quest({ id: 'q' })], skills), []);
  });

  it('requires a boss', () => {
    const issues = validateQuestLog([quest({ id: 'q' })], skills);
    assert.equal(issues.length, 1);
    assert.match(issues[0].problem, /no boss quest/);
  });

  it('rejects two bosses, naming both', () => {
    const issues = validateQuestLog([bossQuest({ id: 'one' }), bossQuest({ id: 'two' })], skills);
    assert.equal(issues.length, 1);
    assert.equal(issues[0].id, 'one, two');
  });

  it('reports every problem at once', () => {
    const issues = validateQuestLog(
      [
        bossQuest({ id: 'boss', skills: ['css', 'css'] }),
        quest({ id: 'dup', skills: ['rust'] }),
        quest({ id: 'dup', evidence: [{ type: 'other', url: 'http://insecure.dev' }] }),
      ],
      skills,
    );
    assert.deepEqual(
      issues.map((item) => item.id),
      ['boss', 'dup', 'dup', 'dup'],
    );
    assert.match(issues[0].problem, /skill listed twice/);
    assert.ok(issues.some((item) => /unknown skill "rust"/.test(item.problem)));
    assert.ok(issues.some((item) => /duplicate quest id/.test(item.problem)));
    assert.ok(issues.some((item) => /not a valid https URL/.test(item.problem)));
  });
});
