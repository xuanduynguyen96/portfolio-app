import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { gearRules } from '../../src/data/gear-rules.ts';

const docs = gearRules.find((r) => r.slot === 'amulet')?.docs ?? assert.fail('amulet docs rule');
import { computeGearTiers, docsSignalCount, tierFor } from '../../src/utils/github-character/gear-tiers.ts';
import { repo, snapshot } from './github-snapshot-fixtures.ts';

const tiers = (s: ReturnType<typeof snapshot>) => Object.fromEntries(computeGearTiers(s).map((g) => [g.slot, g.tier]));

describe('gear tiers', () => {
  it('no signals -> every slot tier 0 (tier 0 is still drawn gear)', () => {
    assert.deepEqual(tiers(snapshot([repo({ name: 'plain', rootEntries: [] })])), { armor: 0, shield: 0, boots: 0, amulet: 0 });
  });

  it('threshold boundaries', () => {
    assert.equal(tierFor(0, [1, 3, 5]), 0);
    assert.equal(tierFor(1, [1, 3, 5]), 1);
    assert.equal(tierFor(2, [1, 3, 5]), 1);
    assert.equal(tierFor(3, [1, 3, 5]), 2);
    assert.equal(tierFor(5, [1, 3, 5]), 3);
    assert.equal(tierFor(99, [1, 3, 5]), 3);
  });

  it('each repo counts once per slot, however many signals it shows', () => {
    const loaded = repo({
      name: 'loaded', rootEntries: ['SECURITY.md', 'tests', 'Dockerfile'], githubEntries: ['dependabot.yml', 'SECURITY.md'],
      workflowFiles: ['codeql.yml', 'test.yml'],
    });
    const result = computeGearTiers(snapshot([loaded]));
    for (const slot of result.filter((g) => g.slot !== 'amulet')) {
      assert.deepEqual(slot.repos, ['loaded'], slot.slot);
      assert.equal(slot.tier, 1, slot.slot);
    }
  });

  it('signals per slot: security files, test dirs, CI/Docker, docs', () => {
    const s = snapshot([
      repo({ name: 'a', githubEntries: ['dependabot.yaml'] }),
      repo({ name: 'b', workflowFiles: ['security-scan.yml'] }),
      repo({ name: 'c', rootEntries: ['MyApp.Tests'] }),
      repo({ name: 'd', rootEntries: ['__tests__'] }),
      repo({ name: 'e', rootEntries: ['playwright.config.ts'] }),
      repo({ name: 'spring-jenkins', rootEntries: [] }),
      repo({ name: 'f', rootEntries: ['compose.yaml'] }),
    ]);
    const bySlot = Object.fromEntries(computeGearTiers(s).map((g) => [g.slot, g.repos]));
    assert.deepEqual(bySlot.armor, ['a', 'b']);
    assert.deepEqual(bySlot.shield, ['c', 'd', 'e']);
    assert.deepEqual(bySlot.boots, ['b', 'f', 'spring-jenkins'], 'any workflow file counts as automation');
  });

  it('amulet needs 3 docs signals in one repo', () => {
    const documented = repo({ name: 'doc', rootEntries: ['README.md', 'docs'], license: 'MIT' });
    assert.equal(docsSignalCount(documented, docs), 3);
    assert.equal(docsSignalCount(repo({ name: 'bare', rootEntries: ['README.md'] }), docs), 1);
    assert.deepEqual(computeGearTiers(snapshot([documented])).find((g) => g.slot === 'amulet')?.repos, ['doc']);
  });

  it('no false positives: non-yaml workflow files, "latest", subject-matter words', () => {
    const s = snapshot([
      repo({ name: 'notes', workflowFiles: ['README.md', '.gitkeep'] }),
      repo({ name: 'rel', workflowFiles: ['latest-notes.yml', 'contest.yaml'] }),
      repo({ name: 'security-camera-app', description: 'security testing toolkit', rootEntries: [] }),
    ]);
    const bySlot = Object.fromEntries(computeGearTiers(s).map((g) => [g.slot, g.repos]));
    assert.deepEqual(bySlot.armor, []);
    assert.deepEqual(bySlot.shield, []);
    assert.deepEqual(bySlot.boots, ['rel'], 'yaml workflows count as automation, non-yaml files do not');
  });

  it('test workflows count for the shield', () => {
    const names = ['test.yml', 'ci-tests.yaml', 'e2e.yml', 'unit_test.yml'];
    for (const name of names) {
      const s = snapshot([repo({ name: 'x', rootEntries: [], workflowFiles: [name] })]);
      assert.deepEqual(computeGearTiers(s).find((g) => g.slot === 'shield')?.repos, ['x'], name);
    }
  });

  it('results follow rule order with legend labels', () => {
    const result = computeGearTiers(snapshot([]));
    assert.deepEqual(result.map((g) => g.slot), gearRules.map((r) => r.slot));
    assert.deepEqual(result.map((g) => g.axis), ['Security', 'Testing', 'Automation', 'Docs']);
  });
});
