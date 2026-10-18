# Researcher-01: GitHub-derived RPG class/gear, build-time snapshot

## STATUS: DEGRADED, UNVERIFIED
- 2/2 WebFetch calls to docs.github.com failed: `getaddrinfo ENOTFOUND docs.github.com`. Live docs NOT read.
- Tool budget (5) exhausted. No WebSearch done. No prior-art repos fetched.
- All claims below = model knowledge, tagged [K]. Verify before implementation.
- Possible cause: outbound HTTPS needs the agent proxy (`$HTTPS_PROXY`, `/root/.ccr/README.md`). Not checked.
- Highest-priority verifications: (a) GraphQL point cost + GITHUB_TOKEN limits, (b) GITHUB_TOKEN reads `user(login)` contributions, (c) scheduled-workflow auto-disable rule.

## 1. Executive summary
- 2-4 GraphQL requests per build/refresh. Cost est. well under 5,000-point/hr budget [K].
- Token: GITHUB_TOKEN likely sufficient for public data [K]. PAT with zero permissions = fallback.
- Snapshot: committed JSON = source of truth. Build + tests read only the snapshot. Scheduled job refreshes it.
- Classify on owned non-fork repos + contribution counts + hygiene file presence. Language bytes = minor, capped, filtered.

Confidence: query shape [K, high]. Token scope [K, medium]. Rate-limit numbers [K, medium]. Linguist exclusions [K, high]. Prior art [none].

## 2. GraphQL query shape [K]

```graphql
query Profile($login: String!, $after: String, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    login createdAt
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes { ... on Repository { nameWithOwner } }
    }
    repositories(first: 50, after: $after, ownerAffiliations: OWNER,
                 isFork: false, orderBy: {field: PUSHED_AT, direction: DESC}) {
      totalCount
      pageInfo { hasNextPage endCursor }
      nodes {
        nameWithOwner description url isArchived isFork isPrivate
        pushedAt stargazerCount
        primaryLanguage { name }
        repositoryTopics(first: 20) { nodes { topic { name } } }
        languages(first: 20, orderBy: {field: SIZE, direction: DESC}) {
          totalSize edges { size node { name } }
        }
        security: object(expression: "HEAD:SECURITY.md") { __typename }
        dependabot: object(expression: "HEAD:.github/dependabot.yml") { __typename }
        workflows: object(expression: "HEAD:.github/workflows") {
          ... on Tree { entries { name } }
        }
        tests: object(expression: "HEAD:tests") { __typename }
        testsAlt: object(expression: "HEAD:test") { __typename }
      }
    }
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions totalPullRequestContributions
      totalIssueContributions totalPullRequestReviewContributions
      restrictedContributionsCount
      contributionCalendar { totalContributions }
      commitContributionsByRepository(maxRepositories: 100) {
        repository { nameWithOwner isFork owner { login } primaryLanguage { name } }
        contributions(first: 1) { totalCount }
      }
    }
  }
}
```

Notes:
- `isFork: false` filter on `repositories` [K]. Still verify `isFork` field in the response.
- `object(expression:)` aliases = 1 per file per repo. Multiplies node count, still far under 500k cap [K].
- `commitContributionsByRepository` includes repos owned by OTHERS (external contribs) [K]. Default `maxRepositories` 25, max 100 [K].
- Contribution counts: default branch commits only [K]. Private contribs appear only if owner opted in [K]. Otherwise `restrictedContributionsCount`.
- `contributionsCollection` range max 1 year [K]. For full history, loop 1-year windows from `createdAt` to now. Total = 1 request per window.
- Pagination: `repositories` cursor. Max `first` = 100 [K]. Use 50 to keep cost low.
- `languages.size` = bytes, linguist-based [K]. `totalSize` for normalization.
- Cost [K]: points roughly scale with requested connection sizes / 100. Typical profile query ~1-10 points. Verify with `rateLimit { cost remaining resetAt }` field: include it in the query, log it.
- Secondary limits [K]: avoid parallel requests; serialize.

## 3. Token [K]
- GITHUB_TOKEN (Actions installation token): expected to read public `user(login:)`, public repos, public contribution totals. No scopes needed for public data [K, verify]. Private/restricted contribs absent (fine).
- Fine-grained PAT: "Public Access" read-only, no repo permissions needed for public data [K]. Use only if GITHUB_TOKEN fails on the `user` query.
- Classic PAT: no scope needed for public data [K]. Avoid: broad scope = security liability.
- Rate limit: GITHUB_TOKEN has separate, lower per-repo budget [K, uncertain]. PAT: 5,000 pts/hr [K].
- Scheduled workflows (`on: schedule`): run on default branch, GITHUB_TOKEN + secrets available [K]. Public repos: schedules auto-disabled after ~60 days without repo activity [K, verify; unclear if bot commits count].
- Fork PRs: secrets withheld, GITHUB_TOKEN read-only [K]. Build fetch step must degrade to snapshot there.
- Fallback (recommended, mandatory):
  - Fetch step: `if [ -z "${GH_TOKEN:-}" ]; then echo "warn: no token, using snapshot"; exit 0; fi`
  - On HTTP error, GraphQL `errors` with partial data, or rate-limit: keep committed snapshot, warn, exit 0.
  - Token only in `env:` of fetch step. Never echoed. Never in build step.

## 4. Snapshot strategy
| Option | Deterministic | Offline tests | Diff/noise | Cost | Verdict |
|---|---|---|---|---|---|
| Committed JSON | yes | yes | review-friendly, noisy if unfiltered | 0 | RECOMMENDED |
| Actions cache | no (eviction, keyed) | no | none in git | low | reject as source of truth [K: evicted after 7 days unused] |
| Fetch each build | no (live drift, rate limits, flaky) | no | none | API per build | reject for build; ok only as refresh path |

