import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ARCHETYPE_IDS } from '../../src/data/character-class-rules.ts';
import { CLASS_BY_ARCHETYPE } from '../../src/data/character-job-rules.ts';
import { composeAvatarGrid } from '../../src/utils/avatar/compose-avatar-grid.ts';
import { outlineGrid, padGrid, STICKER_PAD } from '../../src/utils/avatar/avatar-sticker-outline.ts';
import { selectAvatarLayers } from '../../src/utils/avatar/select-avatar-layers.ts';
import { avatarProfile, isOpaque, type Tiers } from './avatar-test-helpers.ts';

// Classes must differ by shape, not just color (phase 04: chibi bodies share mass, so the guard is
// .80 / .85; the human blind-ID test in phase 06 is the real check).
const MAX_IOU = { full: 0.8, pooled: 0.85 };
const WITHIN_CLASS_MIN_DIFF = 12; // px: jobs of one class differ by their prop

type Mask = boolean[][];
const silhouette = (classId: Parameters<typeof avatarProfile>[0], motif: Parameters<typeof avatarProfile>[1], tiers: Tiers): Mask =>
  outlineGrid(padGrid(composeAvatarGrid(selectAvatarLayers(avatarProfile(classId, motif, tiers), 0)), STICKER_PAD))
    .map((row) => [...row].map(isOpaque));
const pool = (m: Mask): Mask => Array.from({ length: m.length / 2 }, (_, y) => Array.from({ length: m.length / 2 }, (_, x) =>
  m[2 * y][2 * x] || m[2 * y + 1][2 * x] || m[2 * y][2 * x + 1] || m[2 * y + 1][2 * x + 1]));
function iou(a: Mask, b: Mask): number {
  let both = 0;
  let either = 0;
  a.forEach((row, y) => row.forEach((on, x) => {
    if (on && b[y][x]) both++;
    if (on || b[y][x]) either++;
  }));
  return both / either;
}
const diff = (a: Mask, b: Mask) => {
  const flatB = b.flat();
  return a.flat().filter((on, i) => on !== flatB[i]).length;
};

describe('avatar silhouettes', () => {
  for (const tiers of [[0, 0, 0, 0], [3, 3, 3, 3]] as const satisfies readonly Tiers[]) {
    it(`pure jobs of different classes overlap <= ${MAX_IOU.full} (and ${MAX_IOU.pooled} at half size), tiers ${tiers.join('')}`, () => {
      const pure = ARCHETYPE_IDS.map((archetype) => ({ archetype, mask: silhouette(CLASS_BY_ARCHETYPE[archetype], archetype, tiers) }));
      for (let i = 0; i < pure.length; i++) {
        for (let j = i + 1; j < pure.length; j++) {
          const pair = `${pure[i].archetype}/${pure[j].archetype}`;
          const full = iou(pure[i].mask, pure[j].mask);
          const pooled = iou(pool(pure[i].mask), pool(pure[j].mask));
          assert.ok(full <= MAX_IOU.full, `${pair}: ${full.toFixed(3)}`);
          assert.ok(pooled <= MAX_IOU.pooled, `${pair} pooled: ${pooled.toFixed(3)}`);
        }
      }
    });
  }

  it(`jobs within a class differ by >= ${WITHIN_CLASS_MIN_DIFF} px`, () => {
    for (const archetype of ARCHETYPE_IDS) {
      const classId = CLASS_BY_ARCHETYPE[archetype];
      const masks = ARCHETYPE_IDS.map((motif) => silhouette(classId, motif, [0, 0, 0, 0]));
      for (let i = 0; i < masks.length; i++) {
        for (let j = i + 1; j < masks.length; j++) assert.ok(diff(masks[i], masks[j]) >= WITHIN_CLASS_MIN_DIFF, `${classId} ${i}/${j}`);
      }
    }
  });
});
