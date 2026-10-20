import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classRules } from '../../src/data/character-class-rules.ts';
import { skillNodes } from '../../src/data/skills-data.ts';
import { activityWeight, recencyWeight, repoDomainVote, repoWeight, round3, zeroVote } from '../../src/utils/github-character/repo-domain-vote.ts';
import { splitName, repoTokens } from '../../src/utils/github-character/repo-tokens.ts';
import { AS_OF, repo } from './github-snapshot-fixtures.ts';

const node = (id: string) => skillNodes.find((n) => n.id === id)!;
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);
/** Fresh repo, 0 commits: repoWeight is exactly 1. */
const unit = repo({ name: 'unit', commits: 0, pushedWeek: AS_OF });

describe('repo tokens', () => {
  it('splits camelCase, snake_case and kebab-case names', () => {
    assert.equal(splitName('QrCodeScanner'), 'qr code scanner');
    assert.equal(splitName('aspnet_framework_docker_ex'), 'aspnet framework docker ex');
    assert.equal(splitName('HTMLParser-v2'), 'html parser v2');
    assert.ok(repoTokens(repo({ name: 'x', description: 'Xamarin Mobile App', topics: ['machine-learning'] })).has('learning'));
  });
});

describe('repoWeight pieces', () => {
  it('recency halves per half-life with a floor; activity is log-capped', () => {
    assert.equal(recencyWeight(AS_OF, AS_OF), 1);
    assert.ok(Math.abs(recencyWeight('2022-10-10', AS_OF) - 0.5) < 0.01, '48 months later ~ half');
    assert.equal(recencyWeight('1990-01-01', AS_OF), classRules.recency.floor);
    assert.equal(activityWeight(0), 1);
    assert.equal(activityWeight(10 ** 9), 1 + classRules.activity.max);
  });

  it('a push date after asOf counts as brand new (no weight above 1)', () => {
    assert.equal(recencyWeight('2030-01-07', AS_OF), 1);
  });

  it('archived repos count archivedFactor times as much', () => {
    near(repoWeight(unit, AS_OF), 1);
    near(repoWeight({ ...unit, isArchived: true }, AS_OF), classRules.archivedFactor);
  });
});

describe('repoDomainVote', () => {
  it('one voting skill gives its domain the whole repo weight', () => {
    const { vote } = repoDomainVote(unit, [node('docker')], AS_OF);
    assert.deepEqual(vote, { ...zeroVote(), devops: 1 });
  });

  it('several skills of one domain still give that domain the whole weight', () => {
    const { vote, signals } = repoDomainVote(unit, [node('csharp'), node('dotnet'), node('web-servers')], AS_OF);
    near(vote.backend, 1);
    assert.equal(signals.length, 1);
    assert.equal(signals[0].reason, 'C#, .NET / ASP.NET, Web servers & APIs');
  });

  it('skills in two domains split the weight by skill count (2:1 gives 2/3 and 1/3)', () => {
    const { vote, signals } = repoDomainVote(unit, [node('csharp'), node('dotnet'), node('docker')], AS_OF);
    near(vote.backend, 2 / 3);
    near(vote.devops, 1 / 3);
    near(vote.backend + vote.devops, repoWeight(unit, AS_OF));
    assert.deepEqual(signals.map((s) => [s.domain, s.points]), [['backend', round3(2 / 3)], ['devops', round3(1 / 3)]]);
  });

  it('skills that do not vote (languages, groups, docs) add no vote and no signal', () => {
    for (const id of ['typescript', 'javascript', 'python', 'readme-craft', 'technical-writing', 'backend', 'tooling']) {
      assert.deepEqual(repoDomainVote(unit, [node(id)], AS_OF), { vote: zeroVote(), signals: [] }, id);
    }
    assert.deepEqual(repoDomainVote(unit, [], AS_OF), { vote: zeroVote(), signals: [] });
  });

  it('non-voting skills do not dilute the split', () => {
    const { vote } = repoDomainVote(unit, [node('docker'), node('typescript'), node('python')], AS_OF);
    near(vote.devops, 1);
  });

  it('weights: recency x activity x archived scale the whole vote', () => {
    const busy = repo({ name: 'busy', commits: 99, pushedWeek: AS_OF });
    near(repoDomainVote(busy, [node('react')], AS_OF).vote.frontend, activityWeight(99));
    const old = repo({ name: 'old', commits: 0, pushedWeek: '1990-01-01', isArchived: true });
    near(repoDomainVote(old, [node('react')], AS_OF).vote.frontend, classRules.recency.floor * classRules.archivedFactor);
  });

  it('a monolith cannot outvote the activity cap: at most 1 x (1 + max) per repo', () => {
    const huge = repo({ name: 'huge', commits: 10 ** 7, pushedWeek: AS_OF });
    const { vote } = repoDomainVote(huge, skillNodes.filter((n) => classRules.skillDomains[n.id]), AS_OF);
    near(Object.values(vote).reduce((a, b) => a + b, 0), 1 + classRules.activity.max);
  });

  it('signal points are rounded to 3 decimals', () => {
    const { signals } = repoDomainVote(unit, [node('csharp'), node('dotnet'), node('docker')], AS_OF);
    for (const signal of signals) assert.equal(signal.points, round3(signal.points));
  });
});
