// The switcher's eager client graph (static imports of the stub; the dynamic import() of
// look-apply-model is the lazy chunk) must stay free of sprite art, the composer and gear rules.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = resolve(import.meta.dirname, '../..');
const ENTRIES = ['src/scripts/class-job-switcher.ts'];
const FORBIDDEN = /src\/data\/avatar\/|avatar-description|select-avatar-layers|compose-avatar-grid|avatar-svg-|avatar-sticker|gear-rules/;
const VALUE_IMPORT = /^\s*(?:import|export)\s+(?!type\b)[^;]*?from\s+'(\.[^']+)'/gm;

function eagerGraph(entries: string[]): string[] {
  const seen = new Set<string>();
  const queue = entries.map((entry) => resolve(ROOT, entry));
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const [, spec] of readFileSync(file, 'utf8').matchAll(VALUE_IMPORT)) {
      const target = resolve(dirname(file), spec);
      queue.push(existsSync(target) ? target : `${target}.ts`);
    }
  }
  return [...seen].map((file) => relative(ROOT, file));
}

describe('switcher eager imports', () => {
  it('the stub never statically reaches sprites, composer or gear rules', () => {
    const graph = eagerGraph(ENTRIES);
    assert.ok(graph.length > 3, 'graph walk found the imports');
    assert.ok(graph.includes('src/utils/avatar/class-looks.ts') && graph.includes('src/utils/avatar/class-labels.ts'));
    assert.ok(!graph.some((file) => file.includes('look-apply-model') || file.includes('look-avatar-model')));
    assert.deepEqual(graph.filter((file) => FORBIDDEN.test(file)), []);
  });
});
