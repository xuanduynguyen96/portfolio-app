// Phase 00/02 helper: contrast of candidate per-job accent colours against the composer outline (their real
// neighbour) and the sticker ring (both themes), plus pairwise CIE76 distance. Pure arithmetic, no imports.
// Usage: node plans/20261021-0208-distinct-job-art-per-job-props/reports/assets/check-accent-contrast.ts
// Gate (phase 02): vs outline >= 3:1 for all 9; min pairwise dE >= 20 overall and >= 30 inside a class.
const OUTLINE = '#2a1f1d';
const RING = { light: '#9a7b52', dark: '#fbf7ee' };
const ACCENTS: Record<string, string> = { // provisional: phase 00 may nudge hexes, never the contrast gate
  knight: '#8b6fd6', paladin: '#5aae5c', sentinel: '#4a8fd9',
  ranger: '#2fb8d4', skirmisher: '#d9559b', herald: '#ee7c36',
  enchanter: '#b9c93a', summoner: '#c4694a', seer: '#e0527a',
};
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (h: string) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
function lab(h: string): number[] {
  const [r, g, b] = rgb(h).map(lin);
  const [x, y, z] = [(0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, 0.2126 * r + 0.7152 * g + 0.0722 * b, (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883];
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
const dE = (a: string, b: string) => { const [p, q] = [lab(a), lab(b)]; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };

console.log('job         hex      vs outline  vs ring light  vs ring dark');
for (const [job, hex] of Object.entries(ACCENTS)) {
  console.log(`${job.padEnd(11)} ${hex}  ${ratio(hex, OUTLINE).toFixed(2).padStart(9)}  ${ratio(hex, RING.light).toFixed(2).padStart(13)}  ${ratio(hex, RING.dark).toFixed(2).padStart(12)}`);
}
const jobs = Object.keys(ACCENTS);
const pairs = jobs.flatMap((a, i) => jobs.slice(i + 1).map((b) => ({ pair: `${a}/${b}`, de: dE(ACCENTS[a], ACCENTS[b]), sameClass: Math.floor(i / 3) === Math.floor(jobs.indexOf(b) / 3) })));
const lowest = (list: typeof pairs) => list.sort((x, y) => x.de - y.de)[0];
console.log(`lowest pair overall ${lowest([...pairs]).pair} dE ${lowest([...pairs]).de.toFixed(1)}; inside a class ${lowest(pairs.filter((p) => p.sameClass)).pair} dE ${lowest(pairs.filter((p) => p.sameClass)).de.toFixed(1)}`);
