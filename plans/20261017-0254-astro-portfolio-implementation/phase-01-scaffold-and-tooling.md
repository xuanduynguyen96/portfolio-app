# Phase 01: Scaffold & Tooling

## Context Links
- Parent: [plan.md](plan.md)
- Research: [261017-portfolio-app-stack.md](../reports/261017-portfolio-app-stack.md)
- Docs: https://docs.astro.build/en/install-and-setup/ · https://docs.astro.build/en/guides/deploy/github
- Depends on: none

## Overview
- Date: 2026-10-17 · Priority: P0 · Status: Done · Review: Code-reviewed + tester-validated
- Init Astro project in existing repo root, install deps, set base path, scripts, TS strict.

## Key Insights
- Repo root not empty (`.claude/`, `CLAUDE.md`, `plans/`) → `npm create astro` into `.` must not delete these; verify prompt behavior or scaffold in scratch dir then copy.
- `base` must match repo name for project sites, or assets 404.
- `astro check` needs `@astrojs/check` + `typescript`.
- Commit the lockfile (`withastro/action` detects package manager from it). **Don't commit now** — user approval required.

## Requirements
- Functional: `npm run dev|build|preview|check|test:e2e` scripts work.
- Non-functional: TS strict; Node 22 pinned; no secrets in repo.

## Architecture
```
astro.config.mjs  → site + base + output: 'static'
tsconfig.json     → extends astro/tsconfigs/strict
package.json      → scripts, engines.node >=22
```

## Related Code Files
Create:
- `/home/user/portfolio-app/package.json`: deps + scripts
- `/home/user/portfolio-app/package-lock.json`: generated
- `/home/user/portfolio-app/astro.config.mjs`: site/base config
- `/home/user/portfolio-app/tsconfig.json`: strict TS
- `/home/user/portfolio-app/.nvmrc`: `22`
- `/home/user/portfolio-app/.gitignore`: `node_modules/`, `dist/`, `.astro/`, `.env*`, `test-results/`, `playwright-report/`
- `/home/user/portfolio-app/src/env.d.ts` (if template doesn't generate it)
Delete: template demo files not used (e.g. default `src/pages/index.astro` content gets replaced in phase 04).

## Implementation Steps
1. Scaffold: `npm create astro@latest . -- --template minimal --no-git --install --typescript strict` (if CLI refuses non-empty dir, scaffold into scratchpad and copy files over without overwriting `.claude/`, `CLAUDE.md`, `plans/`).
2. Install runtime deps: `npm i gsap @fontsource-variable/space-grotesk @fontsource-variable/jetbrains-mono`.
3. Install dev deps: `npm i -D @astrojs/check typescript @playwright/test @axe-core/playwright`.
4. Config:
   ```js
   // astro.config.mjs
   import { defineConfig } from 'astro/config';
   export default defineConfig({
     site: 'https://xuanduynguyen96.github.io',
     base: '/portfolio-app', // ASSUMPTION: project site. Remove for user site.
     output: 'static',
     trailingSlash: 'ignore',
   });
   ```
5. Scripts in `package.json`:
   ```json
   "scripts": {
     "dev": "astro dev",
     "build": "astro build",
     "preview": "astro preview",
     "check": "astro check",
     "test:e2e": "playwright test"
   },
   "engines": { "node": ">=22" }
   ```
6. Write `.nvmrc`, `.gitignore`.
7. Run `npm run build` on scaffold to confirm toolchain.

## Todo List
- [x] Scaffold Astro minimal template without clobbering existing files
- [x] Install runtime + dev deps
- [x] Configure `site`, `base`, `output`
- [x] Add scripts + engines
- [x] `.nvmrc`, `.gitignore`
- [x] Baseline `npm run build` passes

## Success Criteria
- `npm run build` exits 0, `dist/` produced with `/portfolio-app/` asset paths.
- `npm run check` exits 0.
- `.claude/`, `CLAUDE.md`, `plans/` untouched (`git status` shows only additions).

## Risk Assessment
- CLI overwrites/refuses non-empty dir → scratch-dir scaffold + copy.
- Astro major version newer than plan assumptions (content layer, `astro:transitions`) → read current docs before phase 03/05; adjust APIs.
- Playwright npm version vs pre-installed Chromium mismatch → phase 06 uses `executablePath: '/opt/pw-browsers/chromium'` fallback; never `playwright install`.

## Security Considerations
- `.env*` gitignored; no API keys needed in v1.
- Pin exact deps via lockfile; run `npm audit` and note results.

## Next Steps
- Phase 02 design tokens.
