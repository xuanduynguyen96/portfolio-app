import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { classRules } from '../../src/data/character-class-rules.ts';
import { activityWeight, recencyWeight, repoArchetypeVote } from '../../src/utils/github-character/repo-archetype-vote.ts';
import { splitName, repoTokens } from '../../src/utils/github-character/repo-tokens.ts';
import { AS_OF, lang, repo } from './github-snapshot-fixtures.ts';

const KIB = 1024;
const vote = (r: Parameters<typeof repoArchetypeVote>[0]) => repoArchetypeVote(r, AS_OF).vote;

describe('repo tokens', () => {
  it('splits camelCase, snake_case and kebab-case names', () => {
    assert.equal(splitName('QrCodeScanner'), 'qr code scanner');
    assert.equal(splitName('aspnet_framework_docker_ex'), 'aspnet framework docker ex');
    assert.equal(splitName('HTMLParser-v2'), 'html parser v2');
    assert.ok(repoTokens(repo({ name: 'x', description: 'Xamarin Mobile App', topics: ['machine-learning'] })).has('learning'));
  });
});

describe('repoArchetypeVote', () => {
  it('a Xamarin C# app votes frontend through its description', () => {
    const v = vote(lang('QrCodeScanner', 'C#', 27, { description: 'Xamarin Mobile App for scanning QR or Bar Code' }));
    assert.ok(v.frontend > v.backend);
  });

  it('a repo with no languages still votes through keywords', () => {
    const v = vote(repo({ name: 'aspnet_framework_docker_ex', description: 'asp.net MVC sample' }));
    assert.ok(v.backend > 0);
    assert.equal(v.frontend, 0);
  });

  it('notebook bytes are capped so outputs do not drown real code', () => {
    const r = repo({ name: 'mixed', languages: [{ name: 'Jupyter Notebook', bytes: 5000 * KIB }, { name: 'Go', bytes: 150 * KIB }] });
    assert.ok(vote(r).backend > 0, 'Go keeps a share after the cap');
  });

  it('ignored and unknown languages carry no vote and never throw', () => {
    const r = repo({ name: 'dots', languages: [{ name: 'Shell', bytes: 99 * KIB }, { name: 'Brainfuck', bytes: 9 * KIB }] });
    assert.deepEqual(repoArchetypeVote(r, AS_OF), { vote: { backend: 0, data: 0, frontend: 0 }, signals: [] });
  });

  it('a repo votes at most 1 before weights; archived halves it', () => {
    const r = lang('svc', 'Go', 10, { description: 'api server backend database', commits: 0, pushedWeek: AS_OF });
    assert.ok(Math.abs(vote(r).backend - 1) < 1e-9);
    assert.ok(Math.abs(vote({ ...r, isArchived: true }).backend - classRules.archivedFactor) < 1e-9);
  });

  it('recency halves per half-life with a floor; activity is log-capped', () => {
    assert.equal(recencyWeight(AS_OF, AS_OF), 1);
    assert.ok(Math.abs(recencyWeight('2022-10-10', AS_OF) - 0.5) < 0.01, '48 months later ~ half');
    assert.equal(recencyWeight('1990-01-01', AS_OF), classRules.recency.floor);
    assert.equal(activityWeight(0), 1);
    assert.equal(activityWeight(10 ** 9), 1 + classRules.activity.max);
  });

  it('primary language adds a bonus, discounted for markup like its bytes', () => {
    const plain = repo({ name: 'p', languages: [{ name: 'Go', bytes: 10 * KIB }], commits: 0, pushedWeek: AS_OF });
    assert.ok(Math.abs(vote(plain).backend - 1) < 1e-9, '1 + 0.3 bonus is capped back to 1');
    const mixed = repo({ name: 'm', primaryLanguage: 'Go', commits: 0, pushedWeek: AS_OF,
      languages: [{ name: 'Go', bytes: 5 * KIB }, { name: 'Swift', bytes: 5 * KIB }] });
    const v = vote(mixed);
    assert.ok(Math.abs(v.backend - 0.8 / 1.3) < 1e-9 && Math.abs(v.frontend - 0.5 / 1.3) < 1e-9, 'bonus tips the split');
    const html = repo({ name: 'h', primaryLanguage: 'HTML', commits: 0, pushedWeek: AS_OF, languages: [{ name: 'HTML', bytes: 9 * KIB }] });
    assert.ok(Math.abs(vote(html).frontend - (0.5 + 0.3 * 0.5)) < 1e-9);
  });

  it('a language is "why" evidence only where it really points', () => {
    const ts = lang('site', 'TypeScript', 50);
    const signals = repoArchetypeVote(ts, AS_OF).signals;
    assert.match(signals.find((s) => s.archetype === 'frontend')?.reason ?? '', /TypeScript/);
    assert.doesNotMatch(signals.find((s) => s.archetype === 'backend')?.reason ?? '', /TypeScript \d+%/);
  });

  it('minor languages under the share threshold are ignored', () => {
    const r = repo({ name: 'site', primaryLanguage: null, languages: [{ name: 'TypeScript', bytes: 95 * KIB }, { name: 'Go', bytes: 5 * KIB }] });
    const signals = repoArchetypeVote(r, AS_OF).signals;
    assert.ok(signals.every((s) => !s.reason.includes('Go')));
  });
});
