import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatMetricValue } from '../../src/utils/career-rpg/format-metric.ts';

describe('formatMetricValue', () => {
  it('attaches percent, spaces other units, groups thousands', () => {
    assert.equal(formatMetricValue({ value: 62, unit: '%' }), '62%');
    assert.equal(formatMetricValue({ value: 45, unit: 'ms' }), '45 ms');
    assert.equal(formatMetricValue({ value: 1200 }), '1,200');
  });

  it('rounds to two decimals and keeps zero and negatives', () => {
    assert.equal(formatMetricValue({ value: 99.987, unit: '%' }), '99.99%');
    assert.equal(formatMetricValue({ value: 0, unit: 'CLS' }), '0 CLS');
    assert.equal(formatMetricValue({ value: -3 }), '-3');
  });
});
