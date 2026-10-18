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

/** Optional hand-written case study for one repo (src/content/projects/<repo-slug>.md). */
export interface QuestOverrideInput {
  /** Repo slug (toRepoSlug of the repo name). */
  id: string;
  title?: string;
  summary?: string;
  tags?: string[];
  featured?: boolean;
  order?: number;
  isBoss?: boolean;
  obstacles: string[];
  metrics: Metric[];
  /** Markdown case-study body ('' when only frontmatter). */
  body: string;
  /** Source file still carries the placeholder marker: its metrics are sample data. */
  isSample: boolean;
}

/** Repo hygiene facts (most earn quest bonuses; topics feed the HUD). */
export interface QuestSignals {
  description: boolean;
  topics: boolean;
  homepage: boolean;
  tests: boolean;
  ci: boolean;
}

/** One quest = one public repo (+ its override, if any). */
export interface QuestInput {
  id: string;
  /** Exact GitHub repo name. */
  repo: string;
  title: string;
  summary: string;
  tags: string[];
  difficulty: QuestDifficulty;
  isBoss: boolean;
  featured: boolean;
  order: number;
  skills: string[];
  obstacles: string[];
  /** Hand-reported results (override only). */
  metrics: Metric[];
  /** Facts from the snapshot: owner commits, languages, code size. */
  repoMetrics: Metric[];
  evidence: Evidence[];
  /** Case-study body from the override ('' when none). */
  body: string;
  signals: QuestSignals;
  isSample: boolean;
}

export interface SkillMatch {
  languages?: string[];
  topics?: string[];
  /** Whole words in repo name, description or topics (lowercase). */
  keywords?: string[];
  /** Root file or folder names (case-insensitive). */
  files?: string[];
  /** Repo has at least one GitHub Actions workflow. */
  workflows?: boolean;
}

export interface SkillNodeInput {
  id: string;
  label: string;
  attribute: AttributeId;
  parent?: string;
  /** How public repos prove this skill; group nodes have none. */
  match?: SkillMatch;
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

/** `case-study`: the override body passed the word gates; `derived`: repo facts only. */
export type QuestStatus = 'derived' | 'case-study';

export interface ScoredQuest extends QuestInput {
  status: QuestStatus;
  wordCount: number;
  uniqueWordCount: number;
  /** XP before tier decay/cap. */
  rawXp: number;
  /** XP after tier decay/cap (unrounded; round for display). */
  xp: number;
}

// Outputs (skill tree, level, streak, HUD, achievements, full state) live in career-state-types.ts.
export type * from './career-state-types.ts';
