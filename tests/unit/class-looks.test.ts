import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ARCHETYPE_IDS } from '../../src/data/character-class-rules.ts';
import { CLASS_IDS, CLASS_NAMES, JOBS } from '../../src/data/character-job-rules.ts';
import {
  allClassLooks, changeClass, changeMotif, defaultLook, isValidLook, lookKey, lookProfile, motifsFor,
  parseClassId, parseLookKey, parseMotif, parseStoredLook, sameLook, type ClassLook,
} from '../../src/utils/avatar/class-looks.ts';
import { classifyCharacter } from '../../src/utils/github-character/classify-character.ts';
import { avatarProfile } from './avatar-test-helpers.ts';
import { ownerLike, pureMage, snapshot, sparse } from './github-snapshot-fixtures.ts';

const LOOKS = allClassLooks();

describe('allClassLooks', () => {
  it('is 3 combat classes x 3 jobs + Adventurer, all valid and unique', () => {
    assert.equal(LOOKS.length, ARCHETYPE_IDS.length ** 2 + 1);
    assert.equal(LOOKS.filter((l) => l.classId === 'adventurer').length, 1);
    assert.equal(new Set(LOOKS.map(lookKey)).size, LOOKS.length);
    assert.ok(LOOKS.every(isValidLook));
  });
});

describe('motifsFor / isValidLook', () => {
  it('Adventurer has no jobs; combat classes have every archetype', () => {
    assert.deepEqual(motifsFor('adventurer'), []);
    for (const classId of CLASS_IDS.filter((id) => id !== 'adventurer')) assert.deepEqual(motifsFor(classId), ARCHETYPE_IDS);
  });

  it('rejects Adventurer + job, combat class without job, and unknown values', () => {
    assert.equal(isValidLook({ classId: 'adventurer', motif: 'data' }), false);
    assert.equal(isValidLook({ classId: 'mage', motif: null }), false);
    assert.equal(isValidLook({ classId: 'mage', motif: 'nope' as never }), false);
    assert.equal(isValidLook({ classId: 'nope' as never, motif: null }), false);
  });
});

describe('parsers', () => {
  it('parseClassId / parseMotif accept only rule ids', () => {
    for (const id of CLASS_IDS) assert.equal(parseClassId(id), id);
    for (const id of ARCHETYPE_IDS) assert.equal(parseMotif(id), id);
    for (const bad of ['', 'Warrior', 'constructor', '__proto__', 'warrior ', null, undefined, 7, {}]) {
      assert.equal(parseClassId(bad), null);
      assert.equal(parseMotif(bad), null);
    }
  });

  it('lookKey / parseLookKey round trip for all 10 looks', () => {
    for (const look of LOOKS) assert.deepEqual(parseLookKey(lookKey(look)), look);
    assert.equal(lookKey({ classId: 'mage', motif: 'data' }), 'mage/data');
    assert.equal(lookKey({ classId: 'adventurer', motif: null }), 'adventurer');
  });

  it('parseLookKey rejects anything else', () => {
    const bad = ['', 'warrior', 'Warrior/backend', 'warrior/x', 'adventurer/data', '__proto__/data', 'mage/data/x',
      'mage/', '/data', ' mage/data', 'mage/data ', null, undefined, 3, {}, ['mage/data']];
    for (const key of bad) assert.equal(parseLookKey(key), null, String(key));
  });

  it('parseStoredLook is the same allow-list', () => {
    assert.deepEqual(parseStoredLook('archer/frontend'), { classId: 'archer', motif: 'frontend' });
    assert.equal(parseStoredLook('<script>'), null);
  });
});

describe('defaultLook', () => {
  it('is the classifier output as a valid look', () => {
    for (const snap of [ownerLike(), pureMage(), sparse(), snapshot([])]) {
      const look = defaultLook(classifyCharacter(snap));
      assert.ok(isValidLook(look), lookKey(look));
    }
    assert.deepEqual(defaultLook(classifyCharacter(ownerLike())), { classId: 'warrior', motif: 'frontend' });
    assert.deepEqual(defaultLook(classifyCharacter(snapshot([]))), { classId: 'adventurer', motif: null });
  });

  it('drops a stray motif on Adventurer', () => {
    assert.deepEqual(defaultLook({ classId: 'adventurer', motif: 'data' }), { classId: 'adventurer', motif: null });
  });
});

describe('changeClass / changeMotif', () => {
  const pick: ClassLook = { classId: 'warrior', motif: 'frontend' };

  it('never leaves the valid set (exhaustive: class x current look)', () => {
    for (const current of LOOKS) {
      for (const classId of CLASS_IDS) assert.ok(isValidLook(changeClass(current, classId, pick)), `${lookKey(current)} -> ${classId}`);
    }
  });

  it('keeps the job across combat classes', () => {
    assert.deepEqual(changeClass({ classId: 'warrior', motif: 'data' }, 'archer', pick), { classId: 'archer', motif: 'data' });
  });

  it('from Adventurer uses the pick job, else the first archetype', () => {
    const adventurer: ClassLook = { classId: 'adventurer', motif: null };
    assert.deepEqual(changeClass(adventurer, 'mage', pick), { classId: 'mage', motif: 'frontend' });
    assert.deepEqual(changeClass(adventurer, 'mage', adventurer), { classId: 'mage', motif: ARCHETYPE_IDS[0] });
  });

  it('to Adventurer drops the job', () => {
    assert.deepEqual(changeClass({ classId: 'mage', motif: 'data' }, 'adventurer', pick), { classId: 'adventurer', motif: null });
  });

  it('changeMotif changes the job, ignores Adventurer and unknown jobs', () => {
    assert.deepEqual(changeMotif({ classId: 'mage', motif: 'data' }, 'backend'), { classId: 'mage', motif: 'backend' });
    const adventurer: ClassLook = { classId: 'adventurer', motif: null };
    assert.equal(changeMotif(adventurer, 'data'), adventurer);
    const mage: ClassLook = { classId: 'mage', motif: 'data' };
    assert.equal(changeMotif(mage, 'nope' as never), mage);
  });

  it('sameLook compares class and job', () => {
    assert.ok(sameLook(pick, { ...pick }));
    assert.ok(!sameLook(pick, { classId: 'warrior', motif: 'data' }));
  });
});

describe('lookProfile', () => {
  const gear = avatarProfile('warrior', 'frontend', [0, 1, 2, 3]).gear;

  it('takes names from the rules and passes gear through untouched', () => {
    for (const look of LOOKS) {
      const profile = lookProfile(look, gear);
      assert.equal(profile.className, CLASS_NAMES[look.classId]);
      assert.equal(profile.jobName, look.motif && look.classId !== 'adventurer' ? JOBS[look.classId][look.motif].name : null);
      assert.equal(profile.gear, gear);
      assert.deepEqual(profile.gear.map((g) => g.tier), [0, 1, 2, 3]);
    }
  });
});
