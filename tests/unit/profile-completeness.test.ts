import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PLACEHOLDER_MARKER } from '../../src/data/xp-rules.ts';
import {
  countPlaceholderFiles,
  evaluateCompleteness,
  type CompletenessSnapshot,
} from '../../src/utils/career-rpg/profile-completeness.ts';
import { scoreQuests } from '../../src/utils/career-rpg/quest-scoring.ts';
import { buildSkillTree, flattenSkillTree } from '../../src/utils/career-rpg/skill-tree.ts';
import { bossQuest, quest, realProfile, skill, words } from './career-fixtures.ts';

function snapshot(overrides: Partial<CompletenessSnapshot> = {}): CompletenessSnapshot {
  const quests = scoreQuests([bossQuest({ id: 'boss', skills: ['ts'] })], new Set());
  const nodes = flattenSkillTree(
    buildSkillTree([skill({ id: 'root' }), skill({ id: 'ts', parent: 'root' })], new Map([['ts', ['boss']]]), new Set()),
  );
  return {
    profile: realProfile,
    quests,
    leafSkills: nodes.filter((node) => node.children.length === 0),
    placeholderFiles: 0,
    currentStreak: 2,
    ...overrides,
  };
}

const failing = (result: ReturnType<typeof evaluateCompleteness>) => result.missing.map((item) => item.id);

describe('evaluateCompleteness', () => {
  it('is 100% when every item passes', () => {
    const result = evaluateCompleteness(snapshot());
    assert.equal(result.percent, 100);
    assert.deepEqual(result.missing, []);
    assert.equal(result.items.length, 10);
  });

  it('flags placeholder emails, including subdomains', () => {
    for (const email of ['hello@example.com', 'me@mail.example.org', 'a@b.test', 'not-an-email', '']) {
      const result = evaluateCompleteness(snapshot({ profile: { ...realProfile, email } }));
      assert.deepEqual(failing(result), ['real-email'], email);
      assert.equal(result.percent, 90);
    }
  });

  it('accepts real domains that merely contain a placeholder word', () => {
    const result = evaluateCompleteness(snapshot({ profile: { ...realProfile, email: 'x@contest.dev' } }));
    assert.equal(result.percent, 100);
  });

  it('fails each profile item independently', () => {
    const result = evaluateCompleteness(
      snapshot({
        profile: { ...realProfile, bio: [words(59)], socials: [], availability: { status: 'closed', note: '  ' } },
        placeholderFiles: 3,
        currentStreak: 0,
      }),
    );
    assert.deepEqual(failing(result), ['no-placeholders', 'bio-length', 'availability', 'socials', 'streak-alive']);
    assert.equal(result.percent, 50);
    assert.match(result.items[0].label, /3 files/);
  });

  it('fails quest and skill items on unverified, metric-less, evidence-less content', () => {
    const quests = scoreQuests([quest({ id: 'bare', evidence: [], body: 'short' })], new Set());
    const leafSkills = flattenSkillTree(buildSkillTree([skill({ id: 'lonely' })], new Map(), new Set()));
    const result = evaluateCompleteness(snapshot({ quests, leafSkills }));
    assert.deepEqual(failing(result), ['quest-evidence', 'quest-verified', 'quest-metrics', 'skill-evidence']);
    assert.equal(result.percent, 60);
  });
});

describe('countPlaceholderFiles', () => {
  it('counts files containing the marker once each', () => {
    const sources = {
      'a.md': `# ${PLACEHOLDER_MARKER}: x\n${PLACEHOLDER_MARKER} again`,
      'b.ts': `// ${PLACEHOLDER_MARKER}`,
      'c.ts': 'const done = true; // TODO: unrelated',
    };
    assert.equal(countPlaceholderFiles(sources), 2);
    assert.equal(countPlaceholderFiles({}), 0);
  });
});
