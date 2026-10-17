# Phase 03: Content & Data Model

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [phase-01](phase-01-scaffold-and-tooling.md)
- Docs: https://docs.astro.build/en/guides/content-collections/

## Overview
- Date: 2026-10-17 · Priority: P0 · Status: Done · Review: Code-reviewed + tester-validated
- Typed site config, skills, experience data; projects as a content collection with schema validation.

## Key Insights
- Projects benefit from Markdown body (detail pages) → content collection with Zod schema; build fails on bad frontmatter (good).
- Skills/experience are small lists → plain typed TS (KISS).
- Astro 5+ content layer: `src/content.config.ts` + `glob()` loader. Verify against installed Astro version.
- Placeholder content until user supplies real data (unresolved Q1). Mark placeholders clearly (`TODO(content)`).

## Requirements
- Functional: single source of truth for name, role, bio, email, socials; ≥3 sample projects; ≥3 experience entries; grouped skills.
- Non-functional: type-safe; editing content needs no component changes.

## Architecture
```
src/data/site-config.ts      name, role, tagline, bio[], email, socials[], seo defaults
src/data/skills-data.ts      SkillGroup[] { label, items: string[] }
src/data/experience-data.ts  ExperienceEntry[] { role, org, start, end|null, summary, highlights[] }
src/content.config.ts        projects collection schema
src/content/projects/*.md    one file per project
public/images/projects/*.svg placeholder covers (or src/assets for astro:assets)
```

Schema sketch:
```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    summary: z.string().max(160),
    tags: z.array(z.string()).default([]),
    cover: image().optional(),
    repoUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(100),
  }),
});
export const collections = { projects };
```

## Related Code Files
Create:
- `/home/user/portfolio-app/src/data/site-config.ts`
- `/home/user/portfolio-app/src/data/skills-data.ts`
- `/home/user/portfolio-app/src/data/experience-data.ts`
- `/home/user/portfolio-app/src/content.config.ts`
- `/home/user/portfolio-app/src/content/projects/project-neon-dashboard.md` (placeholder)
- `/home/user/portfolio-app/src/content/projects/project-realtime-chat.md` (placeholder)
- `/home/user/portfolio-app/src/content/projects/project-cli-toolkit.md` (placeholder)
- `/home/user/portfolio-app/src/assets/projects/*.svg` placeholder covers
- `/home/user/portfolio-app/src/utils/with-base-path.ts`: prefix internal links with `import.meta.env.BASE_URL`
- `/home/user/portfolio-app/src/utils/sort-projects.ts`: featured first, then `order`

## Implementation Steps
1. Define TS types + exported consts in `src/data/*`. Email/socials from config only.
2. Write `content.config.ts` (above).
3. Add 3 placeholder projects with frontmatter + short body.
4. `with-base-path.ts`:
   ```ts
   export function withBasePath(path: string): string {
     const base = import.meta.env.BASE_URL.replace(/\/$/, '');
     return `${base}/${path.replace(/^\//, '')}`;
   }
   ```
5. `sort-projects.ts` pure function (easy to unit-reason).
6. `npm run check` → schema types generated, no errors.

## Todo List
- [x] site-config.ts
- [x] skills-data.ts, experience-data.ts
- [x] content.config.ts + 3 projects
- [x] placeholder covers
- [x] with-base-path.ts, sort-projects.ts
- [x] `npm run check` passes

## Success Criteria
- Invalid project frontmatter fails build with clear error.
- All user-editable text lives in `src/data/*` or `src/content/*`.

## Risk Assessment
- Content-layer API differs in installed Astro → follow current docs; schema shape stays.
- Placeholder content shipped by accident → `TODO(content)` markers; listed in README.

## Security Considerations
- Email exposed publicly (mailto) → user choice; can obfuscate lightly or use form later.
- External URLs rendered with `rel="noopener noreferrer"` (phase 04).

## Next Steps
- Phase 04 renders this data.
