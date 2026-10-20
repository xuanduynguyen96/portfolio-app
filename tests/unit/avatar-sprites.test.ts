import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CLASS_IDS, MOTIF_IDS } from '../../src/data/character-job-rules.ts';
import { GEAR_SLOT_IDS } from '../../src/data/gear-rules.ts';
import { isPaletteKey, STICKER_KEY } from '../../src/data/avatar/avatar-palette.ts';
import { classSprites, gearSprites, motifSprites } from '../../src/data/avatar/avatar-sprites.ts';
import type { Box, PoseAnchors, SpriteRows } from '../../src/data/avatar/avatar-types.ts';
import { isOpaque, TIERS } from './avatar-test-helpers.ts';

function assertSpriteShape(rows: SpriteRows, name: string, width?: number, height?: number) {
  assert.ok(rows.length > 0, `${name}: no rows`);
  for (const row of rows) assert.equal(row.length, width ?? rows[0].length, `${name}: unequal row width`);
  if (height !== undefined) assert.equal(rows.length, height, `${name}: height`);
  for (const char of rows.join('')) {
    assert.ok(char === '.' || (isPaletteKey(char) && char !== STICKER_KEY), `${name}: bad char "${char}"`);
  }
  assert.ok(rows.some((row) => [...row].some(isOpaque)), `${name}: empty`);
}

const opaqueCells = (rows: SpriteRows, x0 = 0, y0 = 0) =>
  rows.flatMap((row, y) => [...row].flatMap((char, x) => (isOpaque(char) ? [[x0 + x, y0 + y] as const] : [])));
const inBox = ([x, y]: readonly [number, number], box: Box) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;

/** Every (sprite, anchor) a pose can place: all gear tiers on both feet + every motif. */
function placements(anchors: PoseAnchors, frame: 0 | 1) {
  const out: { name: string; rows: SpriteRows; x: number; y: number }[] = [];
  for (const tier of TIERS) {
    out.push({ name: `armor t${tier}`, rows: gearSprites.armor[tier], ...anchors.armor });
    out.push({ name: `amulet t${tier}`, rows: gearSprites.amulet[tier], ...anchors.amulet });
    out.push({ name: `shield t${tier}`, rows: gearSprites.shield[tier], ...anchors.shield });
    out.push({ name: `boot near t${tier}`, rows: gearSprites.boots[tier], ...anchors.bootNear });
    out.push({ name: `boot far t${tier}`, rows: gearSprites.boots[tier], ...anchors.bootFar });
  }
  for (const motif of MOTIF_IDS) out.push({ name: `motif ${motif}`, rows: motifSprites[motif][frame], ...anchors.motif });
  return out;
}

describe('avatar class poses', () => {
  for (const classId of CLASS_IDS) {
    it(`${classId}: two 32x32 frames in palette, identity boxes hold class pixels`, () => {
      const pose = classSprites[classId];
      assert.equal(pose.frames.length, 2);
      assert.ok(pose.look.length > 10);
      pose.frames.forEach((frame, f) => {
        assertSpriteShape(frame.rows, `${classId} f${f}`, 32, 32);
        assert.notDeepEqual(frame.rows, pose.frames[1 - f].rows, 'frames must differ');
        for (const box of [frame.identity.head, ...frame.identity.held]) {
          assert.ok(box.x0 >= 0 && box.y0 >= 0 && box.x1 < 32 && box.y1 < 32 && box.x0 <= box.x1 && box.y0 <= box.y1);
          assert.ok(opaqueCells(frame.rows).some((cell) => inBox(cell, box)), `${classId}: empty identity box`);
        }
      });
    });

    it(`${classId}: gear + motifs stay on canvas and out of head / held-item boxes on both frames`, () => {
      classSprites[classId].frames.forEach((frame, f) => {
        const boxes = [frame.identity.head, ...frame.identity.held];
        for (const { name, rows, x, y } of placements(frame.anchors, f as 0 | 1)) {
          for (const cell of opaqueCells(rows, x, y)) {
            assert.ok(cell[0] >= 0 && cell[1] >= 0 && cell[0] < 32 && cell[1] < 32, `${classId} f${f} ${name} off canvas at ${cell}`);
            assert.ok(!boxes.some((box) => inBox(cell, box)), `${classId} f${f} ${name} covers identity pixel ${cell}`);
          }
        }
      });
    });
  }
});

describe('avatar gear tiers', () => {
  for (const slot of GEAR_SLOT_IDS) {
    const tiers = gearSprites[slot];
    it(`${slot}: 4 same-size tiers, each mask a superset of the one below`, () => {
      assert.equal(tiers.length, 4);
      tiers.forEach((rows, t) => assertSpriteShape(rows, `${slot} t${t}`, tiers[0][0].length, tiers[0].length));
      for (let t = 0; t < 3; t += 1) {
        const lower = opaqueCells(tiers[t]);
        const upper = new Set(opaqueCells(tiers[t + 1]).map(String));
        for (const cell of lower) assert.ok(upper.has(String(cell)), `${slot} t${t + 1} drops ${cell}`);
        assert.notDeepEqual(tiers[t + 1], tiers[t], `${slot} t${t + 1} identical to t${t}`);
      }
      assert.ok(opaqueCells(tiers[2]).length - opaqueCells(tiers[1]).length >= 2, `${slot}: tier 2 adds >= 2 px`);
    });

    it(`${slot}: material ramp leather -> bronze -> iron -> gold, sparkle on tier 3`, () => {
      const has = (t: number, chars: string) => [...chars].some((c) => tiers[t].join('').includes(c));
      assert.ok(has(0, 'lL') && !has(0, 'bikIyx'), 'tier 0 is plain leather/wood');
      assert.ok(has(1, 'b') && !has(1, 'yx'), 'tier 1 adds bronze');
      assert.ok(has(2, 'ikI') && !has(2, 'yx'), 'tier 2 is iron');
      assert.ok(has(3, 'y') && has(3, 'x'), 'tier 3 is gold with a glint');
    });
  }
});

describe('avatar job motifs', () => {
  for (const motif of MOTIF_IDS) {
    it(`${motif}: two frames in the 6x11 motif box`, () => {
      const frames = motifSprites[motif];
      assert.equal(frames.length, 2);
      frames.forEach((rows, f) => assertSpriteShape(rows, `${motif} f${f}`, 6, 11));
      assert.notDeepEqual(frames[0], frames[1]);
    });
  }
});
