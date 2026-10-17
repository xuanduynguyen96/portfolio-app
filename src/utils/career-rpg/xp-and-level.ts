import { ATTRIBUTE_IDS, xpRules, type AttributeId, type XpRules } from '../../data/xp-rules.ts';
import type { AttributeScore, LevelInfo, ScoredQuest, SkillTreeNode } from './career-types.ts';

/**
 * Attribute XP = quest XP (split evenly across the quest's skills' attributes)
 * + each skill node's own evidence XP; each attribute clamped to the cap, then rounded.
 */
export function computeAttributeXp(
  quests: readonly ScoredQuest[],
  skillNodes: readonly SkillTreeNode[],
  rules: XpRules = xpRules,
): AttributeScore[] {
  const attributeOf = new Map(skillNodes.map((node) => [node.id, node.attribute]));
  const totals = new Map<AttributeId, number>(ATTRIBUTE_IDS.map((id) => [id, 0]));
  const add = (id: AttributeId | undefined, xp: number) => {
    if (id) totals.set(id, (totals.get(id) ?? 0) + xp);
  };

  for (const quest of quests) {
    if (quest.skills.length === 0) continue;
    const share = quest.xp / quest.skills.length;
    quest.skills.forEach((skill) => add(attributeOf.get(skill), share));
  }
  skillNodes.forEach((node) => add(node.attribute, node.xp));

  return ATTRIBUTE_IDS.map((id) => ({
    id,
    label: rules.attributes[id],
    xp: Math.round(Math.min(rules.attributeCap, totals.get(id) ?? 0)),
    cap: rules.attributeCap,
  }));
}

/** Total XP needed to reach level L: base * (L - 1)^exponent (L1 = 0). */
export function xpForLevel(level: number, rules: XpRules = xpRules): number {
  return level <= 1 ? 0 : Math.round(rules.level.base * (level - 1) ** rules.level.exponent);
}

export function levelFromXp(xp: number, rules: XpRules = xpRules): number {
  let level = 1;
  while (level < rules.level.max && xp >= xpForLevel(level + 1, rules)) level++;
  return level;
}

/** Highest title band whose minLevel <= level. */
export function titleForLevel(level: number, rules: XpRules = xpRules): string {
  let title = rules.titles[0]?.title ?? '';
  for (const band of rules.titles) {
    if (band.minLevel <= level) title = band.title;
  }
  return title;
}

export function levelInfo(totalXp: number, rules: XpRules = xpRules): LevelInfo {
  const level = levelFromXp(totalXp, rules);
  const currentLevelXp = xpForLevel(level, rules);
  const atMax = level >= rules.level.max;
  const nextLevelXp = atMax ? null : xpForLevel(level + 1, rules);
  const progress = nextLevelXp === null ? 1 : (totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp);
  return { level, title: titleForLevel(level, rules), totalXp, currentLevelXp, nextLevelXp, progress };
}
