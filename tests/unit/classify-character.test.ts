import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { classRules } from '../../src/data/character-class-rules.ts';
import { CLASS_BY_DOMAIN, JOBS } from '../../src/data/character-job-rules.ts';
import { classifyCharacter } from '../../src/utils/github-character/classify-character.ts';
import { repoWeight, round3 } from '../../src/utils/github-character/repo-domain-vote.ts';
import { matchSkills } from '../../src/utils/github-character/repo-skill-matches.ts';
import { skillNodes } from '../../src/data/skills-data.ts';
import {
  AS_OF, dataOnly, hybridStack, lang, provingRepo, pureBackend, pureDevops, pureFrontend, repo, snapshot, sparse,
} from './github-snapshot-fixtures.ts';

const label = (profile: ReturnType<typeof classifyCharacter>) => `${profile.className}${profile.jobName ? ` · ${profile.jobName}` : ''}`;
/** Repo weight 0.25: the recency floor with no commits. */
const faint = { pushedWeek: '1990-01-01', commits: 0 };
const same = { pushedWeek: AS_OF, commits: 10 };

describe('provingRepo (test helper)', () => {
  it('proves exactly its one skill among the voting skills, for every voting skill', () => {
    for (const skill of Object.keys(classRules.skillDomains)) {
      const proven = matchSkills(provingRepo('zz', skill), skillNodes).filter((id) => classRules.skillDomains[id]);
      assert.deepEqual(proven, [skill]);
    }
  });
});

describe('classifyCharacter: class = domain with the most skill-match weight', () => {
  it('pure profiles land on their class and job', () => {
    assert.equal(label(classifyCharacter(pureBackend())), 'Warrior · Knight');
    assert.equal(label(classifyCharacter(pureFrontend())), 'Archer · Ranger');
    assert.equal(label(classifyCharacter(pureDevops())), 'Mage · Enchanter');
  });

  it('a hybrid takes the strongest domain; the recent weaker domain does not flip it', () => {
    const profile = classifyCharacter(hybridStack());
    assert.equal(profile.primary, 'backend');
    assert.ok(profile.scores.backend > profile.scores.frontend && profile.scores.frontend > 0 && profile.scores.devops > 0);
    assert.equal(profile.classId, CLASS_BY_DOMAIN.backend);
  });

  it('language-only HTML / C# repos vote through their language skill', () => {
    const html = classifyCharacter(snapshot([lang('a', 'HTML'), lang('b', 'HTML')]));
    assert.equal(label(html), 'Archer · Herald');
    assert.equal(label(classifyCharacter(snapshot([lang('a', 'C#'), lang('b', 'C#')]))), 'Warrior · Knight');
  });

  it('languages under the share threshold prove nothing', () => {
    const minor = (name: string) => repo({ name, languages: [{ name: 'C#', bytes: 95_000 }, { name: 'HTML', bytes: 5_000 }], ...same });
    const profile = classifyCharacter(snapshot([minor('a'), minor('b')]));
    assert.equal(profile.scores.frontend, 0);
    assert.equal(profile.classId, 'warrior');
  });

  it('languages that prove no domain skill never vote: Adventurer', () => {
    for (const language of ['TypeScript', 'JavaScript', 'Python', 'Jupyter Notebook', 'Go', 'Rust', 'Swift', 'Kotlin']) {
      const four = snapshot(['a', 'b', 'c', 'd'].map((name) => lang(name, language)));
      assert.equal(classifyCharacter(four).classId, 'adventurer', language);
    }
    assert.equal(classifyCharacter(dataOnly()).classId, 'adventurer');
  });

  it('CI + Playwright on every frontend repo stays Archer (workflow files do not outvote the code)', () => {
    const site = (name: string) => repo({
      name, ...same, languages: [{ name: 'Astro', bytes: 9000 }, { name: 'CSS', bytes: 3000 }], topics: ['react'],
      rootEntries: ['README.md', 'playwright.config.ts'], workflowFiles: ['ci.yml'],
    });
    const profile = classifyCharacter(snapshot([site('a'), site('b'), site('c')]));
    assert.ok(profile.scores.frontend > profile.scores.devops, JSON.stringify(profile.scores));
    assert.equal(profile.classId, 'archer');
  });

  it('a repo proving 2 backend + 1 devops skills splits its weight 2/3 : 1/3', () => {
    const mixed = repo({ name: 'mixed', languages: [{ name: 'C#', bytes: 9000 }], description: 'asp docker', ...same });
    const profile = classifyCharacter(snapshot([mixed, provingRepo('filler', 'csharp', faint)]));
    const w = repoWeight(mixed, AS_OF);
    assert.equal(profile.scores.devops, round3(w / 3));
    assert.equal(profile.scores.backend, round3((2 * w) / 3 + repoWeight(provingRepo('filler', 'csharp', faint), AS_OF)));
  });
});

describe('classifyCharacter: tie-breaks', () => {
  it('equal domain scores break by domain order: backend, frontend, devops', () => {
    const all = classifyCharacter(snapshot([provingRepo('a', 'csharp', same), provingRepo('b', 'react', same), provingRepo('c', 'docker', same)]));
    assert.ok(all.scores.backend === all.scores.frontend && all.scores.frontend === all.scores.devops);
    assert.equal(all.primary, 'backend');
    const two = classifyCharacter(snapshot([provingRepo('b', 'react', same), provingRepo('c', 'docker', same)]));
    assert.equal(two.scores.frontend, two.scores.devops);
    assert.equal(two.primary, 'frontend');
  });

  it('equal job credit goes to the earlier job, whatever the repo order', () => {
    const [knight, paladin] = [provingRepo('a', 'csharp', same), provingRepo('b', 'java', same)];
    assert.equal(classifyCharacter(snapshot([knight, paladin])).jobId, 'knight');
    assert.equal(classifyCharacter(snapshot([paladin, knight])).jobId, 'knight');
    assert.equal(classifyCharacter(snapshot([provingRepo('a', 'web-servers', same), paladin])).jobId, 'paladin');
  });
});

