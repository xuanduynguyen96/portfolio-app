/** Σ sortDesc(values)[i] * decay^i, clamped to cap: the Nth entry is worth less than the first. */
export function decayedSum(values: readonly number[], decay: number, cap: number): number {
  const total = [...values]
    .sort((a, b) => b - a)
    .reduce((sum, value, index) => sum + value * decay ** index, 0);
  return Math.min(cap, total);
}

/**
 * Canonical form used to dedupe evidence site-wide: https only, lowercase host,
 * no hash, no utm_* params, no trailing slash. Returns null when not a valid https URL.
 */
export function normalizeEvidenceUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname) return null;
  for (const key of [...parsed.searchParams.keys()]) {
    if (key.toLowerCase().startsWith('utm_')) parsed.searchParams.delete(key);
  }
  const path = parsed.pathname.replace(/\/+$/, '');
  return `${parsed.origin}${path}${parsed.search}`;
}

/** Normalized, de-duplicated URLs (invalid ones dropped), in first-seen order. */
export function uniqueEvidenceUrls(urls: readonly string[]): string[] {
  const normalized = urls.map(normalizeEvidenceUrl).filter((url): url is string => url !== null);
  return [...new Set(normalized)];
}
