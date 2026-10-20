// Prints the character the committed snapshot produces, with per-repo votes (`npm run character:explain`).
import { readFileSync } from 'node:fs';
import { DOMAIN_IDS } from '../src/data/character-class-rules.ts';
import { skillNodes } from '../src/data/skills-data.ts';
import { classifyCharacter } from '../src/utils/github-character/classify-character.ts';
import type { GithubSnapshot } from '../src/utils/github-character/github-snapshot-types.ts';
import { repoDomainVote } from '../src/utils/github-character/repo-domain-vote.ts';
import { repoMatchesSkill } from '../src/utils/github-character/repo-skill-matches.ts';

const path = process.argv[2] ?? new URL('../src/data/github/github-snapshot.json', import.meta.url);
const snapshot = JSON.parse(readFileSync(path, 'utf8')) as GithubSnapshot;
const profile = classifyCharacter(snapshot);
const fixed = (value: number) => value.toFixed(3);

console.log(`${snapshot.login} as of ${snapshot.asOf}: ${profile.className}${profile.jobName ? ` · ${profile.jobName}` : ''}`);
console.log(`scores ${DOMAIN_IDS.map((d) => `${d} ${fixed(profile.scores[d])}`).join(' | ')}`);
console.log(`primary ${profile.primary ?? '-'}, motif ${profile.motif ?? '-'}\n`);
console.log('Per repo (weighted vote):');
for (const repo of snapshot.repos) {
  const proven = skillNodes.filter((node) => repoMatchesSkill(repo, node.match));
  const { vote } = repoDomainVote(repo, proven, snapshot.asOf);
  console.log(`  ${repo.name.padEnd(30)} ${DOMAIN_IDS.map((d) => `${d} ${fixed(vote[d])}`).join('  ')}`);
}
console.log('\nWhy (class signals):');
for (const signal of profile.signals) console.log(`  ${signal.domain.padEnd(9)} ${fixed(signal.points)}  ${signal.repo}: ${signal.reason}`);
console.log('\nWhy (job signals):');
for (const signal of profile.jobSignals) console.log(`  ${fixed(signal.points)}  ${signal.repo}: ${signal.reason}`);
console.log('\nGear:');
for (const slot of profile.gear) console.log(`  ${slot.label.padEnd(7)} ${slot.axis.padEnd(11)} tier ${slot.tier}  ${slot.repos.join(', ') || '-'}`);
