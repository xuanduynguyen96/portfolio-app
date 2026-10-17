import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ARCHETYPE_IDS, classRules } from '../../src/data/character-class-rules.ts';
import { CLASS_BY_ARCHETYPE, CLASS_NAMES, JOBS } from '../../src/data/character-job-rules.ts';
import { gearRules, GEAR_SLOT_IDS } from '../../src/data/gear-rules.ts';

describe('character rules', () => {
  it('9 unique jobs: 3 per class, one pure job per class', () => {
    const all = Object.values(JOBS).flatMap((byMotif) => Object.values(byMotif));
    assert.equal(new Set(all.map((job) => job.id)).size, 9);
    assert.equal(new Set(all.map((job) => job.name)).size, 9);
    for (const archetype of ARCHETYPE_IDS) {
      const classId = CLASS_BY_ARCHETYPE[archetype];
      assert.equal(Object.keys(JOBS[classId]).length, 3);
      assert.ok(JOBS[classId][archetype], `${classId} has a pure job`);
      assert.ok(CLASS_NAMES[classId]);
    }
    assert.equal(new Set(Object.values(CLASS_BY_ARCHETYPE)).size, 3, 'each archetype maps to its own class');
  });

  it('language weights sum to 1 and never overlap the ignore list', () => {
    for (const [language, weights] of Object.entries(classRules.languages)) {
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(sum - 1) < 1e-9, language);
      assert.ok(!classRules.ignoredLanguages.includes(language), language);
    }
  });

  it('keywords are lowercase single words and unique', () => {
    const matches = classRules.keywords.map((k) => k.match);
    assert.equal(new Set(matches).size, matches.length);
    for (const match of matches) assert.match(match, /^[a-z0-9#+]+$/);
  });

  it('gear: one rule per slot, thresholds ascending and positive', () => {
    assert.deepEqual(gearRules.map((r) => r.slot), [...GEAR_SLOT_IDS]);
    for (const rule of gearRules) {
      const [a, b, c] = rule.thresholds;
      assert.ok(a >= 1 && a < b && b < c, rule.slot);
    }
  });
});
