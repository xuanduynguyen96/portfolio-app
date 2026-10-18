import type { Achievement, ScoredQuest } from './career-types.ts';

/**
 * Top achievements for the 60-second recruiter view: boss first, then featured, then the rest by XP.
 * Hand-reported override metrics come before repo facts. Round-robin (every quest's 1st metric,
 * then 2nd...) so one quest can't crowd out the rest. Returns fewer than `count` when metrics run out.
 */
export function pickTopAchievements(quests: readonly ScoredQuest[], count: number): Achievement[] {
  const byXp = (a: ScoredQuest, b: ScoredQuest) => b.xp - a.xp;
  const candidates = [
    ...quests.filter((quest) => quest.isBoss),
    ...quests.filter((quest) => !quest.isBoss && quest.featured).sort(byXp),
    ...quests.filter((quest) => !quest.isBoss && !quest.featured).sort(byXp),
  ];
  const metricsOf = (quest: ScoredQuest) => [...quest.metrics, ...quest.repoMetrics];
  const rounds = Math.max(0, ...candidates.map((quest) => metricsOf(quest).length));
  const picked: Achievement[] = [];

  for (let round = 0; round < rounds && picked.length < count; round++) {
    for (const quest of candidates) {
      const metric = metricsOf(quest)[round];
      if (!metric || picked.length >= count) continue;
      picked.push({
        questId: quest.id,
        questTitle: quest.title,
        label: metric.label,
        value: metric.value,
        ...(metric.unit === undefined ? {} : { unit: metric.unit }),
        // Repo facts are real; only hand-reported metrics of a placeholder override are samples.
        isSample: quest.isSample && round < quest.metrics.length,
      });
    }
  }
  return picked;
}
