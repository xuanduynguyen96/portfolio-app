import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { xpRules, type XpRules } from '../../src/data/xp-rules.ts';
import { scoreQuests } from '../../src/utils/career-rpg/quest-scoring.ts';
import { buildSkillTree, flattenSkillTree } from '../../src/utils/career-rpg/skill-tree.ts';
import {
  computeAttributeXp,
  levelFromXp,
  levelInfo,
  titleForLevel,
  xpForLevel,
} from '../../src/utils/career-rpg/xp-and-level.ts';
import { baseSkills, quest, skill } from './career-fixtures.ts';

describe('level curve', () => {
  it('xpForLevel follows base * (L - 1)^1.5', () => {
    assert.deepEqual([1, 2, 5, 10, 20].map((level) => xpForLevel(level)), [0, 100, 800, 2700, 8282]);
  });

  it('levels up exactly at the threshold', () => {
    assert.equal(levelFromXp(0), 1);
    assert.equal(levelFromXp(99), 1);
    assert.equal(levelFromXp(100), 2);
    assert.equal(levelFromXp(799), 4);
    assert.equal(levelFromXp(800), 5);
  });

  it('clamps at max level with full progress', () => {
    const info = levelInfo(10_000_000);
    assert.equal(info.level, xpRules.level.max);
    assert.equal(info.nextLevelXp, null);
    assert.equal(info.progress, 1);
  });

  it('reports progress within the current level', () => {
    const info = levelInfo(450); // L3 = 283, L4 = 520
    assert.equal(info.level, 3);
    assert.equal(info.currentLevelXp, 283);
    assert.equal(info.nextLevelXp, 520);
    assert.ok(info.progress > 0 && info.progress < 1);
    assert.equal(levelInfo(0).progress, 0);
  });

  it('picks the highest title band reached', () => {
    assert.deepEqual(
      [1, 4, 5, 9, 10, 19, 20, 50].map((level) => titleForLevel(level)),
      [
        'Novice Coder',
        'Novice Coder',
        'Journeyman Engineer',
        'Journeyman Engineer',
        'Senior Adventurer',
        'Senior Adventurer',
        'Principal Archmage',
        'Principal Archmage',
      ],
    );
  });
});

describe('computeAttributeXp', () => {
  it('splits quest XP across its skills and adds skill evidence XP', () => {
    const quests = scoreQuests([quest({ id: 'q', skills: ['typescript', 'css'] })], new Set());
    const nodes = flattenSkillTree(
      buildSkillTree([...baseSkills, skill({ id: 'docs', attribute: 'communication', evidence: ['https://blog.dev/post'] })], new Map(), new Set()),
    );
    const byId = Object.fromEntries(computeAttributeXp(quests, nodes).map((item) => [item.id, item.xp]));
    assert.deepEqual(byId, { 'code-efficiency': 125, 'ui-polish': 125, communication: 40, reliability: 0 });
  });

  it('ignores unverified quests', () => {
    const quests = scoreQuests([quest({ id: 'q', body: 'too short' })], new Set());
    const nodes = flattenSkillTree(buildSkillTree(baseSkills, new Map(), new Set()));
    assert.ok(computeAttributeXp(quests, nodes).every((item) => item.xp === 0));
  });

  it('clamps each attribute to the cap and returns integers', () => {
    const rules: XpRules = { ...xpRules, attributeCap: 100 };
    const quests = scoreQuests([quest({ id: 'q', difficulty: 'raid' })], new Set(), rules);
    const nodes = flattenSkillTree(buildSkillTree(baseSkills, new Map(), new Set(), rules));
    const scores = computeAttributeXp(quests, nodes, rules);
    assert.equal(scores.find((item) => item.id === 'code-efficiency')?.xp, 100);
    assert.ok(scores.every((item) => Number.isInteger(item.xp) && item.cap === 100));
  });
});
