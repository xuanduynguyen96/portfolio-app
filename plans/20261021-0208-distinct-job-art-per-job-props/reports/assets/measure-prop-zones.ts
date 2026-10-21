// Phase 00 baseline for distinct job art. Read-only: prints (a) the largest free rectangle per class pose
// (union of both frames; gap 0 and gap 1 from body + all gear tiers + identity boxes), (b) colour keys per
// class and the spare slots under the 16-colour cap, (c) animated/static markup bytes per look.
// Usage (repo root): node --disable-warning=ExperimentalWarning plans/20261021-0208-distinct-job-art-per-job-props/reports/assets/measure-prop-zones.ts
// Re-run in phase 00 AFTER phase 01 changes the registry (it only needs classSprites + gearSprites + the look helpers).
import { gzipSync } from 'node:zlib';
import { classSprites, gearSprites } from '../../../../src/data/avatar/avatar-sprites.ts';
import { avatarFrameGrid, avatarSvgMarkup } from '../../../../src/utils/avatar/avatar-svg-markup.ts';
import { allClassLooks, lookProfile } from '../../../../src/utils/avatar/class-looks.ts';

const W = 32;
const CLASSES = ['warrior', 'archer', 'mage', 'adventurer'] as const;
const opaque = (c?: string) => c !== undefined && c !== '.';
type Mask = boolean[][];

function occupied(classId: (typeof CLASSES)[number], frame: 0 | 1): Mask {
  const pose = classSprites[classId].frames[frame];
  const mask: Mask = Array.from({ length: W }, () => Array<boolean>(W).fill(false));
  const put = (rows: readonly string[], at: { x: number; y: number }) =>
    rows.forEach((row, dy) => [...row].forEach((c, dx) => {
      const [x, y] = [at.x + dx, at.y + dy];
      if (opaque(c) && x >= 0 && y >= 0 && x < W && y < W) mask[y][x] = true;
    }));
  put(pose.rows, { x: 0, y: 0 });
  const a = pose.anchors; // tier 3 is a superset of tiers 0-2 (unit-tested), so it is the worst case
  put(gearSprites.armor[3], a.armor);
  put(gearSprites.amulet[3], a.amulet);
  put(gearSprites.shield[3], a.shield);
  put(gearSprites.boots[3], a.bootNear);
  put(gearSprites.boots[3], a.bootFar);
  for (const box of [pose.identity.head, ...pose.identity.held]) {
    for (let y = box.y0; y <= box.y1; y++) for (let x = box.x0; x <= box.x1; x++) mask[y][x] = true;
  }
  return mask;
}
const dilate = (m: Mask): Mask => m.map((row, y) => row.map((_, x) => {
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (m[y + dy]?.[x + dx]) return true;
  return false;
}));

console.log('== largest free rectangle per class (union of both frames); height for each width, "h@(x,y)"');
for (const classId of CLASSES) {
  for (const gap of [0, 1]) {
    const [a, b] = ([0, 1] as const).map((f) => { const m = occupied(classId, f); return gap ? dilate(m) : m; });
    const union = a.map((row, y) => row.map((v, x) => v || b[y][x]));
    const cells = [5, 6, 7, 8, 9, 10].map((w) => {
      let best = 0; let at = '';
      for (let x = 0; x + w <= W; x++) for (let y = 0; y < W; y++) {
        let h = 0;
        scan: while (y + h < W) { for (let xx = x; xx < x + w; xx++) if (union[y + h][xx]) break scan; h++; }
        if (h > best) { best = h; at = `(${x},${y})`; }
      }
      return `w${w}:${best}@${at}`;
    });
    console.log(`${classId.padEnd(10)} gap ${gap}: ${cells.join('  ')}`);
  }
}

console.log('\n== colour keys per class (pose only) and spare slots under the 16-colour cap at gear tier 3');
for (const classId of CLASSES) {
  const pose = classSprites[classId];
  const keys = (rows: readonly string[]) => new Set(rows.join('').replace(/\./g, ''));
  const base = new Set([...keys(pose.frames[0].rows), ...keys(pose.frames[1].rows)]);
  const withGear = new Set(base);
  for (const slot of ['armor', 'amulet', 'shield', 'boots'] as const) for (const k of keys(gearSprites[slot][3])) withGear.add(k);
  withGear.add('o'); // composer outline counts as a colour in the unit test
  console.log(`${classId.padEnd(10)} pose ${base.size} keys, +gear t3 +outline = ${withGear.size}, spare ${16 - withGear.size}  [${[...withGear].sort().join('')}]`);
}

console.log('\n== current markup bytes per look (gear all tier 0 | all tier 3); budgets: animated raw 11264, gzip 2560');
const gz = (t: string) => gzipSync(t, { level: 9 }).length;
for (const look of allClassLooks()) {
  const cells = [0, 3].map((tier) => {
    const profile = lookProfile(look, ['armor', 'shield', 'boots', 'amulet'].map((slot) => ({ slot, tier })) as never);
    const animated = avatarSvgMarkup({ profile, size: 256, idPrefix: 'x', animate: true });
    const colours = new Set(avatarFrameGrid(profile, 0).join('').replace(/[.#]/g, '')).size;
    return `t${tier}: animated ${animated.length} B / ${gz(animated)} gz, ${colours} colours`;
  });
  console.log(`${`${look.classId}/${(look as { motif?: string; jobId?: string }).jobId ?? (look as { motif?: string }).motif ?? '-'}`.padEnd(18)} ${cells.join(' | ')}`);
}
