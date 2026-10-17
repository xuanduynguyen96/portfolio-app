import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { scoreQuests } from '../../src/utils/career-rpg/quest-scoring.ts';
import { pickTopAchievements } from '../../src/utils/career-rpg/speedrun-achievements.ts';
import { quest } from './career-fixtures.ts';

const metric = (label: string, value: number, unit?: string) => ({ label, value, ...(unit ? { unit } : {}) });

describe('pickTopAchievements', () => {
  it('boss first, then featured, then the rest by XP; round-robin across quests', () => {
    const quests = scoreQuests([
      quest({ id: 'boss', isBoss: true, metrics: [metric('Faster', 40, '%'), metric('Bundle', 12, 'KB')] }),
      quest({ id: 'side', difficulty: 'side', repoMetrics: [metric('Commits', 3)] }),
      quest({ id: 'raid', difficulty: 'raid', repoMetrics: [metric('Commits', 30)] }),
      quest({ id: 'star', featured: true, repoMetrics: [metric('Commits', 9)] }),
    ]);
    assert.deepEqual(
      pickTopAchievements(quests, 5).map((item) => `${item.questId}:${item.label}`),
      ['boss:Faster', 'star:Commits', 'raid:Commits', 'side:Commits', 'boss:Bundle'],
    );
  });

  it('override metrics come before repo facts and keep units', () => {
    const quests = scoreQuests([
      quest({ id: 'boss', isBoss: true, metrics: [metric('Users', 5)], repoMetrics: [metric('Code', 12, 'KiB'), metric('Commits', 4)] }),
    ]);
    const picked = pickTopAchievements(quests, 3);
    assert.deepEqual(picked.map((item) => item.label), ['Users', 'Code', 'Commits']);
    assert.deepEqual(picked[1], { questId: 'boss', questTitle: 'boss', label: 'Code', value: 12, unit: 'KiB', isSample: false });
    assert.equal('unit' in picked[2], false);
  });

  it('only hand-reported metrics of a draft override are sample data; repo facts are real', () => {
    const quests = scoreQuests([quest({ id: 'boss', isBoss: true, isSample: true, metrics: [metric('Users', 5)], repoMetrics: [metric('Commits', 2)] })]);
    assert.deepEqual(pickTopAchievements(quests, 3).map((item) => [item.label, item.isSample]), [['Users', true], ['Commits', false]]);
  });

  it('returns fewer (or none) without throwing when metrics run out', () => {
    assert.deepEqual(pickTopAchievements([], 3), []);
    const quests = scoreQuests([quest({ id: 'boss', isBoss: true, repoMetrics: [metric('Commits', 1)] })]);
    assert.equal(pickTopAchievements(quests, 3).length, 1);
    assert.equal(pickTopAchievements(quests, 0).length, 0);
  });
});
