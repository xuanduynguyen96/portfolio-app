import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { xpRules } from '../../src/data/xp-rules.ts';
import {
  pickBossRepo,
  questDifficulty,
  questScore,
  repoMetrics,
  repoToQuestInput,
  selectQuestRepos,
  toRepoSlug,
} from '../../src/utils/github-character/repo-quests.ts';
import { matchSkills, repoMatchesSkill } from '../../src/utils/github-character/repo-skill-matches.ts';
import { repoWeight } from '../../src/utils/github-character/repo-domain-vote.ts';
import { baseSkills, override } from './career-fixtures.ts';
import { lang, repo, snapshot } from './github-snapshot-fixtures.ts';

const KIB = 1024;

describe('toRepoSlug', () => {
  it('lowercases and kebab-cases camel, snake and dotted names', () => {
    assert.equal(toRepoSlug('QrCodeScanner'), 'qr-code-scanner');
    assert.equal(toRepoSlug('aspnet_framework_docker_ex'), 'aspnet-framework-docker-ex');
    assert.equal(toRepoSlug('portfolio-app'), 'portfolio-app');
    assert.equal(toRepoSlug('my.site.io'), 'my-site-io');
  });
});

describe('selectQuestRepos', () => {
  const many = snapshot(Array.from({ length: 9 }, (_, i) => lang(`r${i}`, 'Go', 10, { commits: i })));

  it('keeps the top quest.max repos by score, most active first', () => {
    const selected = selectQuestRepos(many, []);
    assert.equal(selected.length, xpRules.quest.max);
    assert.equal(selected[0].name, 'r8');
    assert.ok(!selected.some((r) => r.name === 'r0'));
  });

  it('always adds repos that have an override', () => {
    const selected = selectQuestRepos(many, [{ id: 'r0' }]);
    assert.equal(selected.length, xpRules.quest.max + 1);
    assert.ok(selected.some((r) => r.name === 'r0'));
  });

  it('never selects a repo whose name has no letters or digits (no project URL)', () => {
    assert.deepEqual(selectQuestRepos(snapshot([lang('---', 'Go', 99, { commits: 99 }), lang('ok', 'Go')]), []).map((r) => r.name), ['ok']);
  });

  it('ties break by repo name', () => {
    assert.deepEqual(selectQuestRepos(snapshot([lang('b', 'Go'), lang('a', 'Go')]), []).map((r) => r.name), ['a', 'b']);
  });

  it('pinned and hygienic repos rank higher', () => {
    const s = { ...snapshot([lang('plain', 'Go'), lang('pinned', 'Go')]), pinned: ['pinned'] };
    assert.equal(selectQuestRepos(s, [])[0].name, 'pinned');
    const tidy = snapshot([lang('plain', 'Go'), lang('tidy', 'Go', 20, { rootEntries: ['tests', 'SECURITY.md'] })]);
    assert.equal(selectQuestRepos(tidy, [])[0].name, 'tidy');
  });
});

describe('questScore does not depend on the class', () => {
  const fresh = { pushedWeek: '2026-09-07', commits: 10 };

  it('repos that prove no skill (Python, empty) still rank by weight', () => {
    const s = snapshot([lang('py-tool', 'Python', 20, fresh), repo({ name: 'notes', ...fresh, commits: 0 }), lang('svc', 'C#', 20, { ...fresh, commits: 0 })]);
    assert.deepEqual(selectQuestRepos(s, []).map((r) => r.name), ['py-tool', 'notes', 'svc'], 'most active first, then by name');
  });

  it('score = repo weight + hygiene + pinned, whatever the repo proves', () => {
    const plain = lang('plain', 'Python', 20, fresh);
    const s = { ...snapshot([plain, { ...plain, name: 'pinned' }]), pinned: ['pinned'] };
    assert.ok(Math.abs(questScore(plain, s) - repoWeight(plain, s.asOf)) < 1e-9);
    assert.ok(Math.abs(questScore(s.repos[1], s) - repoWeight(s.repos[1], s.asOf) - xpRules.quest.selection.pinnedBonus) < 1e-9);
  });

  it('an old archived repo ranks below a fresh one of the same kind', () => {
    const s = snapshot([lang('old', 'C#', 20, { pushedWeek: '2015-01-05', isArchived: true }), lang('new', 'C#', 20, fresh)]);
    assert.deepEqual(selectQuestRepos(s, []).map((r) => r.name), ['new', 'old']);
  });
});

