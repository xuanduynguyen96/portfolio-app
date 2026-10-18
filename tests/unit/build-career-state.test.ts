import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { xpRules } from '../../src/data/xp-rules.ts';
import {
  buildCareerState,
  CareerRuleError,
  type CareerInputs,
} from '../../src/utils/career-rpg/build-career-state.ts';
import { classifyCharacter } from '../../src/utils/github-character/classify-character.ts';
import { validateQuestOverrides } from '../../src/utils/career-rpg/validate-quest-overrides.ts';
import { baseSkills, entry, NOW, override, realProfile, skill, words } from './career-fixtures.ts';
import { lang, repo, snapshot } from './github-snapshot-fixtures.ts';

const KIB = 1024;
const webApp = repo({
  name: 'WebApp', description: 'Main app', commits: 20, topics: ['web'], pushedWeek: '2026-10-12',
  languages: [{ name: 'TypeScript', bytes: 60 * KIB }, { name: 'CSS', bytes: 10 * KIB }],
  rootEntries: ['README.md', 'docs', 'tests'], workflowFiles: ['ci.yml'],
});
const gopher = lang('gopher', 'Go', 10, { commits: 2 });

function inputs(overrides: Partial<CareerInputs> = {}): CareerInputs {
  const s = snapshot([webApp, gopher]);
  return {
    snapshot: { ...s, activity: { ...s.activity, weeks: [{ start: '2026-10-05', count: 3 }, { start: '2026-10-12', count: 1 }] } },
    overrides: [override({ id: 'web-app', isBoss: true, body: words(200), metrics: [{ label: 'Users', value: 40 }] })],
    skills: baseSkills,
    changelog: [entry('w1', '2026-10-14')],
    profile: realProfile,
    rawSources: { 'src/data/site-config.ts': 'export const done = true;' },
    now: NOW,
    ...overrides,
  };
}

describe('buildCareerState', () => {
  it('turns snapshot repos + override into scored quests, skills, streak and character', () => {
    const state = buildCareerState(inputs());
    assert.deepEqual(state.quests.map((q) => [q.id, q.difficulty, q.status, q.isBoss]), [
      ['web-app', 'raid', 'case-study', true],
      ['gopher', 'side', 'derived', false],
    ]);
    assert.equal(state.boss.id, 'web-app');
    const { bonus, baseXp } = xpRules.quest;
    const bossXp = baseXp.raid * (1 + bonus.description + bonus.tests + bonus.ci + bonus.caseStudy + bonus.metrics + bonus.boss);
    assert.ok(Math.abs(state.boss.rawXp - bossXp) < 1e-9);
    assert.deepEqual(state.boss.skills, ['typescript', 'css', 'writing']);
    assert.deepEqual(state.quests[1].skills, ['go']);
    assert.equal(state.streak.current, 2);
    assert.deepEqual(state.character, classifyCharacter(inputs().snapshot), 'character = classifier on the same snapshot');
    assert.equal(state.snapshotAsOf, '2026-10-12');
    assert.equal(state.githubUrl, 'https://github.com/example-user');
    assert.deepEqual(state.achievements.map((a) => `${a.questId}:${a.label}`), ['web-app:Users', 'gopher:Commits', 'web-app:Commits']);
  });

  it('skills level from matching repos, counted once even when the repo is also a quest', () => {
    const state = buildCareerState(inputs());
    const languages = state.skillTree.find((node) => node.id === 'languages');
    const ts = languages?.children.find((node) => node.id === 'typescript');
    assert.deepEqual(ts?.evidence, [webApp.url]);
    assert.deepEqual(ts?.questIds, ['web-app']);
    assert.equal(ts?.evidenceCount, 1);
    assert.equal(languages?.evidenceCount, 2, 'typescript (WebApp) + go (gopher)');
  });

  it('attribute XP: boss XP split over its 3 skills, gopher to go, +1 matched repo per proven skill', () => {
    const { bonus, baseXp } = xpRules.quest;
    const boss = baseXp.raid * (1 + bonus.description + bonus.tests + bonus.ci + bonus.caseStudy + bonus.metrics + bonus.boss);
    const repoXp = xpRules.skillEvidence.xpPerRepo;
    const expected = {
      'code-efficiency': Math.round(boss / 3 + baseXp.side + 2 * repoXp), // typescript share + gopher + ts/go nodes
      'ui-polish': Math.round(boss / 3 + repoXp), // css share + css node
      communication: Math.round(boss / 3 + repoXp), // writing share + writing node
      reliability: 0,
    };
    const state = buildCareerState(inputs());
    assert.deepEqual(Object.fromEntries(state.attributes.map((a) => [a.id, a.xp])), expected);
    assert.equal(state.level.totalXp, Object.values(expected).reduce((sum, xp) => sum + xp, 0));
  });

  it('a quest matching no skill still adds its XP (to the fallback attribute)', () => {
    const state = buildCareerState(inputs({ skills: [], overrides: [] }));
    const xp = Object.fromEntries(state.attributes.map((a) => [a.id, a.xp]));
    const questXp = Math.round(state.quests.reduce((sum, q) => sum + q.xp, 0));
    assert.equal(xp[xpRules.quest.fallbackAttribute], questXp);
  });

  it('without an override the boss is the top-ranked repo and quests are derived', () => {
    const state = buildCareerState(inputs({ overrides: [] }));
    assert.equal(state.boss.id, 'web-app');
    assert.ok(state.quests.every((q) => q.status === 'derived'));
    assert.ok(state.completeness.missing.some((item) => item.id === 'boss-case-study'));
  });

  it('is deterministic for the same inputs', () => {
    assert.deepEqual(buildCareerState(inputs()), buildCareerState(inputs()));
  });

  it('throws one CareerRuleError listing every cross-entry violation', () => {
    const bad = inputs({
      overrides: [override({ id: 'ghost', isBoss: true }), override({ id: 'web-app', isBoss: true })],
      skills: [...baseSkills, skill({ id: 'orphan', parent: 'nope' })],
      changelog: [entry('later', '2026-11-01')],
    });
    assert.throws(
      () => buildCareerState(bad),
      (error: unknown) => {
        assert.ok(error instanceof CareerRuleError);
        assert.deepEqual(
          error.issues.map((item) => `${item.source} ${item.id}`),
          ['skill orphan', 'quest ghost', 'quest ghost, web-app', 'changelog later'],
        );
        assert.match(error.message, /rules failed \(4\)/);
        assert.match(error.message, /- quest ghost: no public repo with slug "ghost"/);
        return true;
      },
    );
  });

  it('an empty snapshot is a rule error, not a crash', () => {
    assert.throws(() => buildCareerState(inputs({ snapshot: snapshot([]), overrides: [] })), /no public repos/);
  });
});

describe('validateQuestOverrides', () => {
  it('flags repos whose names collide on one slug', () => {
    const issues = validateQuestOverrides([], snapshot([repo({ name: 'MyApp' }), repo({ name: 'my-app' })]));
    assert.deepEqual(issues.map((i) => i.id), ['my-app']);
    assert.match(issues[0].problem, /MyApp, my-app share the slug/);
  });

  it('accepts overrides that name real repos, with at most one boss', () => {
    assert.deepEqual(validateQuestOverrides([override({ id: 'web-app', isBoss: true }), override({ id: 'gopher' })], snapshot([webApp, gopher])), []);
  });
});
