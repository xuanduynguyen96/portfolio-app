import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evidenceSchema, httpsUrl, metricSchema, questOverrideSchema, skillNodeSchema } from '../../src/data/career-schemas.ts';

const ok = (result: { success: boolean }) => assert.equal(result.success, true);
const rejects = (result: { success: boolean; error?: { issues: { message: string }[] } }, message: RegExp) => {
  assert.equal(result.success, false);
  assert.match(result.error?.issues.map((issue) => issue.message).join('; ') ?? '', message);
};

describe('career schemas', () => {
  it('httpsUrl accepts https and rejects other schemes and credentials', () => {
    ok(httpsUrl.safeParse('https://github.com/u/repo'));
    rejects(httpsUrl.safeParse('http://github.com/u'), /https/);
    rejects(httpsUrl.safeParse('javascript:alert(1)'), /https/);
    rejects(httpsUrl.safeParse('https://user:pw@github.com/u'), /credentials/);
  });

  it('strict objects reject hand-set xp/level and legacy keys', () => {
    rejects(skillNodeSchema.safeParse({ id: 'ts', label: 'TS', attribute: 'code-efficiency', xp: 9000 }), /Unrecognized key/);
    rejects(skillNodeSchema.safeParse({ id: 'ts', label: 'TS', attribute: 'code-efficiency', level: 3 }), /Unrecognized key/);
    rejects(evidenceSchema.safeParse({ type: 'repo', url: 'https://a.dev', verified: true }), /Unrecognized key/);
    rejects(metricSchema.safeParse({ label: 'Users', value: 10, xp: 1 }), /Unrecognized key/);
  });

  it('skill nodes need a kebab id and a known attribute; evidence is derived, never hand-set', () => {
    ok(skillNodeSchema.safeParse({ id: 'web-animations', label: 'Web Animations', attribute: 'ui-polish' }));
    rejects(skillNodeSchema.safeParse({ id: 'ts', label: 'TS', attribute: 'code-efficiency', evidence: ['https://a.dev'] }), /Unrecognized key/);
    rejects(skillNodeSchema.safeParse({ id: 'Web_Animations', label: 'x', attribute: 'ui-polish' }), /kebab-case/);
    assert.equal(skillNodeSchema.safeParse({ id: 'x', label: 'x', attribute: 'charisma' }).success, false);
  });

  it('metrics must be finite numbers', () => {
    ok(metricSchema.safeParse({ label: 'Faster', value: 40, unit: '%' }));
    assert.equal(metricSchema.safeParse({ label: 'Faster', value: Infinity }).success, false);
    assert.equal(metricSchema.safeParse({ label: 'Faster', value: '40' }).success, false);
  });

  it('skill match: known rule keys, lowercase keywords, at least one rule', () => {
    ok(skillNodeSchema.safeParse({ id: 'ts', label: 'TS', attribute: 'code-efficiency', match: { languages: ['TypeScript'], workflows: true } }));
    rejects(skillNodeSchema.safeParse({ id: 'ts', label: 'TS', attribute: 'code-efficiency', match: {} }), /at least one rule/);
    rejects(skillNodeSchema.safeParse({ id: 'ts', label: 'TS', attribute: 'code-efficiency', match: { keywords: ['Spring Boot'] } }), /lowercase/);
    rejects(skillNodeSchema.safeParse({ id: 'ts', label: 'TS', attribute: 'code-efficiency', match: { stars: 5 } }), /Unrecognized key/);
  });

  it('overrides: everything optional; derived keys (difficulty, skills, evidence, xp, repoUrl) are rejected', () => {
    const parsed = questOverrideSchema.parse({});
    assert.deepEqual({ isBoss: parsed.isBoss, obstacles: parsed.obstacles, metrics: parsed.metrics }, { isBoss: false, obstacles: [], metrics: [] });
    for (const key of ['difficulty', 'skills', 'evidence', 'xp', 'level', 'repoUrl', 'demoUrl']) {
      rejects(questOverrideSchema.safeParse({ [key]: 'x' }), /Unrecognized key/);
    }
    rejects(questOverrideSchema.safeParse({ summary: 'x'.repeat(161) }), /160|too_big|Too big/i);
  });
});
