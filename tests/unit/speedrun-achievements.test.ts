import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { scoreQuests } from '../../src/utils/career-rpg/quest-scoring.ts';
import { pickTopAchievements } from '../../src/utils/career-rpg/speedrun-achievements.ts';
import { bossQuest, quest } from './career-fixtures.ts';

const metric = (label: string, value: number, unit?: string) => ({ label, value, ...(unit ? { unit } : {}) });

describe('pickTopAchievements', () => {
  it('puts the boss first and round-robins metrics across quests', () => {
    const quests = scoreQuests(
      [
        bossQuest({ id: 'boss', metrics: [metric('Faster', 40, '%'), metric('Bundle', 12, 'KB')] }),
        quest({ id: 'low', featured: true, metrics: [metric('Users', 300)] }),
        quest({ id: 'high', featured: true, difficulty: 'raid', metrics: [metric('Uptime', 99.9, '%')] }),
      ],
      new Set(),
    );
    assert.deepEqual(
      pickTopAchievements(quests, 3).map((item) => `${item.questId}:${item.label}`),
      ['boss:Faster', 'high:Uptime', 'low:Users'],
    );
  });

  it("fills remaining slots with later metrics and keeps units", () => {
    const quests = scoreQuests(
      [bossQuest({ id: 'boss', metrics: [metric('Faster', 40, '%'), metric('Bundle', 12, 'KB'), metric('Bugs', 0)] })],
      new Set(),
    );
    const picked = pickTopAchievements(quests, 3);
    assert.deepEqual(picked[1], { questId: 'boss', questTitle: 'boss', label: 'Bundle', value: 12, unit: 'KB' });
    assert.equal('unit' in picked[2], false);
  });

  it('skips unverified and non-featured quests', () => {
    const quests = scoreQuests(
      [
        bossQuest({ id: 'boss' }),
        quest({ id: 'unverified', featured: true, body: 'short', metrics: [metric('Fake', 1000)] }),
        quest({ id: 'side', metrics: [metric('Hidden', 1)] }),
      ],
      new Set(),
    );
    assert.deepEqual(pickTopAchievements(quests, 3).map((item) => item.questId), ['boss']);
  });

  it('returns fewer (or none) without throwing when metrics run out', () => {
    assert.deepEqual(pickTopAchievements([], 3), []);
    const quests = scoreQuests([bossQuest({ id: 'boss' })], new Set());
    assert.equal(pickTopAchievements(quests, 3).length, 1);
    assert.equal(pickTopAchievements(quests, 0).length, 0);
  });
});
