// Career RPG rules: every weight, cap, threshold and title lives here.
// Retuning the game = editing this file only. Scoring logic: src/utils/career-rpg/.

export const ATTRIBUTE_IDS = ['code-efficiency', 'ui-polish', 'communication', 'reliability'] as const;
export const QUEST_DIFFICULTIES = ['side', 'main', 'raid'] as const;
export const EVIDENCE_TYPES = ['repo', 'demo', 'figma', 'article', 'other'] as const;
export const AVAILABILITY_STATUSES = ['open', 'limited', 'closed'] as const;

/** Skill ids: kebab-case (shared by the zod schema and the pure validator). */
export const SKILL_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type AttributeId = (typeof ATTRIBUTE_IDS)[number];
export type QuestDifficulty = (typeof QUEST_DIFFICULTIES)[number];
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number];

// Built by join so this file never matches its own placeholder scan (or a README grep).
export const PLACEHOLDER_MARKER = ['TODO', '(content)'].join('');

export interface TitleBand {
  minLevel: number;
  title: string;
}

export interface XpRules {
  attributes: Record<AttributeId, string>;
  /** Max XP one attribute can hold. */
  attributeCap: number;
  quest: {
    baseXp: Record<QuestDifficulty, number>;
    /** Case-study body below this earns 0 XP. */
    minBodyWords: number;
    /** Distinct words required too, so repeating one word can't pass the gate. */
    minUniqueWords: number;
    metricBonus: number;
    obstacleBonus: number;
    bossBonus: number;
    /** Nth best quest in a tier earns raw * tierDecay^N. */
    tierDecay: number;
    /** Max XP a whole tier can contribute. */
    tierCap: Record<QuestDifficulty, number>;
  };
  skillEvidence: {
    xpPerUrl: number;
    decay: number;
    nodeCap: number;
    /** Evidence counts unlocking node levels 1..N (0 = locked). */
    levelThresholds: readonly number[];
  };
  level: { base: number; exponent: number; max: number };
  /** Ascending by minLevel; first band must start at 1. */
  titles: readonly TitleBand[];
  streak: {
    minBodyWords: number;
    /** Entries dated up to this far past the build time still count (authors ahead of UTC). */
    futureToleranceHours: number;
  };
  completeness: { minBioWords: number; placeholderEmailDomains: readonly string[] };
  speedrun: { achievements: number; countdownSeconds: number };
}

export const xpRules: XpRules = {
  attributes: {
    'code-efficiency': 'Code Efficiency',
    'ui-polish': 'UI Polish',
    communication: 'Communication',
    reliability: 'Reliability',
  },
  attributeCap: 2500,
  quest: {
    baseXp: { side: 100, main: 250, raid: 500 },
    minBodyWords: 150,
    minUniqueWords: 80,
    metricBonus: 0.25,
    obstacleBonus: 0.1,
    bossBonus: 0.5,
    tierDecay: 0.8,
    tierCap: { side: 300, main: 1000, raid: 1500 },
  },
  skillEvidence: { xpPerUrl: 40, decay: 0.7, nodeCap: 120, levelThresholds: [1, 3, 6] },
  level: { base: 100, exponent: 1.5, max: 50 },
  titles: [
    { minLevel: 1, title: 'Novice Coder' },
    { minLevel: 5, title: 'Journeyman Engineer' },
    { minLevel: 10, title: 'Senior Adventurer' },
    { minLevel: 20, title: 'Principal Archmage' },
  ],
  streak: { minBodyWords: 40, futureToleranceHours: 24 },
  completeness: {
    minBioWords: 60,
    placeholderEmailDomains: ['example.com', 'example.org', 'example.net', 'example', 'test', 'invalid', 'localhost'],
  },
  speedrun: { achievements: 3, countdownSeconds: 60 },
};
