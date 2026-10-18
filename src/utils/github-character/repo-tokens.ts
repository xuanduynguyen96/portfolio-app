// Lowercase whole-word tokens of a repo's name, description and topics (for keyword rules).
import type { SnapshotRepo } from './github-snapshot-types.ts';

/** `QrCodeScanner` -> `qr code scanner`; `aspnet_framework_docker_ex` -> `aspnet framework docker ex`. */
export function splitName(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[-_.]+/g, ' ')
    .toLowerCase()
    .trim();
}

export function repoTokens(repo: Pick<SnapshotRepo, 'name' | 'description' | 'topics'>): Set<string> {
  const text = [splitName(repo.name), repo.description ?? '', ...repo.topics.map(splitName)].join(' ').toLowerCase();
  return new Set(text.split(/[^a-z0-9#+]+/).filter(Boolean));
}
