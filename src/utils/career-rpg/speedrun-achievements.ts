import type { Achievement, ScoredQuest } from './career-types.ts';

/**
 * Top achievements for the 60-second recruiter view: metrics of verified quests only,
 * boss first, then featured quests by XP. Round-robin (every quest's 1st metric, then 2nd...)
 * so one quest can't crowd out the rest. Returns fewer than `count` when metrics run out.
 */
export function pickTopAchievements(quests: readonly ScoredQuest[], count: number): Achievement[] {
  const verified = quests.filter((quest) => quest.verified);
  const candidates = [
    ...verified.filter((quest) => quest.isBoss),
    ...verified.filter((quest) => !quest.isBoss && quest.featured).sort((a, b) => b.xp - a.xp),
  ];
  const rounds = Math.max(0, ...candidates.map((quest) => quest.metrics.length));
  const picked: Achievement[] = [];

  for (let round = 0; round < rounds && picked.length < count; round++) {
    for (const quest of candidates) {
      const metric = quest.metrics[round];
      if (!metric || picked.length >= count) continue;
      picked.push({
        questId: quest.id,
        questTitle: quest.title,
        label: metric.label,
        value: metric.value,
        ...(metric.unit === undefined ? {} : { unit: metric.unit }),
      });
    }
  }
  return picked;
}
