import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evidenceSchema, httpsUrl, metricSchema, skillNodeSchema } from '../../src/data/career-schemas.ts';

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

  it('skill nodes need a kebab id and a known attribute; evidence defaults to []', () => {
    const parsed = skillNodeSchema.parse({ id: 'web-animations', label: 'Web Animations', attribute: 'ui-polish' });
    assert.deepEqual(parsed.evidence, []);
    rejects(skillNodeSchema.safeParse({ id: 'Web_Animations', label: 'x', attribute: 'ui-polish' }), /kebab-case/);
    assert.equal(skillNodeSchema.safeParse({ id: 'x', label: 'x', attribute: 'charisma' }).success, false);
  });

  it('metrics must be finite numbers', () => {
    ok(metricSchema.safeParse({ label: 'Faster', value: 40, unit: '%' }));
    assert.equal(metricSchema.safeParse({ label: 'Faster', value: Infinity }).success, false);
    assert.equal(metricSchema.safeParse({ label: 'Faster', value: '40' }).success, false);
  });
});
