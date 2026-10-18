// Cross-entry rules for case-study overrides (per-entry rules live in the zod schema).
import { toRepoSlug } from '../github-character/repo-quests.ts';
import type { GithubSnapshot } from '../github-character/github-snapshot-types.ts';
import type { QuestOverrideInput, RuleIssue } from './career-types.ts';

/** Every override names a public repo of the snapshot, at most one boss, no two repos share a slug. */
export function validateQuestOverrides(overrides: readonly QuestOverrideInput[], snapshot: GithubSnapshot): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const issue = (id: string, problem: string) => issues.push({ source: 'quest', id, problem });

  const reposBySlug = new Map<string, string[]>();
  for (const repo of snapshot.repos) {
    const slug = toRepoSlug(repo.name);
    reposBySlug.set(slug, [...(reposBySlug.get(slug) ?? []), repo.name]);
  }
  for (const [slug, names] of reposBySlug) {
    if (names.length > 1) issue(slug, `repos ${names.join(', ')} share the slug "${slug}": rename one on GitHub`);
  }

  for (const override of overrides) {
    if (!reposBySlug.has(override.id)) {
      issue(override.id, `no public repo with slug "${override.id}" in the GitHub snapshot (file name must be the repo slug)`);
    }
  }

  const bosses = overrides.filter((override) => override.isBoss).map((override) => override.id);
  if (bosses.length > 1) issue(bosses.join(', '), `${bosses.length} overrides set isBoss: at most one allowed`);
  return issues;
}
