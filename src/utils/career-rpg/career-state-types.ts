// Plain-data outputs of the Career RPG engine (split from career-types.ts; re-exported there).
import type { AttributeId } from '../../data/xp-rules.ts';
import type { CharacterProfile } from '../github-character/character-types.ts';
import type { ScoredQuest } from './career-types.ts';

export interface SkillTreeNode {
  id: string;
  label: string;
  attribute: AttributeId;
  parent?: string;
  /** URLs of public repos matching this node. */
  evidence: string[];
  /** Quests that list this skill. */
  questIds: string[];
  children: SkillTreeNode[];
  /** Distinct repos proving this node or a descendant. */
  evidenceCount: number;
  /** 0 = locked. */
  level: number;
  /** XP from this node's own matching repos. */
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
  /** Consecutive ISO weeks with GitHub contributions, ending this or last week. */
  current: number;
  longest: number;
  /** Monday (UTC) of the latest active week. */
  lastActiveWeek: Date | null;
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
  /** From an override whose content is still placeholder (shown with a "sample data" label). */
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
  /** Class, job, gear from public GitHub activity. */
  character: CharacterProfile;
  /** YYYY-MM-DD the GitHub snapshot describes. */
  snapshotAsOf: string;
  githubUrl: string;
}
