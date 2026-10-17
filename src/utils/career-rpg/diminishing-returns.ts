/** Σ sortDesc(values)[i] * decay^i, clamped to cap: the Nth entry is worth less than the first. */
export function decayedSum(values: readonly number[], decay: number, cap: number): number {
  const total = [...values]
    .sort((a, b) => b - a)
    .reduce((sum, value, index) => sum + value * decay ** index, 0);
  return Math.min(cap, total);
}

/**
 * Canonical key used to dedupe evidence site-wide. Deliberately coarse (a false match only
 * costs XP, a miss lets one link be farmed): lowercase host + path, no `www.`/trailing dot,
 * no query, hash, `index.html` or trailing slash. Returns null when not a valid https URL.
 */
export function normalizeEvidenceUrl(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url.trim());
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname) return null;
  const host = parsed.hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
  const port = parsed.port ? `:${parsed.port}` : '';
  const path = parsed.pathname.toLowerCase().replace(/\/index\.html?$/, '').replace(/\/+$/, '');
  return `https://${host}${port}${path}`;
}

/** Normalized, de-duplicated URLs (invalid ones dropped), in first-seen order. */
export function uniqueEvidenceUrls(urls: readonly string[]): string[] {
  const normalized = urls.map(normalizeEvidenceUrl).filter((url): url is string => url !== null);
  return [...new Set(normalized)];
}
