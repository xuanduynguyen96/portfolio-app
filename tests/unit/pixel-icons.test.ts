import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { GEAR_SLOT_IDS } from '../../src/data/gear-rules.ts';
import { attributeIcons, bossIcon, difficultyIcons, gearSlotIcons, skillRootIcon, skillRootIcons } from '../../src/data/pixel-icon-map.ts';
import { gearIcons } from '../../src/data/pixel-icons-gear.ts';
import { careerIcons } from '../../src/data/pixel-icons-career.ts';
import { hudIcons } from '../../src/data/pixel-icons-hud.ts';
import {
  PIXEL_ICON_CHARS,
  PIXEL_ICON_GRID,
  PIXEL_ICON_NAMES,
  PIXEL_ICON_SIZES,
  pixelIcons,
} from '../../src/data/pixel-icons.ts';
import { skillNodes } from '../../src/data/skills-data.ts';
import { ATTRIBUTE_IDS, QUEST_DIFFICULTIES } from '../../src/data/xp-rules.ts';

const allowed = new Set<string>(Object.values(PIXEL_ICON_CHARS));
const entries = Object.entries(pixelIcons) as [string, readonly string[]][];
const iconNames = new Set<string>(PIXEL_ICON_NAMES);

describe('pixel icon grids', () => {
  it('stays within the icon budget (<=32 grids)', () => {
    assert.ok(entries.length > 0);
    assert.ok(entries.length <= 32, `${entries.length} icons`);
  });

  it('every grid is exactly 8 rows x 8 cols of allowed chars', () => {
    for (const [name, grid] of entries) {
      assert.equal(grid.length, PIXEL_ICON_GRID, `${name}: row count`);
      grid.forEach((row, y) => {
        assert.equal(row.length, PIXEL_ICON_GRID, `${name}: row ${y} width`);
        for (const ch of row) assert.ok(allowed.has(ch), `${name}: row ${y} has illegal char "${ch}"`);
      });
    }
  });

  it('every icon has ink and reads as a shape (>=8 filled cells)', () => {
    for (const [name, grid] of entries) {
      const cells = grid.join('');
      assert.ok(cells.includes(PIXEL_ICON_CHARS.ink), `${name}: no ink cell`);
      const filled = [...cells].filter((c) => c !== PIXEL_ICON_CHARS.empty).length;
      assert.ok(filled >= 8, `${name}: only ${filled} filled cells`);
    }
  });

  it('names are kebab-case and unique across career + hud + gear sets', () => {
    const all = [careerIcons, hudIcons, gearIcons].flatMap((set) => Object.keys(set));
    assert.equal(new Set(all).size, all.length, 'icon set name collision');
    for (const name of iconNames) assert.match(name, /^[a-z]+(-[a-z]+)*$/);
  });

  it('no two icons share the same grid', () => {
    const seen = new Map<string, string>();
    for (const [name, grid] of entries) {
      const key = grid.join('/');
      assert.equal(seen.get(key), undefined, `${name} duplicates ${seen.get(key)}`);
      seen.set(key, name);
    }
  });

  it('includes the theme toggle icons', () => {
    for (const name of ['sun', 'moon']) assert.ok(iconNames.has(name), name);
  });

  it('sizes are integer multiples of the grid', () => {
    for (const size of PIXEL_ICON_SIZES) assert.equal(size % PIXEL_ICON_GRID, 0, `${size}px`);
  });
});

describe('pixel icon mappings', () => {
  it('maps every attribute id to an existing icon', () => {
    for (const id of ATTRIBUTE_IDS) assert.ok(iconNames.has(attributeIcons[id]), id);
    assert.equal(Object.keys(attributeIcons).length, ATTRIBUTE_IDS.length);
  });

  it('maps every gear slot to its own existing icon', () => {
    for (const slot of GEAR_SLOT_IDS) assert.ok(iconNames.has(gearSlotIcons[slot]), slot);
    assert.equal(new Set(Object.values(gearSlotIcons)).size, GEAR_SLOT_IDS.length);
  });

  it('maps every quest difficulty (+ boss) to an existing icon', () => {
    for (const id of QUEST_DIFFICULTIES) assert.ok(iconNames.has(difficultyIcons[id]), id);
    assert.equal(Object.keys(difficultyIcons).length, QUEST_DIFFICULTIES.length);
    assert.ok(iconNames.has(bossIcon));
  });

  it('every root skill in skills-data has its own icon', () => {
    const roots = skillNodes.filter((node) => !node.parent).map((node) => node.id);
    assert.ok(roots.length > 0);
    for (const id of roots) {
      assert.ok(Object.hasOwn(skillRootIcons, id), `${id}: no root icon`);
      assert.ok(iconNames.has(skillRootIcon(id)), id);
    }
    for (const icon of Object.values(skillRootIcons)) assert.ok(iconNames.has(icon), icon);
  });

  it('falls back to the quest icon for unknown or inherited keys', () => {
    assert.equal(skillRootIcon('unknown-root'), 'quest');
    assert.equal(skillRootIcon('toString'), 'quest');
  });
});
