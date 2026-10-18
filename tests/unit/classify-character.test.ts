import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { classRules } from '../../src/data/character-class-rules.ts';
import { classifyCharacter } from '../../src/utils/github-character/classify-character.ts';
import { lang, ownerLike, pureArcher, pureMage, pureWarrior, repo, snapshot, sparse } from './github-snapshot-fixtures.ts';

const label = (profile: ReturnType<typeof classifyCharacter>) => `${profile.className}${profile.jobName ? ` · ${profile.jobName}` : ''}`;

describe('classifyCharacter', () => {
  it('pure profiles land on their class with the pure job', () => {
    assert.equal(label(classifyCharacter(pureWarrior())), 'Warrior · Knight');
    assert.equal(label(classifyCharacter(pureMage())), 'Mage · Sorcerer');
    assert.equal(label(classifyCharacter(pureArcher())), 'Archer · Ranger');
  });

  it('a hybrid gets the runner-up archetype as job motif', () => {
    const profile = classifyCharacter(ownerLike());
    assert.equal(label(profile), 'Warrior · Vanguard');
    assert.equal(profile.primary, 'backend');
    assert.equal(profile.secondary, 'frontend');
    assert.equal(profile.motif, 'frontend');
  });

  it('a weak runner-up is no secondary: the job stays pure', () => {
    const profile = classifyCharacter(snapshot([...pureWarrior().repos, lang('tiny-site', 'HTML', 5, { pushedWeek: '2019-01-07' })]));
    assert.equal(profile.secondary, null);
    assert.equal(profile.jobId, 'knight');
  });

  it('too little evidence -> Adventurer without job or motif', () => {
    const profile = classifyCharacter(sparse());
    assert.equal(profile.classId, 'adventurer');
    assert.equal(profile.jobId, null);
    assert.equal(profile.motif, null);
    assert.equal(classifyCharacter(snapshot([])).classId, 'adventurer');
  });

  it('exact score ties break by repo majority first, then archetype order', () => {
    const byOrder = classifyCharacter(snapshot([lang('svc', 'Go', 10), lang('site', 'Swift', 10), lang('svc2', 'Go', 10), lang('site2', 'Swift', 10)]));
    assert.equal(byOrder.scores.backend, byOrder.scores.frontend);
    assert.equal(byOrder.primary, 'backend', 'equal scores and repo counts: ARCHETYPE_IDS order');
    // One fresh Go repo vs two archetyped (halved) Swift repos: equal scores, frontend tops more repos.
    const byMajority = classifyCharacter(snapshot([
      lang('svc', 'Go'), lang('s1', 'Swift', 20, { isArchived: true }), lang('s2', 'Swift', 20, { isArchived: true }),
    ]));
    assert.equal(byMajority.scores.backend, byMajority.scores.frontend);
    assert.equal(byMajority.primary, 'frontend');
  });

  it('single-stack TS / Python / Kotlin profiles get the pure job (language leakage is no secondary)', () => {
    const four = (language: string) => snapshot(['a', 'b', 'c', 'd'].map((name) => lang(name, language)));
    assert.equal(label(classifyCharacter(four('TypeScript'))), 'Archer · Ranger');
    assert.equal(label(classifyCharacter(four('Python'))), 'Mage · Sorcerer');
    assert.equal(label(classifyCharacter(four('Kotlin'))), 'Archer · Ranger');
  });

  it('a weak total is Adventurer even with enough voting repos', () => {
    const old = { pushedWeek: '2010-01-04', commits: 0 };
    const profile = classifyCharacter(snapshot([lang('a', 'Go', 20, old), lang('b', 'Go', 20, old)]));
    assert.ok(profile.scores.backend < classRules.fallback.minTotal);
    assert.equal(profile.classId, 'adventurer');
  });

  it('a repo adds at most 1 x max activity to a score, however big', () => {
    const profile = classifyCharacter(snapshot([lang('monolith', 'Java', 50_000, { commits: 5000 }), lang('x', 'Go', 1, { commits: 0 })]));
    assert.ok(profile.scores.backend <= 2 + classRules.activity.max + 1e-9);
  });

  it('is a pure function of the snapshot: the clock never matters', () => {
    const before = classifyCharacter(ownerLike());
    mock.timers.enable({ apis: ['Date'], now: Date.parse('2040-01-01T00:00:00Z') });
    try {
      assert.deepEqual(classifyCharacter(ownerLike()), before);
    } finally {
      mock.timers.reset();
    }
    assert.notDeepEqual(classifyCharacter(snapshot(ownerLike().repos, '2036-10-13')).scores, before.scores,
      'a later asOf (not the clock) changes recency');
  });

  it('signals: primary first (max 5), ranked by points, each with a reason', () => {
    const profile = classifyCharacter(ownerLike());
    const primary = profile.signals.filter((s) => s.archetype === 'backend');
    assert.ok(primary.length <= 5 && primary.length > 0);
    assert.equal(profile.signals[0].archetype, 'backend');
    for (let i = 1; i < primary.length; i++) assert.ok(primary[i - 1].points >= primary[i].points);
    assert.ok(profile.signals.every((s) => s.reason.length > 0));
    assert.ok(profile.signals.filter((s) => s.archetype === 'frontend').length <= 2);
  });

  it('repos without language or keyword do not vote', () => {
    const profile = classifyCharacter(snapshot([repo({ name: 'empty' }), repo({ name: 'notes' }), lang('svc', 'Go')]));
    assert.equal(profile.classId, 'adventurer', 'only one voting repo');
  });
});
