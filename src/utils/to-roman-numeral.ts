const NUMERALS = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
] as const;

/** 14 -> "XIV". Section "chapter" numbers; throws outside 1-3999 (no standard form). */
export function toRomanNumeral(value: number): string {
  if (!Number.isInteger(value) || value < 1 || value > 3999) {
    throw new RangeError(`toRomanNumeral: expected an integer 1-3999, got ${value}`);
  }
  let rest = value;
  let result = '';
  for (const [amount, numeral] of NUMERALS) {
    while (rest >= amount) {
      result += numeral;
      rest -= amount;
    }
  }
  return result;
}
