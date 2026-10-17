import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { gridHasChar, gridToPathData } from '../../src/utils/pixel-icon-path.ts';

const empty = ['........', '........'];

describe('gridToPathData', () => {
  it('returns an empty string when no cell matches', () => {
    assert.equal(gridToPathData(empty, '#'), '');
    assert.equal(gridToPathData([], '#'), '');
  });

  it('merges a full row into one rectangle', () => {
    assert.equal(gridToPathData(['########'], '#'), 'M0 0h8v1h-8z');
  });

  it('emits one rectangle per horizontal run, in reading order', () => {
    assert.equal(gridToPathData(['##..###.'], '#'), 'M0 0h2v1h-2zM4 0h3v1h-3z');
  });

  it('handles single cells at both row edges', () => {
    assert.equal(gridToPathData(['#......#'], '#'), 'M0 0h1v1h-1zM7 0h1v1h-1z');
  });

  it('uses the row index as y and does not merge vertically', () => {
    assert.equal(gridToPathData(['........', '..##....', '..##....'], '#'), 'M2 1h2v1h-2zM2 2h2v1h-2z');
  });

  it('only covers the requested char', () => {
    const grid = ['#++#', '+##+'];
    assert.equal(gridToPathData(grid, '#'), 'M0 0h1v1h-1zM3 0h1v1h-1zM1 1h2v1h-2z');
    assert.equal(gridToPathData(grid, '+'), 'M1 0h2v1h-2zM0 1h1v1h-1zM3 1h1v1h-1z');
  });

  it('covers exactly the matching cell count', () => {
    const grid = ['#.#+##..', '.###+#+#'];
    const area = [...gridToPathData(grid, '#').matchAll(/h(\d+)v1/g)].reduce((sum, m) => sum + Number(m[1]), 0);
    assert.equal(area, grid.join('').split('').filter((c) => c === '#').length);
  });
});

describe('gridHasChar', () => {
  it('detects presence of a char in any row', () => {
    assert.equal(gridHasChar(['....', '..+.'], '+'), true);
    assert.equal(gridHasChar(['....', '..#.'], '+'), false);
  });
});
