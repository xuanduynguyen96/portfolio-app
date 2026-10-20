import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CLASS_NAMES, JOBS, MOTIF_IDS } from '../../src/data/character-job-rules.ts';
import { lookTitle, statusMessage, suggestionLine, SWITCH_FAILED_MESSAGE } from '../../src/utils/avatar/class-labels.ts';
import { allClassLooks } from '../../src/utils/avatar/class-looks.ts';
import { characterTitle } from '../../src/utils/github-character/character-title.ts';
import { classifyCharacter } from '../../src/utils/github-character/classify-character.ts';
import { hybridStack } from './github-snapshot-fixtures.ts';

describe('lookTitle', () => {
  it('matches characterTitle of the classifier output for the derived look', () => {
    const derived = classifyCharacter(hybridStack());
    assert.equal(lookTitle({ classId: derived.classId, motif: derived.motif }), characterTitle(derived));
    assert.equal(lookTitle({ classId: 'warrior', motif: 'banner' }), 'Warrior · Knight');
  });

  it('formats every look; Adventurer is class only', () => {
    assert.equal(lookTitle({ classId: 'mage', motif: 'hawk' }), 'Mage · Seer');
    assert.equal(lookTitle({ classId: 'adventurer', motif: null }), 'Adventurer');
    const titles = allClassLooks().map(lookTitle);
    assert.equal(titles.length, 10);
    assert.equal(new Set(titles).size, titles.length);
    for (const classId of ['warrior', 'archer', 'mage'] as const) {
      assert.deepEqual(
        MOTIF_IDS.map((motif) => lookTitle({ classId, motif })),
        JOBS[classId].map((job) => `${CLASS_NAMES[classId]} · ${job.name}`),
      );
    }
  });
});

describe('messages', () => {
  it('suggestion line names the GitHub pick', () => {
    assert.equal(suggestionLine('Warrior · Knight'), 'GitHub pick: Warrior · Knight');
  });

  it('status says GitHub pick when default, names both titles otherwise', () => {
    assert.equal(statusMessage('Warrior · Knight', 'Warrior · Knight', true), 'Showing the GitHub pick: Warrior · Knight.');
    const other = statusMessage('Mage · Seer', 'Warrior · Knight', false);
    assert.match(other, /Mage · Seer/);
    assert.match(other, /GitHub pick is Warrior · Knight/);
  });

  it('failure message falls back to the GitHub pick', () => {
    assert.match(SWITCH_FAILED_MESSAGE, /GitHub pick/);
  });
});