describe('pickBossRepo', () => {
  const s = { ...snapshot([lang('a', 'Go'), lang('b', 'Go'), lang('c', 'Go')]), pinned: ['b'] };
  const selected = s.repos;

  it('override isBoss wins, then first pinned, then top ranked', () => {
    assert.equal(pickBossRepo(selected, s, [override({ id: 'c', isBoss: true })])?.name, 'c');
    assert.equal(pickBossRepo(selected, s, [])?.name, 'b');
    assert.equal(pickBossRepo(selected, { ...s, pinned: [] }, [])?.name, 'a');
  });
});

describe('questDifficulty', () => {
  const { main, raid } = xpRules.quest.difficulty;
  it('either commits or code size reaches a tier', () => {
    assert.equal(questDifficulty(repo({ name: 'x', commits: 0 })), 'side');
    assert.equal(questDifficulty(repo({ name: 'x', commits: main.commits })), 'main');
    assert.equal(questDifficulty(repo({ name: 'x', commits: raid.commits })), 'raid');
    assert.equal(questDifficulty(repo({ name: 'x', commits: 0, languages: [{ name: 'Go', bytes: raid.kib * KIB }] })), 'raid');
  });
});

describe('repoToQuestInput', () => {
  const r = repo({
    name: 'WebApp', description: 'A web app', homepage: 'https://web.example.dev/', commits: 7,
    languages: [{ name: 'TypeScript', bytes: 40 * KIB }, { name: 'CSS', bytes: 8 * KIB }], topics: ['astro'],
    rootEntries: ['README.md', 'docs', 'tests'], workflowFiles: ['ci.yml'],
  });
  const context = { snapshot: snapshot([r]), skills: baseSkills, boss: r, rank: 0 };

  it('derives everything from the repo when there is no override', () => {
    const q = repoToQuestInput(r, undefined, context);
    assert.equal(q.id, 'web-app');
    assert.equal(q.title, 'WebApp');
    assert.equal(q.summary, 'A web app');
    assert.deepEqual(q.tags, ['TypeScript', 'CSS', 'astro']);
    assert.equal(q.isBoss, true);
    assert.deepEqual(q.skills, ['typescript', 'css', 'writing']);
    assert.deepEqual(q.evidence, [{ type: 'repo', url: r.url }, { type: 'demo', url: 'https://web.example.dev/' }]);
    assert.deepEqual(q.signals, { description: true, topics: true, homepage: true, tests: true, ci: true });
    assert.deepEqual(q.repoMetrics, [{ label: 'Commits', value: 7 }, { label: 'Languages', value: 2 }, { label: 'Code', value: 48, unit: 'KiB' }]);
  });

  it('override text wins; repo facts (difficulty, skills, evidence) do not change', () => {
    const q = repoToQuestInput(r, override({ id: 'web-app', title: 'My App', summary: 'Short', tags: ['X'], body: 'case' }), context);
    assert.equal(q.title, 'My App');
    assert.equal(q.summary, 'Short');
    assert.deepEqual(q.tags, ['X']);
    assert.equal(q.body, 'case');
    assert.equal(q.difficulty, repoToQuestInput(r, undefined, context).difficulty);
  });

  it('a repo without description gets a language summary, capped at 160 chars', () => {
    assert.equal(repoToQuestInput(lang('svc', 'Go'), undefined, context).summary, 'Public repository in Go.');
    const long = repoToQuestInput(repo({ name: 'l', description: 'y'.repeat(300) }), undefined, context).summary;
    assert.equal(Array.from(long).length, 160);
    assert.equal(repoMetrics(repo({ name: 'empty', commits: 0 })).length, 0);
  });
});

describe('repo skill matches', () => {
  it('languages count only above the share threshold; files, keywords, workflows', () => {
    const r = repo({ name: 'mix', languages: [{ name: 'TypeScript', bytes: 95 }, { name: 'Go', bytes: 5 }], rootEntries: ['Docs'] });
    assert.deepEqual(matchSkills(r, baseSkills), ['typescript', 'writing']);
    assert.equal(repoMatchesSkill(repo({ name: 'x', workflowFiles: ['a.yml'] }), { workflows: true }), true);
    assert.equal(repoMatchesSkill(repo({ name: 'x', description: 'Spring demo' }), { keywords: ['spring'] }), true);
    assert.equal(repoMatchesSkill(repo({ name: 'x' }), undefined), false);
  });
});
