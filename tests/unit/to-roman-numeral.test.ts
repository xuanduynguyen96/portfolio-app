import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toRomanNumeral } from '../../src/utils/to-roman-numeral.ts';

describe('toRomanNumeral', () => {
  it('converts additive and subtractive forms', () => {
    const cases: [number, string][] = [
      [1, 'I'],
      [3, 'III'],
      [4, 'IV'],
      [6, 'VI'],
      [7, 'VII'],
      [9, 'IX'],
      [14, 'XIV'],
      [40, 'XL'],
      [90, 'XC'],
      [400, 'CD'],
      [1994, 'MCMXCIV'],
      [3999, 'MMMCMXCIX'],
    ];
    for (const [value, expected] of cases) assert.equal(toRomanNumeral(value), expected, String(value));
  });

  it('throws RangeError outside 1-3999 and for non-integers', () => {
    for (const value of [0, -1, 4000, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      assert.throws(() => toRomanNumeral(value), RangeError, String(value));
    }
  });
});
