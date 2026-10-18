import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { lookTitle, statusMessage, suggestionLine, SWITCH_FAILED_MESSAGE } from '../../src/utils/avatar/class-labels.ts';
import { allClassLooks } from '../../src/utils/avatar/class-looks.ts';
import { characterTitle } from '../../src/utils/github-character/character-title.ts';
import { classifyCharacter } from '../../src/utils/github-character/classify-character.ts';
import { ownerLike } from './github-snapshot-fixtures.ts';

describe('lookTitle', () => {
  it('matches characterTitle of the classifier output for the derived look', () => {
    const derived = classifyCharacter(ownerLike());
    assert.equal(lookTitle({ classId: derived.classId, motif: derived.motif }), characterTitle(derived));
    assert.equal(lookTitle({ classId: 'warrior', motif: 'frontend' }), 'Warrior · Vanguard');
  });

  it('formats every look; Adventurer is class only', () => {
    assert.equal(lookTitle({ classId: 'mage', motif: 'data' }), 'Mage · Sorcerer');
    assert.equal(lookTitle({ classId: 'adventurer', motif: null }), 'Adventurer');
    const titles = allClassLooks().map(lookTitle);
    assert.equal(new Set(titles).size, titles.length);
  });
});

describe('messages', () => {
  it('suggestion line names the GitHub pick', () => {
    assert.equal(suggestionLine('Warrior · Vanguard'), 'GitHub pick: Warrior · Vanguard');
  });

  it('status says GitHub pick when default, names both titles otherwise', () => {
    assert.equal(statusMessage('Warrior · Vanguard', 'Warrior · Vanguard', true), 'Showing the GitHub pick: Warrior · Vanguard.');
    const other = statusMessage('Mage · Sorcerer', 'Warrior · Vanguard', false);
    assert.match(other, /Mage · Sorcerer/);
    assert.match(other, /GitHub pick is Warrior · Vanguard/);
  });

  it('failure message falls back to the GitHub pick', () => {
    assert.match(SWITCH_FAILED_MESSAGE, /GitHub pick/);
  });
});
