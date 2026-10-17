import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string().max(160),
      tags: z.array(z.string()).default([]),
      cover: image().optional(),
      coverAlt: z.string().default(''),
      repoUrl: z.url().optional(),
      demoUrl: z.url().optional(),
      featured: z.boolean().default(false),
      order: z.number().default(100),
    })
    .refine((project) => !project.cover || project.coverAlt.trim().length > 0, {
      message: 'coverAlt is required when cover is set',
      path: ['coverAlt'],
    }),
});

export const collections = { projects };
