// Review sheet for the layered avatar: every class x motif x a few gear tier sets, both frames, on
// both theme backgrounds, rendered through the production markup path + real design tokens.
// Usage: node scripts/render-avatar-sheet.ts [out.html] [--png out.png]
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ARCHETYPE_IDS, type ArchetypeId } from '../src/data/character-class-rules.ts';
import { CLASS_BY_ARCHETYPE, CLASS_NAMES, JOBS, type ClassId } from '../src/data/character-job-rules.ts';
import { GEAR_SLOT_IDS } from '../src/data/gear-rules.ts';
import type { AvatarFrame } from '../src/data/avatar/avatar-types.ts';
import type { AvatarProfile } from '../src/utils/avatar/avatar-description.ts';
import { AVATAR_VIEWBOX, avatarFrameGrid, avatarFramePaths, avatarSvgMarkup } from '../src/utils/avatar/avatar-svg-markup.ts';
import type { GearTier } from '../src/utils/github-character/character-types.ts';

const DEFAULT_OUT = 'plans/20261017-1617-github-derived-character-avatar/reports/assets/05-avatar-sheet.html';
const args = process.argv.slice(2);
const pngIndex = args.indexOf('--png');
const pngOut = pngIndex >= 0 ? args[pngIndex + 1] : undefined;
const htmlOut = resolve(args.find((arg, i) => !arg.startsWith('--') && i !== pngIndex + 1) ?? DEFAULT_OUT);

type Tiers = readonly [GearTier, GearTier, GearTier, GearTier]; // armor, shield, boots, amulet
const TIER_SETS: readonly [string, Tiers][] = [
  ['all 0', [0, 0, 0, 0]],
  ['owner 0·1·2·0', [0, 1, 2, 0]],
  ['all 1', [1, 1, 1, 1]],
  ['all 2', [2, 2, 2, 2]],
  ['all 3', [3, 3, 3, 3]],
  ['mixed 3·2·1·0', [3, 2, 1, 0]],
];

function profileOf(classId: ClassId, motif: ArchetypeId | null, tiers: Tiers): AvatarProfile {
  const job = classId !== 'adventurer' && motif ? JOBS[classId][motif] : null;
  return {
    classId,
    className: CLASS_NAMES[classId],
    jobName: job?.name ?? null,
    motif: classId === 'adventurer' ? null : motif,
    gear: GEAR_SLOT_IDS.map((slot, i) => ({ slot, axis: '', label: '', tier: tiers[i], repos: [] })),
  };
}

const LOOKS: AvatarProfile[] = [
  ...ARCHETYPE_IDS.flatMap((primary) =>
    ARCHETYPE_IDS.map((motif) => profileOf(CLASS_BY_ARCHETYPE[primary], motif, [0, 0, 0, 0]))),
  profileOf('adventurer', null, [0, 0, 0, 0]),
];
const PURE = [...ARCHETYPE_IDS.map((a) => profileOf(CLASS_BY_ARCHETYPE[a], a, [0, 0, 0, 0])), profileOf('adventurer', null, [0, 0, 0, 0])];

/** One static frame (frame B included) at `art` px per 32-grid. */
function frameSvg(profile: AvatarProfile, frame: AvatarFrame, art: number): string {
  const box = (art * AVATAR_VIEWBOX) / 32;
  return `<svg class="character-avatar" viewBox="0 0 ${AVATAR_VIEWBOX} ${AVATAR_VIEWBOX}" width="${box}" height="${box}" shape-rendering="crispEdges" style="--avatar-px:${art / 32}px">${avatarFramePaths(avatarFrameGrid(profile, frame))}</svg>`;
}
const withTiers = (p: AvatarProfile, tiers: Tiers) => profileOf(p.classId, p.motif, tiers);
const label = (p: AvatarProfile) => (p.jobName ? `${p.className} · ${p.jobName}` : p.className);
const cell = (caption: string, body: string) => `<figure><div class="row">${body}</div><figcaption>${caption}</figcaption></figure>`;