Recommended design [K]:
1. `data/github-snapshot.json` committed. Normalized: sorted keys, sorted arrays by `nameWithOwner`, no `fetchedAt` in committed file (sidecar or omit).
2. Refresh workflow: `on: schedule` weekly + `workflow_dispatch`. Steps: fetch → normalize → compare to committed file → commit ONLY if bytes differ → push. Commit message: `chore(data): refresh github snapshot`.
3. `[skip ci]`: DON'T use. Data change should trigger Pages rebuild. Loop-safe: build step never commits.
4. Build + dev + tests read only the snapshot. Classification = pure function(snapshot, config). Tests use copy of snapshot as fixture.
5. Noise control: weekly cadence → max ~1 data commit/week. Contribution calendar churn is daily, so weekly refresh is the noise cap.

## 5. Classification heuristics and prior art

### Prior art
- github-readme-stats [K]: language card sums `size` bytes over owned non-fork repos; has hidden/ignored language lists. Rank formula = weighted, capped, log/CDF-like scoring of stars, commits, PRs, issues, contributed-to. Useful model for "stat → level" mapping. Source: https://github.com/anuraghazra/github-readme-stats (unverified this session).
- linguist [K]: vendored/generated/documentation paths excluded by built-in `vendor.yml`/`generated` rules and `.gitattributes` overrides (`linguist-vendored`, `linguist-generated`, `linguist-documentation`, `linguist-language`). Source: https://github.com/github-linguist/linguist (unverified this session).
- "GitHub RPG character / class" projects: NOT searched. Unknown. Search terms for follow-up: "github rpg character", "github wrapped", "github readme stats rank".

### Pitfalls
| Pitfall | Effect | Mitigation |
|---|---|---|
| Bytes-by-language | one big generated/data/CSS file dominates | count repos per language (primaryLanguage), cap bytes (e.g., min(bytes, X) or log) |
| Forks | not owner's code | `isFork: false`; never count fork bytes |
| Vendored code | linguist mostly excludes; lockfiles/minified bundles may leak | trust linguist; exclude `*.min.js`, `dist/`, lockfiles in own filter if needed |
| Jupyter notebooks | `.ipynb` bytes include embedded outputs (images, base64) → inflated | cap or exclude Jupyter from bytes; use repo count |
| Generated files | inflate bytes | linguist-generated; default branch only |
| Markdown/docs | prose may skew "languages" | verify whether linguist language list includes prose (unverified) |
| Bulk imports/squashes | commit count inflated | cap per-day/per-repo; use PRs/reviews as separate axes |
| Archived repos | stale signal | weight lower, do not exclude |
| Topics | self-declared, sparse | secondary only |
| Hygiene files (SECURITY.md, dependabot, workflows, tests) | presence-only, cheap, objective | use as "hygiene" axis, binary/count |

### Suggested axes → class (deterministic, config-driven)
- Primary class: from distinct-repos-per-language (repo count, not bytes) + contribution mix (commits vs PRs vs reviews vs issues). Thresholds in `config` JSON.
- Gear tier: from hygiene count (SECURITY/dependabot/workflows/tests) + stars + pinned count.
- Level/rank: log-scaled totals (commits, stars, repos), capped.
- All thresholds in config, golden-file tests on snapshot fixtures. No network in tests.

## 6. Ranked recommendations
1. Committed snapshot + weekly refresh workflow (`workflow_dispatch` too). Build/tests read snapshot only. Rationale: deterministic, offline, reviewable. Trade-off: data commits trigger Pages rebuilds (acceptable).
2. Single `user(login:)` query, paged repos (50), 1-year `contributionsCollection` windows. Rationale: ~2-4 requests, cheap. Trade-off: full history needs N windows.
3. GITHUB_TOKEN first, zero-permission PAT fallback. Rationale: no long-lived secret if GITHUB_TOKEN works. Trade-off: GITHUB_TOKEN quota unclear; verify.
4. Repo-count-based language signal, bytes capped, forks/notebooks/prose excluded. Rationale: resists bytes bias. Trade-off: loses nuance.
5. Hygiene file presence as gear axis. Rationale: objective, cheap. Trade-off: presence ≠ quality.

## 7. Minimal working example (fetch wrapper sketch)
```bash
if [ -z "${GH_TOKEN:-}" ]; then echo "warn: no token; keep snapshot"; exit 0; fi
gh api graphql -F login=xuanduynguyen96 -f query="$(cat scripts/profile.graphql)" > /tmp/raw.json \
  || { echo "warn: fetch failed; keep snapshot"; exit 0; }
# normalize -> data/github-snapshot.json ; commit only if changed
```
Use the scratchpad dir for temp output in practice, not /tmp.

## 8. Sources (ALL UNFETCHED, model knowledge, dates unknown)
- https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api
- https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication
- https://docs.github.com/en/graphql/reference/objects (User.contributionsCollection, Repository.languages, object())
- https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows (schedule)
- https://github.com/github-linguist/linguist
- https://github.com/anuraghazra/github-readme-stats
- https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows (eviction)

Credibility: all tier-1 (official) by URL, but unverified in this session. Treat as leads, not findings.

## 9. Unresolved questions
- Exact point cost and GITHUB_TOKEN GraphQL quota: verify with one live `rateLimit` call.
- Does GITHUB_TOKEN return public `contributionsCollection` for another user? Verify.
- Do bot commits count as "activity" for the 60-day scheduled-workflow disable? Verify.
- Does linguist `languages` include prose/Markdown? Verify on one repo.
- Prior-art "GitHub RPG" projects: not searched.
- Network: docs.github.com unreachable from sandbox. Proxy route needed? Check `/root/.ccr/README.md`.
- Class/gear thresholds: product decision, not research.
