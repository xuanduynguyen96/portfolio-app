import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildCareerState,
  CareerRuleError,
  type CareerInputs,
} from '../../src/utils/career-rpg/build-career-state.ts';
import { baseSkills, bossQuest, entry, NOW, quest, realProfile, skill } from './career-fixtures.ts';

function inputs(overrides: Partial<CareerInputs> = {}): CareerInputs {
  return {
    quests: [
      bossQuest({ id: 'boss', skills: ['typescript', 'css'] }),
      quest({ id: 'chat', featured: true, skills: ['writing'], metrics: [{ label: 'Users', value: 120 }] }),
      quest({ id: 'tiny', difficulty: 'side', body: 'Too short to count.' }),
    ],
    skills: baseSkills,
    changelog: [entry('w1', '2026-10-14'), entry('w2', '2026-10-07')],
    profile: realProfile,
    rawSources: { 'src/data/site-config.ts': 'export const done = true;' },
    now: NOW,
    ...overrides,
  };
}

describe('buildCareerState', () => {
  it('scores a valid career end to end', () => {
    const state = buildCareerState(inputs());
    assert.deepEqual(state.quests.map((item) => [item.id, item.status]), [
      ['boss', 'verified'],
      ['chat', 'verified'],
      ['tiny', 'body-too-short'],
    ]);
    assert.equal(state.boss.id, 'boss');
    const xp = Object.fromEntries(state.attributes.map((item) => [item.id, item.xp]));
    // boss 925 split over typescript + css; chat 250 * 1.25 to writing.
    assert.deepEqual(xp, { 'code-efficiency': 463, 'ui-polish': 463, communication: 313, reliability: 0 });
    assert.equal(state.level.totalXp, 463 + 463 + 313);
    assert.equal(state.level.level, 6); // L6 = 1118, L7 = 1470
    assert.equal(state.streak.current, 2);
    assert.deepEqual(state.achievements.map((item) => item.questId), ['boss', 'chat']);
    assert.deepEqual(state.completeness.missing.map((item) => item.id), ['quest-verified', 'quest-metrics']);
  });

  it('rolls verified quests into skill levels, but not unverified ones', () => {
    const state = buildCareerState(inputs());
    const languages = state.skillTree.find((node) => node.id === 'languages');
    assert.equal(languages?.children[0].questIds.join(), 'boss');
    assert.equal(languages?.level, 1);
  });

  it('lets a quest claim a URL before skill nodes do', () => {
    const url = 'https://github.com/example-user/boss';
    const state = buildCareerState(inputs({ skills: [...baseSkills, skill({ id: 'extra', evidence: [url] })] }));
    assert.equal(state.skillTree.find((node) => node.id === 'extra')?.xp, 0);
  });

  it('is deterministic for the same inputs', () => {
    assert.deepEqual(buildCareerState(inputs()), buildCareerState(inputs()));
  });

  it('throws one CareerRuleError listing every cross-entry violation', () => {
    const bad = inputs({
      quests: [bossQuest({ id: 'one' }), bossQuest({ id: 'two', skills: ['ghost'] })],
      skills: [...baseSkills, skill({ id: 'orphan', parent: 'nope' })],
      changelog: [entry('later', '2026-11-01')],
    });
    assert.throws(
      () => buildCareerState(bad),
      (error: unknown) => {
        assert.ok(error instanceof CareerRuleError);
        assert.equal(error.name, 'CareerRuleError');
        assert.deepEqual(
          error.issues.map((item) => `${item.source} ${item.id}`),
          ['skill orphan', 'quest two', 'quest one, two', 'changelog later'],
        );
        assert.match(error.message, /rules failed \(4\)/);
        assert.match(error.message, /- skill orphan: unknown parent "nope"/);
        return true;
      },
    );
  });
});
