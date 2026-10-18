# Phase 01: GitHub fetcher, normalized snapshot, refresh workflow

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 00 (verified query + token) · Blocks: 02, 03
- Inputs: [researcher-01 §2-4](research/researcher-01-report.md), [spike report](reports/02-spike-results-report.md)
- Docs: `docs/deployment-guide.md`, `docs/system-architecture.md#cicd`, `docs/code-standards.md#career-rpg-modules-srcutilscareer-rpg`

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: M (5h) · Implementation: Not started · Review: Not started
- Fetch script (GraphQL) → pure normalizer → committed `src/data/github/github-snapshot.json`. Separate weekly refresh workflow commits only on change, then dispatches deploy. Deploy workflow stays `contents: read`, never fetches.

## Key Insights
- Commits pushed with GITHUB_TOKEN do **not** trigger `push` workflows; `workflow_dispatch` via `gh workflow run` is allowed → refresh dispatches deploy explicitly (needs `actions: write`). Verified in 00 (V8).
- Deploy's weekly cron (streak freshness) moves into refresh: refresh always dispatches deploy, changed or not → one weekly build.
- Volatility sources: `pushedAt` of portfolio-app changes on every commit (incl. bot's own) → store ISO-week dates only; language bytes → KiB floor; calendar → ISO-week totals. `asOf` = Monday of fetch week → re-runs in same week with same data = byte-identical.
- No `npm ci` in refresh job: fetch path = Node built-ins + own pure TS → no third-party code runs while a write token exists.
- Normalizer lives in `src/utils/github-character/` (pure, unit-tested with fixtures); the script is thin I/O.

## Requirements
- Functional: fetch owner (`siteConfig` GitHub login, constant `GITHUB_LOGIN` in `src/data/github/github-login.ts`); public, non-fork, owned repos; pinned; contributions per 1-year window since account creation; root + `.github/workflows` entries per repo.
- Token order: `GITHUB_TOKEN` → on auth/permission error and `GH_SNAPSHOT_PAT` set → retry with PAT. No token / HTTP error / GraphQL `errors` / schema mismatch → `::warning::`, keep file, exit 0.
- Writes file only if serialized output differs. Output: 2-space JSON, fixed key order, trailing newline.
- Privacy: `privacy: PUBLIC` in query **and** normalizer drops `isPrivate: true` (defense in depth, tested).
- Non-functional: files <200 lines; script runs via `node scripts/fetch-github-snapshot.ts` (type stripping).

## Architecture
```ts
// src/utils/github-character/github-snapshot-types.ts
export interface GithubSnapshot {
  schemaVersion: 1;
  login: string;
  asOf: string;               // YYYY-MM-DD, Monday (UTC) of fetch week
  accountCreated: string;     // YYYY-MM-DD
  pinned: string[];           // public repo names, pin order
  repos: SnapshotRepo[];      // sorted by name (case-insensitive)
  activity: {
    weeks: { start: string; count: number }[];  // ISO weeks, ascending, zero weeks omitted
    totals: { commits: number; pullRequests: number; reviews: number; issues: number };
  };
}
export interface SnapshotRepo {
  name: string; url: string; description: string | null; homepage: string | null;
  createdWeek: string; pushedWeek: string; isArchived: boolean; stars: number;
  primaryLanguage: string | null;
  languages: { name: string; kib: number }[];    // kib desc, then name; kib >= 1
  topics: string[];                               // sorted
  license: string | null;                         // SPDX id
  rootEntries: string[];                          // sorted, max 60 names
  workflowFiles: string[];                        // sorted
  commits: number;                                // owner commit contributions, all windows
}
```
```
refresh-github-snapshot.yml (cron '47 2 * * 1' + workflow_dispatch input `dry_run_no_token: boolean`; permissions contents: write, actions: write; concurrency group)
  checkout(master) → setup-node(.nvmrc) → node scripts/fetch-github-snapshot.ts [env GITHUB_TOKEN, GH_SNAPSHOT_PAT]
  → git add snapshot; git diff --cached --quiet || (commit "chore(data): refresh github snapshot" && push)
  → gh workflow run deploy-to-github-pages.yml --ref master   [env GH_TOKEN: github.token]
```

## Related Code Files
Create:
- `/home/user/portfolio-app/src/utils/github-character/github-snapshot-types.ts`
- `/home/user/portfolio-app/src/utils/github-character/normalize-snapshot.ts` (raw GraphQL pages → `GithubSnapshot`; ISO-week helpers reuse `weekStartUtc` from `career-rpg/consistency-streak.ts`)
- `/home/user/portfolio-app/src/data/github/github-login.ts`, `/home/user/portfolio-app/src/data/github/github-snapshot-schema.ts` (zod strict, used by loader + tests)
- `/home/user/portfolio-app/src/data/github/github-snapshot.json` (seed from 00 artifact via normalizer)
- `/home/user/portfolio-app/scripts/fetch-github-snapshot.ts` (CLI: env, token order, write-if-changed)
- `/home/user/portfolio-app/scripts/github-snapshot/github-graphql-queries.ts`, `/home/user/portfolio-app/scripts/github-snapshot/post-github-graphql.ts` (fetch + 20s timeout, typed error)
- `/home/user/portfolio-app/.github/workflows/refresh-github-snapshot.yml`
- `/home/user/portfolio-app/.gitattributes` (`.claude/** linguist-vendored`, `plans/** linguist-documentation`, `docs/** linguist-documentation`)
- `/home/user/portfolio-app/tests/unit/normalize-snapshot.test.ts`, `/home/user/portfolio-app/tests/unit/github-snapshot-schema.test.ts`, `/home/user/portfolio-app/tests/unit/fixtures/github-raw-owner-like.json`
Modify:
- `/home/user/portfolio-app/.github/workflows/deploy-to-github-pages.yml` (drop `schedule`; header comment: refresh dispatches)
- `/home/user/portfolio-app/package.json` (`"snapshot:fetch": "node scripts/fetch-github-snapshot.ts"`)
- `/home/user/portfolio-app/src/data/site-config.ts` (GitHub social href built from `GITHUB_LOGIN`, DRY)

## Implementation Steps
1. Types + zod schema (strict; `schemaVersion` literal 1; date regex; arrays bounded).
2. `normalize-snapshot.ts`: `normalizeSnapshot(raw: RawGithubPages, fetchedAt: Date): GithubSnapshot`. Filter `isFork || isPrivate`; https-only url/homepage (else null); trim description to 200 chars; languages → KiB floor, drop 0; per-day calendar → ISO-week sums (Sunday-start safe); sum commits per repo across windows (only repos in public list); sort everything; build object in fixed key order.
3. `serializeSnapshot(s) = JSON.stringify(s, null, 2) + '\n'`; script compares with file text.
4. Queries: repos page (first 50, cursor loop, `privacy: PUBLIC`, `ownerAffiliations: OWNER`, `isFork: false`) with `root: object(expression:"HEAD:")` and `wf: object(expression:"HEAD:.github/workflows")`; contributions query per year window (serialized, never parallel); log `rateLimit.cost`.
5. Script: `main()` try/catch around everything; exit codes: 0 always except normalizer-produced snapshot failing schema (warn + exit 0 too; never write invalid).
6. Workflow per Architecture. Pin actions at current majors (`actions/checkout@v5`, `actions/setup-node@v5`); `timeout-minutes: 5`; token only in fetch step env; commit as `github-actions[bot]`.
7. Run normalizer on 00 artifact → commit seed snapshot (public data only, review diff manually).
8. Tests: fixture (owner-like: 1 private, 1 fork, 1 null-language, notebook repo, Sunday-start calendar) → assert private/fork removed, sort order, ISO weeks, KiB rounding, idempotence (`normalize(raw)` twice equal; same week different day → same output), schema accepts output, rejects extra keys.
9. After merge (06): run `workflow_dispatch` twice (expect change then no-change), once with token unset via input flag `dry_run_no_token` (expect warn, exit 0).

## Todo List
- [ ] types + zod schema
- [ ] normalizer + serializer + tests
- [ ] queries + post helper + fetch script
- [ ] `.gitattributes` linguist overrides
- [ ] refresh workflow; deploy cron removed
- [ ] seed snapshot committed (reviewed: no private data)
- [ ] check + unit + e2e green

## Success Criteria
- `npm run test:unit` covers normalizer (>=8 cases); same input → byte-identical output
- Snapshot contains 0 private repos (test asserts on committed file too)
- Refresh run with no token: warning, exit 0, file unchanged

## Risk Assessment
- Branch protection blocks bot push → document ruleset bypass for `github-actions[bot]` or PR mode (Q7).
- Schedules auto-disable after 60 days of inactivity [unverified]; weekly bot commit likely keeps it alive; deployment-guide notes manual re-enable.
- Linguist re-index lag after `.gitattributes` → languages may stay stale until next push; acceptable.
- Large accounts: repo cap 300 (6 pages) + `rootEntries` cap keeps file small.

## Security Considerations
- Write token scope: job-level `contents: write` + `actions: write` only; no third-party code (no `npm ci`) in that job.
- PAT (if needed): fine-grained, public read-only, no repo permissions; stored as secret; never logged.
- Snapshot published in public repo → public data only; private filtered twice.
- Fork PRs: deploy verify reads committed snapshot; no secrets needed.

## Next Steps
- 02 consumes `GithubSnapshot`. Unresolved: PAT needed? (from 00); branch protection (Q7).
