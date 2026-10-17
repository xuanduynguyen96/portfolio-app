# Research: Portfolio App on GitHub Pages (animated, modern/futuristic UI)

Date: 2026-10-17 · Scope: simple framework, GitHub-hosted, heavy animation, futuristic style

## Table of Contents
- [Executive Summary](#executive-summary)
- [Research Methodology](#research-methodology)
- [Key Findings](#key-findings)
- [Comparative Analysis](#comparative-analysis)
- [Implementation Recommendations](#implementation-recommendations)
- [Resources & References](#resources--references)
- [Appendices](#appendices)
- [Unresolved Questions](#unresolved-questions)

## Executive Summary

**Recommendation: Astro (static output) + GSAP (ScrollTrigger, SplitText) + plain CSS custom properties, deployed to GitHub Pages via GitHub Actions.**

- Astro = simplest framework that still gives components, routing, and zero-JS-by-default pages. Official GitHub Pages guide exists.
- GSAP = best-in-class animation. Since 2025 all plugins are free, including commercial use. Avoids paid-plugin lock-in.
- Futuristic look = design system work (dark base, neon accents, grid/glow, mono type). No framework needed. Three.js only if a 3D hero is wanted later (YAGNI for v1).
- Hosting: GitHub Pages fits a portfolio easily. Limits are generous. No e-commerce.

Minimal alternative: plain HTML/CSS/JS, no build step, GSAP via CDN. Pick this if you want zero tooling. Astro wins once there are multiple pages or reusable sections.

Reading of "simple framework": Astro. If you meant "no framework at all", say so; the stack below still works with it.

## Research Methodology
- Sources consulted: 5 web searches (standard mode), 3 primary (official Astro docs, Webflow/GSAP license pages, GitHub Docs), 3 secondary (blogs, package-health sites). Official docs cross-checked against secondary sources.
- Date range: GSAP license effective 2025-04-30; GitHub Pages limits (current GitHub Docs); Astro docs (undated, current at fetch); Motion (current at fetch).
- Key search terms: "GitHub Pages deploy static site framework Astro Vite", "GSAP free license all plugins", "Motion framer-motion vanilla bundle size", "GitHub Pages usage limits", "Astro View Transitions GSAP".
- Not verified: current Astro/GSAP/Motion version numbers, Vite static-deploy docs, `client:visible` + GSAP interaction, custom-domain HTTPS on Pages. See Unresolved Questions.

## Key Findings

### Technology Overview
- **Astro**: static-site-first framework. Ships HTML with minimal JS. Components use `.astro` files. Optional UI islands for React/Vue/etc. Build output is plain static files, a natural fit for Pages.
- **GSAP**: JS animation engine. Timelines, ScrollTrigger (scroll-linked), SplitText (text reveals), Flip, MorphSVG. Framework-agnostic.
- **Motion** (motion.dev, formerly Framer Motion): alternative animation lib. Has a vanilla JS API. Good for simple UI transitions. Heavier than GSAP for scroll-driven work.

### Current State & Trends
- GSAP became free for everyone in 2025, including former Club plugins. Standard license covers commercial use. Restriction: no building competing products from GSAP.
- Old `gsap-trial` package is retired. Use `gsap` on npm.
- Astro maintains its own GitHub Action for Pages deploys. Docs recommend it.
- Motion: full core ~34 kB (can't tree-shake below that); with `LazyMotion` the initial render drops to ~5.5 kB (React-oriented figures). Motion One `animate()` cited at ~3.8 kB.

### Best Practices
- **Animation budget**: animate `transform` and `opacity` only. Avoid layout-triggering properties.
- **Reduced motion**: respect `prefers-reduced-motion`. Astro's `<ClientRouter />` does this for page transitions. For GSAP, wrap animations in `gsap.matchMedia()` with a `(prefers-reduced-motion: no-preference)` query.
- **Routing**: use Astro `<ClientRouter />` for smooth page transitions. Known trade-off: scripts and state may need re-init after each navigation. Listen for `astro:page-load` (verify in docs).
- **Lockfile**: commit it. Astro's action infers the package manager from the lockfile.
- **Pin actions**: `actions/deploy-pages` major versions were seen as both `@v4` and `@v5` in cached docs. Copy the YAML from the current docs page, not from memory.

### Security Implications
- Static site = small attack surface. No server, no DB, no secrets in the browser.
- Contact forms: GitHub Pages cannot process POST. Use a third-party form service (e.g., Formspree) or a `mailto:` link. Do not embed API keys in client code.
- Third-party CDN scripts (GSAP via CDN): pin exact versions and prefer npm + bundling (Astro does this by default).
- No CVE research was done for Astro/GSAP in this pass. Check GitHub Security Advisories for both before release.

### Performance Insights
- Astro ships zero JS for static sections. Only interactive islands hydrate. Good for Core Web Vitals.
- GSAP core is small; ScrollTrigger adds weight. Load plugins only where used.
- Heavy effects (3D, WebGL, particle systems) are the main performance risk. Keep them out of v1.
- GitHub Pages limits (official docs): source repo recommended ≤1 GB; published site ≤1 GB; soft bandwidth 100 GB/month; soft 10 builds/hour (does not apply to custom Actions workflows); deploys time out after 10 minutes.

## Comparative Analysis

### Stack options

| Option | Build step | Animation | Learning curve | Fit for animated portfolio | Verdict |
|---|---|---|---|---|---|
| **Astro + GSAP** | Yes (`astro build`) | Excellent (GSAP) | Low | High: static, components, transitions | **Pick** |
| Plain HTML/CSS/JS + GSAP (CDN) | None | Excellent (GSAP) | Lowest | High for 1–3 pages; messy at scale | Fallback |
| Astro + Motion | Yes | Good for UI; weaker for scroll timelines | Low | Medium | Only if you want React-style APIs |
| Vite + vanilla JS | Yes | Same as above | Low–Medium | Medium; more manual routing | Viable, but Astro does more out of box |
| Next.js static export | Yes | Any | Medium–High | Overkill for static portfolio | Avoid |

### Animation library

| Need | Pick | Why |
|---|---|---|
| Scroll-linked, timelines, text reveals | **GSAP** | ScrollTrigger + SplitText, now free |
| Simple enter/hover transitions | CSS or Motion | Smaller; less setup |
| 3D hero (later) | Three.js | Only if the design needs it |

### Hosting

| Option | Verdict |
|---|---|
| **GitHub Pages via GitHub Actions** | **Pick**: free, matches "deployed on GitHub", fits limits |
| Pages via branch build (Jekyll default) | Avoid: no Astro build, use Actions instead |
| Vercel/Netlify | Not requested; better previews, but off-platform |

## Implementation Recommendations

### Quick Start Guide

1. Create the Astro project (run in repo root):

```bash
npm create astro@latest . -- --template minimal
npm install gsap
```

2. Set site URL and base path in `astro.config.mjs`:

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://<github-user>.github.io',
  // Project site (username.github.io/<repo>): set base to the repo name.
  // User site (repo named username.github.io): omit base.
  base: '/portfolio-app',
});
```

3. Add a Pages workflow at `.github/workflows/deploy.yml`. Use the official action; copy the current version from the docs.

```yaml
# .github/workflows/deploy.yml
# Verify the latest major version of withastro/action and actions/deploy-pages
# at https://docs.astro.build/en/guides/deploy/github before committing.
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: withastro/action@v5   # verify current major
        id: deployment
```

4. In the repo: Settings → Pages → Source = **GitHub Actions**.

5. GSAP with Astro. Re-init on page swaps when using `<ClientRouter />`:

```astro
<!-- src/components/Hero.astro -->
<h1 class="hero-title">Hello, I build things</h1>

<script>
  import gsap from 'gsap';

  function init() {
    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.hero-title', {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });
    });
  }

  document.addEventListener('astro:page-load', init);
</script>
```

6. Futuristic style tokens (CSS custom properties, dark-first):

```css
/* src/styles/theme.css */
:root {
  --bg: #05070d;
  --surface: rgba(255, 255, 255, 0.04);
  --border: rgba(0, 255, 240, 0.2);
  --accent: #00fff0;
  --accent-2: #ff2bd6;
  --text: #e6fbff;
  --glow: 0 0 24px rgba(0, 255, 240, 0.35);
  --font-mono: ui-monospace, 'JetBrains Mono', monospace;
}
body {
  background: var(--bg);
  color: var(--text);
}
```

### Common Pitfalls
- **Blank page / broken assets on Pages**: `base` wrong. Asset URLs 404 when base is missing. Fix in `astro.config.mjs`.
- **Animations run twice or stop after nav**: scripts not re-initialized under `ClientRouter`. Use `astro:page-load`.
- **Animations ignore reduced motion**: plain `gsap.from` without `matchMedia`. Wrap all motion.
- **Janky scroll**: animating `top`, `width`, `box-shadow` without care. Use `transform`/`opacity`.
- **Heavy first load**: importing every GSAP plugin on every page. Import only what each page uses.
- **Contact form does nothing**: Pages is static. Use a form service or `mailto:`.
- **Build fails on Actions**: lockfile missing. Commit `package-lock.json` or `pnpm-lock.yaml`.
- **Deploy timeout**: 10-minute cap on Pages deploys. Keep assets lean (video, big images).
- **Off-brand use**: GitHub Pages terms bar online business and e-commerce. A personal portfolio is fine.

## Resources & References

### Official Documentation
- [Astro: Deploy to GitHub Pages](https://docs.astro.build/en/guides/deploy/github): official guide, recommends the Astro GitHub Action (undated; current at fetch)
- [Astro: View Transitions](https://docs.astro.build/en/guides/view-transitions): `<ClientRouter />`, built-in reduced-motion support (undated)
- [GitHub Docs: GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits): size, bandwidth, build, and timeout limits (undated)
- [Webflow: GSAP becomes free](https://webflow.com/updates/gsap-becomes-free): official announcement (2025)
- [Webflow blog: GSAP 100% free](https://webflow.com/blog/gsap-becomes-free): official post (2025)
- [GSAP Standard License](https://gsap.com/community/standard-license/): license terms (effective 2025-04-30 per third-party copy; verify on source)
- [Motion (motion.dev) Reduce bundle size guide](https://www.framer.com/motion/guide-reduce-bundle-size/): official bundle guide (undated)

### Recommended Tutorials
- [Codrops: Interlude, custom page transitions in Astro](https://tympanus.net/codrops/?p=123511): GSAP-driven transitions on Astro's client router, 21 examples (undated)

### Community Resources
- [Motion vs Motion One vs AutoAnimate 2026 comparison](https://www.pkgpulse.com/guides/framer-motion-vs-motion-one-vs-autoanimate-2026): secondary, bundle-size comparison (2026)
- [Motion.dev independence announcement](https://forums.tumult.com/t/motion-dev-now-becomes-independent-and-uses-vanilla-javascript/24256): project background (undated)

### Further Reading
- GSAP docs (ScrollTrigger, SplitText, `matchMedia`): not searched this pass; read before implementing scroll effects.
- Astro Actions/Content Collections for project lists: not searched.

## Appendices

### A. Glossary
- **SSG (static site generator)**: builds HTML files at build time; no server at runtime.
- **Islands**: Astro term for interactive components that hydrate independently; the rest stays static HTML.
- **ClientRouter**: Astro component for client-side page transitions without full reloads.
- **ScrollTrigger**: GSAP plugin that binds animations to scroll position.
- **SplitText**: GSAP plugin that splits text into chars/words/lines for staggered reveals.
- **`prefers-reduced-motion`**: OS setting users enable to reduce animation; honor it.
- **Tree-shaking**: bundler drops unused exports; affects real bundle size vs. published size.

### B. Compatibility Matrix

| Component | Requirement | Status |
|---|---|---|
| Astro | Node.js version | Not verified; check Astro docs for current minimum |
| GSAP | npm `gsap` package | Current; trial package retired |
| GitHub Pages | Actions-based deploy | Supported; Settings → Pages → GitHub Actions |
| Motion | Vanilla JS API | Supported; core ~34 kB (full), ~5.5 kB (LazyMotion, React figures) |

### C. Raw Research Notes
- Search 1: Astro GitHub Pages guide found; Vite static-deploy page not found in results.
- Search 2: GSAP free for all since 2025; commercial use OK; competing-product restriction.
- Search 3: Motion core ~34 kB; Motion One animate() ~3.8 kB; a 2026 Motion release date was cited but not confirmed (omitted).
- Search 4: GitHub Pages limits from GitHub Docs snippet; custom-domain HTTPS not confirmed.
- Search 5: Astro ClientRouter reduced-motion support confirmed in docs summary; `client:visible` + GSAP not found.

## Unresolved Questions
- Exact current versions of Astro, GSAP, and Motion; check npm before pinning.
- Is "simple framework" = Astro, or do you want zero build (plain HTML)?
- Project site (`/repo`) or user site (`username.github.io`)? Changes the `base` setting.
- Contact form needed? If yes, which service?
- Does the design need a 3D/WebGL hero (Three.js), or are scroll and CSS effects enough for v1?
- Custom domain? HTTPS for custom domains not confirmed in this research.
- Vite static-deploy specifics: not researched (only needed if Vite is chosen).
- GSAP ↔ `client:visible` interaction: not researched; keep GSAP in non-island `<script>` tags as a default.

## Sources
- [Deploy your Astro Site to GitHub Pages](https://docs.astro.build/en/guides/deploy/github)
- [Astro View Transitions](https://docs.astro.build/en/guides/view-transitions)
- [GSAP becomes free (Webflow)](https://webflow.com/updates/gsap-becomes-free)
- [Webflow makes GSAP 100% free](https://webflow.com/blog/gsap-becomes-free)
- [GSAP Standard License](https://gsap.com/community/standard-license/)
- [Motion: Reduce bundle size](https://www.framer.com/motion/guide-reduce-bundle-size/)
- [Framer Motion vs Motion One vs AutoAnimate 2026](https://www.pkgpulse.com/guides/framer-motion-vs-motion-one-vs-autoanimate-2026)
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [Codrops: Interlude Astro page transitions](https://tympanus.net/codrops/?p=123511)
