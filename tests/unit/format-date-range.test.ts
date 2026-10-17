import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatDateRange, formatEntryDate } from '../../src/utils/format-date-range.ts';

describe('format-date-range', () => {
  it('formats a range with an open end', () => {
    assert.equal(formatDateRange('2023-04', null), 'Apr 2023 — Present');
    assert.equal(formatDateRange('2021-01', '2023-03'), 'Jan 2021 — Mar 2023');
  });

  it('formats entry dates in UTC regardless of time of day', () => {
    assert.equal(formatEntryDate(new Date('2026-10-17T00:00:00Z')), 'Oct 17, 2026');
    assert.equal(formatEntryDate(new Date('2026-10-17T23:59:59Z')), 'Oct 17, 2026');
  });
});
