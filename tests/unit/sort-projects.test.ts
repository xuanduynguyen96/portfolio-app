import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sortProjects } from '../../src/utils/sort-projects.ts';

const project = (title: string, data: Partial<{ isBoss: boolean; featured: boolean; order: number }> = {}) => ({
  data: { title, isBoss: false, featured: false, order: 100, ...data },
});

describe('sortProjects', () => {
  it('orders boss, then featured, then order, then title', () => {
    const sorted = sortProjects([
      project('Zeta', { order: 1 }),
      project('Alpha', { order: 1 }),
      project('Featured', { featured: true, order: 9 }),
      project('Boss', { isBoss: true, order: 99 }),
      project('Late', { order: 2 }),
    ]);
    assert.deepEqual(sorted.map((item) => item.data.title), ['Boss', 'Featured', 'Alpha', 'Zeta', 'Late']);
  });

  it('does not mutate the input', () => {
    const input = [project('B'), project('A')];
    sortProjects(input);
    assert.deepEqual(input.map((item) => item.data.title), ['B', 'A']);
  });
});
