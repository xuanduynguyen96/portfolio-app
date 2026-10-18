import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { gzipSync } from 'node:zlib';
import { AVATAR_PALETTE, STICKER_KEY, avatarCssVar, PALETTE_KEYS } from '../../src/data/avatar/avatar-palette.ts';
import { avatarPaths } from '../../src/utils/avatar/avatar-svg-paths.ts';
import { avatarFrameGrid, avatarSvgMarkup } from '../../src/utils/avatar/avatar-svg-markup.ts';
import { LOOK_KEYS, TIERS, avatarProfile, type Tiers } from './avatar-test-helpers.ts';

/** Raw markup ceilings (regression guards; transfer size is the gzip budget). */
const BUDGET = { staticRaw: 6 * 1024, animatedRaw: 11 * 1024, animatedGzip: 2.5 * 1024 };
const MAX_COLORS = 16; // art colors + outline; the sticker ring is the paper, not a color of the art

/** Uniform tiers plus each slot maxed alone: the extremes of every look. */
const TIER_SAMPLES: readonly Tiers[] = [
  ...TIERS.map((t): Tiers => [t, t, t, t]),
  ...[0, 1, 2, 3].map((slot): Tiers => [0, 1, 2, 3].map((i) => (i === slot ? 3 : 0)) as unknown as Tiers),
];
const SAMPLES = LOOK_KEYS.flatMap(([classId, motif]) => TIER_SAMPLES.map((tiers) => avatarProfile(classId, motif, tiers)));

function cells(d: string): Set<string> {
  const out = new Set<string>();
  let pen = { x: 0, y: 0 };
  for (const [, cmd, a, b, w, h] of d.matchAll(/([Mm])(-?\d+) (-?\d+)h(\d+)v(\d+)h-\d+z/g)) {
    pen = cmd === 'M' ? { x: Number(a), y: Number(b) } : { x: pen.x + Number(a), y: pen.y + Number(b) };
    for (let dy = 0; dy < Number(h); dy++) for (let dx = 0; dx < Number(w); dx++) out.add(`${pen.x + dx},${pen.y + dy}`);
  }
  return out;
}

describe('avatar svg paths', () => {
  it('one path per palette key present, covering exactly its cells', () => {
    for (const profile of SAMPLES.filter((_, i) => i % 7 === 0)) {
      const grid = avatarFrameGrid(profile, 0);
      for (const { key, cssVar, d } of avatarPaths(grid)) {
        const expected = new Set(grid.flatMap((row, y) => [...row].flatMap((c, x) => (c === key ? [`${x},${y}`] : []))));
        assert.deepEqual(cells(d), expected, `${profile.classId} ${key}`);
        assert.equal(cssVar, avatarCssVar(key));
      }
    }
  });

  it('rejects characters outside the palette', () => {
    assert.throws(() => avatarPaths(['.Z.']), /Unknown avatar palette key "Z"/);
  });

  it(`every look stays within ${MAX_COLORS} colors and the size budgets`, () => {
    for (const profile of SAMPLES) {
      for (const frame of [0, 1] as const) {
        const keys = new Set(avatarFrameGrid(profile, frame).join('').replace(/[.#]/g, ''));
        assert.ok(keys.size <= MAX_COLORS, `${profile.classId}/${profile.motif}: ${keys.size} colors`);
      }
      const still = avatarSvgMarkup({ profile, size: 192, idPrefix: 'x' });
      const animated = avatarSvgMarkup({ profile, size: 192, idPrefix: 'x', animate: true });
      assert.ok(still.length <= BUDGET.staticRaw, `static ${still.length} B`);
      assert.ok(animated.length <= BUDGET.animatedRaw, `animated ${animated.length} B`);
      assert.ok(gzipSync(animated).length <= BUDGET.animatedGzip, `animated gzip ${gzipSync(animated).length} B`);
    }
  });

  it('every --avatar-* variable the palette uses is defined in design-tokens.css (both themes for the ring)', () => {
    const css = readFileSync(new URL('../../src/styles/design-tokens.css', import.meta.url), 'utf8');
    for (const key of PALETTE_KEYS) assert.match(css, new RegExp(`${avatarCssVar(key)}:`), key);
    assert.match(css, new RegExp(`--avatar-${AVATAR_PALETTE[STICKER_KEY]}:\\s*light-dark\\(`));
  });
});

describe('avatar svg markup', () => {
  const profile = avatarProfile('warrior', 'frontend', [0, 1, 2, 0]);

  it('is an accessible image named by class and job, with unique-prefixed ids', () => {
    const svg = avatarSvgMarkup({ profile, size: 192, idPrefix: 'hero' });
    assert.match(svg, /role="img"/);
    assert.match(svg, /aria-labelledby="hero-title" aria-describedby="hero-desc"/);
    assert.match(svg, /<title id="hero-title">Warrior · Vanguard<\/title>/);
    assert.match(svg, /<desc id="hero-desc">[^<]*Shield tier 1 of 3[^<]*Boots tier 2 of 3[^<]*<\/desc>/);
  });

  it('size is the 32px art box at an integer scale; the viewBox adds the 2px sticker margin', () => {
    const svg = avatarSvgMarkup({ profile, size: 128, idPrefix: 'a' });
    assert.match(svg, /viewBox="0 0 36 36" width="144" height="144"/);
  });

  it('static avatars carry frame A only; animated ones both frames and a data-animate hook', () => {
    const still = avatarSvgMarkup({ profile, size: 192, idPrefix: 'a' });
    const animated = avatarSvgMarkup({ profile, size: 192, idPrefix: 'a', animate: true });
    assert.equal((still.match(/class="avatar-frame-/g) ?? []).length, 1);
    assert.ok(!still.includes('data-animate'));
    assert.match(animated, /avatar-frame-a[\s\S]*avatar-frame-b/);
    assert.match(animated, /data-animate=""/);
  });

  it('escapes text and prefixes', () => {
    const svg = avatarSvgMarkup({ profile: { ...profile, className: 'A<b>"' }, size: 128, idPrefix: 'x"y' });
    assert.ok(!svg.includes('A<b>'));
    assert.match(svg, /id="x&quot;y-title"/);
  });
});
