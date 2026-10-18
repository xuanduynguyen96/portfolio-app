import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { xpRules } from '../../src/data/xp-rules.ts';
import { applyTierDecay, isCaseStudy, scoreQuests, scoreRaw, sortQuests } from '../../src/utils/career-rpg/quest-scoring.ts';
import { quest, words } from './career-fixtures.ts';

const { baseXp, bonus } = xpRules.quest;
const allSignals = { description: true, topics: true, homepage: true, tests: true, ci: true };

describe('sortQuests', () => {
  it('orders boss, featured, order, then title, without mutating the input', () => {
    const input = [
      quest({ id: 'b', order: 1 }),
      quest({ id: 'a', order: 1 }),
      quest({ id: 'f', featured: true, order: 9 }),
      quest({ id: 'boss', isBoss: true, order: 50 }),
    ];
    assert.deepEqual(sortQuests(input).map((q) => q.id), ['boss', 'f', 'a', 'b']);
    assert.equal(input[0].id, 'b');
  });
});

describe('isCaseStudy', () => {
  it('needs both the word count and the distinct-word count', () => {
    assert.equal(isCaseStudy(words(xpRules.quest.minBodyWords)), true);
    assert.equal(isCaseStudy(words(xpRules.quest.minBodyWords - 1)), false);
    assert.equal(isCaseStudy('again '.repeat(400)), false, 'repetition cannot pass the gate');
  });
});

describe('scoreRaw', () => {
  it('a bare repo earns base XP for its difficulty, status derived', () => {
    for (const difficulty of ['side', 'main', 'raid'] as const) {
      const scored = scoreRaw(quest({ id: difficulty, difficulty }));
      assert.equal(scored.rawXp, baseXp[difficulty]);
      assert.equal(scored.status, 'derived');
    }
  });

  it('each signal adds its bonus; topics feed the HUD only', () => {
    const scored = scoreRaw(quest({ id: 'x', signals: allSignals }));
    const expected = baseXp.main * (1 + bonus.description + bonus.homepage + bonus.tests + bonus.ci);
    assert.ok(Math.abs(scored.rawXp - expected) < 1e-9);
  });

  it('case study, override metrics, obstacles and boss stack', () => {
    const scored = scoreRaw(quest({
      id: 'boss', isBoss: true, body: words(200), obstacles: ['hard'], metrics: [{ label: 'Users', value: 3 }],
    }));
    assert.equal(scored.status, 'case-study');
    assert.equal(scored.wordCount, 200);
    const expected = baseXp.main * (1 + bonus.caseStudy + bonus.metrics + bonus.obstacles + bonus.boss);
    assert.ok(Math.abs(scored.rawXp - expected) < 1e-9);
  });

  it('a too-short override body is no case study and earns no bonus', () => {
    const scored = scoreRaw(quest({ id: 'x', body: words(20) }));
    assert.equal(scored.status, 'derived');
    assert.equal(scored.rawXp, baseXp.main);
  });

  it('repo metrics are facts, not a hand-reported bonus', () => {
    assert.equal(scoreRaw(quest({ id: 'x', repoMetrics: [{ label: 'Commits', value: 9 }] })).rawXp, baseXp.main);
  });
});

describe('applyTierDecay', () => {
  it('decays the Nth best quest in a tier and caps the tier total', () => {
    const quests = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => scoreRaw(quest({ id, difficulty: 'main' })));
    const xp = applyTierDecay(quests).map((q) => q.xp);
    const decayed = [0, 1, 2, 3, 4, 5].map((n) => baseXp.main * xpRules.quest.tierDecay ** n);
    const sum = decayed.reduce((a, b) => a + b, 0);
    const scale = Math.min(1, xpRules.quest.tierCap.main / sum);
    xp.forEach((value, i) => assert.ok(Math.abs(value - decayed[i] * scale) < 1e-9));
    assert.ok(xp.reduce((a, b) => a + b, 0) <= xpRules.quest.tierCap.main + 1e-9);
  });

  it('tiers decay independently', () => {
    const [raid, side] = applyTierDecay([scoreRaw(quest({ id: 'r', difficulty: 'raid' })), scoreRaw(quest({ id: 's', difficulty: 'side' }))]);
    assert.equal(raid.xp, baseXp.raid);
    assert.equal(side.xp, baseXp.side);
  });
});

describe('scoreQuests', () => {
  it('scores in display order', () => {
    const scored = scoreQuests([quest({ id: 'later', order: 2 }), quest({ id: 'boss', isBoss: true })]);
    assert.deepEqual(scored.map((q) => q.id), ['boss', 'later']);
    assert.ok(scored[0].xp > scored[1].xp);
  });
});
