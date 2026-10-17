/** Whole seconds left of `totalSeconds` after `elapsedMs` (never negative). */
export function remainingSeconds(totalSeconds: number, elapsedMs: number): number {
  return Math.max(0, totalSeconds - Math.floor(Math.max(0, elapsedMs) / 1000));
}

/** "01:00" ... "00:01", then "GG" once time is up. */
export function formatClock(seconds: number): string {
  if (seconds <= 0) return 'GG';
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
