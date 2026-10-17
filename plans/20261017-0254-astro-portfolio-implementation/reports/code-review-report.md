# Code Review Report: Astro 7 + GSAP Portfolio

Date: 261017 | Reviewer: code-reviewer | Scope: src/**, astro.config.mjs, playwright.config.ts, tests/e2e/**, deploy workflow, package.json
Method: read all in-scope files + empirical probes (Playwright vs `astro preview` of dist; experiment on a scratch COPY of the project, source untouched). No commits, no source edits.

## Overall
Solid. Lifecycle (before-swap cleanup / page-load init), motion-flag failsafe, base-path handling, ext-link rel, workflow perms all check out. One real UX bug (High): animations break deep-link/reload scroll position. Rest Medium/Low. No Critical, no security findings of note.

Verified OK (no action): mm.revert() -> Context.kill removes from `_media` (no MQ listener leak); swapRootAttributes drops data-motion/-ready so after-swap re-flag + page-load re-init is consistent; 3 nav rounds no duplicate split; scroll-reveals fire for already-passed elements on soft-nav; hero descenders not clipped by SplitText mask (screenshot); canonical/og URLs correct incl. base; all files <200 lines (site-header 187, global-styles 152; mobile-menu.ts already extracted); kebab-case ok; no secrets; permissions least-privilege; `deploy` job needs only pages/id-token (no checkout) so job-level perms override is fine.

## Critical
None.

## High

### H1. Hash deep-link and reload lose scroll position when motion is enabled
- Files: `src/styles/global-styles.css:18-22` (html `scroll-behavior: smooth`), interacts with `src/scripts/animations/init-animations.ts:20-31` (ScrollTrigger creation) and Astro ClientRouter scroll restore.
- Repro (verified, chromium, 1280x800, built site, no-preference motion):
  - `goto('/portfolio-app/#contact')` -> scrollY stays 0 (target top 3954px offscreen). Same for `#projects`.
  - Scroll to 2200, `reload()` -> scrollY 0 after.
  - Same two cases with `reducedMotion: reduce`, JS off, or animation chunk blocked -> correct (3874 / 2200).
- Root cause (verified by log): Astro restores via `scrollTo({left, top})` (no `behavior:'instant'`) / browser fragment scroll; under CSS smooth scroll that is an *animated* scroll that has not started yet. ScrollTrigger's first refresh (triggered by page-load init) calls `scrollTo(0,0)` and cancels it. Log: `scrollTo({left:0,top:2200})@4ms ... page-load@18ms y=0 ... scrollTo(0,0)@30ms`.
- Impact: any shared `/#projects` link lands at top; F5 mid-page jumps to top; the CTA/nav in-page clicks (which e2e tests cover) still work, so tests miss it.
- Fix (verified on scratch copy: reload y=2200, #projects y=2060, #contact y=3874): delete the `@media (prefers-reduced-motion: no-preference) { html { scroll-behavior: smooth } }` block. GSAP docs also advise against CSS smooth scroll with ScrollTrigger. If smooth anchor scrolling is wanted, enable it only after init settles (e.g. add `data-smooth` to html in a `setTimeout` after `ScrollTrigger` refresh + `load`) or use GSAP ScrollToPlugin for nav clicks. Unverified: the gated variant.
- Add e2e: (a) `goto('./#contact')` -> `expect.poll(() => scrollY).toBeGreaterThan(1000)`; (b) scroll, `reload()`, poll scrollY near previous. Both must run in default (no-preference) project.

## Medium

### M1. Mobile CLS from nav collapsing after JS
- `src/scripts/mobile-menu.ts:8` sets `data-menuEnhanced` on page-load; mobile CSS (`site-header.astro` `@media (max-width:47.99rem)`) hides nav only after that. Until then, 5 links wrap in header, then collapse -> content below shifts.
- Verified: layout-shift observer at 360px: CLS 0.07 (0.09 under 4x CPU throttle), source = logo/MAIN. Desktop 0.0001. Near 0.1 "good" threshold; Lighthouse run reportedly desktop so missed.
- Fix: set the flag synchronously in the existing head inline script (`root.dataset.menuEnhanced=''`) and key CSS off `html[data-menu-enhanced]`; but the flag is wiped by swapRootAttributes on soft-nav, so also set it in the existing `astro:after-swap` handler. No-JS keeps always-visible nav.

### M2. Lifecycle e2e test does not prove it is a soft navigation
- `tests/e2e/page-navigation-lifecycle.spec.ts:6-27`. Comment says "Soft navigation" but nothing distinguishes it from a full page load. If ClientRouter silently fell back to a hard reload (it does on fetch failure / swap error), test still passes -> the init/cleanup path it claims to cover is untested. Also no leak/duplicate assertion beyond text equality.
- Fix: `await page.evaluate(() => { window.__spa = true })` before first click; after each navigation `expect(await page.evaluate(() => window.__spa)).toBe(true)`. Optionally expose `ScrollTrigger.getAll().length` under `import.meta.env.DEV`/test flag and assert it is constant across rounds.

### M3. workflow_dispatch from any branch deploys to production
- `.github/workflows/deploy-to-github-pages.yml:50,61` `if: github.event_name != 'pull_request'`. A manual dispatch on a feature branch passes `verify` and runs build+deploy. Only the github-pages environment branch rule (default: allowed branches, user-configurable) stands between that and prod.
- Fix: `if: github.ref == 'refs/heads/main' && github.event_name != 'pull_request'` on build and deploy.

### M4. CI has zero retries on browser tests
- `playwright.config.ts:10` `retries: 0` while CI runs `fullyParallel` on shared 2-4 vCPU runners with timing-dependent animation assertions (opacity polling, 3s failsafe test with 6s timeout). One slow runner = red deploy gate.
- Fix: `retries: process.env.CI ? 1 : 0` (and `workers` left default). Keep `trace: 'on-first-retry'`.

## Low

- L1. Third-party/mutable action refs: all actions pinned by major tag (`checkout@v5`, `setup-node@v5`, `upload-artifact@v4`, `withastro/action@v5`, `deploy-pages@v4`). Supply-chain hardening: pin to commit SHAs + Dependabot `github-actions` ecosystem. Workflow:25-72.
- L2. Duplicate build: `verify` builds (via webServer) and `build` job rebuilds. Acceptable (clean artifact), just note extra ~1 min.
- L3. Unused direct dep `playwright-core` pinned 1.56.1 (package.json:30); never imported (grep). Pinned separately from `@playwright/test` it can drift/mismatch on bump. Remove (YAGNI).
- L4. `init()` not idempotent (`init-animations.ts:20`): if `astro:page-load` ever fired twice w/o before-swap, first `mm` is overwritten and leaks live ScrollTriggers. No current path found; hardening: call `cleanup()` first in `init()`.
- L5. Slow-bundle flash: if GSAP chunk takes >3s (slow 3G, ~47KB gz), failsafe (`base-layout.astro:63-65`) un-hides content, then late `init` does `gsap.set(targets,{opacity:0})` (`scroll-reveals.ts:14`) and re-hides/re-animates visible content. Not stuck-hidden. Fix: in `init`, bail to `revealAllImmediately()` if `html[data-motion]` was already removed while reduced-motion is not active, or accept.
- L6. 404 page indexable/canonical `/portfolio-app/404/` (verified in dist/404.html). Add `noindex` meta for 404 (e.g. `noindex` prop on BaseLayout) and skip canonical there. No sitemap/robots.txt (needs @astrojs/sitemap if SEO matters; YAGNI otherwise).
- L7. Weak/vacuous assertions in `tests/e2e/reduced-motion.spec.ts`:
  - :21,:34,:45 `not.toHaveAttribute('data-motion', /.*/)` passes immediately if the flag was never set; failsafe test (:39-47) should first assert `data-motion="ok"` then wait for removal.
  - :19-25 reduce test checks "no split chars" without first awaiting `data-motion-ready`, so could run before init.
  - Failsafe route filter relies on chunk name containing `ClientRouter` (:41); brittle to Astro renaming but fails safe.
- L8. axe test (`accessibility-axe.spec.ts:19`) filters to serious/critical only and never audits mobile viewport or the open mobile menu state. Add a 360px + menu-open run; log moderate counts.
- L9. Only Chromium project. ClientRouter uses non-View-Transition fallback on Firefox/Safari; lifecycle path differs. Add webkit/firefox for the lifecycle spec if budget allows.
- L10. A11y polish: no `aria-current` on nav link for current section/page (`site-header.astro`); `main#main:focus` shows the global outline around the whole main after skip-link (`global-styles.css:89`) -> add `main:focus { outline: none }`; `coverAlt` defaults to `''` even when `cover` is set (`content.config.ts:13`) -> `.refine` alt required with cover.
- L11. DRY nits: "XDN" logo initials hardcoded (`site-header.astro:16`) vs `siteConfig.name`; section order/index numbers duplicated across sections + `SECTION_IDS` in tests; footer year is build-time (stale until next deploy).
- L12. `ScrollTrigger` positions are computed once at page-load; fonts (swap) / images finishing later change layout on soft-nav (no `load` refresh). Reveals use `once` + early threshold so worst case is slightly early/late trigger; not reproduced as a stuck-hidden case. Optional: `document.fonts.ready.then(() => ScrollTrigger.refresh())` inside init.

