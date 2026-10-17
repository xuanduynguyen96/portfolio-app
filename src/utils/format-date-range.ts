const formatter = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** "2023-04" -> "Apr 2023" */
function formatYearMonth(value: string): string {
  return formatter.format(new Date(`${value}-01T00:00:00Z`));
}

/** Human-readable range, e.g. "Apr 2023 — Present". */
export function formatDateRange(start: string, end: string | null): string {
  return `${formatYearMonth(start)} — ${end ? formatYearMonth(end) : 'Present'}`;
}

const entryFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' });

/** "Oct 17, 2026" in UTC, so output never depends on the build machine's time zone. */
export function formatEntryDate(date: Date): string {
  return entryFormatter.format(date);
}
