// Armor slot (Security): 8x6 sprite on the chest, bottom row = belt line. Tier 0 leather strap +
// belt, 1 bronze studs + buckle, 2 iron chest plate, 3 gold-trimmed plate with a glint.
import type { TieredRows } from './avatar-types.ts';

export const armorTiers: TieredRows = [
  [
    '......lL',
    '.....lL.',
    '....lL..',
    '...lL...',
    '..lL....',
    'LLlLLLLL',
  ],
  [
    '......bL',
    '.....lL.',
    '....bL..',
    '...lL...',
    '.bbL....',
    'LbbLLLLL',
  ],
  [
    '.....kiI',
    '.kkkkiI.',
    '.kiiiI..',
    '.kiiI...',
    '.kiII...',
    'IkiIIIII',
  ],
  [
    '....xyyb',
    '.yyyyyb.',
    '.ykkib..',
    '.ykib...',
    '.yybb...',
    'byybbbbb',
  ],
];
