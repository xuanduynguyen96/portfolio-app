// Which skills a public repo proves: language share, topic, keyword, root file or workflow match.
import { classRules, type ClassRules } from '../../data/character-class-rules.ts';
import type { SkillMatch, SkillNodeInput } from '../career-rpg/career-types.ts';
import type { SnapshotRepo } from './github-snapshot-types.ts';
import { repoTokens } from './repo-tokens.ts';

/** Max skills one quest lists (the projects schema allowed 6 hand-picked skills). */
export const MAX_QUEST_SKILLS = 6;

/** Languages making up at least `minLanguageShare` of the repo's bytes (same noise floor as the classifier). */
export function significantLanguages(repo: SnapshotRepo, rules: ClassRules = classRules): Set<string> {
  const total = repo.languages.reduce((sum, language) => sum + language.bytes, 0);
  return new Set(repo.languages.filter((language) => total > 0 && language.bytes / total >= rules.minLanguageShare).map((l) => l.name));
}

export function repoMatchesSkill(repo: SnapshotRepo, match: SkillMatch | undefined, rules: ClassRules = classRules): boolean {
  if (!match) return false;
  const languages = significantLanguages(repo, rules);
  const topics = new Set(repo.topics.map((topic) => topic.toLowerCase()));
  const files = new Set(repo.rootEntries.map((name) => name.toLowerCase()));
  const tokens = repoTokens(repo);
  return (
    (match.languages ?? []).some((language) => languages.has(language)) ||
    (match.topics ?? []).some((topic) => topics.has(topic.toLowerCase())) ||
    (match.keywords ?? []).some((keyword) => tokens.has(keyword)) ||
    (match.files ?? []).some((file) => files.has(file.toLowerCase())) ||
    (match.workflows === true && repo.workflowFiles.length > 0)
  );
}

/** Skill ids a repo proves, in taxonomy order. */
export function matchSkills(repo: SnapshotRepo, skills: readonly SkillNodeInput[], rules: ClassRules = classRules): string[] {
  return skills.filter((node) => repoMatchesSkill(repo, node.match, rules)).map((node) => node.id);
}