function themeBand(theme: 'light' | 'dark'): string {
  const big = PURE.map((p) => cell(`${label(p)} · A | B · tier 0`, frameSvg(p, 0, 128) + frameSvg(p, 1, 128))).join('');
  const bigT3 = PURE.map((p) => cell(`${label(p)} · A | B · tier 3`, frameSvg(withTiers(p, [3, 3, 3, 3]), 0, 128) + frameSvg(withTiers(p, [3, 3, 3, 3]), 1, 128))).join('');
  const ladder = GEAR_SLOT_IDS.map((slot, s) =>
    cell(`${slot} 0→3 (others 0)`, [0, 1, 2, 3].map((t) => {
      const tiers = [0, 0, 0, 0] as GearTier[];
      tiers[s] = t as GearTier;
      return frameSvg(withTiers(PURE[0], tiers as unknown as Tiers), 0, 96);
    }).join(''))).join('');
  const grid = LOOKS.map((p) =>
    `<tr><th>${label(p)}</th>${TIER_SETS.map(([, t]) => `<td>${frameSvg(withTiers(p, t), 0, 64)}${frameSvg(withTiers(p, t), 1, 64)}</td>`).join('')}</tr>`).join('');
  const head = `<tr><th></th>${TIER_SETS.map(([name]) => `<th>${name} (A | B)</th>`).join('')}</tr>`;
  const hero = avatarSvgMarkup({ profile: profileOf('warrior', 'frontend', [0, 1, 2, 0]), size: 192, idPrefix: `hero-${theme}`, animate: true });
  return `<section class="band ${theme}"><h2>${theme} theme</h2>
<div class="wrap">${cell('owner, animated (hero, 192)', hero)}${big}</div><div class="wrap">${bigT3}</div>
<div class="wrap">${ladder}</div><table>${head}${grid}</table></section>`;
}

const tokens = readFileSync(new URL('../src/styles/design-tokens.css', import.meta.url), 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Avatar sheet</title><style>${tokens}
body{margin:0;font:14px system-ui,sans-serif}
.band{padding:16px 20px}.band.light{color-scheme:light;background:#f4ecd8 linear-gradient(#e2d8c2 1px,transparent 1px) 0 0/48px 48px;color:#2b1f14}
.band.dark{color-scheme:dark;background:#14110f;color:#eae0cc}h2{margin:0 0 8px;font-size:16px}
.wrap{display:flex;flex-wrap:wrap;gap:18px;align-items:end;margin-bottom:14px}figure{margin:0}.row{display:flex;gap:6px;align-items:end}
figcaption{font-size:12px;opacity:.8}table{border-collapse:collapse}th{font-size:12px;text-align:left;padding:2px 8px;font-weight:600}td{padding:4px 8px}
.character-avatar{filter:drop-shadow(0 calc(var(--avatar-px) * 0.75) calc(var(--avatar-px) * 0.75) var(--avatar-shadow))}
.character-avatar .avatar-frame-b{visibility:hidden}
@media (prefers-reduced-motion:no-preference){.character-avatar[data-animate] .avatar-frame-a{animation:avatar-frame-a .9s steps(1) infinite}
.character-avatar[data-animate] .avatar-frame-b{animation:avatar-frame-b .9s steps(1) infinite}}
@keyframes avatar-frame-a{0%{visibility:visible}50%{visibility:hidden}}@keyframes avatar-frame-b{0%{visibility:hidden}50%{visibility:visible}}
</style></head><body>${themeBand('light')}${themeBand('dark')}</body></html>`;
writeFileSync(htmlOut, html);
console.log(`wrote ${htmlOut} (${(html.length / 1024).toFixed(0)} KB)`);

if (pngOut) {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(`file://${htmlOut}`);
  await page.screenshot({ path: resolve(pngOut), fullPage: true });
  await browser.close();
  console.log(`wrote ${resolve(pngOut)}`);
}
