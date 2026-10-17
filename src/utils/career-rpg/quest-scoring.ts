import { QUEST_DIFFICULTIES, xpRules, type XpRules } from '../../data/xp-rules.ts';
import type { QuestInput, RuleIssue, ScoredQuest } from './career-types.ts';
import { countUniqueWords, countWords } from './count-words.ts';
import { normalizeEvidenceUrl, uniqueEvidenceUrls } from './diminishing-returns.ts';

/** Boss first, then featured, ascending `order`, then title. Deterministic; returns a new array. */
export function sortQuests<T extends QuestInput>(quests: readonly T[]): T[] {
  return [...quests].sort(
    (a, b) =>
      Number(b.isBoss) - Number(a.isBoss) ||
      Number(b.featured) - Number(a.featured) ||
      a.order - b.order ||
      a.title.localeCompare(b.title),
  );
}

/**
 * Cross-entry rules: unique ids, exactly one boss, known + unique skills, valid URLs.
 * (Per-entry rules such as "boss needs a metric and an obstacle" live in the zod schema.)
 */
export function validateQuestLog(quests: readonly QuestInput[], skillIds: ReadonlySet<string>): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const issue = (id: string, problem: string) => issues.push({ source: 'quest', id, problem });
  const ids = new Set<string>();

  for (const quest of quests) {
    if (ids.has(quest.id)) issue(quest.id, 'duplicate quest id');
    ids.add(quest.id);
    for (const skill of quest.skills) {
      if (!skillIds.has(skill)) issue(quest.id, `unknown skill "${skill}"`);
    }
    if (new Set(quest.skills).size !== quest.skills.length) issue(quest.id, 'skill listed twice');
    for (const { url } of quest.evidence) {
      if (normalizeEvidenceUrl(url) === null) issue(quest.id, `evidence "${url}" is not a valid https URL`);
    }
  }

  const bosses = quests.filter((quest) => quest.isBoss).map((quest) => quest.id);
  if (bosses.length === 0) issue('(all)', 'no boss quest: exactly one project needs isBoss: true');
  if (bosses.length > 1) issue(bosses.join(', '), `${bosses.length} boss quests: exactly one isBoss: true allowed`);
  return issues;
}

/**
 * XP before tier decay. A quest scores only if its case study meets the word minimums
 * AND it is first to claim at least one evidence URL (shared `seen` set, sorted order).
 */
function scoreRaw(quest: QuestInput, seen: Set<string>, rules: XpRules): ScoredQuest {
  const wordCount = countWords(quest.body);
  const uniqueWordCount = countUniqueWords(quest.body);
  const own = uniqueEvidenceUrls(quest.evidence.map((item) => item.url));
  const fresh = own.filter((url) => !seen.has(url));
  const base = { ...quest, wordCount, uniqueWordCount, rawXp: 0, xp: 0, verified: false };

  if (wordCount < rules.quest.minBodyWords) return { ...base, status: 'body-too-short' };
  if (uniqueWordCount < rules.quest.minUniqueWords) return { ...base, status: 'body-too-repetitive' };
  if (own.length === 0) return { ...base, status: 'no-evidence' };
  if (fresh.length === 0) return { ...base, status: 'no-new-evidence' };

  fresh.forEach((url) => seen.add(url));
  const { baseXp, metricBonus, obstacleBonus, bossBonus } = rules.quest;
  const multiplier =
    1 +
    (quest.metrics.length > 0 ? metricBonus : 0) +
    (quest.obstacles.length > 0 ? obstacleBonus : 0) +
    (quest.isBoss ? bossBonus : 0);
  const rawXp = baseXp[quest.difficulty] * multiplier;
  return { ...base, status: 'verified', verified: true, rawXp, xp: rawXp };
}

/** Per tier: Nth best quest earns raw * decay^N, then the tier total is scaled down to its cap. */
export function applyTierDecay(quests: readonly ScoredQuest[], rules: XpRules = xpRules): ScoredQuest[] {
  const effective = new Map<ScoredQuest, number>();
  for (const tier of QUEST_DIFFICULTIES) {
    const inTier = quests
      .filter((quest) => quest.verified && quest.difficulty === tier)
      .sort((a, b) => b.rawXp - a.rawXp);
    const decayed = inTier.map((quest, index) => quest.rawXp * rules.quest.tierDecay ** index);
    const sum = decayed.reduce((total, xp) => total + xp, 0);
    const scale = sum > rules.quest.tierCap[tier] ? rules.quest.tierCap[tier] / sum : 1;
    inTier.forEach((quest, index) => effective.set(quest, decayed[index] * scale));
  }
  return quests.map((quest) => ({ ...quest, xp: effective.get(quest) ?? 0 }));
}

/** Scores quests in `sortQuests` order (so the boss claims shared URLs first). */
export function scoreQuests(
  quests: readonly QuestInput[],
  seen: Set<string>,
  rules: XpRules = xpRules,
): ScoredQuest[] {
  return applyTierDecay(
    sortQuests(quests).map((quest) => scoreRaw(quest, seen, rules)),
    rules,
  );
}
