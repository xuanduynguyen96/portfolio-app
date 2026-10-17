// Gear rules: repo hygiene signals -> 4 avatar slots, tier 0-3 by how many public repos show the
// signal (each repo counts once per slot). Patterns match file names in the snapshot: root entries,
// `.github/` entries and `.github/workflows/` files. Hygiene, not subject matter: no topic keywords
// for armor/shield. Known blind spot: tests living below the root (Maven `src/test`, Go `_test.go`).

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
  /** Documentation slot: counts docs signals instead (see gear-tiers.ts). */
  docs?: { minSignals: number; readme: RegExp; docsDir: RegExp };
}

const WORKFLOW = /\.ya?ml$/i;

export const gearRules: readonly GearSlotRule[] = [
  {
    slot: 'armor',
    axis: 'Security',
    label: 'Armor',
    thresholds: [1, 2, 4],
    rootFiles: [/^security\.md$/i],
    githubFiles: [/^security\.md$/i, /^dependabot\.ya?ml$/i],
    workflowFiles: [/(codeql|security|scorecard|dependency-review).*\.ya?ml$/i],
    keywords: [],
  },
  {
    slot: 'shield',
    axis: 'Testing',
    label: 'Shield',
    thresholds: [1, 3, 5],
    rootFiles: [/^(tests?|__tests__|spec|e2e)$/i, /\.tests?$/i, /^(jest|vitest|playwright|cypress)\.config\./i, /^pytest\.ini$/i],
    githubFiles: [],
    workflowFiles: [/(^|[-_.])(tests?|e2e|spec)(?=[-_.])[^/]*\.ya?ml$/i],
    keywords: [],
  },
  {
    slot: 'boots',
    axis: 'Automation',
    label: 'Boots',
    thresholds: [1, 3, 5],
    rootFiles: [
      /^dockerfile$/i, /^(docker-)?compose\.ya?ml$/i, /^jenkinsfile$/i, /^\.gitlab-ci\.yml$/i, /^\.travis\.yml$/i,
      /^\.circleci$/i, /^azure-pipelines\.ya?ml$/i, /^bitbucket-pipelines\.yml$/i,
    ],
    githubFiles: [],
    workflowFiles: [WORKFLOW],
    keywords: ['docker', 'jenkins', 'kubernetes'],
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
    docs: { minSignals: 3, readme: /^readme(\.|$)/i, docsDir: /^docs?$/i },
  },
];
