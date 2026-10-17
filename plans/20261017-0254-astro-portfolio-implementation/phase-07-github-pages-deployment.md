# Phase 07: GitHub Pages Deployment

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [phase-06](phase-06-testing-and-verification.md)
- Docs: https://docs.astro.build/en/guides/deploy/github · https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## Overview
- Date: 2026-10-17 · Priority: P0 · Status: Done (code); pending user: enable Pages + push · Review: Code-reviewed + tester-validated
- Workflow: verify (check, build, e2e) on PRs + main; build + deploy to Pages on main only.

## Key Insights
- `withastro/action` = checkout-less build + upload Pages artifact. Needs `actions/checkout` first and a separate `deploy` job with `actions/deploy-pages`. (Corrects research snippet.)
- Custom Actions workflows bypass the 10 builds/hour soft limit; deploy timeout 10 min.
- Pages via Actions doesn't run Jekyll → no `.nojekyll` needed.
- Action versions drift → copy current majors from Astro docs at implementation time.
- **User actions required**: enable Pages (Source = GitHub Actions); approve push.

## Requirements
- Functional: push to `main` → site live at `https://xuanduynguyen96.github.io/portfolio-app/`; PRs run verify only.
- Non-functional: least-privilege permissions; concurrency prevents overlapping deploys; failing tests block deploy.

## Architecture
```
push main ──► verify ──► build (withastro/action) ──► deploy (actions/deploy-pages)
pull_request ──► verify
```

Workflow sketch (verify majors before committing):
```yaml
# .github/workflows/deploy-to-github-pages.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:
permissions:
  contents: read
concurrency:
  group: pages-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}  # never cancel a running main deploy
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with: { node-version-file: .nvmrc, cache: npm }
      - run: npm ci
      - run: npm run check
      - run: npx playwright install --with-deps chromium   # CI runner only, not local env
      - run: npm run test:e2e
  build:
    if: github.event_name != 'pull_request'
    needs: verify
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: withastro/action@v5
  deploy:
    if: github.event_name != 'pull_request'
    needs: build
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Related Code Files
Create:
- `/home/user/portfolio-app/.github/workflows/deploy-to-github-pages.yml`

## Implementation Steps
1. Fetch current Astro GitHub deploy guide; align action majors + inputs (node version input for `withastro/action`).
2. Write workflow (above), adjusted.
3. Validate YAML locally (`npx --yes yaml-lint` or careful review); `actionlint` if available.
4. Hand off to user: enable Settings → Pages → Source: GitHub Actions.
5. **Only on user request**: commit + push branch, open PR → verify job runs → merge to `main` → deploy.
6. Smoke-check live URL: assets load, nav works, 404 page served for unknown path.

## Todo List
- [x] Confirm action versions from docs (CI run still to confirm)
- [x] Write workflow (deploy restricted to `refs/heads/main`)
- [x] Lint workflow
- [ ] User enables Pages (Actions source) — **user action, required**
- [ ] (On request) push, PR, merge
- [ ] Live smoke check

## Success Criteria
- PR run: verify green.
- Main run: verify → build → deploy green; live URL serves site with correct base.
- Unknown URL shows custom 404.

## Risk Assessment
- Wrong `base` → blank/unstyled site → matches repo name; e2e already runs with base.
- Pages not enabled → deploy job fails "Not Found" → step 4 instruction.
- Default branch is `main` but repo also has `master` branch → confirm with user which is default; workflow targets `main`.
- Playwright install adds CI time (~1 min) → acceptable; within limits.

## Security Considerations
- Top-level `contents: read`; `pages: write` + `id-token: write` only on deploy job.
- Pin actions to major versions (or SHAs if user prefers stricter supply-chain posture).
- No secrets required.

## Next Steps
- Phase 08 documents deploy steps; optional custom domain later.
