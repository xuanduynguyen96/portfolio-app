import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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

  it('exact ties break deterministically: repo majority first, then archetype order', () => {
    const tie = snapshot([lang('svc', 'Go', 10), lang('site', 'Swift', 10)]);
    const profile = classifyCharacter(tie);
    assert.equal(profile.scores.backend, profile.scores.frontend);
    assert.equal(profile.primary, 'backend', 'ARCHETYPE_IDS order: backend before frontend');
    const majority = snapshot([lang('svc', 'Go', 10, { commits: 1000 }), lang('site', 'Swift', 10), lang('app', 'Swift', 10, { pushedWeek: '1990-01-01', isArchived: true })]);
    assert.ok(classifyCharacter(majority).scores.backend > 0);
  });

  it('one huge repo cannot outvote many repos (each repo votes at most ~1)', () => {
    const profile = classifyCharacter(snapshot([
      lang('monolith', 'Java', 50_000, { commits: 5000 }),
      lang('a', 'TypeScript', 10), lang('b', 'JavaScript', 10), lang('c', 'Swift', 10), lang('d', 'HTML', 10),
    ]));
    assert.equal(profile.classId, 'archer');
  });

  it('is a pure function of the snapshot: build time never matters', () => {
    assert.deepEqual(classifyCharacter(ownerLike()), classifyCharacter(ownerLike()));
    assert.notDeepEqual(classifyCharacter(snapshot(ownerLike().repos, '2036-10-13')).scores, classifyCharacter(ownerLike()).scores,
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
