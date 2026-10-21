import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { CLASS_IDS, JOB_IDS, JOBS, type CombatClassId } from '../../src/data/character-job-rules.ts';
import { classTrim, TRIM_MARK } from '../../src/data/avatar/avatar-class-trim.ts';
import { JOB_ACCENT, JOB_PROP_ZONES } from '../../src/data/avatar/avatar-job-style.ts';
import { avatarCssVar, isPaletteKey, STICKER_KEY } from '../../src/data/avatar/avatar-palette.ts';
import { classSprites, gearSprites, jobPropSprites } from '../../src/data/avatar/avatar-sprites.ts';
import type { Box, PlacedSprite, PoseFrame } from '../../src/data/avatar/avatar-types.ts';
import { composeAvatarGrid } from '../../src/utils/avatar/compose-avatar-grid.ts';
import { selectAvatarLayers } from '../../src/utils/avatar/select-avatar-layers.ts';
import { avatarProfile, isOpaque, TIERS } from './avatar-test-helpers.ts';

const COMBAT = CLASS_IDS.filter((id): id is CombatClassId => id !== 'adventurer');
const FRAMES = [0, 1] as const;
const ACCENT_KEYS = new Set<string>(Object.values(JOB_ACCENT));
const MIN_MOTION_PX = 4; // frame B must visibly move
const MIN_ACCENT_SHARE = 0.15; // the accent is the prop's main hue
const MIN_TRIM_PX = 4;
const MIN_PROP_DIFF_PX = 20; // props of one class differ by shape, not just colour

type Cell = readonly [number, number];
const key = ([x, y]: Cell) => `${x},${y}`;
const cells = ({ x, y, rows }: PlacedSprite, keep = isOpaque) =>
  rows.flatMap((row, dy) => [...row].flatMap((char, dx) => (keep(char) ? [[x + dx, y + dy] as Cell] : [])));
const inBox = ([x, y]: Cell, box: Box) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;
const near = ([x, y]: Cell, taken: Set<string>) =>
  [-1, 0, 1].some((dx) => [-1, 0, 1].some((dy) => taken.has(key([x + dx, y + dy]))));

/** Every pixel the pose and any gear tier can paint on one frame. */
function occupied(frame: PoseFrame): Set<string> {
  const out = new Set(cells({ x: 0, y: 0, rows: frame.rows }).map(key));
  const { armor, amulet, shield, bootNear, bootFar } = frame.anchors;
  for (const tier of TIERS) {
    for (const [rows, at] of [[gearSprites.armor[tier], armor], [gearSprites.amulet[tier], amulet], [gearSprites.shield[tier], shield],
      [gearSprites.boots[tier], bootNear], [gearSprites.boots[tier], bootFar]] as const) {
      for (const cell of cells({ ...at, rows })) out.add(key(cell));
    }
  }
  return out;
}

const classKeys = (classId: CombatClassId) => new Set([
  ...classSprites[classId].frames.flatMap((frame) => [...frame.rows.join('')]),
  ...Object.values(gearSprites).flatMap((tiers) => tiers.flatMap((rows) => [...rows.join('')])),
].filter(isOpaque));

