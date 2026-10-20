import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CLASS_IDS, CLASS_NAMES, JOBS, MOTIF_IDS } from '../../src/data/character-job-rules.ts';
import {
  allClassLooks, changeClass, changeMotif, defaultLook, isValidLook, lookKey, lookProfile, motifsFor,
  parseClassId, parseLookKey, parseMotif, parseStoredLook, sameLook, type ClassLook,
} from '../../src/utils/avatar/class-looks.ts';
import { classifyCharacter } from '../../src/utils/github-character/classify-character.ts';
import { avatarProfile } from './avatar-test-helpers.ts';
import { hybridStack, pureDevops, snapshot, sparse } from './github-snapshot-fixtures.ts';

const LOOKS = allClassLooks();

describe('allClassLooks', () => {
  it('is 3 combat classes x 3 jobs + Adventurer, all valid and unique', () => {
    assert.equal(LOOKS.length, (CLASS_IDS.length - 1) * MOTIF_IDS.length + 1);
    assert.equal(LOOKS.length, 10);
    assert.equal(LOOKS.filter((l) => l.classId === 'adventurer').length, 1);
    assert.equal(new Set(LOOKS.map(lookKey)).size, LOOKS.length);
    assert.ok(LOOKS.every(isValidLook));
  });
});

describe('motifsFor / isValidLook', () => {
  it('Adventurer has no jobs; combat classes have every job slot', () => {
    assert.deepEqual(motifsFor('adventurer'), []);
    for (const classId of CLASS_IDS.filter((id) => id !== 'adventurer')) assert.deepEqual(motifsFor(classId), MOTIF_IDS);
  });

  it('rejects Adventurer + job, combat class without job, and unknown values', () => {
    assert.equal(isValidLook({ classId: 'adventurer', motif: 'hawk' }), false);
    assert.equal(isValidLook({ classId: 'mage', motif: null }), false);
    assert.equal(isValidLook({ classId: 'mage', motif: 'nope' as never }), false);
    assert.equal(isValidLook({ classId: 'nope' as never, motif: null }), false);
  });
});

describe('parsers', () => {
  it('parseClassId / parseMotif accept only rule ids', () => {
    for (const id of CLASS_IDS) assert.equal(parseClassId(id), id);
    for (const id of MOTIF_IDS) assert.equal(parseMotif(id), id);
    for (const bad of ['', 'Warrior', 'constructor', '__proto__', 'warrior ', null, undefined, 7, {}]) {
      assert.equal(parseClassId(bad), null);
      assert.equal(parseMotif(bad), null);
    }
  });

  it('lookKey / parseLookKey round trip for all 10 looks', () => {
    for (const look of LOOKS) assert.deepEqual(parseLookKey(lookKey(look)), look);
    assert.equal(lookKey({ classId: 'mage', motif: 'hawk' }), 'mage/hawk');
    assert.equal(lookKey({ classId: 'adventurer', motif: null }), 'adventurer');
  });

  it('parseLookKey rejects anything else', () => {
    const bad = ['', 'warrior', 'Warrior/banner', 'warrior/x', 'adventurer/hawk', '__proto__/hawk', 'mage/hawk/x',
      'mage/', '/hawk', ' mage/hawk', 'mage/hawk ', null, undefined, 3, {}, ['mage/hawk']];
    for (const key of bad) assert.equal(parseLookKey(key), null, String(key));
  });

  it('keys saved by older versions (class/archetype motifs) are rejected', () => {
    for (const key of ['mage/data', 'warrior/data', 'warrior/frontend', 'archer/backend', 'mage/backend']) {
      assert.equal(parseLookKey(key), null, key);
      assert.equal(parseStoredLook(key), null, key);
    }
  });

  it('parseStoredLook is the same allow-list', () => {
    assert.deepEqual(parseStoredLook('archer/crystal'), { classId: 'archer', motif: 'crystal' });
    assert.equal(parseStoredLook('<script>'), null);
  });
});

describe('defaultLook', () => {
  it('is the classifier output as a valid look', () => {
    for (const snap of [hybridStack(), pureDevops(), sparse(), snapshot([])]) {
      const look = defaultLook(classifyCharacter(snap));
      assert.ok(isValidLook(look), lookKey(look));
    }
    assert.deepEqual(defaultLook(classifyCharacter(hybridStack())), { classId: 'warrior', motif: 'banner' });
    assert.deepEqual(defaultLook(classifyCharacter(snapshot([]))), { classId: 'adventurer', motif: null });
  });

  it('drops a stray motif on Adventurer', () => {
    assert.deepEqual(defaultLook({ classId: 'adventurer', motif: 'hawk' }), { classId: 'adventurer', motif: null });
  });
});

describe('changeClass / changeMotif', () => {
  const pick: ClassLook = { classId: 'warrior', motif: 'banner' };

  it('never leaves the valid set (exhaustive: class x current look)', () => {
    for (const current of LOOKS) {
      for (const classId of CLASS_IDS) assert.ok(isValidLook(changeClass(current, classId, pick)), `${lookKey(current)} -> ${classId}`);
    }
  });

  it('keeps the job slot (prop) across combat classes; the job name follows the class', () => {
    const next = changeClass({ classId: 'warrior', motif: 'hawk' }, 'archer', pick);
    assert.deepEqual(next, { classId: 'archer', motif: 'hawk' });
    assert.equal(lookProfile(next, []).jobName, 'Herald');
  });

  it('from Adventurer uses the pick job slot, else the first slot', () => {
    const adventurer: ClassLook = { classId: 'adventurer', motif: null };
    assert.deepEqual(changeClass(adventurer, 'mage', pick), { classId: 'mage', motif: 'banner' });
    assert.deepEqual(changeClass(adventurer, 'mage', adventurer), { classId: 'mage', motif: MOTIF_IDS[0] });
  });

  it('to Adventurer drops the job', () => {
    assert.deepEqual(changeClass({ classId: 'mage', motif: 'hawk' }, 'adventurer', pick), { classId: 'adventurer', motif: null });
  });

  it('changeMotif changes the job, ignores Adventurer and unknown jobs', () => {
    assert.deepEqual(changeMotif({ classId: 'mage', motif: 'hawk' }, 'crystal'), { classId: 'mage', motif: 'crystal' });
    const adventurer: ClassLook = { classId: 'adventurer', motif: null };
    assert.equal(changeMotif(adventurer, 'hawk'), adventurer);
    const mage: ClassLook = { classId: 'mage', motif: 'hawk' };
    assert.equal(changeMotif(mage, 'nope' as never), mage);
  });

  it('sameLook compares class and job', () => {
    assert.ok(sameLook(pick, { ...pick }));
    assert.ok(!sameLook(pick, { classId: 'warrior', motif: 'hawk' }));
  });
});

describe('lookProfile', () => {
  const gear = avatarProfile('warrior', 'banner', [0, 1, 2, 3]).gear;

  it('takes names from the rules and passes gear through untouched', () => {
    for (const look of LOOKS) {
      const profile = lookProfile(look, gear);
      assert.equal(profile.className, CLASS_NAMES[look.classId]);
      assert.equal(profile.jobName, look.motif && look.classId !== 'adventurer' ? JOBS[look.classId].find((job) => job.motif === look.motif)?.name : null);
      assert.equal(profile.gear, gear);
      assert.deepEqual(profile.gear.map((g) => g.tier), [0, 1, 2, 3]);
    }
  });
});
