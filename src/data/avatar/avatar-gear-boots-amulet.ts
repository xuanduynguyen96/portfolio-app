// Boots (Automation) and amulet (Docs). Boots: 5x4, toes left, row 0 = cuff over the leg (drawn on
// both feet). Amulet: 5x5 cord + pendant at the neck. Tier 0 leather, 1 bronze, 2 iron, 3 gold + glint.
import type { TieredRows } from './avatar-types.ts';

export const bootTiers: TieredRows = [
  ['.....', '.lllL', 'llllL', 'LLLLL'],
  ['...bL', 'blllL', 'bllbL', 'LLLLL'],
  ['.kkiI', 'kkliI', 'klliI', 'IIIII'],
  ['.xyyb', 'yylyb', 'yllyb', 'bbbbb'],
];

export const amuletTiers: TieredRows = [
  ['L...L', '.L.L.', '..l..', '.....', '.....'],
  ['L...L', '.L.L.', '.bbb.', '..b..', '.....'],
  ['i...i', '.i.i.', '.kkI.', '.kII.', '..I..'],
  ['y...y', '.y.y.', 'yxyyb', '.yyb.', '..b..'],
];
