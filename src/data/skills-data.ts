// Skill tree nodes (flat list; `parent` links children to a root). Rendered by skills-section.astro.
// Node levels are derived from `evidence` URLs + verified projects listing the skill: never set by hand.
// Validated at build (strict schema, parent refs, no cycles). TODO(content): replace with real skills + evidence.
import type { SkillNodeData } from './career-schemas';

const repo = 'https://github.com/xuanduynguyen96/portfolio-app';

export const skillNodes: SkillNodeData[] = [
  { id: 'languages', label: 'Languages', attribute: 'code-efficiency' },
  { id: 'typescript', label: 'TypeScript', attribute: 'code-efficiency', parent: 'languages', evidence: [`${repo}/tree/master/src/utils`] },
  { id: 'javascript', label: 'JavaScript', attribute: 'code-efficiency', parent: 'languages' },
  { id: 'python', label: 'Python', attribute: 'code-efficiency', parent: 'languages' },
  { id: 'sql', label: 'SQL', attribute: 'code-efficiency', parent: 'languages' },
  { id: 'html', label: 'HTML', attribute: 'ui-polish', parent: 'languages' },
  { id: 'css', label: 'CSS', attribute: 'ui-polish', parent: 'languages', evidence: [`${repo}/blob/master/src/styles/design-tokens.css`] },

  { id: 'frontend', label: 'Frontend', attribute: 'ui-polish' },
  { id: 'astro', label: 'Astro', attribute: 'ui-polish', parent: 'frontend', evidence: [`${repo}/blob/master/astro.config.mjs`] },
  { id: 'react', label: 'React', attribute: 'ui-polish', parent: 'frontend' },
  { id: 'gsap', label: 'GSAP', attribute: 'ui-polish', parent: 'frontend', evidence: [`${repo}/tree/master/src/scripts/animations`] },
  { id: 'web-animations', label: 'Web Animations', attribute: 'ui-polish', parent: 'frontend' },
  { id: 'accessibility', label: 'Accessibility', attribute: 'reliability', parent: 'frontend', evidence: [`${repo}/blob/master/tests/e2e/accessibility-axe.spec.ts`] },
  { id: 'design-systems', label: 'Design Systems', attribute: 'ui-polish', parent: 'frontend' },

  { id: 'backend', label: 'Backend', attribute: 'code-efficiency' },
  { id: 'nodejs', label: 'Node.js', attribute: 'code-efficiency', parent: 'backend' },
  { id: 'rest', label: 'REST', attribute: 'code-efficiency', parent: 'backend' },
  { id: 'postgresql', label: 'PostgreSQL', attribute: 'reliability', parent: 'backend' },
  { id: 'redis', label: 'Redis', attribute: 'reliability', parent: 'backend' },

  { id: 'tooling', label: 'Tooling', attribute: 'reliability' },
  { id: 'git', label: 'Git', attribute: 'reliability', parent: 'tooling', evidence: [repo] },
  { id: 'github-actions', label: 'GitHub Actions', attribute: 'reliability', parent: 'tooling', evidence: [`${repo}/blob/master/.github/workflows/deploy-to-github-pages.yml`] },
  { id: 'playwright', label: 'Playwright', attribute: 'reliability', parent: 'tooling', evidence: [`${repo}/blob/master/playwright.config.ts`] },
  { id: 'docker', label: 'Docker', attribute: 'reliability', parent: 'tooling' },
  { id: 'vite', label: 'Vite', attribute: 'code-efficiency', parent: 'tooling' },

  { id: 'collaboration', label: 'Collaboration', attribute: 'communication' },
  { id: 'technical-writing', label: 'Technical Writing', attribute: 'communication', parent: 'collaboration', evidence: [`${repo}/tree/master/docs`] },
  { id: 'code-review', label: 'Code Review', attribute: 'communication', parent: 'collaboration' },
];
