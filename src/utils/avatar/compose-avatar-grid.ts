// Pure layer compositor: places sprite layers on a 32x32 canvas in LAYER_Z order (stable within a
// slot) where the last opaque pixel wins. Inputs are never mutated.
import { LAYER_Z, type SpriteLayer } from '../../data/avatar/avatar-types.ts';
import { TRANSPARENT } from '../../data/avatar/avatar-palette.ts';

export const AVATAR_SIZE = 32;

export function sortLayers(layers: readonly SpriteLayer[]): SpriteLayer[] {
  return layers
    .map((layer, index) => ({ layer, index }))
    .sort((a, b) => LAYER_Z[a.layer.slot] - LAYER_Z[b.layer.slot] || a.index - b.index)
    .map(({ layer }) => layer);
}

/** 32 rows of 32 chars; `.` where no layer paints. Pixels outside the canvas are dropped. */
export function composeAvatarGrid(layers: readonly SpriteLayer[]): string[] {
  const cells = Array.from({ length: AVATAR_SIZE }, () => Array<string>(AVATAR_SIZE).fill(TRANSPARENT));
  for (const layer of sortLayers(layers)) {
    layer.rows.forEach((row, dy) => {
      const y = layer.y + dy;
      if (y < 0 || y >= AVATAR_SIZE) return;
      for (let dx = 0; dx < row.length; dx += 1) {
        const x = layer.x + dx;
        const char = row[dx];
        if (char !== TRANSPARENT && x >= 0 && x < AVATAR_SIZE) cells[y][x] = char;
      }
    });
  }
  return cells.map((row) => row.join(''));
}
