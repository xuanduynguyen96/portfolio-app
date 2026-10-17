import { ATTRIBUTE_IDS, xpRules, type XpRules } from '../../data/xp-rules.ts';
import type { RuleIssue, SkillNodeInput, SkillTreeNode } from './career-types.ts';
import { decayedSum, normalizeEvidenceUrl, uniqueEvidenceUrls } from './diminishing-returns.ts';

const KEBAB_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Unique kebab ids, known attributes, valid URLs, existing parents, no cycles. */
export function validateSkillTree(nodes: readonly SkillNodeInput[]): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const issue = (id: string, problem: string) => issues.push({ source: 'skill', id, problem });
  const byId = new Map<string, SkillNodeInput>();

  for (const node of nodes) {
    if (byId.has(node.id)) issue(node.id, 'duplicate skill id');
    byId.set(node.id, node);
    if (!KEBAB_ID.test(node.id)) issue(node.id, 'id must be kebab-case');
    if (!(ATTRIBUTE_IDS as readonly string[]).includes(node.attribute)) {
      issue(node.id, `unknown attribute "${node.attribute}"`);
    }
    for (const url of node.evidence) {
      if (normalizeEvidenceUrl(url) === null) issue(node.id, `evidence "${url}" is not a valid https URL`);
    }
  }

  const reportedCycles = new Set<string>();
  for (const node of byId.values()) {
    if (node.parent === undefined) continue;
    if (node.parent === node.id) {
      issue(node.id, 'skill is its own parent');
      continue;
    }
    if (!byId.has(node.parent)) {
      issue(node.id, `unknown parent "${node.parent}"`);
      continue;
    }
    const path = [node.id];
    let current = byId.get(node.parent);
    while (current) {
      if (current.id === node.id) {
        const key = [...path].sort().join('|');
        if (!reportedCycles.has(key)) {
          reportedCycles.add(key);
          issue(node.id, `parent cycle ${[...path, node.id].join(' -> ')}`);
        }
        break;
      }
      // A cycle further up that doesn't include this node is reported by its own members.
      if (path.includes(current.id) || current.parent === current.id) break;
      path.push(current.id);
      current = current.parent === undefined ? undefined : byId.get(current.parent);
    }
  }
  return issues;
}

/** Node level = number of thresholds the distinct evidence count reaches (0 = locked). */
export function skillNodeLevel(evidenceCount: number, rules: XpRules = xpRules): number {
  return rules.skillEvidence.levelThresholds.filter((threshold) => evidenceCount >= threshold).length;
}

/**
 * Nested tree from a validated flat list. Walks pre-order (input order) so the shared
 * `seen` set decides which node first claims a URL: a URL earns XP once site-wide.
 * Evidence (own URLs + verified quests) rolls up to ancestors for levels.
 */
export function buildSkillTree(
  nodes: readonly SkillNodeInput[],
  verifiedQuestIdsBySkill: ReadonlyMap<string, readonly string[]>,
  seen: Set<string>,
  rules: XpRules = xpRules,
): SkillTreeNode[] {
  const childrenOf = new Map<string | undefined, SkillNodeInput[]>();
  for (const node of nodes) {
    const siblings = childrenOf.get(node.parent) ?? [];
    siblings.push(node);
    childrenOf.set(node.parent, siblings);
  }

  const visit = (node: SkillNodeInput): { tree: SkillTreeNode; evidence: Set<string> } => {
    const ownUrls = uniqueEvidenceUrls(node.evidence);
    const fresh = ownUrls.filter((url) => !seen.has(url));
    fresh.forEach((url) => seen.add(url));
    const { xpPerUrl, decay, nodeCap } = rules.skillEvidence;
    const xp = decayedSum(fresh.map(() => xpPerUrl), decay, nodeCap);

    const questIds = [...(verifiedQuestIdsBySkill.get(node.id) ?? [])];
    const evidence = new Set([...ownUrls, ...questIds.map((id) => `quest:${id}`)]);
    const children = (childrenOf.get(node.id) ?? []).map((child) => {
      const result = visit(child);
      result.evidence.forEach((item) => evidence.add(item));
      return result.tree;
    });

    const tree: SkillTreeNode = {
      id: node.id,
      label: node.label,
      attribute: node.attribute,
      ...(node.parent === undefined ? {} : { parent: node.parent }),
      evidence: node.evidence,
      questIds,
      children,
      evidenceCount: evidence.size,
      level: skillNodeLevel(evidence.size, rules),
      xp,
    };
    return { tree, evidence };
  };

  return (childrenOf.get(undefined) ?? []).map((root) => visit(root).tree);
}

/** Depth-first (pre-order) flat list of a nested tree. */
export function flattenSkillTree(roots: readonly SkillTreeNode[]): SkillTreeNode[] {
  return roots.flatMap((node) => [node, ...flattenSkillTree(node.children)]);
}
