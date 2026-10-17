import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PLACEHOLDER_MARKER, xpRules } from '../../src/data/xp-rules.ts';
import {
  countPlaceholderFiles,
  evaluateCompleteness,
  type CompletenessInput,
} from '../../src/utils/career-rpg/profile-completeness.ts';
import { scoreQuests } from '../../src/utils/career-rpg/quest-scoring.ts';
import { NOW, quest, realProfile, words } from './career-fixtures.ts';

const tidy = { description: true, topics: true, homepage: false, tests: false, ci: false };

function input(overrides: Partial<CompletenessInput> = {}): CompletenessInput {
  return {
    profile: realProfile,
    quests: scoreQuests([quest({ id: 'boss', isBoss: true, body: words(200), signals: tidy }), quest({ id: 'side', signals: tidy })]),
    snapshotAsOf: '2026-10-12',
    now: NOW,
    placeholderFiles: 0,
    currentStreak: 2,
    ...overrides,
  };
}

const failing = (result: ReturnType<typeof evaluateCompleteness>) => result.missing.map((item) => item.id);

describe('evaluateCompleteness', () => {
  it('is 100% when every item passes', () => {
    const result = evaluateCompleteness(input());
    assert.equal(result.percent, 100);
    assert.deepEqual(result.missing, []);
    assert.equal(result.items.length, 10);
  });

  it('flags placeholder emails, including subdomains', () => {
    for (const email of ['hello@example.com', 'me@mail.example.org', 'a@b.test', 'not-an-email', '']) {
      const result = evaluateCompleteness(input({ profile: { ...realProfile, email } }));
      assert.deepEqual(failing(result), ['real-email'], email);
      assert.equal(result.percent, 90);
    }
  });

  it('accepts real domains that merely contain a placeholder word', () => {
    assert.equal(evaluateCompleteness(input({ profile: { ...realProfile, email: 'x@contest.dev' } })).percent, 100);
  });

  it('fails each profile item independently', () => {
    const result = evaluateCompleteness(
      input({
        profile: { ...realProfile, bio: [words(59)], socials: [], availability: { status: 'closed', note: '  ' } },
        placeholderFiles: 3,
        currentStreak: 0,
      }),
    );
    assert.deepEqual(failing(result), ['no-placeholders', 'bio-length', 'availability', 'socials', 'streak-alive']);
    assert.equal(result.percent, 50);
    assert.match(result.items[0].label, /3 files/);
  });

  it('repo hygiene items: descriptions, topics, boss case study', () => {
    const bare = { description: false, topics: false, homepage: false, tests: false, ci: false };
    const quests = scoreQuests([quest({ id: 'boss', isBoss: true, body: words(20), signals: bare })]);
    assert.deepEqual(failing(evaluateCompleteness(input({ quests }))), ['quest-descriptions', 'quest-topics', 'boss-case-study']);
  });

  it('snapshot freshness: stale after maxSnapshotAgeDays', () => {
    const days = xpRules.completeness.maxSnapshotAgeDays;
    const asOf = '2026-10-12';
    const at = (offsetDays: number) => new Date(Date.parse(`${asOf}T00:00:00Z`) + offsetDays * 86_400_000);
    assert.deepEqual(failing(evaluateCompleteness(input({ now: at(days) }))), []);
    assert.deepEqual(failing(evaluateCompleteness(input({ now: at(days + 1) }))), ['snapshot-fresh']);
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