describe('classifyCharacter: job = the skills the repos prove', () => {
  it('every one of the 9 jobs is reachable from repos proving only its skills', () => {
    for (const [classId, jobs] of Object.entries(JOBS)) {
      for (const job of jobs) {
        const rival = jobs.find((other) => other.id !== job.id)!;
        const repos = [provingRepo('a', job.skills[0], same), provingRepo('b', job.skills[0], same), provingRepo('c', rival.skills[0], faint)];
        const profile = classifyCharacter(snapshot(repos));
        assert.equal(profile.classId, classId, job.id);
        assert.equal(profile.jobId, job.id, job.id);
        assert.equal(profile.motif, job.motif, job.id);
      }
    }
  });

  it('the job with the most proving weight wins even if another job has more repos', () => {
    const heavy = provingRepo('a', 'java', { pushedWeek: AS_OF, commits: 1000 });
    const lights = ['b', 'c'].map((name) => provingRepo(name, 'csharp', faint));
    assert.equal(classifyCharacter(snapshot([heavy, ...lights])).jobId, 'paladin');
  });
});

describe('classifyCharacter: Adventurer fallback', () => {
  it('too little evidence -> no job, no motif', () => {
    for (const snap of [sparse(), snapshot([]), snapshot([repo({ name: 'empty' }), repo({ name: 'notes' }), provingRepo('x', 'csharp')])]) {
      const profile = classifyCharacter(snap);
      assert.equal(profile.classId, 'adventurer');
      assert.equal(profile.jobId, null);
      assert.equal(profile.motif, null);
      assert.equal(profile.primary, null);
    }
  });

  it('the total weight boundary: just under minTotal is Adventurer, at minTotal is classified', () => {
    const faintRepos = (n: number) => snapshot(Array.from({ length: n }, (_, i) => provingRepo(`r${i}`, 'csharp', faint)));
    const needed = Math.ceil(classRules.fallback.minTotal / classRules.recency.floor);
    assert.equal(classifyCharacter(faintRepos(needed - 1)).classId, 'adventurer');
    assert.equal(classifyCharacter(faintRepos(needed)).classId, 'warrior');
  });

  it('the voter boundary: one repo is never enough, two strong repos are', () => {
    const strong = (name: string) => provingRepo(name, 'csharp', { pushedWeek: AS_OF, commits: 10_000 });
    assert.equal(classifyCharacter(snapshot([strong('a')])).classId, 'adventurer');
    assert.equal(classifyCharacter(snapshot([strong('a'), strong('b')])).classId, 'warrior');
  });
});

describe('classifyCharacter: evidence', () => {
  it('class signals: primary domain only, at most signals.domain, ranked by points then name, with reasons', () => {
    const many = snapshot(['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((name, i) => provingRepo(name, 'csharp', { ...same, commits: i })));
    const profile = classifyCharacter(many);
    assert.equal(profile.signals.length, classRules.signals.domain);
    assert.ok(profile.signals.every((s) => s.domain === 'backend' && s.reason.length > 0));
    for (let i = 1; i < profile.signals.length; i++) assert.ok(profile.signals[i - 1].points >= profile.signals[i].points);
    const tied = classifyCharacter(snapshot(['b', 'a', 'c'].map((name) => provingRepo(name, 'csharp', same))));
    assert.deepEqual(tied.signals.map((s) => s.repo), ['a', 'b', 'c']);
  });

  it('job signals: at most signals.job, only repos proving the chosen job', () => {
    const profile = classifyCharacter(snapshot([
      ...['a', 'b', 'c'].map((name) => provingRepo(name, 'java', same)), provingRepo('d', 'csharp', faint),
    ]));
    assert.equal(profile.jobId, 'paladin');
    assert.equal(profile.jobSignals.length, classRules.signals.job);
    assert.ok(profile.jobSignals.every((s) => s.repo !== 'd' && /Java/.test(s.reason)));
  });

  it('signals use `domain`; the old archetype / secondary fields are gone', () => {
    const profile = classifyCharacter(hybridStack());
    for (const signal of [...profile.signals, ...profile.jobSignals]) {
      assert.ok('domain' in signal && !('archetype' in signal));
    }
    assert.ok(!('secondary' in profile));
  });
});

describe('classifyCharacter: purity and caps', () => {
  it('is a pure function of the snapshot: the clock never matters, asOf does', () => {
    const before = classifyCharacter(hybridStack());
    mock.timers.enable({ apis: ['Date'], now: Date.parse('2040-01-01T00:00:00Z') });
    try {
      assert.deepEqual(classifyCharacter(hybridStack()), before);
    } finally {
      mock.timers.reset();
    }
    assert.notDeepEqual(classifyCharacter(snapshot(hybridStack().repos, '2036-10-13')).scores, before.scores);
  });

  it('a monolith adds at most 1 x (1 + max activity) to a score, however big', () => {
    const profile = classifyCharacter(snapshot([
      lang('monolith', 'Java', 50_000, { commits: 5000, pushedWeek: AS_OF }), provingRepo('x', 'csharp', { commits: 0, pushedWeek: AS_OF }),
    ]));
    assert.ok(profile.scores.backend <= 2 + classRules.activity.max + 1e-9);
  });
});
