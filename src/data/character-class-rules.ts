// Class rules: how public repos vote for an archetype. Every number lives here; retune here only.
// Rule changes must be generic (a reason that holds for any developer) and keep the
// fixture profiles in tests/unit/classify-character.test.ts on their expected classes.

/** Order = final tie-break. */
export const ARCHETYPE_IDS = ['backend', 'data', 'frontend'] as const;
export type ArchetypeId = (typeof ARCHETYPE_IDS)[number];

type ArchetypeWeights = Partial<Record<ArchetypeId, number>>;

export interface ClassRules {
  /** Language -> archetype weights (each row sums to 1). Unknown languages carry no vote. */
  languages: Record<string, ArchetypeWeights>;
  /** Markup/styling counts less than code (default 1). */
  languageWeight: Record<string, number>;
  /** Tooling, build glue, editor config and prose formats: never a vote. */
  ignoredLanguages: readonly string[];
  /** Notebooks embed outputs (images, base64): cap their bytes before computing shares. */
  notebookBytesCap: number;
  /** Languages under this share of a repo's code are noise. */
  minLanguageShare: number;
  primaryLanguageBonus: number;
  /** Whole-word matches in repo name, description and topics (lowercase). */
  keywords: readonly { match: string; archetype: ArchetypeId; points: number }[];
  /** Vote weight halves every `halfLifeMonths` since the last push; never below `floor`. */
  recency: { halfLifeMonths: number; floor: number };
  /** Weight 1 + min(max, log10(1 + owner commits) * scale). */
  activity: { scale: number; max: number };
  archivedFactor: number;
  /**
   * Secondary archetype (job motif) needs a share of the primary score, an absolute score, and to be
   * the top archetype of at least `minTopRepos` repos (so language leakage alone, e.g. TypeScript's
   * backend share, can't make a TS-only profile hybrid).
   */
  secondary: { minRatio: number; minScore: number; minTopRepos: number };
  /** A language shows as "why" evidence for an archetype only when it weighs at least this much there. */
  reasonMinWeight: number;
  /** "Why" signals kept per profile. */
  signals: { primary: number; secondary: number };
  /** Below either: no class yet (Adventurer). */
  fallback: { minTotal: number; minRepos: number };
}

export const classRules: ClassRules = {
  languages: {
    'C#': { backend: 1 }, Java: { backend: 1 }, Go: { backend: 1 }, Rust: { backend: 1 }, Ruby: { backend: 1 },
    PHP: { backend: 1 }, Elixir: { backend: 1 }, Erlang: { backend: 1 }, C: { backend: 1 }, 'C++': { backend: 1 },
    Zig: { backend: 1 }, 'F#': { backend: 1 }, Haskell: { backend: 1 }, Clojure: { backend: 1 }, Groovy: { backend: 1 },
    'Visual Basic .NET': { backend: 1 }, Scala: { backend: 0.7, data: 0.3 },
    Python: { data: 0.6, backend: 0.4 }, 'Jupyter Notebook': { data: 1 }, R: { data: 1 }, Julia: { data: 1 },
    MATLAB: { data: 1 }, Fortran: { data: 1 }, SQL: { data: 0.5, backend: 0.5 }, PLpgSQL: { data: 0.5, backend: 0.5 },
    TypeScript: { frontend: 0.7, backend: 0.3 }, JavaScript: { frontend: 0.8, backend: 0.2 },
    Kotlin: { frontend: 0.6, backend: 0.4 }, Swift: { frontend: 1 }, Dart: { frontend: 1 }, 'Objective-C': { frontend: 1 },
    HTML: { frontend: 1 }, CSS: { frontend: 1 }, SCSS: { frontend: 1 }, Less: { frontend: 1 },
    Vue: { frontend: 1 }, Svelte: { frontend: 1 }, Astro: { frontend: 1 },
  },
  languageWeight: { HTML: 0.5, CSS: 0.5, SCSS: 0.5, Less: 0.5 },
  ignoredLanguages: [
    'Shell', 'PowerShell', 'Batchfile', 'Makefile', 'Dockerfile', 'Nix', 'Nushell', 'Vim Script',
    'TeX', 'Rich Text Format', 'PostScript',
  ],
  notebookBytesCap: 200 * 1024,
  minLanguageShare: 0.1,
  primaryLanguageBonus: 0.3,
  keywords: [
    { match: 'xamarin', archetype: 'frontend', points: 1 },
    { match: 'mobile', archetype: 'frontend', points: 0.5 },
    { match: 'android', archetype: 'frontend', points: 0.5 },
    { match: 'ios', archetype: 'frontend', points: 0.5 },
    { match: 'react', archetype: 'frontend', points: 0.5 },
    { match: 'vue', archetype: 'frontend', points: 0.5 },
    { match: 'website', archetype: 'frontend', points: 0.5 },
    { match: 'portfolio', archetype: 'frontend', points: 0.5 },
    { match: 'resume', archetype: 'frontend', points: 0.5 },
    { match: 'ui', archetype: 'frontend', points: 0.5 },
    { match: 'aspnet', archetype: 'backend', points: 1 },
    { match: 'asp', archetype: 'backend', points: 0.5 },
    { match: 'api', archetype: 'backend', points: 0.5 },
    { match: 'server', archetype: 'backend', points: 0.5 },
    { match: 'spring', archetype: 'backend', points: 0.5 },
    { match: 'backend', archetype: 'backend', points: 0.5 },
    { match: 'database', archetype: 'backend', points: 0.5 },
    { match: 'mvc', archetype: 'backend', points: 0.5 },
    { match: 'data', archetype: 'data', points: 0.5 },
    { match: 'notebooks', archetype: 'data', points: 0.5 },
    { match: 'statistics', archetype: 'data', points: 0.5 },
    { match: 'ml', archetype: 'data', points: 0.5 },
    { match: 'ai', archetype: 'data', points: 0.5 },
    { match: 'pandas', archetype: 'data', points: 0.5 },
    { match: 'tensorflow', archetype: 'data', points: 0.5 },
    { match: 'pytorch', archetype: 'data', points: 0.5 },
    { match: 'analysis', archetype: 'data', points: 0.5 },
  ],
  // 48 months (spike, reports/02): public repos are sparse; 24 made whichever repo was pushed last decide.
  recency: { halfLifeMonths: 48, floor: 0.25 },
  activity: { scale: 0.25, max: 0.5 },
  archivedFactor: 0.5,
  secondary: { minRatio: 0.35, minScore: 0.5, minTopRepos: 1 },
  reasonMinWeight: 0.5,
  signals: { primary: 5, secondary: 2 },
  fallback: { minTotal: 1, minRepos: 2 },
};
