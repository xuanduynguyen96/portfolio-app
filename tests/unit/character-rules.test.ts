import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classRules, DOMAIN_IDS } from '../../src/data/character-class-rules.ts';
import { CLASS_BY_DOMAIN, CLASS_IDS, CLASS_NAMES, DOMAIN_LABELS, JOB_IDS, JOBS, jobAtSlot, jobSlot } from '../../src/data/character-job-rules.ts';
import { gearRules, GEAR_SLOT_IDS } from '../../src/data/gear-rules.ts';
import { skillNodes } from '../../src/data/skills-data.ts';

const COMBAT = Object.keys(JOBS) as (keyof typeof JOBS)[];
const allJobs = Object.values(JOBS).flat();
const skillIds = new Set(skillNodes.map((node) => node.id));

describe('classes and jobs', () => {
  it('each domain maps to its own combat class; Adventurer is the only fallback', () => {
    assert.deepEqual(Object.keys(CLASS_BY_DOMAIN).sort(), [...DOMAIN_IDS].sort());
    assert.equal(new Set(Object.values(CLASS_BY_DOMAIN)).size, DOMAIN_IDS.length);
    assert.deepEqual([...CLASS_IDS].sort(), [...Object.values(CLASS_BY_DOMAIN), 'adventurer'].sort());
    assert.deepEqual([...COMBAT].sort(), [...Object.values(CLASS_BY_DOMAIN)].sort());
    for (const classId of CLASS_IDS) assert.ok(CLASS_NAMES[classId]);
    for (const domain of DOMAIN_IDS) assert.ok(DOMAIN_LABELS[domain]);
  });

  it('9 unique jobs: 3 per class, ids are JOB_IDS in order, names unique', () => {
    assert.equal(allJobs.length, 9);
    assert.deepEqual(allJobs.map((job) => job.id), [...JOB_IDS]);
    assert.equal(new Set(allJobs.map((job) => job.name)).size, 9);
    for (const classId of COMBAT) assert.equal(JOBS[classId].length, 3, classId);
  });

  it('jobSlot / jobAtSlot map a job to its slot and back', () => {
    for (const classId of COMBAT) {
      JOBS[classId].forEach((job, slot) => {
        assert.equal(jobSlot(classId, job.id), slot);
        assert.equal(jobAtSlot(classId, slot), job.id);
      });
      assert.equal(jobAtSlot(classId, 7), JOBS[classId][0].id);
      assert.equal(jobAtSlot(classId, -1), JOBS[classId][0].id);
    }
    assert.equal(jobSlot('mage', 'knight'), -1);
    assert.equal(jobSlot('mage', null), -1);
    assert.equal(jobSlot('adventurer', 'knight'), -1);
  });

  it('every job has skills and a switcher hint', () => {
    for (const job of allJobs) {
      assert.ok(job.skills.length > 0 && job.specialty.length > 0, job.id);
    }
  });
});

describe('skill -> domain -> job table', () => {
  const { skillDomains } = classRules;

  it('every voting skill sits in exactly one job, of the class that owns its domain', () => {
    for (const [skill, domain] of Object.entries(skillDomains)) {
      const owners = COMBAT.flatMap((classId) => JOBS[classId].filter((job) => job.skills.includes(skill)).map((job) => ({ classId, job })));
      assert.equal(owners.length, 1, `${skill} must be in exactly one job`);
      assert.equal(owners[0].classId, CLASS_BY_DOMAIN[domain!], skill);
    }
  });

  it('no job skill is outside skillDomains; every id is a real, non-group skill', () => {
    for (const job of allJobs) {
      for (const skill of job.skills) assert.ok(skill in skillDomains, `${job.id}: ${skill} votes for nothing`);
    }
    for (const skill of Object.keys(skillDomains)) {
      assert.ok(skillIds.has(skill), `${skill} is not a skill`);
      assert.ok(skillNodes.find((node) => node.id === skill)?.match, `${skill} is a group (no match rule)`);
    }
  });

  it('every domain has at least one skill', () => {
    for (const domain of DOMAIN_IDS) assert.ok(Object.values(skillDomains).includes(domain), domain);
  });
});

describe('class rules numbers', () => {
  it('are sane', () => {
    assert.ok(classRules.minLanguageShare > 0 && classRules.minLanguageShare < 1);
    assert.ok(classRules.recency.halfLifeMonths > 0 && classRules.recency.floor > 0 && classRules.recency.floor < 1);
    assert.ok(classRules.activity.scale > 0 && classRules.activity.max > 0);
    assert.ok(classRules.archivedFactor > 0 && classRules.archivedFactor < 1);
    assert.ok(classRules.signals.domain > 0 && classRules.signals.job > 0);
    assert.ok(classRules.fallback.minTotal > 0 && classRules.fallback.minRepos >= 1);
  });
});

describe('gear rules', () => {
  it('one rule per slot, thresholds ascending and positive', () => {
    assert.deepEqual(gearRules.map((r) => r.slot), [...GEAR_SLOT_IDS]);
    for (const rule of gearRules) {
      const [a, b, c] = rule.thresholds;
      assert.ok(a >= 1 && a < b && b < c, rule.slot);
    }
  });
});
