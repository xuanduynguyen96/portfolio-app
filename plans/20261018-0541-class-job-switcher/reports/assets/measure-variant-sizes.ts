// Phase 00 baseline: avatar markup bytes for every try-on look (owner's real gear), per delivery option.
// Usage: node --disable-warning=ExperimentalWarning plans/20261018-0541-class-job-switcher/reports/assets/measure-variant-sizes.ts
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { avatarDescription } from '../../../../src/utils/avatar/avatar-description.ts';
import { avatarFrameGrid, avatarFramePaths, avatarSvgMarkup } from '../../../../src/utils/avatar/avatar-svg-markup.ts';
import { allClassLooks, lookProfile } from '../../../../src/utils/avatar/class-looks.ts';
import { classifyCharacter } from '../../../../src/utils/github-character/classify-character.ts';
import type { GithubSnapshot } from '../../../../src/utils/github-character/github-snapshot-types.ts';

const snapshot = JSON.parse(readFileSync('src/data/github/github-snapshot.json', 'utf8')) as GithubSnapshot;
const owner = classifyCharacter(snapshot);
console.log('owner', owner.classId, owner.jobName, owner.jobId, owner.gear.map((g) => `${g.slot}:${g.tier}`).join(' '));

// Updated for v1.5 (class = domain): every class x job slot look plus the Adventurer, via the shared look list.
const looks = allClassLooks().map((look) => lookProfile(look, owner.gear));
const gz = (text: string) => gzipSync(text, { level: 9 }).length;
let framesAndDesc = '';
const rows = looks.map((profile) => {
  const still = avatarSvgMarkup({ profile, size: 192, idPrefix: 'x' });
  const animated = avatarSvgMarkup({ profile, size: 256, idPrefix: 'x', animate: true });
  const frames = `<g class="avatar-frame-a">${avatarFramePaths(avatarFrameGrid(profile, 0))}</g><g class="avatar-frame-b">${avatarFramePaths(avatarFrameGrid(profile, 1))}</g>`;
  framesAndDesc += frames + avatarDescription(profile).desc;
  return { look: `${profile.className}${profile.jobName ? ` · ${profile.jobName}` : ''}`, staticRaw: still.length, staticGz: gz(still), animatedRaw: animated.length, animatedGz: gz(animated), framesRaw: frames.length, framesGz: gz(frames) };
});
console.table(rows);
console.log(`all 10 looks (frames + desc) concatenated: raw ${framesAndDesc.length} B, gzip ${gz(framesAndDesc)} B  <- option A (inline templates) payload on EVERY home load`);
console.log(`sum of per-look frames gzip: ${rows.reduce((s, r) => s + r.framesGz, 0)} B  <- option B worst case (all 9-10 fetched separately)`);
