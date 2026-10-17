// Prints the character the committed snapshot produces, with per-repo votes (`npm run character:explain`).
import { readFileSync } from 'node:fs';
import { ARCHETYPE_IDS } from '../src/data/character-class-rules.ts';
import { classifyCharacter } from '../src/utils/github-character/classify-character.ts';
import type { GithubSnapshot } from '../src/utils/github-character/github-snapshot-types.ts';
import { repoArchetypeVote } from '../src/utils/github-character/repo-archetype-vote.ts';

const path = process.argv[2] ?? new URL('../src/data/github/github-snapshot.json', import.meta.url);
const snapshot = JSON.parse(readFileSync(path, 'utf8')) as GithubSnapshot;
const profile = classifyCharacter(snapshot);
const fixed = (value: number) => value.toFixed(3);

console.log(`${snapshot.login} as of ${snapshot.asOf}: ${profile.className}${profile.jobName ? ` · ${profile.jobName}` : ''}`);
console.log(`scores ${ARCHETYPE_IDS.map((a) => `${a} ${fixed(profile.scores[a])}`).join(' | ')}`);
console.log(`primary ${profile.primary ?? '-'}, secondary ${profile.secondary ?? '-'}, motif ${profile.motif ?? '-'}\n`);
console.log('Per repo (weighted vote):');
for (const repo of snapshot.repos) {
  const { vote } = repoArchetypeVote(repo, snapshot.asOf);
  console.log(`  ${repo.name.padEnd(30)} ${ARCHETYPE_IDS.map((a) => `${a[0]} ${fixed(vote[a])}`).join('  ')}`);
}
console.log('\nWhy (signals):');
for (const signal of profile.signals) console.log(`  ${signal.archetype.padEnd(9)} ${fixed(signal.points)}  ${signal.repo}: ${signal.reason}`);
console.log('\nGear:');
for (const slot of profile.gear) console.log(`  ${slot.label.padEnd(7)} ${slot.axis.padEnd(11)} tier ${slot.tier}  ${slot.repos.join(', ') || '-'}`);
