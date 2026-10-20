// Class + job from the snapshot. Each public repo votes for the domains of the skills it proves; the
// strongest domain is the class. Within that class, the job is the specialty whose skills the most repos
// voting for that domain prove. Deterministic: scores rounded to 3 decimals, ties broken by domain order,
// then job order.
import { classRules, DOMAIN_IDS, type ClassRules, type DomainId } from '../../data/character-class-rules.ts';
import { CLASS_BY_DOMAIN, CLASS_NAMES, JOBS, type CombatClassId, type JobDefinition } from '../../data/character-job-rules.ts';
import { skillNodes } from '../../data/skills-data.ts';
import type { SkillNodeInput } from '../career-rpg/career-types.ts';
import type { CharacterProfile, ClassSignal } from './character-types.ts';
import { computeGearTiers } from './gear-tiers.ts';
import type { GithubSnapshot } from './github-snapshot-types.ts';
import { repoDomainVote, round3, zeroVote, type DomainVote } from './repo-domain-vote.ts';
import { repoMatchesSkill } from './repo-skill-matches.ts';

interface Voter {
  name: string;
  vote: DomainVote;
  proven: readonly SkillNodeInput[];
}

const bySignal = (a: ClassSignal, b: ClassSignal) => b.points - a.points || (a.repo < b.repo ? -1 : a.repo > b.repo ? 1 : 0);

/** The voter gives weight to the domain and proves at least one skill of the job. */
const creditsJob = (voter: Voter, job: JobDefinition, domain: DomainId) =>
  voter.vote[domain] > 0 && voter.proven.some((node) => job.skills.includes(node.id));

function rankDomains(scores: DomainVote): DomainId[] {
  return [...DOMAIN_IDS].sort((a, b) => scores[b] - scores[a] || DOMAIN_IDS.indexOf(a) - DOMAIN_IDS.indexOf(b));
}

/** Job with the most domain weight from the repos that prove its skills; ties go to the earlier job. */
function pickJob(classId: CombatClassId, domain: DomainId, voters: readonly Voter[]): JobDefinition {
  const credit = (job: JobDefinition) =>
    voters.filter((voter) => creditsJob(voter, job, domain)).reduce((sum, voter) => sum + voter.vote[domain], 0);
  // Rounded like the domain scores so one tie rule (earlier job wins) holds for both.
  const rounded = (job: JobDefinition) => round3(credit(job));
  return JOBS[classId].reduce((best, job) => (rounded(job) > rounded(best) ? job : best));
}

function jobSignals(job: JobDefinition, domain: DomainId, voters: readonly Voter[], count: number): ClassSignal[] {
  return voters
    .filter((voter) => creditsJob(voter, job, domain))
    .map((voter): ClassSignal => ({
      repo: voter.name,
      domain,
      points: round3(voter.vote[domain]),
      reason: voter.proven.filter((node) => job.skills.includes(node.id)).map((node) => node.label).join(', '),
    }))
    .sort(bySignal)
    .slice(0, count);
}

export function classifyCharacter(
  snapshot: GithubSnapshot,
  rules: ClassRules = classRules,
  skills: readonly SkillNodeInput[] = skillNodes,
): CharacterProfile {
  const scores = zeroVote();
  const voters: Voter[] = [];
  const signals: ClassSignal[] = [];

  for (const repo of snapshot.repos) {
    const proven = skills.filter((node) => repoMatchesSkill(repo, node.match, rules));
    const { vote, signals: repoSignals } = repoDomainVote(repo, proven, snapshot.asOf, rules);
    if (repoSignals.length === 0) continue;
    for (const domain of DOMAIN_IDS) scores[domain] += vote[domain];
    voters.push({ name: repo.name, vote, proven });
    signals.push(...repoSignals);
  }
  for (const domain of DOMAIN_IDS) scores[domain] = round3(scores[domain]);

  const gear = computeGearTiers(snapshot);
  const total = DOMAIN_IDS.reduce((sum, domain) => sum + scores[domain], 0);
  if (total < rules.fallback.minTotal || voters.length < rules.fallback.minRepos) {
    return {
      classId: 'adventurer', className: CLASS_NAMES.adventurer, jobId: null, jobName: null, motif: null,
      scores, primary: null, signals: signals.sort(bySignal).slice(0, rules.signals.domain), jobSignals: [], gear,
    };
  }

  const [primary] = rankDomains(scores);
  const classId = CLASS_BY_DOMAIN[primary];
  const job = pickJob(classId, primary, voters);

  return {
    classId,
    className: CLASS_NAMES[classId],
    jobId: job.id,
    jobName: job.name,
    motif: job.motif,
    scores,
    primary,
    signals: signals.filter((signal) => signal.domain === primary).sort(bySignal).slice(0, rules.signals.domain),
    jobSignals: jobSignals(job, primary, voters, rules.signals.job),
    gear,
  };
}
