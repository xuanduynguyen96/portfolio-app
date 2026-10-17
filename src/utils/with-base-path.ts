/** Prefix an internal path with the configured Astro `base` (e.g. "/portfolio-app"). */
export function withBasePath(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
