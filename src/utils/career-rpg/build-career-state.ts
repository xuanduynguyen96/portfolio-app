import { xpRules, type XpRules } from '../../data/xp-rules.ts';
import { classifyCharacter } from '../github-character/classify-character.ts';
import type { GithubSnapshot } from '../github-character/github-snapshot-types.ts';
import { pickBossRepo, repoToQuestInput, selectQuestRepos, toRepoSlug } from '../github-character/repo-quests.ts';
import { repoMatchesSkill } from '../github-character/repo-skill-matches.ts';
import type {
  CareerState,
  ChangelogInput,
  ProfileInput,
  QuestOverrideInput,
  RuleIssue,
  SkillNodeInput,
} from './career-types.ts';
import { computeContributionStreak, validateChangelog } from './consistency-streak.ts';
import { countPlaceholderFiles, evaluateCompleteness } from './profile-completeness.ts';
import { scoreQuests } from './quest-scoring.ts';
import { buildSkillTree, flattenSkillTree, validateSkillTree } from './skill-tree.ts';
import { pickTopAchievements } from './speedrun-achievements.ts';
import { validateQuestOverrides } from './validate-quest-overrides.ts';
import { computeAttributeXp, levelInfo } from './xp-and-level.ts';

export interface CareerInputs {
  /** Normalized public GitHub data: the source of quests, skills, streak and class. */
  snapshot: GithubSnapshot;
  /** Optional case studies, one per repo slug. */
  overrides: readonly QuestOverrideInput[];
  skills: readonly SkillNodeInput[];
  /** Validated (no future dates) but not scored: the streak comes from GitHub activity. */
  changelog: readonly ChangelogInput[];
  profile: ProfileInput;
  /** Source path -> raw text, scanned for placeholder markers. */
  rawSources: Readonly<Record<string, string>>;
  /** Build date; injected so results are deterministic. */
  now: Date;
}

/** All cross-entry rule violations at once, so one build run lists every problem. */
export class CareerRuleError extends Error {
  issues: RuleIssue[];

  constructor(issues: RuleIssue[]) {
    const lines = issues.map((item) => `- ${item.source} ${item.id}: ${item.problem}`);
    super(`Career RPG rules failed (${issues.length}):\n${lines.join('\n')}`);
    this.name = 'CareerRuleError';
    this.issues = issues;
  }
}

/** Validate everything, then score. Pure: same inputs => same state. Throws CareerRuleError. */
export function buildCareerState(inputs: CareerInputs, rules: XpRules = xpRules): CareerState {
  const { snapshot } = inputs;
  const issues = [
    ...validateSkillTree(inputs.skills),
    ...validateQuestOverrides(inputs.overrides, snapshot),
    ...validateChangelog(inputs.changelog, inputs.now, rules),
  ];
  if (snapshot.repos.length === 0) issues.push({ source: 'quest', id: '(all)', problem: 'the GitHub snapshot has no public repos' });
  if (issues.length > 0) throw new CareerRuleError(issues);

  const selected = selectQuestRepos(snapshot, inputs.overrides, rules);
  const boss = pickBossRepo(selected, snapshot, inputs.overrides);
  const overrideById = new Map(inputs.overrides.map((override) => [override.id, override]));
  const quests = scoreQuests(
    selected.map((repo, rank) =>
      repoToQuestInput(repo, overrideById.get(toRepoSlug(repo.name)), { snapshot, skills: inputs.skills, boss, rank }, rules)),
    rules,
  );

  const questIdsBySkill = new Map<string, string[]>();
  for (const quest of quests) {
    for (const skill of quest.skills) questIdsBySkill.set(skill, [...(questIdsBySkill.get(skill) ?? []), quest.id]);
  }
  const repoUrlsBySkill = new Map(inputs.skills.map((node) => [
    node.id,
    snapshot.repos.filter((repo) => repoMatchesSkill(repo, node.match)).map((repo) => repo.url),
  ]));
  const skillTree = buildSkillTree(inputs.skills, repoUrlsBySkill, questIdsBySkill, rules);

  const attributes = computeAttributeXp(quests, flattenSkillTree(skillTree), rules);
  const totalXp = attributes.reduce((sum, attribute) => sum + attribute.xp, 0);
  const streak = computeContributionStreak(snapshot.activity.weeks, inputs.now, rules);
  const completeness = evaluateCompleteness(
    {
      profile: inputs.profile,
      quests,
      snapshotAsOf: snapshot.asOf,
      now: inputs.now,
      placeholderFiles: countPlaceholderFiles(inputs.rawSources),
      currentStreak: streak.current,
    },
    rules,
  );

  return {
    quests,
    // A non-empty snapshot always yields a boss (pickBossRepo falls back to the top repo).
    boss: quests.find((quest) => quest.isBoss)!,
    skillTree,
    attributes,
    level: levelInfo(totalXp, rules),
    streak,
    completeness,
    achievements: pickTopAchievements(quests, rules.speedrun.achievements),
    character: classifyCharacter(snapshot),
    snapshotAsOf: snapshot.asOf,
    githubUrl: `https://github.com/${snapshot.login}`,
  };
}
