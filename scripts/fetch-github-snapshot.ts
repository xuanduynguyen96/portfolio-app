// Refreshes src/data/github/github-snapshot.json from the GitHub GraphQL API.
// Never fails the job: no token, network/API errors keep the committed file (warning, exit 0).
// Writes only when the normalized text changed; reports `changed=true|false` to $GITHUB_OUTPUT.
// No schema check here (no npm deps in this step): the refresh workflow validates before committing;
// after a local `npm run snapshot:fetch`, run `npm run test:unit` before committing.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { GITHUB_LOGIN } from '../src/data/github/github-login.ts';
import { normalizeSnapshot, serializeSnapshot } from '../src/utils/github-character/normalize-snapshot.ts';
import { fetchWithFallback } from './github-snapshot/fetch-github-data.ts';

const SNAPSHOT_PATH = new URL('../src/data/github/github-snapshot.json', import.meta.url);

/** One line, no workflow-command injection from API error text. */
const warn = (message: string) => console.log(`::warning::${message.replace(/[\r\n%]+/g, ' ')}`);
const output = (changed: boolean) => {
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
};

async function main() {
  const tokens = [
    { label: 'GITHUB_TOKEN', value: process.env.GITHUB_TOKEN ?? '' },
    { label: 'GH_SNAPSHOT_PAT', value: process.env.GH_SNAPSHOT_PAT ?? '' },
  ].filter((token) => token.value);
  if (tokens.length === 0) {
    warn('No GitHub token: keeping the committed snapshot.');
    return output(false);
  }

  const now = new Date();
  const { raw } = await fetchWithFallback(tokens, GITHUB_LOGIN, now, (message) => console.log(message));
  const next = serializeSnapshot(normalizeSnapshot(raw, now));
  let current = '';
  try {
    current = readFileSync(SNAPSHOT_PATH, 'utf8');
  } catch {
    // first run: no snapshot yet
  }
  if (next === current) {
    console.log('Snapshot unchanged.');
    return output(false);
  }
  writeFileSync(SNAPSHOT_PATH, next);
  console.log('Snapshot updated.');
  output(true);
}

main().catch((error: unknown) => {
  warn(`Snapshot refresh skipped, committed file kept: ${error instanceof Error ? error.message : String(error)}`);
  output(false);
});
