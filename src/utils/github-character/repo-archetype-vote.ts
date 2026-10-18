// One repo's vote: language shares + primary language + keywords, scaled so a repo's total is at
// most 1, then weighted by recency, owner activity and archived state. Pure; reference date = asOf.
import { ARCHETYPE_IDS, classRules, type ArchetypeId, type ClassRules } from '../../data/character-class-rules.ts';
import type { ClassSignal } from './character-types.ts';
import type { SnapshotRepo } from './github-snapshot-types.ts';
import { repoTokens } from './repo-tokens.ts';

/** Average Gregorian month (365.25 / 12 days). */
const AVG_MONTH_MS = 30.4375 * 86_400_000;

export type ArchetypeVote = Record<ArchetypeId, number>;

export interface RepoVote {
  vote: ArchetypeVote;
  /** One signal per archetype the repo voted for (points = weighted vote). */
  signals: ClassSignal[];
}

/** All-zero vote, derived from ARCHETYPE_IDS so a new archetype can't be forgotten. */
export const zeroVote = (): ArchetypeVote => Object.fromEntries(ARCHETYPE_IDS.map((id) => [id, 0])) as ArchetypeVote;
export const round3 = (value: number) => Math.round(value * 1000) / 1000;

export function recencyWeight(pushedWeek: string, asOf: string, rules: ClassRules = classRules): number {
  const months = Math.max(0, (Date.parse(asOf) - Date.parse(pushedWeek)) / AVG_MONTH_MS);
  return Math.max(rules.recency.floor, 0.5 ** (months / rules.recency.halfLifeMonths));
}

export function activityWeight(commits: number, rules: ClassRules = classRules): number {
  return 1 + Math.min(rules.activity.max, Math.log10(1 + commits) * rules.activity.scale);
}

export function repoArchetypeVote(repo: SnapshotRepo, asOf: string, rules: ClassRules = classRules): RepoVote {
  const raw = zeroVote();
  const reasons: Record<ArchetypeId, string[]> = { backend: [], data: [], frontend: [] };

  const counted = repo.languages
    .filter((language) => rules.languages[language.name] && !rules.ignoredLanguages.includes(language.name))
    .map((language) => ({
      name: language.name,
      bytes: language.name === 'Jupyter Notebook' ? Math.min(language.bytes, rules.notebookBytesCap) : language.bytes,
    }));
  const totalBytes = counted.reduce((sum, language) => sum + language.bytes, 0);
  for (const language of counted) {
    const share = language.bytes / totalBytes;
    if (share < rules.minLanguageShare) continue;
    for (const archetype of ARCHETYPE_IDS) {
      const weight = rules.languages[language.name][archetype] ?? 0;
      if (weight === 0) continue;
      const weighted = weight * (rules.languageWeight[language.name] ?? 1);
      raw[archetype] += share * weighted;
      // Show a language as evidence only where it really points (TypeScript's backend share is leakage).
      if (weighted >= rules.reasonMinWeight) reasons[archetype].push(`${language.name} ${Math.round(share * 100)}% of code`);
    }
  }

  const primary = repo.primaryLanguage ? rules.languages[repo.primaryLanguage] : undefined;
  if (primary && repo.primaryLanguage && !rules.ignoredLanguages.includes(repo.primaryLanguage)) {
    const markup = rules.languageWeight[repo.primaryLanguage] ?? 1;
    for (const archetype of ARCHETYPE_IDS) raw[archetype] += rules.primaryLanguageBonus * (primary[archetype] ?? 0) * markup;
  }

  const tokens = repoTokens(repo);
  for (const keyword of rules.keywords) {
    if (!tokens.has(keyword.match)) continue;
    raw[keyword.archetype] += keyword.points;
    reasons[keyword.archetype].push(`keyword "${keyword.match}"`);
  }

  const total = ARCHETYPE_IDS.reduce((sum, archetype) => sum + raw[archetype], 0);
  if (total === 0) return { vote: zeroVote(), signals: [] };
  const weight = (1 / Math.max(1, total)) * recencyWeight(repo.pushedWeek, asOf, rules) * activityWeight(repo.commits, rules)
    * (repo.isArchived ? rules.archivedFactor : 1);

  const vote = zeroVote();
  const signals: ClassSignal[] = [];
  for (const archetype of ARCHETYPE_IDS) {
    vote[archetype] = raw[archetype] * weight;
    const points = round3(vote[archetype]);
    if (points > 0) {
      const reason = reasons[archetype].length > 0 ? reasons[archetype].join(', ') : `partly ${repo.primaryLanguage ?? 'mixed code'}`;
      signals.push({ repo: repo.name, archetype, points, reason });
    }
  }
  return { vote, signals };
}