describe('job props', () => {
  for (const classId of COMBAT) {
    for (const { id } of JOBS[classId]) {
      const frames = jobPropSprites[id];

      it(`${id}: same-size frames in palette, frame B moves >= ${MIN_MOTION_PX} px`, () => {
        for (const { rows } of frames) {
          assert.ok(rows.length > 0 && rows.every((row) => row.length === frames[0].rows[0].length), 'ragged rows');
          for (const char of rows.join('')) assert.ok(char === '.' || (isPaletteKey(char) && char !== STICKER_KEY), `bad char ${char}`);
        }
        assert.equal(frames[1].rows.length, frames[0].rows.length);
        const paint = (f: 0 | 1) => new Map(cells(frames[f]).map((cell) => [key(cell), frames[f].rows[cell[1] - frames[f].y][cell[0] - frames[f].x]]));
        const [a, b] = [paint(0), paint(1)];
        const changed = new Set([...a.keys(), ...b.keys()].filter((cell) => a.get(cell) !== b.get(cell)));
        assert.ok(changed.size >= MIN_MOTION_PX, `${changed.size} px change`);
      });

      it(`${id}: inside the ${classId} zone, 1 px clear of body, gear (all tiers) and identity boxes`, () => {
        FRAMES.forEach((f) => {
          const frame = classSprites[classId].frames[f];
          const taken = occupied(frame);
          for (const cell of cells(frames[f])) {
            assert.ok(inBox(cell, JOB_PROP_ZONES[classId]), `f${f} ${cell} outside zone`);
            assert.ok(!near(cell, taken), `f${f} ${cell} touches body or gear`);
            assert.ok(![frame.identity.head, ...frame.identity.held].some((box) => inBox(cell, box)), `f${f} ${cell} in identity box`);
          }
        });
      });

      it(`${id}: class + gear colours plus its own accent as the main hue`, () => {
        const allowed = classKeys(classId);
        for (const { rows } of frames) {
          for (const char of rows.join('').replaceAll('.', '')) {
            assert.ok(char === JOB_ACCENT[id] || (allowed.has(char) && !ACCENT_KEYS.has(char)), `stray colour ${char}`);
          }
        }
        const opaque = cells(frames[0]);
        const accent = cells(frames[0], (char) => char === JOB_ACCENT[id]);
        assert.ok(accent.length / opaque.length >= MIN_ACCENT_SHARE, `accent ${accent.length}/${opaque.length}`);
      });
    }

    it(`${classId}: its 3 props differ by >= ${MIN_PROP_DIFF_PX} px of shape on each frame`, () => {
      for (const f of FRAMES) {
        const masks = JOBS[classId].map(({ id }) => new Set(cells(jobPropSprites[id][f]).map(key)));
        for (let i = 0; i < masks.length; i++) {
          for (let j = i + 1; j < masks.length; j++) {
            const diff = [...masks[i]].filter((c) => !masks[j].has(c)).length + [...masks[j]].filter((c) => !masks[i].has(c)).length;
            assert.ok(diff >= MIN_PROP_DIFF_PX, `${JOBS[classId][i].id}/${JOBS[classId][j].id} f${f}: ${diff} px`);
          }
        }
      }
    });
  }
});

describe('job accents and trim', () => {
  it('9 distinct accent keys, each a plain hex token (same in both themes)', () => {
    const css = readFileSync(new URL('../../src/styles/design-tokens.css', import.meta.url), 'utf8');
    assert.equal(ACCENT_KEYS.size, JOB_IDS.length);
    for (const jobId of JOB_IDS) {
      assert.equal(avatarCssVar(JOB_ACCENT[jobId]), `--avatar-accent-${jobId}`);
      assert.match(css, new RegExp(`--avatar-accent-${jobId}: #[0-9a-f]{6};`), jobId);
    }
  });

  for (const classId of COMBAT) {
    it(`${classId}: trim marks opaque class pixels outside identity boxes, >= ${MIN_TRIM_PX} px a frame`, () => {
      FRAMES.forEach((f) => {
        const frame = classSprites[classId].frames[f];
        const trim = classTrim[classId][f];
        assert.ok(trim.rows.every((row) => /^[.*]+$/.test(row)), 'trim uses only . and *');
        const marks = cells(trim, (char) => char === TRIM_MARK);
        assert.ok(marks.length >= MIN_TRIM_PX, `f${f}: ${marks.length} px`);
        for (const cell of marks) {
          assert.ok(isOpaque(frame.rows[cell[1]]?.[cell[0]]), `f${f} ${cell} not on the body`);
          assert.ok(![frame.identity.head, ...frame.identity.held].some((box) => inBox(cell, box)), `f${f} ${cell} in identity box`);
        }
      });
    });

    it(`${classId}: every job shows its accent on each trim pixel gear does not cover`, () => {
      for (const { id } of JOBS[classId]) {
        for (const f of FRAMES) {
          const layers = selectAvatarLayers(avatarProfile(classId, id), f);
          const grid = composeAvatarGrid(layers);
          const gear = new Set(layers.filter((l) => !['class', 'trim', 'job'].includes(l.slot)).flatMap((l) => cells(l).map(key)));
          for (const cell of cells(classTrim[classId][f], (char) => char === TRIM_MARK)) {
            if (!gear.has(key(cell))) assert.equal(grid[cell[1]][cell[0]], JOB_ACCENT[id], `${id} f${f} ${cell}`);
          }
        }
      }
    });
  }

  it('Adventurer wears no accent', () => {
    for (const f of FRAMES) {
      const grid = composeAvatarGrid(selectAvatarLayers(avatarProfile('adventurer', null, [3, 3, 3, 3]), f)).join('');
      assert.ok(![...ACCENT_KEYS].some((accent) => grid.includes(accent)));
    }
  });
});
