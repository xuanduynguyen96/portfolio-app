// Class rules: how public repos vote for a domain (backend, frontend, devops). A repo votes for the
// domains of the skills it proves (skill matches in skills-data.ts), so the class follows what the code
// does. Every number lives here; retune here only. Rule changes must be generic (a reason that holds for
// any developer) and keep the fixture profiles in tests/unit/classify-character.test.ts on their expected classes.

/** Order = final tie-break. */
export const DOMAIN_IDS = ['backend', 'frontend', 'devops'] as const;
export type DomainId = (typeof DOMAIN_IDS)[number];

export interface ClassRules {
  /** Skill id -> the domain it proves. Skills not listed vote for nothing. */
  skillDomains: Readonly<Partial<Record<string, DomainId>>>;
  /** Languages under this share of a repo's bytes don't count as a skill match. */
  minLanguageShare: number;
  /** Vote weight halves every `halfLifeMonths` since the last push; never below `floor`. */
  recency: { halfLifeMonths: number; floor: number };
  /** Weight 1 + min(max, log10(1 + owner commits) * scale). */
  activity: { scale: number; max: number };
  archivedFactor: number;
  /** "Why" evidence kept per profile: repos for the class domain, repos for the job. */
  signals: { domain: number; job: number };
  /** Below either: no class yet (Adventurer). */
  fallback: { minTotal: number; minRepos: number };
}

export const classRules: ClassRules = {
  skillDomains: {
    csharp: 'backend', java: 'backend', dotnet: 'backend', spring: 'backend', 'web-servers': 'backend',
    html: 'frontend', css: 'frontend', astro: 'frontend', react: 'frontend', mobile: 'frontend', 'web-sites': 'frontend',
    'github-actions': 'devops', docker: 'devops', jenkins: 'devops', playwright: 'devops',
  },
  minLanguageShare: 0.1,
  // 48 months (spike, reports/02): public repos are sparse; 24 made whichever repo was pushed last decide.
  recency: { halfLifeMonths: 48, floor: 0.25 },
  activity: { scale: 0.25, max: 0.5 },
  archivedFactor: 0.5,
  signals: { domain: 5, job: 2 },
  fallback: { minTotal: 1, minRepos: 2 },
};
