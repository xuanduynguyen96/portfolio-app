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
  /** Projects = public repos from the GitHub snapshot (+ optional case-study overrides). */
  quest: {
    /** Repos shown as quests (plus every repo with an override). */
    max: number;
    /** Skills / tags listed per quest; derived summary length (same caps as the override schema). */
    maxSkills: number;
    maxTags: number;
    summaryMax: number;
    /** Attribute that receives the XP of a quest whose repo matches no skill (else it would vanish). */
    fallbackAttribute: AttributeId;
    /** Quest ranking = repo weight + hygienic slots + pinned bonus. */
    selection: { hygieneBonus: number; pinnedBonus: number };
    /** A repo reaching either threshold gets the tier (owner commits / KiB of code). */
    difficulty: Record<Exclude<QuestDifficulty, 'side'>, { commits: number; kib: number }>;
    baseXp: Record<QuestDifficulty, number>;
    /** Case-study override body below this earns no case-study bonus. */
    minBodyWords: number;
    /** Distinct words required too, so repeating one word can't pass the gate. */
    minUniqueWords: number;
    /** Multiplier bonuses: XP = baseXp * (1 + sum of earned bonuses). */
    bonus: {
      description: number;
      homepage: number;
      tests: number;
      ci: number;
      caseStudy: number;
      metrics: number;
      obstacles: number;
      boss: number;
    };
    /** Nth best quest in a tier earns raw * tierDecay^N. */
    tierDecay: number;
    /** Max XP a whole tier can contribute. */
    tierCap: Record<QuestDifficulty, number>;
  };
  skillEvidence: {
    /** XP per public repo matching the skill (decayed, capped per node). */
    xpPerRepo: number;
    decay: number;
    nodeCap: number;
    /** Evidence counts unlocking node levels 1..N (0 = locked). */
    levelThresholds: readonly number[];
  };
  level: { base: number; exponent: number; max: number };
  /** Ascending by minLevel; first band must start at 1. */
  titles: readonly TitleBand[];
  streak: {
    /** An ISO week counts when it has at least this many GitHub contributions. */
    minWeeklyContributions: number;
    /** Changelog entries dated up to this far past the build time are allowed (authors ahead of UTC). */
    futureToleranceHours: number;
  };
  completeness: {
    minBioWords: number;
    placeholderEmailDomains: readonly string[];
    /** The GitHub snapshot is stale when older than this at build time. */
    maxSnapshotAgeDays: number;
  };
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
    max: 6,
    maxSkills: 6,
    maxTags: 6,
    summaryMax: 160,
    fallbackAttribute: 'code-efficiency',
    selection: { hygieneBonus: 0.1, pinnedBonus: 0.5 },
    difficulty: { main: { commits: 4, kib: 20 }, raid: { commits: 15, kib: 200 } },
    baseXp: { side: 100, main: 250, raid: 500 },
    minBodyWords: 150,
    minUniqueWords: 80,
    bonus: { description: 0.1, homepage: 0.1, tests: 0.15, ci: 0.1, caseStudy: 0.5, metrics: 0.25, obstacles: 0.1, boss: 0.5 },
    tierDecay: 0.8,
    tierCap: { side: 300, main: 1000, raid: 1500 },
  },
  skillEvidence: { xpPerRepo: 40, decay: 0.7, nodeCap: 120, levelThresholds: [1, 3, 6] },
  level: { base: 100, exponent: 1.5, max: 50 },
  titles: [
    { minLevel: 1, title: 'Novice Coder' },
    { minLevel: 5, title: 'Journeyman Engineer' },
    { minLevel: 10, title: 'Senior Adventurer' },
    { minLevel: 20, title: 'Principal Archmage' },
  ],
  streak: { minWeeklyContributions: 1, futureToleranceHours: 24 },
  completeness: {
    minBioWords: 60,
    placeholderEmailDomains: ['example.com', 'example.org', 'example.net', 'example', 'test', 'invalid', 'localhost'],
    maxSnapshotAgeDays: 14,
  },
  speedrun: { achievements: 3, countdownSeconds: 60 },
};
