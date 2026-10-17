import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SkillNodeInput } from '../../src/utils/career-rpg/career-types.ts';
import {
  buildSkillTree,
  flattenSkillTree,
  skillNodeLevel,
  validateSkillTree,
} from '../../src/utils/career-rpg/skill-tree.ts';
import { xpRules } from '../../src/data/xp-rules.ts';
import { baseSkills, skill } from './career-fixtures.ts';

const problems = (nodes: SkillNodeInput[]) => validateSkillTree(nodes).map((item) => `${item.id}: ${item.problem}`);

describe('validateSkillTree', () => {
  it('accepts a valid forest', () => {
    assert.deepEqual(validateSkillTree(baseSkills), []);
  });

  it('rejects unknown parent, self parent and duplicate ids', () => {
    assert.deepEqual(
      problems([skill({ id: 'a', parent: 'nope' }), skill({ id: 'b', parent: 'b' }), skill({ id: 'c' }), skill({ id: 'c' })]),
      ['c: duplicate skill id', 'a: unknown parent "nope"', 'b: skill is its own parent'],
    );
  });

  it('reports a 3-node cycle once, with its path', () => {
    assert.deepEqual(
      problems([skill({ id: 'a', parent: 'c' }), skill({ id: 'b', parent: 'a' }), skill({ id: 'c', parent: 'b' })]),
      ['a: parent cycle a -> c -> b -> a'],
    );
  });

  it('does not blame a node that merely hangs below a cycle', () => {
    const issues = problems([
      skill({ id: 'a', parent: 'b' }),
      skill({ id: 'b', parent: 'a' }),
      skill({ id: 'leaf', parent: 'a' }),
    ]);
    assert.deepEqual(issues, ['a: parent cycle a -> b -> a']);
  });

  it('rejects bad ids and unknown attributes', () => {
    const issues = problems([
      // Deliberately invalid attribute (bypasses the type like bad content would).
      { id: 'Bad_Id', label: 'x', attribute: 'charisma' as never },
    ]);
    assert.deepEqual(issues, ['Bad_Id: id must be kebab-case', 'Bad_Id: unknown attribute "charisma"']);
  });
});

describe('skillNodeLevel', () => {
  it('maps evidence counts to levels 0..3 via thresholds [1, 3, 6]', () => {
    assert.deepEqual([0, 1, 2, 3, 5, 6, 50].map((count) => skillNodeLevel(count)), [0, 1, 1, 2, 2, 3, 3]);
  });
});

describe('buildSkillTree', () => {
  const none = new Map<string, string[]>();

  it('nests children in input order', () => {
    const roots = buildSkillTree(baseSkills, none, none);
    assert.deepEqual(roots.map((root) => root.id), ['languages', 'frontend', 'collaboration']);
    assert.deepEqual(flattenSkillTree(roots).map((node) => node.id), baseSkills.map((node) => node.id));
  });

  it('rolls matching repos and quests up to ancestors (distinct evidence)', () => {
    const nodes = [skill({ id: 'root' }), skill({ id: 'child', parent: 'root' }), skill({ id: 'sibling', parent: 'root' })];
    const repos = new Map([['child', ['https://github.com/u/a', 'https://github.com/u/b']], ['sibling', ['https://github.com/u/b']]]);
    const [root] = buildSkillTree(nodes, repos, new Map([['sibling', ['quest-1']]]));
    const [child, sibling] = root.children;
    assert.equal(child.evidenceCount, 2);
    assert.equal(sibling.evidenceCount, 2); // repo b + quest-1
    assert.equal(root.evidenceCount, 3); // a, b (deduped), quest-1
    assert.equal(root.level, 2);
    assert.deepEqual(sibling.questIds, ['quest-1']);
    assert.deepEqual(child.evidence, ['https://github.com/u/a', 'https://github.com/u/b']);
  });

  it('one repo may prove many skills; per-node XP decays and caps', () => {
    const urls = Array.from({ length: 10 }, (_, index) => `https://github.com/u/${index}`);
    const nodes = [skill({ id: 'a' }), skill({ id: 'b' })];
    const [a, b] = buildSkillTree(nodes, new Map([['a', urls], ['b', urls.slice(0, 1)]]), none);
    assert.equal(a.xp, xpRules.skillEvidence.nodeCap);
    assert.equal(b.xp, xpRules.skillEvidence.xpPerRepo);
  });

  it('duplicate URLs for one node count once', () => {
    const [node] = buildSkillTree([skill({ id: 'a' })], new Map([['a', ['https://x.dev', 'https://x.dev']]]), none);
    assert.equal(node.evidenceCount, 1);
    assert.equal(node.xp, xpRules.skillEvidence.xpPerRepo);
  });
});
