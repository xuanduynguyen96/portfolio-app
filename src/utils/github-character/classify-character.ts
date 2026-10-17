// Class + job from the snapshot: sum repo votes per archetype, primary = top, secondary = runner-up if
// strong enough. Deterministic: scores rounded to 3 decimals, ties broken by repo majority, then id order.
import { ARCHETYPE_IDS, classRules, type ArchetypeId, type ClassRules } from '../../data/character-class-rules.ts';
import { CLASS_BY_ARCHETYPE, CLASS_NAMES, JOBS } from '../../data/character-job-rules.ts';
import type { CharacterProfile, ClassSignal } from './character-types.ts';
import { computeGearTiers } from './gear-tiers.ts';
import type { GithubSnapshot } from './github-snapshot-types.ts';
import { repoArchetypeVote, round3, type ArchetypeVote } from './repo-archetype-vote.ts';

const PRIMARY_SIGNALS = 5;
const SECONDARY_SIGNALS = 2;

const bySignal = (a: ClassSignal, b: ClassSignal) => b.points - a.points || (a.repo < b.repo ? -1 : a.repo > b.repo ? 1 : 0);

function rankArchetypes(scores: ArchetypeVote, topCounts: ArchetypeVote): ArchetypeId[] {
  return [...ARCHETYPE_IDS].sort((a, b) =>
    scores[b] - scores[a] || topCounts[b] - topCounts[a] || ARCHETYPE_IDS.indexOf(a) - ARCHETYPE_IDS.indexOf(b));
}

export function classifyCharacter(snapshot: GithubSnapshot, rules: ClassRules = classRules): CharacterProfile {
  const scores: ArchetypeVote = { backend: 0, data: 0, frontend: 0 };
  const topCounts: ArchetypeVote = { backend: 0, data: 0, frontend: 0 };
  const signals: ClassSignal[] = [];
  let votingRepos = 0;

  for (const repo of snapshot.repos) {
    const { vote, signals: repoSignals } = repoArchetypeVote(repo, snapshot.asOf, rules);
    if (repoSignals.length === 0) continue;
    votingRepos++;
    for (const archetype of ARCHETYPE_IDS) scores[archetype] += vote[archetype];
    const top = [...ARCHETYPE_IDS].sort((a, b) => vote[b] - vote[a] || ARCHETYPE_IDS.indexOf(a) - ARCHETYPE_IDS.indexOf(b))[0];
    topCounts[top]++;
    signals.push(...repoSignals);
  }
  for (const archetype of ARCHETYPE_IDS) scores[archetype] = round3(scores[archetype]);

  const gear = computeGearTiers(snapshot);
  const total = ARCHETYPE_IDS.reduce((sum, archetype) => sum + scores[archetype], 0);
  if (total < rules.fallback.minTotal || votingRepos < rules.fallback.minRepos) {
    return {
      classId: 'adventurer', className: CLASS_NAMES.adventurer, jobId: null, jobName: null, motif: null,
      scores, primary: null, secondary: null, signals: signals.sort(bySignal).slice(0, PRIMARY_SIGNALS), gear,
    };
  }

  const [primary, runnerUp] = rankArchetypes(scores, topCounts);
  const secondary = scores[runnerUp] >= rules.secondary.minRatio * scores[primary] && scores[runnerUp] >= rules.secondary.minScore
    ? runnerUp
    : null;
  const motif = secondary ?? primary;
  const classId = CLASS_BY_ARCHETYPE[primary];
  const job = JOBS[classId][motif];
  const ranked = (archetype: ArchetypeId, count: number) =>
    signals.filter((signal) => signal.archetype === archetype).sort(bySignal).slice(0, count);

  return {
    classId,
    className: CLASS_NAMES[classId],
    jobId: job.id,
    jobName: job.name,
    motif,
    scores,
    primary,
    secondary,
    signals: [...ranked(primary, PRIMARY_SIGNALS), ...(secondary ? ranked(secondary, SECONDARY_SIGNALS) : [])],
    gear,
  };
}
