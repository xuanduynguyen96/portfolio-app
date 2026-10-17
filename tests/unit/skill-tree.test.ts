import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SkillNodeInput } from '../../src/utils/career-rpg/career-types.ts';
import {
  buildSkillTree,
  flattenSkillTree,
  skillNodeLevel,
  validateSkillTree,
} from '../../src/utils/career-rpg/skill-tree.ts';
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

  it('rejects one evidence URL reused across skills (even in a variant form)', () => {
    assert.deepEqual(
      problems([
        skill({ id: 'a', evidence: ['https://ex.dev/repo'] }),
        skill({ id: 'b', evidence: ['https://www.ex.dev/Repo/'] }),
        skill({ id: 'c', evidence: ['https://ex.dev/repo', 'https://ex.dev/repo#same-node-is-fine'] }),
      ]),
      ['b: evidence "https://www.ex.dev/Repo/" already used by skill "a"', 'c: evidence "https://ex.dev/repo" already used by skill "a"'],
    );
  });

  it('rejects bad ids, unknown attributes and non-https evidence', () => {
    const issues = problems([
      // Deliberately invalid attribute (bypasses the type like bad content would).
      { id: 'Bad_Id', label: 'x', attribute: 'charisma' as never, evidence: ['http://plain.dev'] },
    ]);
    assert.deepEqual(issues, [
      'Bad_Id: id must be kebab-case',
      'Bad_Id: unknown attribute "charisma"',
      'Bad_Id: evidence "http://plain.dev" is not a valid https URL',
    ]);
  });
});

describe('skillNodeLevel', () => {
  it('maps evidence counts to levels 0..3 via thresholds [1, 3, 6]', () => {
    assert.deepEqual([0, 1, 2, 3, 5, 6, 50].map((count) => skillNodeLevel(count)), [0, 1, 1, 2, 2, 3, 3]);
  });
});

describe('buildSkillTree', () => {
  it('nests children in input order', () => {
    const roots = buildSkillTree(baseSkills, new Map(), new Set());
    assert.deepEqual(roots.map((root) => root.id), ['languages', 'frontend', 'collaboration']);
    assert.deepEqual(flattenSkillTree(roots).map((node) => node.id), baseSkills.map((node) => node.id));
  });

  it('rolls evidence and verified quests up to ancestors', () => {
    const nodes = [
      skill({ id: 'root' }),
      skill({ id: 'child', parent: 'root', evidence: ['https://a.dev', 'https://b.dev'] }),
      skill({ id: 'sibling', parent: 'root', evidence: ['https://b.dev/'] }),
    ];
    const [root] = buildSkillTree(nodes, new Map([['sibling', ['quest-1']]]), new Set());
    const [child, sibling] = root.children;
    assert.equal(child.evidenceCount, 2);
    assert.equal(sibling.evidenceCount, 2); // own URL + quest-1
    assert.equal(root.evidenceCount, 3); // a, b (deduped), quest-1
    assert.equal(root.level, 2);
    assert.deepEqual(sibling.questIds, ['quest-1']);
  });

  it('awards XP for a URL once even if the builder sees it twice (validation rejects this input)', () => {
    const url = 'https://github.com/example-user/repo';
    const nodes = Array.from({ length: 20 }, (_, index) => skill({ id: `s-${index}`, evidence: [url] }));
    assert.equal(validateSkillTree(nodes).length, 19);
    const flat = flattenSkillTree(buildSkillTree(nodes, new Map(), new Set()));
    assert.equal(flat.reduce((total, node) => total + node.xp, 0), 40);
  });

  it('skips URLs already claimed by quests and caps per-node XP with decay', () => {
    const urls = Array.from({ length: 10 }, (_, index) => `https://ex.dev/${index}`);
    const seen = new Set(['https://ex.dev/0']);
    const [node] = buildSkillTree([skill({ id: 'many', evidence: urls })], new Map(), seen);
    assert.equal(node.xp, 120);
    assert.equal(seen.size, 10);
  });
});
