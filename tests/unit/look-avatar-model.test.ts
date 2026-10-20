import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { gearSprites } from '../../src/data/avatar/avatar-sprites.ts';
import { GEAR_SLOT_IDS, gearRules } from '../../src/data/gear-rules.ts';
import { avatarSvgMarkup } from '../../src/utils/avatar/avatar-svg-markup.ts';
import { allClassLooks, lookKey, lookProfile } from '../../src/utils/avatar/class-looks.ts';
import { lookAvatarModel, parseGear } from '../../src/utils/avatar/look-avatar-model.ts';
import { selectAvatarLayers } from '../../src/utils/avatar/select-avatar-layers.ts';
import { classifyCharacter } from '../../src/utils/github-character/classify-character.ts';
import { avatarProfile, TIERS, type Tiers } from './avatar-test-helpers.ts';
import { hybridStack } from './github-snapshot-fixtures.ts';

const LOOKS = allClassLooks();
const OWNER_GEAR = classifyCharacter(hybridStack()).gear;
const pathMarkup = (paths: readonly { cssVar: string; d: string }[]) =>
  paths.map(({ cssVar, d }) => `<path style="fill:var(${cssVar})" d="${d}"/>`).join('');
const gearOf = (tiers: Tiers) => avatarProfile('warrior', 'banner', tiers).gear;
const TIER_SETS: readonly Tiers[] = [[0, 0, 0, 0], [1, 1, 1, 1], [2, 2, 2, 2], [3, 3, 3, 3], [3, 2, 1, 0], [0, 1, 2, 3], [0, 1, 2, 0]];

describe('lookAvatarModel', () => {
  it('composes two non-empty frames for all 10 looks', () => {
    for (const look of LOOKS) {
      const model = lookAvatarModel(look, OWNER_GEAR);
      assert.ok(model.frames[0].length > 0 && model.frames[1].length > 0, lookKey(look));
      const profile = lookProfile(look, OWNER_GEAR);
      assert.equal(model.className, profile.className);
      assert.equal(model.jobName, profile.jobName);
      assert.equal(model.title, profile.jobName ? `${profile.className} · ${profile.jobName}` : profile.className);
      assert.ok(!/preview|try-on|actual/i.test(`${model.title} ${model.desc}`));
    }
  });

  it('matches the server markup for the same look (title, desc, both frames)', () => {
    const derived = classifyCharacter(hybridStack());
    const svg = avatarSvgMarkup({ profile: derived, size: 256, idPrefix: 'x', animate: true });
    const model = lookAvatarModel({ classId: derived.classId, motif: derived.motif }, derived.gear);
    const unescape = (s: string) => s.replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
    assert.equal(unescape(/<title[^>]*>(.*?)<\/title>/.exec(svg)![1]), model.title);
    assert.equal(unescape(/<desc[^>]*>(.*?)<\/desc>/.exec(svg)![1]), model.desc);
    assert.equal(/<g class="avatar-frame-a">(.*?)<\/g>/.exec(svg)![1], pathMarkup(model.frames[0]));
    assert.equal(/<g class="avatar-frame-b">(.*?)<\/g>/.exec(svg)![1], pathMarkup(model.frames[1]));
  });

  it('draws the earned gear on every look, in both frames, and describes it', () => {
    for (const look of LOOKS) {
      for (const tiers of TIER_SETS) {
        const gear = gearOf(tiers);
        const model = lookAvatarModel(look, gear);
        GEAR_SLOT_IDS.forEach((slot, i) => {
          const rule = gearRules.find((r) => r.slot === slot)!;
          assert.match(model.desc, new RegExp(`${rule.label} tier ${tiers[i]} of ${rule.thresholds.length}`), `${lookKey(look)} ${slot}`);
          for (const frame of [0, 1] as const) {
            const layers = selectAvatarLayers(lookProfile(look, gear), frame).filter((layer) => layer.slot === slot);
            assert.ok(layers.length >= 1, `${lookKey(look)} ${slot} f${frame} has a gear layer`);
            assert.ok(layers.every((layer) => layer.rows === gearSprites[slot][tiers[i]]), `${lookKey(look)} ${slot} tier ${tiers[i]}`);
          }
        });
      }
    }
  });

  it('every earned tier changes the art of every look (gear is not dropped)', () => {
    for (const look of LOOKS) {
      GEAR_SLOT_IDS.forEach((slot, s) => {
        const base = JSON.stringify(lookAvatarModel(look, gearOf([0, 0, 0, 0])).frames);
        for (const tier of TIERS.filter((t) => t > 0)) {
          const tiers = [0, 0, 0, 0] as [number, number, number, number];
          tiers[s] = tier;
          assert.notEqual(JSON.stringify(lookAvatarModel(look, gearOf(tiers as unknown as Tiers)).frames), base, `${lookKey(look)} ${slot} ${tier}`);
        }
      });
    }
  });

  it('same stats give the same gear text on every look', () => {
    const gearText = (desc: string) => desc.slice(desc.indexOf('Gear:'));
    const texts = new Set(LOOKS.map((look) => gearText(lookAvatarModel(look, OWNER_GEAR).desc)));
    assert.equal(texts.size, 1);
  });

  it('is JSON-serializable and small', () => {
    for (const look of LOOKS) {
      const model = lookAvatarModel(look, OWNER_GEAR);
      assert.deepEqual(JSON.parse(JSON.stringify(model)), model);
      assert.ok(JSON.stringify(model).length <= 12 * 1024, lookKey(look));
    }
  });
});

describe('parseGear', () => {
  it('accepts the server shape', () => {
    const gear = parseGear(JSON.stringify([{ slot: 'armor', tier: 0 }, { slot: 'shield', tier: 1 }, { slot: 'boots', tier: 2 }, { slot: 'amulet', tier: 3 }]));
    assert.deepEqual(gear.map((g) => g.tier), [0, 1, 2, 3]);
  });

  it('rejects bad json, shapes, slots, tiers and duplicates', () => {
    const bad = ['', 'null', '{}', '[1]', '[null]', '[{"slot":"cape","tier":1}]', '[{"slot":"armor","tier":4}]', '[{"slot":"armor","tier":-1}]',
      '[{"slot":"armor","tier":1.5}]', '[{"slot":"armor","tier":"1"}]', '[{"slot":"armor","tier":1},{"slot":"armor","tier":2}]'];
    for (const json of bad) assert.throws(() => parseGear(json), json);
  });
});
