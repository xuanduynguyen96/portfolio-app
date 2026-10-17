# Deployment Guide

Target: GitHub Pages project site, `https://xuanduynguyen96.github.io/portfolio-app/`.

## One-time setup

1. Push repo to GitHub (`xuanduynguyen96/portfolio-app`), default branch `master`.
2. Repo Settings -> Pages -> Build and deployment -> Source: **GitHub Actions**.
3. Push to `master` (or run the workflow manually on `master`). First deploy creates the `github-pages` environment.

No secrets needed.

## Workflow

File: `.github/workflows/deploy-to-github-pages.yml`

| Job | Runs on | Does |
|-----|---------|------|
| `verify` | PR, push to `master`, manual, weekly schedule | `npm ci` -> `npm run check` -> `npm run test:unit` -> `npx playwright install --with-deps chromium` -> `npm run test:e2e`. Uploads `playwright-report/` (7 days) on failure |
| `build` | push to `master` or schedule on `master` (needs `verify`) | `withastro/action@v5` (Node 22) builds and uploads Pages artifact |
| `deploy` | after `build` | `actions/deploy-pages@v4` publishes; environment `github-pages` |

Triggers: `push` to `master`, `pull_request`, `workflow_dispatch`, and `schedule` cron `17 3 * * 1` (Mondays 03:17 UTC).

Why the schedule: the Career RPG consistency streak is computed from the **build date**, so a static site goes stale without rebuilds. The weekly run re-verifies, rebuilds and redeploys `master` (default branch). Caveat: GitHub pauses scheduled workflows after 60 days without repo activity; re-enable in the Actions tab (or push a commit) if the streak stops refreshing.

Safety:
- `build`/`deploy` have `if: github.ref == 'refs/heads/master' && github.event_name != 'pull_request'`, so a `workflow_dispatch` on a feature branch verifies only.
- Concurrency group `pages-<ref>`: superseded PR runs cancel; a `master` deploy is never cancelled.
- Permissions: top-level `contents: read`; only `deploy` gets `pages: write` + `id-token: write`.
- e2e retries once in CI (`retries: 1`); retried passes show as flaky in the report.

Action versions (`checkout@v5`, `setup-node@v5`, `upload-artifact@v4`, `withastro/action@v5`, `deploy-pages@v4`) could not be verified online when written. Confirm on the first run; bump if the run reports deprecations or missing tags.

## Local check before pushing

```bash
npm run check
npm run test:unit     # Career RPG rules, no build (Node >=22.18)
npm run test:e2e      # builds + previews + runs 56 tests
```

## Base path

`astro.config.mjs` sets `site: 'https://xuanduynguyen96.github.io'` and `base: '/portfolio-app'`. All internal links use `withBasePath()`. Canonical/OG URLs derive from `site` + path.

## Different repo name

Change `base` to `/<new-repo-name>`, `site` if the owner differs, then update test assertions that hardcode `/portfolio-app`: `tests/e2e/home-page-smoke.spec.ts` (canonical + og:image), `tests/e2e/internal-links.spec.ts` (base-path regex), `tests/e2e/page-navigation-lifecycle.spec.ts` (URL regexes), and `BASE_URL` in `playwright.config.ts`.

## User site or custom domain

User site (repo named `<user>.github.io`) or custom domain serves from `/`:

1. Remove `base` from `astro.config.mjs`; set `site` to the final origin (e.g. `https://example.com`).
2. Custom domain: add `public/CNAME` containing the domain; set the domain in Settings -> Pages; configure DNS (CNAME to `<user>.github.io`, or A/AAAA records for apex).
3. Update tests: canonical + og:image assertions in `home-page-smoke.spec.ts`; base-path regex in `internal-links.spec.ts`; URL regexes in `page-navigation-lifecycle.spec.ts`; `BASE_URL` in `playwright.config.ts` (drop `/portfolio-app`).
4. Run `npm run check && npm run test:unit && npm run test:e2e`.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Deploy job fails "Pages not enabled" / 404 on artifact | Set Pages Source to GitHub Actions |
| Site loads unstyled / 404 assets | `base` mismatch with the URL path; check `astro.config.mjs` |
| `verify` fails only in CI | Download `playwright-report` artifact; check traces (`trace: on-first-retry`) |
| Local `npm run test:e2e` hangs on server | Port 4321 busy, or stale `astro preview`; kill it. Config reuses an existing server locally |
| Playwright "browser not found" | `npx playwright install chromium` (version pinned 1.56.1) |
| `astro preview` runs in background under an AI agent | Astro 7 behavior; the config passes `--ignore-lock` to stay foreground |
| `engines`/Node error on install | Use Node >=22.22 (`nvm use`) |
| Build fails with `Career RPG rules failed (N)` | Fix every listed `source id: problem` line (unknown skill, 2 bosses, reused evidence URL, future changelog date...). Rules: [architecture](system-architecture.md#career-rpg-pipeline) |
| Content schema error on `repoUrl`/`xp`/`level` | Unknown keys are rejected; move links to `evidence`, delete computed fields |
| `test:unit` fails to import `.ts` | Node <22.18 (no type stripping); `nvm use` |
| Streak shows "paused" / stale | Rebuild (push, or run the workflow); check the weekly schedule isn't paused (60-day inactivity) |
| Need the streak/HUD as of a past date | `CAREER_RPG_NOW=YYYY-MM-DD npm run build` (end of that UTC day) |
| Social card shows old image | Regenerate `public/og-image.png` (README command); platforms cache previews |
| Content hidden or nav collapsed after deploy | Check browser console for bundle errors; failsafe reveals after 3s ([architecture](system-architecture.md)) |

## Rollback

Revert the bad commit on `master` and push (redeploys), or re-run an earlier successful workflow run from the Actions tab.
