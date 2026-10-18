// Finished sticker grid -> one <path> per palette key (runs merged across rows, see gridToMergedPathData).
// Keys come out in palette order: ring, outline, then colors (paint order does not matter: one key per cell).
import { avatarCssVar, isPaletteKey, PALETTE_KEYS, type PaletteKey } from '../../data/avatar/avatar-palette.ts';
import { gridHasChar, gridToMergedPathData } from '../pixel-icon-path.ts';

export interface AvatarPath {
  key: PaletteKey;
  cssVar: string;
  d: string;
}

export function avatarPaths(grid: readonly string[]): AvatarPath[] {
  for (const row of grid) {
    for (const char of row) {
      if (char !== '.' && !isPaletteKey(char)) throw new Error(`Unknown avatar palette key "${char}"`);
    }
  }
  return PALETTE_KEYS.filter((key) => gridHasChar(grid, key)).map((key) => ({
    key,
    cssVar: avatarCssVar(key),
    d: gridToMergedPathData(grid, key),
  }));
}
