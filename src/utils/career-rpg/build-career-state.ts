import { xpRules, type XpRules } from '../../data/xp-rules.ts';
import type {
  CareerState,
  ChangelogInput,
  ProfileInput,
  QuestInput,
  RuleIssue,
  SkillNodeInput,
} from './career-types.ts';
import { computeStreak, validateChangelog } from './consistency-streak.ts';
import { countPlaceholderFiles, evaluateCompleteness } from './profile-completeness.ts';
import { scoreQuests, validateQuestLog } from './quest-scoring.ts';
import { buildSkillTree, flattenSkillTree, validateSkillTree } from './skill-tree.ts';
import { pickTopAchievements } from './speedrun-achievements.ts';
import { computeAttributeXp, levelInfo } from './xp-and-level.ts';

export interface CareerInputs {
  quests: readonly QuestInput[];
  skills: readonly SkillNodeInput[];
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
  const skillIds = new Set(inputs.skills.map((node) => node.id));
  const issues = [
    ...validateSkillTree(inputs.skills),
    ...validateQuestLog(inputs.quests, skillIds),
    ...validateChangelog(inputs.changelog, inputs.now, rules),
  ];
  if (issues.length > 0) throw new CareerRuleError(issues);

  // One URL earns XP once site-wide: quests claim first (boss first), then skill nodes.
  const seen = new Set<string>();
  const quests = scoreQuests(inputs.quests, seen, rules);
  const questIdsBySkill = new Map<string, string[]>();
  for (const quest of quests.filter((item) => item.verified)) {
    for (const skill of quest.skills) questIdsBySkill.set(skill, [...(questIdsBySkill.get(skill) ?? []), quest.id]);
  }
  const skillTree = buildSkillTree(inputs.skills, questIdsBySkill, seen, rules);
  const skillNodes = flattenSkillTree(skillTree);

  const attributes = computeAttributeXp(quests, skillNodes, rules);
  const totalXp = attributes.reduce((sum, attribute) => sum + attribute.xp, 0);
  const streak = computeStreak(inputs.changelog, inputs.now, rules);
  const completeness = evaluateCompleteness(
    {
      profile: inputs.profile,
      quests,
      leafSkills: skillNodes.filter((node) => node.children.length === 0),
      placeholderFiles: countPlaceholderFiles(inputs.rawSources),
      currentStreak: streak.current,
    },
    rules,
  );

  return {
    quests,
    // validateQuestLog guarantees exactly one boss.
    boss: quests.find((quest) => quest.isBoss)!,
    skillTree,
    attributes,
    level: levelInfo(totalXp, rules),
    streak,
    completeness,
    achievements: pickTopAchievements(quests, rules.speedrun.achievements),
  };
}
