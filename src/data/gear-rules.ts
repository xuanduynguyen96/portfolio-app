// Gear rules: repo hygiene signals -> 4 avatar slots, tier 0-3 by how many public repos show the
// signal (each repo counts once per slot). Patterns match file names in the snapshot.

export const GEAR_SLOT_IDS = ['armor', 'shield', 'boots', 'amulet'] as const;
export type GearSlotId = (typeof GEAR_SLOT_IDS)[number];

export interface GearSlotRule {
  slot: GearSlotId;
  /** Skill axis shown in the legend. */
  axis: string;
  /** Item name shown in the legend. */
  label: string;
  /** Repos needed for tiers 1, 2, 3 (ascending). */
  thresholds: readonly [number, number, number];
  rootFiles: readonly RegExp[];
  githubFiles: readonly RegExp[];
  workflowFiles: readonly RegExp[];
  /** Whole words in name, description, topics. */
  keywords: readonly string[];
}

export const gearRules: readonly GearSlotRule[] = [
  {
    slot: 'armor',
    axis: 'Security',
    label: 'Armor',
    thresholds: [1, 2, 4],
    rootFiles: [/^security\.md$/i],
    githubFiles: [/^security\.md$/i, /^dependabot\.ya?ml$/i],
    workflowFiles: [/codeql|security|scorecard|dependency-review/i],
    keywords: ['security'],
  },
  {
    slot: 'shield',
    axis: 'Testing',
    label: 'Shield',
    thresholds: [1, 3, 5],
    rootFiles: [/^(tests?|__tests__|spec|e2e)$/i, /\.tests?$/i, /^(jest|vitest|playwright|cypress)\.config\./i, /^pytest\.ini$/i],
    githubFiles: [],
    workflowFiles: [/test/i],
    keywords: ['testing'],
  },
  {
    slot: 'boots',
    axis: 'Automation',
    label: 'Boots',
    thresholds: [1, 3, 5],
    rootFiles: [/^dockerfile$/i, /^(docker-)?compose\.ya?ml$/i, /^jenkinsfile$/i, /^\.gitlab-ci\.yml$/i],
    githubFiles: [],
    workflowFiles: [/./],
    keywords: ['docker', 'jenkins', 'devops', 'kubernetes', 'ci'],
  },
  {
    slot: 'amulet',
    axis: 'Docs',
    label: 'Amulet',
    thresholds: [1, 3, 5],
    rootFiles: [],
    githubFiles: [],
    workflowFiles: [],
    keywords: [],
  },
];

/** Amulet: a repo counts when it shows at least this many documentation signals (see gear-tiers.ts). */
export const DOCS_SIGNALS_MIN = 3;
export const MAX_GEAR_TIER = 3;
