// Grouped skills rendered by skills-section.astro.
// TODO(content): replace with real skills.

export interface SkillGroup {
  label: string;
  items: string[];
}

export const skillGroups: SkillGroup[] = [
  { label: 'Languages', items: ['TypeScript', 'JavaScript', 'Python', 'SQL', 'HTML', 'CSS'] },
  { label: 'Frontend', items: ['Astro', 'React', 'GSAP', 'Web Animations', 'Accessibility', 'Design Systems'] },
  { label: 'Backend', items: ['Node.js', 'REST', 'PostgreSQL', 'Redis'] },
  { label: 'Tooling', items: ['Git', 'GitHub Actions', 'Playwright', 'Docker', 'Vite'] },
];
