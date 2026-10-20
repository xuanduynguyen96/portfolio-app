// One repo's domain vote: the skills it proves, grouped by domain, split evenly across those skills, then
// weighted by recency, owner activity and archived state. Pure; reference date = asOf.
import { classRules, DOMAIN_IDS, type ClassRules, type DomainId } from '../../data/character-class-rules.ts';
import type { SkillNodeInput } from '../career-rpg/career-types.ts';
import type { ClassSignal } from './character-types.ts';
import type { SnapshotRepo } from './github-snapshot-types.ts';

/** Average Gregorian month (365.25 / 12 days). */
const AVG_MONTH_MS = 30.4375 * 86_400_000;

export type DomainVote = Record<DomainId, number>;

export interface RepoVote {
  vote: DomainVote;
  /** One signal per domain the repo voted for (points = weighted vote, reason = the skills it proves). */
  signals: ClassSignal[];
}

/** All-zero vote, derived from DOMAIN_IDS so a new domain can't be forgotten. */
export const zeroVote = (): DomainVote => Object.fromEntries(DOMAIN_IDS.map((id) => [id, 0])) as DomainVote;
export const round3 = (value: number) => Math.round(value * 1000) / 1000;

export function recencyWeight(pushedWeek: string, asOf: string, rules: ClassRules = classRules): number {
  const months = Math.max(0, (Date.parse(asOf) - Date.parse(pushedWeek)) / AVG_MONTH_MS);
  return Math.max(rules.recency.floor, 0.5 ** (months / rules.recency.halfLifeMonths));
}

export function activityWeight(commits: number, rules: ClassRules = classRules): number {
  return 1 + Math.min(rules.activity.max, Math.log10(1 + commits) * rules.activity.scale);
}

/** How much one repo counts: recency x owner activity x archived. Shared by the class vote and quest ranking. */
export function repoWeight(repo: SnapshotRepo, asOf: string, rules: ClassRules = classRules): number {
  return recencyWeight(repo.pushedWeek, asOf, rules) * activityWeight(repo.commits, rules)
    * (repo.isArchived ? rules.archivedFactor : 1);
}

/** `proven` = the skill nodes this repo matches. Skills outside `skillDomains` vote for nothing. */
export function repoDomainVote(
  repo: SnapshotRepo,
  proven: readonly SkillNodeInput[],
  asOf: string,
  rules: ClassRules = classRules,
): RepoVote {
  const vote = zeroVote();
  const voting = proven.filter((node) => rules.skillDomains[node.id] !== undefined);
  if (voting.length === 0) return { vote, signals: [] };

  const weight = repoWeight(repo, asOf, rules);
  const signals: ClassSignal[] = [];
  for (const domain of DOMAIN_IDS) {
    const skills = voting.filter((node) => rules.skillDomains[node.id] === domain);
    if (skills.length === 0) continue;
    vote[domain] = (skills.length / voting.length) * weight;
    signals.push({ repo: repo.name, domain, points: round3(vote[domain]), reason: skills.map((node) => node.label).join(', ') });
  }
  return { vote, signals };
}
