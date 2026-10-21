import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CLASS_IDS, CLASS_NAMES, JOB_IDS, JOBS } from '../../src/data/character-job-rules.ts';
import {
  allClassLooks, changeClass, changeJob, defaultLook, isValidLook, jobsFor, lookKey, lookProfile,
  parseClassId, parseJobId, parseLookKey, parseStoredLook, sameLook, type ClassLook,
} from '../../src/utils/avatar/class-looks.ts';
import { classifyCharacter } from '../../src/utils/github-character/classify-character.ts';
import { avatarProfile } from './avatar-test-helpers.ts';
import { hybridStack, pureDevops, snapshot, sparse } from './github-snapshot-fixtures.ts';

const LOOKS = allClassLooks();

describe('allClassLooks', () => {
  it('is 3 combat classes x 3 jobs + Adventurer, all valid and unique', () => {
    assert.equal(LOOKS.length, (CLASS_IDS.length - 1) * 3 + 1);
    assert.equal(LOOKS.length, 10);
    assert.equal(LOOKS.filter((l) => l.classId === 'adventurer').length, 1);
    assert.equal(new Set(LOOKS.map(lookKey)).size, LOOKS.length);
    assert.ok(LOOKS.every(isValidLook));
  });
});

describe('jobsFor / isValidLook', () => {
  it('Adventurer has no jobs; combat classes have their own 3 jobs', () => {
    assert.deepEqual(jobsFor('adventurer'), []);
    assert.deepEqual(jobsFor('mage'), ['enchanter', 'summoner', 'seer']);
    for (const classId of CLASS_IDS.filter((id) => id !== 'adventurer')) assert.deepEqual(jobsFor(classId), JOBS[classId].map((job) => job.id));
  });

  it('rejects Adventurer + job, combat class without job, a job of another class, and unknown values', () => {
    assert.equal(isValidLook({ classId: 'adventurer', jobId: 'seer' }), false);
    assert.equal(isValidLook({ classId: 'mage', jobId: null }), false);
    assert.equal(isValidLook({ classId: 'mage', jobId: 'knight' }), false);
    assert.equal(isValidLook({ classId: 'mage', jobId: 'nope' as never }), false);
    assert.equal(isValidLook({ classId: 'nope' as never, jobId: null }), false);
  });
});

describe('parsers', () => {
  it('parseClassId / parseJobId accept only rule ids', () => {
    for (const id of CLASS_IDS) assert.equal(parseClassId(id), id);
    for (const id of JOB_IDS) assert.equal(parseJobId(id), id);
    for (const bad of ['', 'Warrior', 'constructor', '__proto__', 'warrior ', null, undefined, 7, {}]) {
      assert.equal(parseClassId(bad), null);
      assert.equal(parseJobId(bad), null);
    }
  });

  it('lookKey / parseLookKey round trip for all 10 looks', () => {
    for (const look of LOOKS) assert.deepEqual(parseLookKey(lookKey(look)), look);
    assert.equal(lookKey({ classId: 'mage', jobId: 'seer' }), 'mage/seer');
    assert.equal(lookKey({ classId: 'adventurer', jobId: null }), 'adventurer');
  });

  it('parseLookKey rejects anything else', () => {
    const bad = ['', 'warrior', 'Warrior/knight', 'warrior/x', 'adventurer/seer', '__proto__/seer', 'mage/seer/x', 'mage/knight',
      'archer/seer', 'mage/', '/seer', ' mage/seer', 'mage/seer ', null, undefined, 3, {}, ['mage/seer']];
    for (const key of bad) assert.equal(parseLookKey(key), null, String(key));
  });

  it('keys saved by older versions (archetype motifs, job-slot props) are rejected', () => {
    for (const key of ['mage/data', 'warrior/data', 'warrior/frontend', 'archer/backend', 'mage/backend',
      'mage/hawk', 'warrior/banner', 'archer/crystal']) {
      assert.equal(parseLookKey(key), null, key);
      assert.equal(parseStoredLook(key), null, key);
    }
  });

  it('parseStoredLook is the same allow-list', () => {
    assert.deepEqual(parseStoredLook('archer/skirmisher'), { classId: 'archer', jobId: 'skirmisher' });
    assert.equal(parseStoredLook('<script>'), null);
  });
});

