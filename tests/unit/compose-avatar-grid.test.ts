import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SpriteLayer } from '../../src/data/avatar/avatar-types.ts';
import { AVATAR_SIZE, composeAvatarGrid, sortLayers } from '../../src/utils/avatar/compose-avatar-grid.ts';
import { composeAvatarSprite, outlineGrid, padGrid, stickerRing } from '../../src/utils/avatar/avatar-sticker-outline.ts';
import { selectAvatarLayers } from '../../src/utils/avatar/select-avatar-layers.ts';
import { classSprites, gearSprites, jobPropSprites } from '../../src/data/avatar/avatar-sprites.ts';
import { avatarProfile, isOpaque } from './avatar-test-helpers.ts';

const layer = (slot: SpriteLayer['slot'], x: number, y: number, rows: string[]): SpriteLayer => ({ slot, x, y, rows });
const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

describe('composeAvatarGrid', () => {
  it('returns 32 rows of 32 transparent cells for no layers', () => {
    const grid = composeAvatarGrid([]);
    assert.equal(grid.length, AVATAR_SIZE);
    assert.ok(grid.every((row) => row === '.'.repeat(AVATAR_SIZE)));
  });

  it('paints by z-order regardless of list order (shield over class)', () => {
    const grid = composeAvatarGrid([layer('shield', 1, 1, ['b']), layer('class', 0, 0, ['rr', 'rr'])]);
    assert.equal(grid[0].slice(0, 2), 'rr');
    assert.equal(grid[1].slice(0, 2), 'rb');
  });

  it('follows base < class < armor < amulet < boots < shield < job < fx', () => {
    const slots: SpriteLayer['slot'][] = ['fx', 'job', 'shield', 'boots', 'amulet', 'armor', 'class', 'base'];
    assert.deepEqual(sortLayers(slots.map((slot) => layer(slot, 0, 0, ['o']))).map((l) => l.slot), [...slots].reverse());
    const keys = ['x', 'a', 'i', 'L', 'y', 'b', 'g', 's'];
    for (let n = 1; n <= slots.length; n += 1) {
      const top = composeAvatarGrid(slots.slice(slots.length - n).map((slot, i) => layer(slot, 0, 0, [keys[slots.length - n + i]])));
      assert.equal(top[0][0], keys[slots.length - n], `top of ${n} layers`);
    }
  });

  it('within a slot the later layer wins; transparent cells never erase', () => {
    const grid = composeAvatarGrid([layer('boots', 0, 0, ['ll']), layer('boots', 0, 0, ['.L'])]);
    assert.equal(grid[0].slice(0, 2), 'lL');
  });

  it('clips pixels outside the canvas', () => {
    const grid = composeAvatarGrid([layer('fx', -1, 31, ['xxx', 'xxx'])]);
    assert.equal(grid[31].slice(0, 3), 'xx.');
    assert.equal(grid.length, 32);
    assert.ok(grid.every((row) => row.length === 32));
  });

  it('does not mutate its input', () => {
    const layers = deepFreeze(selectAvatarLayers(avatarProfile('warrior', 'knight', [0, 1, 2, 0]), 0));
    const before = JSON.stringify(layers);
    composeAvatarGrid(layers);
    composeAvatarSprite(layers);
    assert.equal(JSON.stringify(layers), before);
  });
});

describe('sticker outline + ring', () => {
  it('pads evenly', () => {
    assert.deepEqual(padGrid(['ab'], 1), ['....', '.ab.', '....']);
  });

  it('outlines all 8 neighbours but not from existing outline pixels', () => {
    assert.deepEqual(outlineGrid(['.....', '.....', '..r..', '.....', '.....']), ['.....', '.ooo.', '.oro.', '.ooo.', '.....']);
    assert.deepEqual(outlineGrid(['...', '.o.', '...']), ['...', '.o.', '...']);
  });

  it('rings within radius sqrt(5): 2px out, corners cut', () => {
    const ring = stickerRing(['.....', '.....', '..o..', '.....', '.....']);
    assert.deepEqual(ring, ['.###.', '#####', '##o##', '#####', '.###.']);
  });

  it('every art pixel of a real avatar is wrapped by outline, then ring; 36x36', () => {
    const sprite = composeAvatarSprite(selectAvatarLayers(avatarProfile('archer', 'herald', [3, 3, 3, 3]), 1));
    assert.equal(sprite.length, 36);
    assert.ok(sprite.every((row) => row.length === 36));
    sprite.forEach((row, y) => [...row].forEach((char, x) => {
      if (!isOpaque(char) || char === 'o' || char === '#') return;
      for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) {
        assert.ok(isOpaque(sprite[y + dy]?.[x + dx]) && sprite[y + dy][x + dx] !== '#', `art at ${x},${y} touches ring/edge`);
      }
    }));
    assert.ok(sprite.join('').includes('#'));
  });
});

describe('selectAvatarLayers', () => {
  it('places class pose + 4 gear slots (both boots) at the frame anchors, job prop last at its own place', () => {
    const profile = avatarProfile('warrior', 'paladin', [0, 1, 2, 3]);
    for (const frame of [0, 1] as const) {
      const layers = selectAvatarLayers(profile, frame);
      const anchors = classSprites.warrior.frames[frame].anchors;
      assert.deepEqual(layers.map((l) => l.slot), ['class', 'armor', 'amulet', 'boots', 'boots', 'shield', 'job']);
      assert.equal(layers[0].rows, classSprites.warrior.frames[frame].rows);
      assert.deepEqual([layers[1].x, layers[1].y, layers[1].rows], [anchors.armor.x, anchors.armor.y, gearSprites.armor[0]]);
      assert.equal(layers[2].rows, gearSprites.amulet[3]);
      assert.equal(layers[5].rows, gearSprites.shield[1]);
      assert.deepEqual([layers[4].x, layers[4].y], [anchors.bootNear.x, anchors.bootNear.y]);
      const prop = jobPropSprites.paladin[frame];
      assert.deepEqual([layers[6].x, layers[6].y, layers[6].rows], [prop.x, prop.y, prop.rows]);
    }
  });

  it('omits the job layer without a job and defaults missing gear to tier 0', () => {
    const layers = selectAvatarLayers({ classId: 'adventurer', jobId: null, gear: [] }, 0);
    assert.ok(!layers.some((l) => l.slot === 'job'));
    assert.equal(layers.find((l) => l.slot === 'shield')?.rows, gearSprites.shield[0]);
  });

  it('draws no prop for a job that is not one of the class\'s', () => {
    for (const [classId, jobId] of [['adventurer', 'seer'], ['mage', 'knight']] as const) {
      assert.ok(!selectAvatarLayers({ classId, jobId, gear: [] }, 0).some((l) => l.slot === 'job'), `${classId}/${jobId}`);
    }
  });

  it('frames differ and gear on the moving torso follows it (warrior dips 1px on frame B)', () => {
    const [a, b] = [0, 1].map((f) => selectAvatarLayers(avatarProfile('warrior', null), f as 0 | 1));
    assert.equal(b.find((l) => l.slot === 'armor')!.y - a.find((l) => l.slot === 'armor')!.y, 1);
    assert.equal(b.find((l) => l.slot === 'shield')!.y - a.find((l) => l.slot === 'shield')!.y, 1);
    assert.notDeepEqual(composeAvatarGrid(a), composeAvatarGrid(b));
  });
});
