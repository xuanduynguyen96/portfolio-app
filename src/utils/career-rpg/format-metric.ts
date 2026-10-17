import type { Metric } from './career-types.ts';

const formatter = new Intl.NumberFormat('en', { maximumFractionDigits: 2 });

/** "62%", "45 ms", "1,200": percent sticks to the number, other units get a space. */
export function formatMetricValue({ value, unit }: Pick<Metric, 'value' | 'unit'>): string {
  const number = formatter.format(value);
  if (!unit) return number;
  return unit === '%' ? `${number}%` : `${number} ${unit}`;
}
