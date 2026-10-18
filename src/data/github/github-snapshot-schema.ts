// Strict zod schema for the committed GitHub snapshot: a bad refresh fails verify before it can deploy.
import { z } from 'astro/zod';
import { httpsUrl } from '../career-schemas.ts';

const isoDay = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');
const count = z.number().int().min(0);
const name = z.string().min(1).max(100);

export const snapshotRepoSchema = z.strictObject({
  name,
  url: httpsUrl,
  description: z.string().max(200).nullable(),
  homepage: httpsUrl.nullable(),
  createdWeek: isoDay,
  pushedWeek: isoDay,
  isArchived: z.boolean(),
  stars: count,
  primaryLanguage: z.string().nullable(),
  languages: z.array(z.strictObject({ name: z.string().min(1), bytes: z.number().int().min(1) })).max(20),
  topics: z.array(z.string().min(1)).max(20),
  license: z.string().nullable(),
  rootEntries: z.array(z.string().min(1)).max(60),
  githubEntries: z.array(z.string().min(1)).max(100),
  workflowFiles: z.array(z.string().min(1)).max(100),
  commits: count,
});

export const githubSnapshotSchema = z.strictObject({
  schemaVersion: z.literal(1),
  // GitHub login rules: interpolated into the profile URL.
  login: z.string().regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/, 'must be a GitHub login'),
  asOf: isoDay,
  accountCreated: isoDay,
  pinned: z.array(name).max(6),
  repos: z
    .array(snapshotRepoSchema)
    .max(300)
    .refine((repos) => new Set(repos.map((r) => r.name.toLowerCase())).size === repos.length, 'repo names must be unique'),
  activity: z.strictObject({
    weeks: z.array(z.strictObject({ start: isoDay, count: z.number().int().min(1) })),
    totals: z.strictObject({ commits: count, pullRequests: count, reviews: count, issues: count }),
  }),
});
