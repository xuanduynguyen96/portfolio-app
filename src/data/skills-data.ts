// Skill tree nodes (flat list; `parent` links children to a root). Rendered by skills-section.astro.
// A node levels up when public repos match it (`match`: language share, topic, keyword, root file,
// workflows) and when projects list it: never set by hand. Validated at build (strict schema,
// parent refs, no cycles). Roots are groups (no `match`); root ids map to icons in pixel-icon-map.ts.
import type { SkillNodeData } from './career-schemas';

export const skillNodes: SkillNodeData[] = [
  { id: 'languages', label: 'Languages', attribute: 'code-efficiency' },
  { id: 'typescript', label: 'TypeScript', attribute: 'code-efficiency', parent: 'languages', match: { languages: ['TypeScript'] } },
  { id: 'javascript', label: 'JavaScript', attribute: 'code-efficiency', parent: 'languages', match: { languages: ['JavaScript'] } },
  { id: 'csharp', label: 'C#', attribute: 'code-efficiency', parent: 'languages', match: { languages: ['C#'] } },
  { id: 'java', label: 'Java', attribute: 'code-efficiency', parent: 'languages', match: { languages: ['Java'] } },
  { id: 'python', label: 'Python', attribute: 'code-efficiency', parent: 'languages', match: { languages: ['Python', 'Jupyter Notebook'] } },
  { id: 'html', label: 'HTML', attribute: 'ui-polish', parent: 'languages', match: { languages: ['HTML'] } },
  { id: 'css', label: 'CSS', attribute: 'ui-polish', parent: 'languages', match: { languages: ['CSS', 'SCSS', 'Less'] } },

  { id: 'frontend', label: 'Frontend', attribute: 'ui-polish' },
  { id: 'astro', label: 'Astro', attribute: 'ui-polish', parent: 'frontend', match: { languages: ['Astro'], files: ['astro.config.mjs', 'astro.config.ts'] } },
  { id: 'react', label: 'React', attribute: 'ui-polish', parent: 'frontend', match: { keywords: ['react', 'nextjs'], topics: ['react'] } },
  { id: 'mobile', label: 'Mobile (Xamarin)', attribute: 'ui-polish', parent: 'frontend', match: { keywords: ['xamarin', 'mobile', 'android', 'ios'] } },
  { id: 'web-sites', label: 'Websites', attribute: 'ui-polish', parent: 'frontend', match: { keywords: ['portfolio', 'resume', 'website', 'landing'] } },

  { id: 'backend', label: 'Backend', attribute: 'code-efficiency' },
  { id: 'dotnet', label: '.NET / ASP.NET', attribute: 'code-efficiency', parent: 'backend', match: { keywords: ['aspnet', 'asp', 'dotnet'], files: ['global.json'] } },
  { id: 'spring', label: 'Spring Boot', attribute: 'code-efficiency', parent: 'backend', match: { keywords: ['spring'], files: ['pom.xml', 'build.gradle'] } },
  { id: 'web-servers', label: 'Web servers & APIs', attribute: 'reliability', parent: 'backend', match: { keywords: ['server', 'api', 'rest', 'mvc'] } },

  { id: 'tooling', label: 'Tooling', attribute: 'reliability' },
  { id: 'github-actions', label: 'GitHub Actions', attribute: 'reliability', parent: 'tooling', match: { workflows: true } },
  { id: 'docker', label: 'Docker', attribute: 'reliability', parent: 'tooling', match: { keywords: ['docker'], files: ['dockerfile', 'compose.yaml', 'docker-compose.yml'] } },
  { id: 'jenkins', label: 'Jenkins', attribute: 'reliability', parent: 'tooling', match: { keywords: ['jenkins'], files: ['jenkinsfile'] } },
  { id: 'playwright', label: 'Playwright', attribute: 'reliability', parent: 'tooling', match: { files: ['playwright.config.ts', 'playwright.config.js'] } },

  { id: 'collaboration', label: 'Collaboration', attribute: 'communication' },
  { id: 'technical-writing', label: 'Technical Writing', attribute: 'communication', parent: 'collaboration', match: { files: ['docs', 'CONTRIBUTING.md'] } },
  { id: 'readme-craft', label: 'READMEs', attribute: 'communication', parent: 'collaboration', match: { files: ['README.md', 'README'] } },
];
