// SPIKE ONLY (branch spike/github-graphql, never merged). Verifies plan phase-00 claims V1-V7, V9.
// Writes raw public JSON to spike-output/ and a summary to $GITHUB_STEP_SUMMARY.
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';

const TOKEN = process.env.PROBE_TOKEN ?? '';
const LABEL = process.env.PROBE_LABEL ?? 'GITHUB_TOKEN';
const OWNER = 'xuanduynguyen96';
const COMPARE = (process.env.PROBE_LOGINS ?? 'mitchellh,jakevdp,sindresorhus').split(',');
const SKIP_OWNER = process.env.PROBE_SKIP_OWNER === '1';
const OUT = `spike-output/${LABEL.toLowerCase()}`;
const summary: string[] = [];
const log = (line: string) => { console.log(line); summary.push(line); };

async function gql(query: string, variables: Record<string, unknown>) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { authorization: `bearer ${TOKEN}`, 'content-type': 'application/json', 'user-agent': 'portfolio-spike' },
    body: JSON.stringify({ query, variables }),
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { json = { nonJson: text.slice(0, 500) }; }
  return { status: res.status, json };
}

const REPO_FIELDS = `
  name nameWithOwner description homepageUrl url isArchived isFork isPrivate createdAt pushedAt
  stargazerCount forkCount licenseInfo { spdxId }
  primaryLanguage { name }
  repositoryTopics(first: 20) { nodes { topic { name } } }
  languages(first: 20, orderBy: { field: SIZE, direction: DESC }) { totalSize edges { size node { name } } }
  defaultBranchRef { name target { ... on Commit { history { totalCount } } } }
  root: object(expression: "HEAD:") { ... on Tree { entries { name type } } }
  dotGithub: object(expression: "HEAD:.github") { ... on Tree { entries { name type } } }
  workflows: object(expression: "HEAD:.github/workflows") { ... on Tree { entries { name } } }
`;

const PROFILE = `query($login: String!, $after: String, $first: Int!) {
  rateLimit { cost remaining limit used resetAt }
  user(login: $login) {
    login createdAt
    pinnedItems(first: 6, types: REPOSITORY) { nodes { ... on Repository { nameWithOwner isPrivate } } }
    repositories(first: $first, after: $after, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC,
                 orderBy: { field: PUSHED_AT, direction: DESC }) {
      totalCount pageInfo { hasNextPage endCursor } nodes { ${REPO_FIELDS} }
    }
  }
}`;

const CONTRIB = `query($login: String!, $from: DateTime!, $to: DateTime!) {
  rateLimit { cost remaining limit used resetAt }
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions totalPullRequestContributions totalIssueContributions
      totalPullRequestReviewContributions restrictedContributionsCount hasAnyRestrictedContributions
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
      commitContributionsByRepository(maxRepositories: 100) {
        repository { nameWithOwner isPrivate isFork } contributions { totalCount }
      }
    }
  }
}`;

function years(createdAt: string, now: Date): { from: string; to: string }[] {
  const out: { from: string; to: string }[] = [];
  let to = now;
  const start = new Date(createdAt);
  while (to > start) {
    const from = new Date(to);
    from.setUTCFullYear(from.getUTCFullYear() - 1);
    from.setUTCSeconds(from.getUTCSeconds() + 1);
    out.push({ from: (from < start ? start : from).toISOString(), to: to.toISOString() });
    to = new Date(from.getTime() - 1000);
  }
  return out;
}

async function probe(login: string, allYears: boolean) {
  const raw: Record<string, unknown> = {};
  let p = await gql(PROFILE, { login, after: null, first: 50 });
  for (const first of [25, 10]) {
    if (p.status < 500) break;
    log(`- profile HTTP ${p.status} at larger page; retrying with first=${first}`);
    p = await gql(PROFILE, { login, after: null, first });
  }
  raw.profile = p;
  const user = p.json?.data?.user;
  log(`\n### ${login}\n- profile HTTP ${p.status}; errors: ${JSON.stringify(p.json?.errors ?? null)}`);
  log(`- rateLimit: ${JSON.stringify(p.json?.data?.rateLimit)}`);
  if (!user) { writeFileSync(`${OUT}/${login}.json`, JSON.stringify(raw, null, 2)); return; }
  const repos = user.repositories.nodes as any[];
  log(`- V1 repos: totalCount=${user.repositories.totalCount} page=${repos.length} hasNext=${user.repositories.pageInfo.hasNextPage}`);
  log(`- V6 private=${repos.filter((r) => r.isPrivate).length} forks=${repos.filter((r) => r.isFork).length}`);
  log(`- V7 pinned: ${JSON.stringify(user.pinnedItems.nodes)}`);
  const withRoot = repos.filter((r) => r.root?.entries).length;
  const withWf = repos.filter((r) => r.workflows?.entries).length;
  log(`- V4 root tree on ${withRoot}/${repos.length}; workflows dir on ${withWf}`);
  const md = repos.flatMap((r) => (r.languages?.edges ?? []).map((e: any) => e.node.name)).filter((n: string) => /markdown|text/i.test(n));
  log(`- V5 prose langs seen: ${JSON.stringify([...new Set(md)])}`);
  const now = new Date();
  const windows = allYears ? years(user.createdAt, now) : years(new Date(now.getTime() - 364 * 864e5).toISOString(), now);
  const contribs: unknown[] = [];
  for (const w of windows) {
    const c = await gql(CONTRIB, { login, ...w });
    contribs.push({ window: w, ...c });
    const cc = c.json?.data?.user?.contributionsCollection;
    const days = cc?.contributionCalendar?.weeks?.flatMap((wk: any) => wk.contributionDays) ?? [];
    log(`- V2 ${w.from.slice(0, 10)}..${w.to.slice(0, 10)} HTTP ${c.status} cost=${c.json?.data?.rateLimit?.cost} commits=${cc?.totalCommitContributions} cal=${cc?.contributionCalendar?.totalContributions} restricted=${cc?.restrictedContributionsCount} days=${days.length} firstDay=${days[0]?.date} byRepo=${cc?.commitContributionsByRepository?.length} privateByRepo=${cc?.commitContributionsByRepository?.filter((x: any) => x.repository.isPrivate).length} errors=${JSON.stringify(c.json?.errors ?? null)}`);
  }
  raw.contributions = contribs;
  if (login === OWNER) {
    const from = new Date(now); from.setUTCMonth(from.getUTCMonth() - 13);
    const v9 = await gql(CONTRIB, { login, from: from.toISOString(), to: now.toISOString() });
    log(`- V9 13-month window: HTTP ${v9.status} errors=${JSON.stringify(v9.json?.errors ?? null)}`);
    raw.v9 = v9;
  }
  writeFileSync(`${OUT}/${login}.json`, JSON.stringify(raw, null, 2));
}

mkdirSync(OUT, { recursive: true });
log(`## Probe with ${LABEL} (token present: ${TOKEN.length > 0})`);
if (TOKEN) {
  if (!SKIP_OWNER) await probe(OWNER, true);
  for (const login of COMPARE) await probe(login, false);
  const rl = await gql('{ rateLimit { cost remaining limit used resetAt } viewer { login } }', {});
  log(`\n- final rateLimit + viewer: HTTP ${rl.status} ${JSON.stringify(rl.json)}`);
}
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary.join('\n') + '\n');
