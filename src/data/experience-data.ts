// Timeline entries rendered by experience-section.astro (newest first).
// TODO(content): replace with real experience.

export interface ExperienceEntry {
  role: string;
  org: string;
  /** ISO year-month, e.g. "2023-04" */
  start: string;
  /** null = present */
  end: string | null;
  summary: string;
  highlights: string[];
}

export const experienceEntries: ExperienceEntry[] = [
  {
    role: 'Senior Software Engineer',
    org: 'Placeholder Labs',
    start: '2023-04',
    end: null,
    summary: 'Lead frontend engineer for a data visualization platform.',
    highlights: ['Cut bundle size by 40% with static-first rendering', 'Built a shared motion + design-token system'],
  },
  {
    role: 'Software Engineer',
    org: 'Example Studio',
    start: '2020-07',
    end: '2023-03',
    summary: 'Full-stack engineer shipping client web apps end to end.',
    highlights: ['Delivered 12+ production projects', 'Introduced automated accessibility testing in CI'],
  },
  {
    role: 'Junior Developer',
    org: 'Sample Agency',
    start: '2018-09',
    end: '2020-06',
    summary: 'Built marketing sites and interactive landing pages.',
    highlights: ['Created reusable animation components', 'Improved Lighthouse scores to 95+ across sites'],
  },
];
