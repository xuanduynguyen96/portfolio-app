// Phase 01 golden check: one sha256 over the composed sticker grids (both frames) of every selectable look x
// 6 gear tier sets. Run BEFORE the job-keyed refactor and AFTER it (phase 01): the digests must be identical,
// because phase 01 changes keys and data shape only (the 9 jobs still draw the 3 legacy props). It deliberately
// uses only API names that exist before and after (allClassLooks, lookProfile, avatarFrameGrid).
// Usage (repo root): node --disable-warning=ExperimentalWarning plans/20261021-0208-distinct-job-art-per-job-props/reports/assets/hash-look-grids.ts
import { createHash } from 'node:crypto';
import { avatarFrameGrid } from '../../../../src/utils/avatar/avatar-svg-markup.ts';
import { allClassLooks, lookProfile } from '../../../../src/utils/avatar/class-looks.ts';

const SETS = [[0, 0, 0, 0], [1, 1, 1, 1], [2, 2, 2, 2], [3, 3, 3, 3], [3, 2, 1, 0], [0, 1, 2, 3]];
const SLOTS = ['armor', 'shield', 'boots', 'amulet'];
const hash = createHash('sha256');
let grids = 0;
for (const look of allClassLooks()) {
  for (const tiers of SETS) {
    const profile = lookProfile(look, SLOTS.map((slot, i) => ({ slot, tier: tiers[i] })) as never);
    for (const frame of [0, 1] as const) { hash.update(avatarFrameGrid(profile, frame).join('\n')); grids += 1; }
  }
}
console.log(`${grids} grids, sha256 ${hash.digest('hex')}`);
