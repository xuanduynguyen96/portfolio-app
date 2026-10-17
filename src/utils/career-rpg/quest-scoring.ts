import { QUEST_DIFFICULTIES, xpRules, type XpRules } from '../../data/xp-rules.ts';
import type { QuestInput, ScoredQuest } from './career-types.ts';
import { countUniqueWords, countWords } from './count-words.ts';

/** Boss first, then featured, ascending `order`, then title. Deterministic; returns a new array. */
export function sortQuests<T extends QuestInput>(quests: readonly T[]): T[] {
  return [...quests].sort(
    (a, b) =>
      Number(b.isBoss) - Number(a.isBoss) ||
      Number(b.featured) - Number(a.featured) ||
      a.order - b.order ||
      (a.title < b.title ? -1 : a.title > b.title ? 1 : 0),
  );
}

/** A case study counts only past both word gates (repeating one word can't pass). */
export function isCaseStudy(body: string, rules: XpRules = xpRules): boolean {
  return countWords(body) >= rules.quest.minBodyWords && countUniqueWords(body) >= rules.quest.minUniqueWords;
}

/** XP before tier decay: base by difficulty times (1 + every bonus the repo/override earns). */
export function scoreRaw(quest: QuestInput, rules: XpRules = xpRules): ScoredQuest {
  const caseStudy = isCaseStudy(quest.body, rules);
  const { bonus, baseXp } = rules.quest;
  const earned = [
    quest.signals.description && bonus.description,
    quest.signals.homepage && bonus.homepage,
    quest.signals.tests && bonus.tests,
    quest.signals.ci && bonus.ci,
    caseStudy && bonus.caseStudy,
    quest.metrics.length > 0 && bonus.metrics,
    quest.obstacles.length > 0 && bonus.obstacles,
    quest.isBoss && bonus.boss,
  ].reduce<number>((sum, value) => sum + (value || 0), 0);
  const rawXp = baseXp[quest.difficulty] * (1 + earned);
  return {
    ...quest,
    status: caseStudy ? 'case-study' : 'derived',
    wordCount: countWords(quest.body),
    uniqueWordCount: countUniqueWords(quest.body),
    rawXp,
    xp: rawXp,
  };
}

/** Per tier: Nth best quest earns raw * decay^N, then the tier total is scaled down to its cap. */
export function applyTierDecay(quests: readonly ScoredQuest[], rules: XpRules = xpRules): ScoredQuest[] {
  const effective = new Map<ScoredQuest, number>();
  for (const tier of QUEST_DIFFICULTIES) {
    const inTier = quests.filter((quest) => quest.difficulty === tier).sort((a, b) => b.rawXp - a.rawXp);
    const decayed = inTier.map((quest, index) => quest.rawXp * rules.quest.tierDecay ** index);
    const sum = decayed.reduce((total, xp) => total + xp, 0);
    const scale = sum > rules.quest.tierCap[tier] ? rules.quest.tierCap[tier] / sum : 1;
    inTier.forEach((quest, index) => effective.set(quest, decayed[index] * scale));
  }
  return quests.map((quest) => ({ ...quest, xp: effective.get(quest) ?? 0 }));
}

/** Scores quests in `sortQuests` order. */
export function scoreQuests(quests: readonly QuestInput[], rules: XpRules = xpRules): ScoredQuest[] {
  return applyTierDecay(sortQuests(quests).map((quest) => scoreRaw(quest, rules)), rules);
}
