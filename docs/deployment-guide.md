# Deployment Guide

Target: GitHub Pages project site, `https://xuanduynguyen96.github.io/portfolio-app/`.

## One-time setup

1. Push repo to GitHub (`xuanduynguyen96/portfolio-app`), default branch `master`.
2. Repo Settings -> Pages -> Build and deployment -> Source: **GitHub Actions**.
3. Push to `master` (or run the workflow manually on `master`). First deploy creates the `github-pages` environment.

No secrets needed (optional `GH_SNAPSHOT_PAT`, see [Snapshot refresh](#snapshot-refresh)). If `master` is protected, read the branch protection note there before the first weekly run.

## Workflows

Two workflows: deploy (below) and [snapshot refresh](#snapshot-refresh). Refresh commits data and dispatches deploy; deploy never calls the GitHub API.

### Deploy

File: `.github/workflows/deploy-to-github-pages.yml`

| Job | Runs on | Does |
|-----|---------|------|
| `verify` | PR, push to `master`, manual (incl. dispatched by refresh) | `npm ci` -> `npm run check` -> `npm run test:unit` -> `npx playwright install --with-deps chromium` -> `npm run test:e2e`. Uploads `playwright-report/` (7 days) on failure |
| `build` | push to `master` or dispatch on `master` (needs `verify`) | `withastro/action@v5` (Node 22) builds and uploads Pages artifact |
| `deploy` | after `build` | `actions/deploy-pages@v4` publishes; environment `github-pages` |

Triggers: `push` to `master`, `pull_request`, `workflow_dispatch`. No cron: the weekly rebuild comes from the refresh workflow (the Career RPG streak/HUD are computed from the **build date**, so a static site goes stale without rebuilds).

Safety:
- `build`/`deploy` have `if: github.ref == 'refs/heads/master' && github.event_name != 'pull_request'`, so a `workflow_dispatch` on a feature branch verifies only.
- Concurrency group `pages-<ref>`: superseded PR runs cancel; a `master` deploy is never cancelled.
- Permissions: top-level `contents: read`; only `deploy` gets `pages: write` + `id-token: write`.
- e2e retries once in CI (`retries: 1`); retried passes show as flaky in the report.

Action versions (`checkout@v5`, `setup-node@v5`, `upload-artifact@v4`, `withastro/action@v5`, `deploy-pages@v4`) could not be verified online when written. Confirm on the first run; bump if the run reports deprecations or missing tags.

### Snapshot refresh

File: `.github/workflows/refresh-github-snapshot.yml`. Keeps `src/data/github/github-snapshot.json` (the character's only data source) current. Triggers: `schedule` Mondays 02:47 UTC, `workflow_dispatch` (input `dry_run_no_token`).

| Job | Does |
|-----|------|
| `fetch` | Runs `node scripts/fetch-github-snapshot.ts` (own code, no npm, before any install) with `GITHUB_TOKEN` then optional `GH_SNAPSHOT_PAT`. Never fails the job: no token or any API error keeps the committed file, logs `::warning::`, exits 0. If the normalized text changed: uploads it as an artifact, `npm ci --ignore-scripts` (no secrets in env), runs the snapshot schema test |
| `publish` | Only if changed and validated (`contents: write`, no npm): downloads the artifact, commits `chore(data): refresh github snapshot` as `github-actions[bot]`, `git pull --rebase`, pushes |
| `dispatch-deploy` | Always (even unchanged, or fetch/publish failed): `gh workflow run deploy-to-github-pages.yml` on the same ref (`actions: write`) |

Why dispatch: commits pushed with `GITHUB_TOKEN` do not trigger `push` workflows. The dispatched deploy re-verifies, so a bad snapshot that slipped past validation still fails before deploy. Cost: about 8 GraphQL points per run (5000/h limit).

**Manual refresh:** Actions -> "Refresh GitHub snapshot" -> Run workflow (branch `master`; `workflow_dispatch` is available only once the file is on the default branch). Tick `dry_run_no_token` to check the keep-snapshot fallback. Check the run summary: "Snapshot updated" / "Snapshot unchanged" / warning.

**Local refresh:**

```bash
GITHUB_TOKEN=$(gh auth token) npm run snapshot:fetch   # or a fine-grained PAT; no token = no change
npm run test:unit                                       # validates the snapshot schema (the script itself does not)
npm run character:explain                               # see what changed in class/gear
git add src/data/github/github-snapshot.json
```

**Optional `GH_SNAPSHOT_PAT`:** fallback if `GITHUB_TOKEN` is refused for the profile query (the Actions spike showed `GITHUB_TOKEN` works, so this is normally unneeded). Create a fine-grained token, resource owner = you, **Public repositories (read-only)**, no extra permissions; add as repo secret `GH_SNAPSHOT_PAT` (Settings -> Secrets and variables -> Actions). Least privilege: never use a classic token with `repo` scope (it would read private data the snapshot must not contain; the normalizer drops private repos anyway, defense in depth). Never commit tokens.

**Branch protection on `master`:** the `publish` job pushes straight to the branch. With "require pull request" or required checks on `master`, that push is rejected: the job fails, `dispatch-deploy` still runs, and the site deploys with the old snapshot (HUD "GitHub data refreshed" turns red after 14 days). Options: add `github-actions[bot]` (or the Actions app) to the ruleset bypass list, or change `publish` to push a branch and open a PR (needs "Allow GitHub Actions to create and approve pull requests"). Not yet verified for this repo; see roadmap open items.

**60-day schedule pause:** GitHub disables scheduled workflows after 60 days without repo activity. `asOf` is the ISO-week Monday, so the weekly run normally commits (a re-run in the same week with no new data does not); whether those bot commits count as repo activity for this rule is unverified. If the weekly run stops (no run in Actions history, HUD snapshot check red): Actions -> "Refresh GitHub snapshot" -> **Enable workflow**, then Run workflow once, or push any commit. Dispatching manually never depends on the schedule.

**Trust split (do not undo):** the token is only in the `fetch` step that runs our dependency-free script; third-party npm code runs later with no secrets, and cannot change the uploaded artifact (it can only fail the job). `publish` has no npm. Keep it that way when editing the workflow.

Seed note: the committed snapshot predates `.gitattributes` (`.claude/**` vendored; `plans/`, `docs/` documentation), so the first live refresh after merge will correct language stats and may change the class.

## Local check before pushing

```bash
npm run check
npm run test:unit     # engine, classifier, snapshot, avatar, class-look; 279 tests, no build (Node >=22.18)
npm run test:e2e      # builds + previews + runs 121 tests
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
| Build fails with `Career RPG rules failed (N)` | Fix every listed `source id: problem` line (override file name matches no snapshot repo, 2 `isBoss`, duplicate skill id, future changelog date...). Rules: [architecture](system-architecture.md#career-rpg-pipeline) |
| Content schema error on `repoUrl`/`xp`/`level`/`difficulty`/`skills`/`evidence` | Unknown keys are rejected in `src/content/projects/*.md`; delete them (derived from the repo) |
| Build fails parsing `github-snapshot.json` | Strict schema: restore with `git checkout -- src/data/github/github-snapshot.json` or re-run `npm run snapshot:fetch`; hand edits must still match `github-snapshot-schema.ts` |
| Refresh run is green but snapshot didn't change | Expected on a re-run within the same ISO week with no new data (`asOf` = week Monday), or when no token worked (look for `::warning::` in the `fetch` log) |
| Refresh `publish` job fails on push | Branch protection on `master`: see [Snapshot refresh](#snapshot-refresh) |
| Character class/gear looks wrong | `npm run character:explain`; fix rules generically ([code standards](code-standards.md#tuning-class-job-and-gear-rules)) or the repo's GitHub description/topics/language stats |
| HUD "GitHub data refreshed" fails | Snapshot older than `maxSnapshotAgeDays`: run the refresh workflow manually; check schedule pause |
| `test:unit` fails to import `.ts` | Node <22.18 (no type stripping); `nvm use` |
| Streak shows "paused" / stale | Streak = weeks with GitHub contributions in the snapshot: run the refresh workflow; check the weekly schedule isn't paused (60-day inactivity) |
| Need the streak/HUD as of a past date | `CAREER_RPG_NOW=YYYY-MM-DD npm run build` (end of that UTC day) |
| Social card shows old image | Regenerate `public/og-image.png` (README command); platforms cache previews |
| Content hidden or nav collapsed after deploy | Check browser console for bundle errors; failsafe reveals after 3s ([architecture](system-architecture.md)) |

## Rollback

Revert the bad commit on `master` and push (redeploys), or re-run an earlier successful workflow run from the Actions tab.