## Positive
- Motion safety design (flag + failsafe + reduce + mm contexts) is coherent and covered by tests incl. mid-session reduce toggle and JS-off.
- `withBasePath` used consistently; internal-links e2e verifies base on every link/asset; preview-based tests.
- `rel="noopener noreferrer"` on every `_blank`; tested.
- Opacity (not autoAlpha) keeps content in a11y tree; aria-labels contain visible text (WCAG 2.5.3).
- Content collection schema typed with zod 4 `z.url()`, `summary.max(160)`; deterministic sortProjects with tiebreak; UTC date formatter (no TZ drift).
- Workflow: top-level `contents: read`, per-job elevation, concurrency w/o cancelling prod deploy, deploy gated by verify, timeouts set.
- Bundle: 121KB raw / 47KB gz JS (gsap+ST+SplitText), CSS scoped, no UI framework.

## Recommended actions (priority)
1. H1: remove CSS smooth-scroll (or gate post-init); add deep-link + reload e2e.
2. M3: restrict build/deploy to `refs/heads/main`.
3. M1: set menu-enhanced flag in head inline script + after-swap.
4. M2: add SPA marker assertion to lifecycle test.
5. M4: `retries: 1` in CI.
6. L1/L3/L6/L7 cleanup; rest optional.

## Metrics
- Files >200 lines: 0 (max 187 site-header.astro)
- Type/lint: not rerun (reported astro check 0, tsc 0 accepted); no `any` found in src
- Tests: not rerun (reported 23/23); gaps: deep-link/reload scroll, soft-nav proof, mobile axe
- Probe-measured CLS mobile 0.07-0.09, desktop 0.0001

## Unresolved questions
1. Is smooth anchor scrolling a requirement, or is instant jump acceptable (simplest H1 fix)?
2. Does repo's github-pages environment restrict deploy branches to main (affects M3 severity)?
3. Is Lighthouse score target mobile too (M1 CLS 0.07-0.09 close to 0.1 threshold)?
