// Sticker finish for a composed 32x32 grid: pad to 36x36 (viewBox 0 0 36 36), add a 1px 8-neighbour
// outline `o` around every opaque pixel, then a 2px die-cut ring `#` with rounded corners.
import { OUTLINE_KEY, STICKER_KEY, TRANSPARENT } from '../../data/avatar/avatar-palette.ts';
import type { SpriteLayer } from '../../data/avatar/avatar-types.ts';
import { composeAvatarGrid } from './compose-avatar-grid.ts';

export const STICKER_PAD = 2;
export const STICKER_RING_RADIUS_SQ = 5; // offsets with dx^2 + dy^2 <= 5: 2px ring, corners cut

export function padGrid(grid: readonly string[], pad: number): string[] {
  const width = (grid[0]?.length ?? 0) + 2 * pad;
  const empty = TRANSPARENT.repeat(width);
  const side = TRANSPARENT.repeat(pad);
  return [...Array(pad).fill(empty), ...grid.map((row) => side + row + side), ...Array(pad).fill(empty)];
}

/** Marks each transparent cell that touches (incl. diagonals) a filled non-outline cell with `o`. */
export function outlineGrid(grid: readonly string[]): string[] {
  return mapTransparent(grid, (x, y) => {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const char = grid[y + dy]?.[x + dx];
        if (char !== undefined && char !== TRANSPARENT && char !== OUTLINE_KEY) return OUTLINE_KEY;
      }
    }
    return TRANSPARENT;
  });
}

/** Marks each transparent cell within the rounded 2px radius of any filled cell with `#`. */
export function stickerRing(grid: readonly string[]): string[] {
  return mapTransparent(grid, (x, y) => {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        if (dx * dx + dy * dy > STICKER_RING_RADIUS_SQ) continue;
        const char = grid[y + dy]?.[x + dx];
        if (char !== undefined && char !== TRANSPARENT) return STICKER_KEY;
      }
    }
    return TRANSPARENT;
  });
}

/** Layers -> finished 36x36 sticker grid (art + outline + ring). */
export function composeAvatarSprite(layers: readonly SpriteLayer[]): string[] {
  return stickerRing(outlineGrid(padGrid(composeAvatarGrid(layers), STICKER_PAD)));
}

function mapTransparent(grid: readonly string[], fill: (x: number, y: number) => string): string[] {
  return grid.map((row, y) =>
    Array.from(row, (char, x) => (char === TRANSPARENT ? fill(x, y) : char)).join(''),
  );
}
