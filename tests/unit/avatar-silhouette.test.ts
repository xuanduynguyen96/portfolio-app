import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CLASS_IDS, JOBS, type CombatClassId } from '../../src/data/character-job-rules.ts';
import { composeAvatarGrid } from '../../src/utils/avatar/compose-avatar-grid.ts';
import { outlineGrid, padGrid, STICKER_PAD } from '../../src/utils/avatar/avatar-sticker-outline.ts';
import { selectAvatarLayers } from '../../src/utils/avatar/select-avatar-layers.ts';
import { avatarProfile, isOpaque, type Tiers } from './avatar-test-helpers.ts';

// Classes must differ by shape, not just color (phase 04: chibi bodies share mass, so the guard is
// .80 / .85; the human blind-ID test in phase 06 is the real check).
const MAX_IOU = { full: 0.8, pooled: 0.85 };
const WITHIN_CLASS_MIN_DIFF = 12; // px: jobs of one class differ by their prop

const COMBAT = CLASS_IDS.filter((id): id is CombatClassId => id !== 'adventurer');

type Mask = boolean[][];
const SLOTS = [0, 1, 2] as const;
const silhouette = (classId: CombatClassId, slot: number, tiers: Tiers): Mask =>
  outlineGrid(padGrid(composeAvatarGrid(selectAvatarLayers(avatarProfile(classId, JOBS[classId][slot].id, tiers), 0)), STICKER_PAD))
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
    it(`classes sharing a job slot overlap <= ${MAX_IOU.full} (and ${MAX_IOU.pooled} at half size), tiers ${tiers.join('')}`, () => {
      for (const slot of SLOTS) {
        const looks = COMBAT.map((classId) => ({ classId, mask: silhouette(classId, slot, tiers) }));
        for (let i = 0; i < looks.length; i++) {
          for (let j = i + 1; j < looks.length; j++) {
            const pair = `${looks[i].classId}/${looks[j].classId} slot ${slot}`;
            const full = iou(looks[i].mask, looks[j].mask);
            const pooled = iou(pool(looks[i].mask), pool(looks[j].mask));
            assert.ok(full <= MAX_IOU.full, `${pair}: ${full.toFixed(3)}`);
            assert.ok(pooled <= MAX_IOU.pooled, `${pair} pooled: ${pooled.toFixed(3)}`);
          }
        }
      }
    });
  }

  it(`jobs within a class differ by >= ${WITHIN_CLASS_MIN_DIFF} px`, () => {
    for (const classId of COMBAT) {
      const masks = SLOTS.map((slot) => silhouette(classId, slot, [0, 0, 0, 0]));
      for (let i = 0; i < masks.length; i++) {
        for (let j = i + 1; j < masks.length; j++) assert.ok(diff(masks[i], masks[j]) >= WITHIN_CLASS_MIN_DIFF, `${classId} ${i}/${j}`);
      }
    }
  });
});
