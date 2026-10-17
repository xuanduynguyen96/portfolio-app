# Phase 06: Consistency Streak, Changelog Page, Scheduled Build

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [phase-02](phase-02-content-schema-extensions.md) (collection), [phase-01](phase-01-rules-config-scoring-utils-unit-tests.md) (`computeStreak`) · Parallel with: 03, 04, 05
- Docs: `docs/deployment-guide.md`, https://docs.github.com/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows#schedule

## Overview
- Date: 2026-10-17 · Priority: P1 · Effort: S · Implementation: Not started · Review: Not reviewed
- `/changelog/` page listing dated entries (newest first) with streak summary; weekly cron rebuild so streak decays/refreshes without a push. (Streak badge on home = phase 04.)

## Key Insights
- Streak computed vs build date => stale between builds. Weekly cron rebuild (Mon) keeps it honest: a missed week shows streak paused after next rebuild.
- `schedule` runs only on default branch; `github.ref` = `refs/heads/master` => existing `build`/`deploy` `if:` conditions already pass (`event_name` = `schedule`, not `pull_request`).
- GitHub disables scheduled workflows after 60 days without repo activity => document.
- Avoid :00 cron (GitHub load) => `17 3 * * 1` (Mon 03:17 UTC).
- e2e build uses fixed `CAREER_RPG_NOW`; deploy build (withastro/action) uses real date => tests stable, prod live.

## Requirements
- Functional: page h1 "Changelog"; streak summary (current, longest, last entry); entries as `<article>` with `<time datetime>` + summary h2 + rendered body; empty state text.
- Non-functional: no JS; reuses `BaseLayout`, `GlassCard`, `.prose` styles pattern; <200 lines.

## Architecture
```
src/pages/changelog.astro  -> getCollection('changelog') sorted date desc + loadCareerState().streak
  BaseLayout(title "Changelog | name") > article.container > header(h1, StreakBadge reuse from phase 04) > ol(reversed) > li > GlassCard as="article"
deploy-to-github-pages.yml: on.schedule: [{ cron: '17 3 * * 1' }]
```
Date format: `Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' })` — add `formatEntryDate` to `/home/user/portfolio-app/src/utils/format-date-range.ts` (existing date util, 11 lines) rather than new file.

## Related Code Files
Create:
- `/home/user/portfolio-app/src/pages/changelog.astro`
Modify:
- `/home/user/portfolio-app/src/utils/format-date-range.ts`: export `formatEntryDate(date)`
- `/home/user/portfolio-app/src/components/site-footer.astro`: link "Changelog" via `withBasePath('/changelog/')`
- `/home/user/portfolio-app/.github/workflows/deploy-to-github-pages.yml`: add `schedule`; update header comment
- `/home/user/portfolio-app/src/content/changelog/*.md`: placeholders already from phase 02

## Implementation Steps
1. `formatEntryDate` in `format-date-range.ts` (UTC, deterministic).
2. `changelog.astro`: render list; reuse `StreakBadge` (phase 04 owns component; if 04 not merged yet, import after it lands — only shared touchpoint).
3. Footer link (footer has no nav landmark; plain link ok).
4. Workflow: add
   ```yaml
   on:
     push: { branches: [master] }
     pull_request:
     workflow_dispatch:
     schedule:
       - cron: '17 3 * * 1' # weekly rebuild: refreshes build-date-based streak
   ```
   Concurrency group `pages-${{ github.ref }}`, `cancel-in-progress` false for schedule (already only true for PR). Verify job still runs before deploy (keeps quality gate).
5. Build; open `/changelog/`.

## Todo List
- [ ] formatEntryDate
- [ ] changelog.astro
- [ ] footer link
- [ ] workflow schedule
- [ ] build + view

## Success Criteria
- `/changelog/` lists 3 placeholder entries newest first, streak "3-week streak" with `CAREER_RPG_NOW=2026-10-17`.
- Workflow YAML valid (`gh workflow view` after push, or actionlint if available); schedule present.

## Risk Assessment
- Scheduled deploy of unreviewed state: it builds `master` only (already reviewed) => low.
- Cron disabled after inactivity => documented in deployment guide (phase 09).
- Future-dated entry breaks scheduled build => intended (clear error); author fixes date.

## Security Considerations
- No new permissions/secrets; schedule reuses existing least-privilege jobs (`contents: read`, deploy `pages: write`, `id-token: write`).

## Next Steps
- Phase 08: changelog e2e + axe; phase 09: deployment-guide cron notes.
