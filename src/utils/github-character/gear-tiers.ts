// Gear tiers: per slot, the set of public repos showing any of its signals; tier = thresholds reached.
import { DOCS_SIGNALS_MIN, gearRules, MAX_GEAR_TIER, type GearSlotRule } from '../../data/gear-rules.ts';
import type { GearSlotResult, GearTier } from './character-types.ts';
import type { GithubSnapshot, SnapshotRepo } from './github-snapshot-types.ts';
import { repoTokens } from './repo-tokens.ts';

const anyMatch = (patterns: readonly RegExp[], names: readonly string[]) =>
  patterns.some((pattern) => names.some((name) => pattern.test(name)));

/** README, description, topics, license, docs/ folder, https homepage. */
export function docsSignalCount(repo: SnapshotRepo): number {
  return [
    repo.rootEntries.some((name) => /^readme(\.|$)/i.test(name)),
    repo.description !== null,
    repo.topics.length > 0,
    repo.license !== null,
    repo.rootEntries.some((name) => /^docs?$/i.test(name)),
    repo.homepage !== null,
  ].filter(Boolean).length;
}

export function repoHasGear(repo: SnapshotRepo, rule: GearSlotRule): boolean {
  if (rule.slot === 'amulet') return docsSignalCount(repo) >= DOCS_SIGNALS_MIN;
  const tokens = repoTokens(repo);
  return anyMatch(rule.rootFiles, repo.rootEntries)
    || anyMatch(rule.githubFiles, repo.githubEntries)
    || anyMatch(rule.workflowFiles, repo.workflowFiles)
    || rule.keywords.some((keyword) => tokens.has(keyword));
}

export function tierFor(repoCount: number, thresholds: readonly number[]): GearTier {
  return Math.min(MAX_GEAR_TIER, thresholds.filter((threshold) => repoCount >= threshold).length) as GearTier;
}

export function computeGearTiers(snapshot: GithubSnapshot, rules: readonly GearSlotRule[] = gearRules): GearSlotResult[] {
  return rules.map((rule) => {
    const repos = snapshot.repos.filter((repo) => repoHasGear(repo, rule)).map((repo) => repo.name).sort();
    return { slot: rule.slot, axis: rule.axis, label: rule.label, tier: tierFor(repos.length, rule.thresholds), repos };
  });
}