describe('defaultLook', () => {
  it('is the classifier output as a valid look', () => {
    for (const snap of [hybridStack(), pureDevops(), sparse(), snapshot([])]) {
      const look = defaultLook(classifyCharacter(snap));
      assert.ok(isValidLook(look), lookKey(look));
    }
    assert.deepEqual(defaultLook(classifyCharacter(hybridStack())), { classId: 'warrior', jobId: 'knight' });
    assert.deepEqual(defaultLook(classifyCharacter(snapshot([]))), { classId: 'adventurer', jobId: null });
  });

  it('drops a stray job on Adventurer', () => {
    assert.deepEqual(defaultLook({ classId: 'adventurer', jobId: 'seer' }), { classId: 'adventurer', jobId: null });
  });
});

describe('changeClass / changeJob', () => {
  const pick: ClassLook = { classId: 'warrior', jobId: 'knight' };

  it('never leaves the valid set (exhaustive: class x current look)', () => {
    for (const current of LOOKS) {
      for (const classId of CLASS_IDS) assert.ok(isValidLook(changeClass(current, classId, pick)), `${lookKey(current)} -> ${classId}`);
    }
  });

  it('keeps the job slot across combat classes; the job follows the class', () => {
    const next = changeClass({ classId: 'warrior', jobId: 'sentinel' }, 'archer', pick);
    assert.deepEqual(next, { classId: 'archer', jobId: 'herald' });
    assert.equal(lookProfile(next, []).jobName, 'Herald');
    assert.deepEqual(changeClass(next, 'mage', pick), { classId: 'mage', jobId: 'seer' });
  });

  it('from Adventurer uses the pick job slot, else the first slot', () => {
    const adventurer: ClassLook = { classId: 'adventurer', jobId: null };
    assert.deepEqual(changeClass(adventurer, 'mage', { classId: 'archer', jobId: 'skirmisher' }), { classId: 'mage', jobId: 'summoner' });
    assert.deepEqual(changeClass(adventurer, 'mage', pick), { classId: 'mage', jobId: 'enchanter' });
    assert.deepEqual(changeClass(adventurer, 'mage', adventurer), { classId: 'mage', jobId: 'enchanter' });
  });

  it('to Adventurer drops the job', () => {
    assert.deepEqual(changeClass({ classId: 'mage', jobId: 'seer' }, 'adventurer', pick), { classId: 'adventurer', jobId: null });
  });

  it('changeJob changes the job, ignores Adventurer, jobs of another class and unknown jobs', () => {
    assert.deepEqual(changeJob({ classId: 'mage', jobId: 'seer' }, 'summoner'), { classId: 'mage', jobId: 'summoner' });
    const adventurer: ClassLook = { classId: 'adventurer', jobId: null };
    assert.equal(changeJob(adventurer, 'seer'), adventurer);
    const mage: ClassLook = { classId: 'mage', jobId: 'seer' };
    assert.equal(changeJob(mage, 'knight'), mage);
    assert.equal(changeJob(mage, 'nope' as never), mage);
  });

  it('sameLook compares class and job', () => {
    assert.ok(sameLook(pick, { ...pick }));
    assert.ok(!sameLook(pick, { classId: 'warrior', jobId: 'sentinel' }));
  });
});

describe('lookProfile', () => {
  const gear = avatarProfile('warrior', 'knight', [0, 1, 2, 3]).gear;

  it('takes names from the rules and passes gear through untouched', () => {
    for (const look of LOOKS) {
      const profile = lookProfile(look, gear);
      assert.equal(profile.className, CLASS_NAMES[look.classId]);
      assert.equal(profile.jobName, look.classId !== 'adventurer' ? JOBS[look.classId].find((job) => job.id === look.jobId)?.name : null);
      assert.equal(profile.jobId, look.jobId);
      assert.equal(profile.gear, gear);
      assert.deepEqual(profile.gear.map((g) => g.tier), [0, 1, 2, 3]);
    }
  });
});
