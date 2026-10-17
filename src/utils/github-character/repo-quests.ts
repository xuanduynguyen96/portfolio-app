// Repos -> quests: pick the repos worth showing, then build each quest from repo facts + override.
import { xpRules, type QuestDifficulty, type XpRules } from '../../data/xp-rules.ts';
import { gearRules } from '../../data/gear-rules.ts';
import type { Metric, QuestInput, QuestOverrideInput, SkillNodeInput } from '../career-rpg/career-types.ts';
import { repoHasGear } from './gear-tiers.ts';
import type { GithubSnapshot, SnapshotRepo } from './github-snapshot-types.ts';
import { ARCHETYPE_IDS } from '../../data/character-class-rules.ts';
import { repoArchetypeVote } from './repo-archetype-vote.ts';
import { MAX_QUEST_SKILLS, matchSkills } from './repo-skill-matches.ts';
import { splitName } from './repo-tokens.ts';

const SUMMARY_MAX = 160;
const MAX_TAGS = 6;

/** URL/file slug: `QrCodeScanner` -> `qr-code-scanner`, `aspnet_framework_docker_ex` -> `aspnet-framework-docker-ex`. */
export function toRepoSlug(name: string): string {
  return splitName(name).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

const kib = (repo: SnapshotRepo) => Math.round(repo.languages.reduce((sum, language) => sum + language.bytes, 0) / 1024);

/** Class vote total (recency + activity weighted) + hygiene slots + pinned bonus. */
export function questScore(repo: SnapshotRepo, snapshot: GithubSnapshot, rules: XpRules = xpRules): number {
  const { vote } = repoArchetypeVote(repo, snapshot.asOf);
  const voteTotal = ARCHETYPE_IDS.reduce((sum, archetype) => sum + vote[archetype], 0);
  const hygiene = gearRules.filter((rule) => repoHasGear(repo, rule)).length;
  const pinned = snapshot.pinned.includes(repo.name) ? 1 : 0;
  return voteTotal + hygiene * rules.quest.selection.hygieneBonus + pinned * rules.quest.selection.pinnedBonus;
}

/**
 * Top `quest.max` repos by score (desc, then name) plus every repo with an override, in score order.
 * Overrides only need an id and an optional boss flag, so e2e tests can mirror the selection.
 */
export function selectQuestRepos(
  snapshot: GithubSnapshot,
  overrides: readonly Pick<QuestOverrideInput, 'id'>[],
  rules: XpRules = xpRules,
): SnapshotRepo[] {
  const overridden = new Set(overrides.map((override) => override.id));
  const ranked = snapshot.repos
    .map((repo) => ({ repo, score: questScore(repo, snapshot, rules) }))
    .sort((a, b) => b.score - a.score || (a.repo.name < b.repo.name ? -1 : a.repo.name > b.repo.name ? 1 : 0));
  return ranked
    .filter((entry, index) => index < rules.quest.max || overridden.has(toRepoSlug(entry.repo.name)))
    .map((entry) => entry.repo);
}

/** Boss: the override marked isBoss, else the first pinned selected repo, else the top-ranked one. */
export function pickBossRepo(
  selected: readonly SnapshotRepo[],
  snapshot: GithubSnapshot,
  overrides: readonly Pick<QuestOverrideInput, 'id' | 'isBoss'>[],
): SnapshotRepo | undefined {
  const bossSlug = overrides.find((override) => override.isBoss)?.id;
  return (
    selected.find((repo) => toRepoSlug(repo.name) === bossSlug) ??
    selected.find((repo) => snapshot.pinned.includes(repo.name)) ??
    selected[0]
  );
}

export function questDifficulty(repo: SnapshotRepo, rules: XpRules = xpRules): QuestDifficulty {
  const { raid, main } = rules.quest.difficulty;
  if (repo.commits >= raid.commits || kib(repo) >= raid.kib) return 'raid';
  if (repo.commits >= main.commits || kib(repo) >= main.kib) return 'main';
  return 'side';
}

export function repoMetrics(repo: SnapshotRepo): Metric[] {
  return [
    ...(repo.commits > 0 ? [{ label: 'Commits', value: repo.commits }] : []),
    ...(repo.languages.length > 0 ? [{ label: 'Languages', value: repo.languages.length }] : []),
    ...(kib(repo) > 0 ? [{ label: 'Code', value: kib(repo), unit: 'KiB' }] : []),
  ];
}

function derivedSummary(repo: SnapshotRepo): string {
  const languages = repo.languages.slice(0, 3).map((language) => language.name);
  const text = repo.description ?? (languages.length > 0 ? `Public repository in ${languages.join(', ')}.` : 'Public repository.');
  return text.length > SUMMARY_MAX ? `${Array.from(text).slice(0, SUMMARY_MAX - 1).join('').trimEnd()}…` : text;
}

export interface QuestContext {
  snapshot: GithubSnapshot;
  skills: readonly SkillNodeInput[];
  boss: SnapshotRepo | undefined;
  /** Position in the selection (default display order). */
  rank: number;
}

export function repoToQuestInput(repo: SnapshotRepo, override: QuestOverrideInput | undefined, context: QuestContext, rules: XpRules = xpRules): QuestInput {
  const tags = [...new Set([...repo.languages.slice(0, 3).map((language) => language.name), ...repo.topics])].slice(0, MAX_TAGS);
  const shield = gearRules.find((rule) => rule.slot === 'shield');
  return {
    id: toRepoSlug(repo.name),
    repo: repo.name,
    title: override?.title ?? repo.name,
    summary: override?.summary ?? derivedSummary(repo),
    tags: override?.tags ?? tags,
    difficulty: questDifficulty(repo, rules),
    isBoss: repo === context.boss,
    featured: override?.featured ?? context.snapshot.pinned.includes(repo.name),
    order: override?.order ?? context.rank,
    skills: matchSkills(repo, context.skills).slice(0, MAX_QUEST_SKILLS),
    obstacles: override?.obstacles ?? [],
    metrics: override?.metrics ?? [],
    repoMetrics: repoMetrics(repo),
    evidence: [{ type: 'repo', url: repo.url }, ...(repo.homepage ? [{ type: 'demo' as const, url: repo.homepage }] : [])],
    body: override?.body ?? '',
    signals: {
      description: repo.description !== null,
      topics: repo.topics.length > 0,
      homepage: repo.homepage !== null,
      tests: shield ? repoHasGear(repo, shield) : false,
      ci: repo.workflowFiles.length > 0,
    },
    isSample: override?.isSample ?? false,
  };
}
