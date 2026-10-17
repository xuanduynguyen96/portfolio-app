# Phase 00: Spike: live query verification, classifier dry-run, 3 class silhouettes

## Context Links
- Parent: [plan.md](plan.md) · Depends on: none · Blocks: 01, 02, 04
- Inputs: [researcher-01 §2-3, §9](research/researcher-01-report.md) (all [K] unverified), [researcher-02 §1, §5](research/researcher-02-report.md), [owner data](reports/01-owner-github-data-report.md)
- Docs: `docs/deployment-guide.md`, `.github/workflows/deploy-to-github-pages.yml`

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: M (4h) · Implementation: Done · Review: user gate pending
- Throwaway spike. Prove the data path works with GITHUB_TOKEN, measure cost, dry-run classifier on owner + 3 public profiles, prototype 3 class silhouettes. Output: `reports/02-spike-results-report.md`. No production code merged.

## Key Insights
- Verified 2026-10-17 from this session: `gh api graphql` → **HTTP 403 "GraphQL not available from Claude Code sessions"**; REST works but only for repos attached to the session. → GraphQL can only be verified inside GitHub Actions (or owner's machine).
- `workflow_dispatch` needs the workflow on the default branch; `push` triggers work on any branch → spike workflow triggers on push to `spike/github-graphql`.
- REST `portfolio-app/languages`: TypeScript 166 KB, **Python 127 KB** (`.claude/` skill scripts), Astro 77, JS 60, Shell 29, CSS 13. Tooling dirs pollute language signal.
- `portfolio-app`: no description, no topics, no license → sparse keyword signals; HUD checks become actionable.
- GitHub contribution calendar weeks start **Sunday**; streak uses ISO (Monday) weeks → aggregate per day.

## Requirements
- Verify each researcher-01 claim, record verified/refuted + evidence:

| # | Claim | How |
|---|---|---|
| V1 | GITHUB_TOKEN can query `user(login:)` public repos | run query, check `data.user.repositories` |
| V2 | GITHUB_TOKEN gets `contributionsCollection` + `contributionCalendar` (per-day) | non-null, totals > 0 |
| V3 | Point cost per query, remaining budget | `rateLimit { cost remaining limit resetAt }` |
| V4 | `object(expression:"HEAD:")` root Tree entries + `HEAD:.github/workflows` | entries listed |
| V5 | `languages` excludes prose (Markdown) | inspect a docs-heavy repo |
| V6 | `privacy: PUBLIC` arg + `isFork:false` filter | no private/fork in output |
| V7 | `pinnedItems` returns public pinned repos | list |
| V8 | `gh workflow run <file>` works with GITHUB_TOKEN + `actions: write` | dispatch a no-op workflow |
| V9 | Contribution windows: 1-year max per `contributionsCollection` | try 13-month range, expect error |

- Classifier dry-run on owner + 3 profiles with expected classes: one Go/Java (Warrior), one Python/Jupyter (Mage, e.g. `jakevdp`), one JS/TS (Archer, e.g. `sindresorhus`). Expected class must result without per-profile tuning.
- 3 silhouettes (Warrior, Mage, Archer) at tier 0 on 32x32, rendered 128/192/256 + 16x16 downsample, IoU computed.

## Architecture
```
branch spike/github-graphql (never merged)
  .github/workflows/spike-github-graphql.yml   on: push (spike/**), permissions: contents read, actions write
    step 1: node scripts/spike/probe-github-graphql.ts  env GITHUB_TOKEN  → $GITHUB_STEP_SUMMARY + raw JSON
    step 2: gh workflow run spike-noop.yml (V8)       → expect 204
    step 3: upload-artifact raw-*.json (retention-days: 1; public data only)
scratchpad (local): dry-run-classifier.ts reads artifact JSON; silhouette-sheet.html + iou.ts
```
Dry-run formula (prototype of phase 02, see there):
```ts
repoVote = min(1, Σ share(lang)·archetypeMap[lang] + Σ keywordHits) · recency(pushed, asOf) · activity(commits)
score[a] = Σ repoVote[a];  class = argmax; secondary if score2 >= 0.35·score1
```

## Related Code Files
Create (spike branch only, deleted after): `.github/workflows/spike-github-graphql.yml`, `.github/workflows/spike-noop.yml`, `scripts/spike/probe-github-graphql.ts`
Create (scratchpad, not committed): `dry-run-classifier.ts`, `silhouette-prototypes.ts`, `silhouette-sheet.html`
Create (plan dir): `/home/user/portfolio-app/plans/20261017-1617-github-derived-character-avatar/reports/02-spike-results-report.md`
Modify / Delete: none on feature branch

## Implementation Steps
1. Write `probe-github-graphql.ts` (Node 22, global `fetch`, no deps): POST `https://api.github.com/graphql`, query from researcher-01 §2 with `privacy: PUBLIC`, root Tree alias, `.github/workflows` alias, `pinnedItems`, `rateLimit`; then one `contributionsCollection` per year since `createdAt`; plus 13-month probe (V9). Print summary table; write raw JSON per login.
2. Run for logins: `xuanduynguyen96` + 3 comparison profiles (public data only; keep `repositories(first: 50)`).
3. Push branch `spike/github-graphql` (needs owner/agent push access); read job summary + artifact.
4. If V1/V2 fail: retry with fine-grained PAT (public read only) as secret `GH_SNAPSHOT_PAT`; record which token works.
5. Dry-run classifier in scratchpad on artifact JSON; print scores, class, secondary, top 5 signals per profile. Try 2 parameter sets (half-life 24 vs 48 months) and record owner outcome for both.
6. Draw 3 tier-0 silhouettes (shared base body, class headgear + weapon + torso mass, see phase 04 layout). Render sheet in both theme backgrounds; compute pairwise IoU at 32 and 16 (2x2 OR-pool).
7. Quick 3-person blind-ID on prototypes (128px, 2s). Decide 32x32 vs 24x32 (default 32x32).
8. Write report: verification table, cost numbers, owner dry-run, comparison profiles, IoU numbers, blind-ID result, decisions. Delete spike branch + workflows.
9. **Gate:** user reviews owner class result + prototypes before 02 locks rules and 04 authors all grids.

## Todo List
- [x] probe script + spike workflows on `spike/github-graphql`
- [x] V1-V9 recorded (GITHUB_TOKEN; PAT only if needed)
- [x] dry-run owner + 3 profiles, 2 param sets
- [x] 3 silhouette prototypes + IoU (32 and 16)
- [ ] mini blind-ID (3 people): moved to user gate
- [x] `reports/02-spike-results-report.md`
- [ ] spike branch deleted (local done; remote delete blocked by session proxy, owner deletes `spike/github-graphql` in GitHub UI); user gate passed

## Success Criteria
- Every V-claim marked verified/refuted with evidence; working token path known
- Point cost per refresh known (expect < 50 points)
- Comparison profiles land on expected class with one shared param set
- Silhouette cross-class IoU below candidate threshold (start 0.75 at 32, 0.8 at 16); >=2/3 blind-ID correct

## Risk Assessment
- GITHUB_TOKEN lacks access to `user` data → PAT fallback (documented in 01). If both fail → REST fallback (per-repo calls, no calendar) = scope change, ask user.
- No push access for spike branch → owner pushes it or runs probe locally with `GH_TOKEN=$(gh auth token)` (then V1/V2 not GITHUB_TOKEN-verified; note in report).
- Owner result contradicts self-image → expected; Q2 in plan.md, user decides.

## Security Considerations
- Token only in probe step `env`; never echoed; artifacts public-only, 1-day retention.
- Spike workflow `permissions` minimal; delete afterwards.
- Comparison profiles: public data, not committed, not published.

## Next Steps
- 01 uses verified query + token path; 02 uses dry-run params; 04 starts from prototype grids.
- Unresolved: comparison logins final pick; PAT needed?
