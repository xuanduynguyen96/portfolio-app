// Plain-data inputs/outputs of the Career RPG scoring functions (no Astro types).
import type {
  AttributeId,
  AvailabilityStatus,
  EvidenceType,
  QuestDifficulty,
} from '../../data/xp-rules.ts';

export interface Metric {
  label: string;
  value: number;
  unit?: string;
}

export interface Evidence {
  type: EvidenceType;
  url: string;
}

export interface QuestInput {
  id: string;
  title: string;
  difficulty: QuestDifficulty;
  isBoss: boolean;
  featured: boolean;
  order: number;
  skills: string[];
  obstacles: string[];
  metrics: Metric[];
  evidence: Evidence[];
  /** Markdown case-study body. */
  body: string;
  /** Source file still carries the placeholder marker: its metrics are sample data. */
  isSample: boolean;
}

export interface SkillNodeInput {
  id: string;
  label: string;
  attribute: AttributeId;
  parent?: string;
  /** Evidence URLs. */
  evidence: string[];
}

export interface ChangelogInput {
  id: string;
  date: Date;
  summary: string;
  body: string;
}

export interface ProfileInput {
  email: string;
  bio: string[];
  socials: { label: string; href: string }[];
  availability: { status: AvailabilityStatus; note: string };
}

export interface RuleIssue {
  source: 'quest' | 'skill' | 'changelog';
  id: string;
  problem: string;
}

export type QuestStatus = 'verified' | 'no-evidence' | 'no-new-evidence' | 'body-too-short' | 'body-too-repetitive';

export interface ScoredQuest extends QuestInput {
  status: QuestStatus;
  verified: boolean;
  wordCount: number;
  uniqueWordCount: number;
  /** XP before tier decay/cap. */
  rawXp: number;
  /** XP after tier decay/cap (unrounded; round for display). */
  xp: number;
}

export interface SkillTreeNode {
  id: string;
  label: string;
  attribute: AttributeId;
  parent?: string;
  evidence: string[];
  /** Verified quests that list this skill. */
  questIds: string[];
  children: SkillTreeNode[];
  /** Distinct evidence across this node + descendants (URLs + verified quests). */
  evidenceCount: number;
  /** 0 = locked. */
  level: number;
  /** XP from this node's own first-seen evidence URLs. */
  xp: number;
}

export interface AttributeScore {
  id: AttributeId;
  label: string;
  xp: number;
  cap: number;
}

export interface LevelInfo {
  level: number;
  title: string;
  totalXp: number;
  currentLevelXp: number;
  /** null at max level. */
  nextLevelXp: number | null;
  /** 0..1 towards next level. */
  progress: number;
}

export interface StreakInfo {
  /** Consecutive ISO weeks with an entry, ending this or last week. */
  current: number;
  longest: number;
  lastEntryDate: Date | null;
}

export interface CompletenessItem {
  id: string;
  label: string;
  passed: boolean;
}

export interface Completeness {
  percent: number;
  items: CompletenessItem[];
  missing: CompletenessItem[];
}

export interface Achievement {
  questId: string;
  questTitle: string;
  label: string;
  value: number;
  unit?: string;
  /** From a quest whose content is still placeholder (shown with a "sample data" label). */
  isSample: boolean;
}

export interface CareerState {
  /** Sorted: boss, featured, order, title. */
  quests: ScoredQuest[];
  boss: ScoredQuest;
  skillTree: SkillTreeNode[];
  attributes: AttributeScore[];
  level: LevelInfo;
  streak: StreakInfo;
  completeness: Completeness;
  achievements: Achievement[];
}
