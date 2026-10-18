import { ATTRIBUTE_IDS, SKILL_ID_PATTERN, xpRules, type XpRules } from '../../data/xp-rules.ts';
import type { RuleIssue, SkillNodeInput, SkillTreeNode } from './career-types.ts';
import { decayedSum } from './diminishing-returns.ts';

/** Unique kebab ids, known attributes, existing parents, no cycles. (One repo may prove many skills.) */
export function validateSkillTree(nodes: readonly SkillNodeInput[]): RuleIssue[] {
  const issues: RuleIssue[] = [];
  const issue = (id: string, problem: string) => issues.push({ source: 'skill', id, problem });
  const byId = new Map<string, SkillNodeInput>();

  for (const node of nodes) {
    if (byId.has(node.id)) issue(node.id, 'duplicate skill id');
    byId.set(node.id, node);
    if (!SKILL_ID_PATTERN.test(node.id)) issue(node.id, 'id must be kebab-case');
    if (!(ATTRIBUTE_IDS as readonly string[]).includes(node.attribute)) {
      issue(node.id, `unknown attribute "${node.attribute}"`);
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
 * Nested tree from a validated flat list. A node's XP comes from the public repos matching it
 * (decayed, capped); its level from the distinct repos proving it or a descendant. Quests are
 * repos too, so they add "Proven in" links but no extra evidence (no double counting).
 */
export function buildSkillTree(
  nodes: readonly SkillNodeInput[],
  repoUrlsBySkill: ReadonlyMap<string, readonly string[]>,
  questIdsBySkill: ReadonlyMap<string, readonly string[]>,
  rules: XpRules = xpRules,
): SkillTreeNode[] {
  const childrenOf = new Map<string | undefined, SkillNodeInput[]>();
  for (const node of nodes) {
    const siblings = childrenOf.get(node.parent) ?? [];
    siblings.push(node);
    childrenOf.set(node.parent, siblings);
  }

  const visit = (node: SkillNodeInput): { tree: SkillTreeNode; evidence: Set<string> } => {
    const repoUrls = [...new Set(repoUrlsBySkill.get(node.id) ?? [])];
    const { xpPerRepo, decay, nodeCap } = rules.skillEvidence;
    const xp = decayedSum(repoUrls.map(() => xpPerRepo), decay, nodeCap);

    const questIds = [...(questIdsBySkill.get(node.id) ?? [])];
    const evidence = new Set(repoUrls);
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
      evidence: repoUrls,
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
