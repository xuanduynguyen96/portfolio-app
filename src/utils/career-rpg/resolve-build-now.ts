/**
 * Build date for streak/HUD. `CAREER_RPG_NOW=YYYY-MM-DD` pins it (reproduce a past build);
 * it means the end of that UTC day. Unset/empty => the real current time.
 */
export function resolveBuildNow(value: string | undefined, current: Date = new Date()): Date {
  if (value === undefined || value === '') return current;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`CAREER_RPG_NOW must be YYYY-MM-DD, got "${value}"`);
  const now = new Date(`${value}T23:59:59.999Z`);
  if (Number.isNaN(now.getTime()) || now.toISOString().slice(0, 10) !== value) {
    throw new Error(`CAREER_RPG_NOW is not a real date: "${value}"`);
  }
  return now;
}
