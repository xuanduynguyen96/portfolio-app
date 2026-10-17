# Phase 04: Layout, Components & Pages

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [phase-02](phase-02-design-system-and-global-styles.md), [phase-03](phase-03-content-and-data-model.md)
- Docs: https://docs.astro.build/en/guides/view-transitions · https://docs.astro.build/en/guides/images/
- Skills: `aesthetic`, `ui-styling`; `ui-ux-designer` agent for design review if needed

## Overview
- Date: 2026-10-17 · Priority: P0 · Status: Done · Review: Code-reviewed + tester-validated
- Base layout with SEO + ClientRouter, header/nav, footer, reusable primitives, 6 sections, index, project detail, 404.

## Key Insights
- Zero JS by default; only animation script (phase 05) + tiny nav toggle.
- Mark animatable elements with `data-reveal` / `data-hero-title` attributes now so phase 05 is pure JS wiring.
- `<ClientRouter />` gives cross-page transitions + respects reduced motion.
- Internal links must use `withBasePath()`; anchor links (`#projects`) fine on index, but from detail pages use `withBasePath('/#projects')`.

## Requirements
- Functional: sections Hero, About, Skills, Projects, Experience, Contact; Footer; sticky header with anchor nav + mobile menu; project detail pages `/projects/[slug]`; 404 page.
- Non-functional: semantic landmarks (`header`, `nav`, `main`, `footer`, `section[aria-labelledby]`), skip link, 360px no h-scroll, images lazy + sized, each file <200 lines.

## Architecture
```
src/layouts/base-layout.astro        <head> SEO/OG, fonts, styles, ClientRouter, motion-flag inline script, header/footer slots
src/components/
├── site-header.astro                logo + nav + mobile toggle (small inline script)
├── site-footer.astro
├── skip-to-content-link.astro
├── section-heading.astro            eyebrow (mono, "// 01") + h2
├── glass-card.astro                 .glass wrapper, slot, optional href
├── neon-button.astro                <a>/<button> variants primary/ghost
├── project-card.astro               cover, title, summary, tags, links
├── tag-chip.astro
└── sections/
    ├── hero-section.astro           name, role, tagline, CTAs, data-hero-title
    ├── about-section.astro
    ├── skills-section.astro
    ├── projects-section.astro       getCollection + sortProjects
    ├── experience-section.astro     vertical timeline
    └── contact-section.astro        mailto + socials
src/pages/
├── index.astro                      composes sections
├── projects/[slug].astro            getStaticPaths from collection, render body
└── 404.astro
public/favicon.svg, public/og-image.png
```

Motion flag (head, inline, consumed by phase 02 CSS + phase 05):
```astro
<script is:inline>
  const setMotionFlag = () => {
    if (matchMedia('(prefers-reduced-motion: no-preference)').matches) {
      document.documentElement.dataset.motion = 'ok';
    }
  };
  setMotionFlag();
  document.addEventListener('astro:after-swap', setMotionFlag);
</script>
```

## Related Code Files
Create: all files in Architecture tree above (full paths under `/home/user/portfolio-app/`).
Modify: `/home/user/portfolio-app/src/pages/index.astro` (replace template content).

## Implementation Steps
1. `base-layout.astro`: props `title`, `description`, `ogImage?`; import Fontsource + 3 CSS files; meta (charset, viewport, description, canonical via `Astro.site`, OG/Twitter); `<ClientRouter />` from `astro:transitions`; motion-flag script; skip link; header; `<main id="main">`; footer.
2. Primitives: `section-heading`, `glass-card`, `neon-button`, `tag-chip` — props typed via `interface Props`.
3. `site-header`: anchor links from a nav array; mobile toggle button `aria-expanded`/`aria-controls`; close on link click; re-bind on `astro:page-load`.
4. Sections: pull from `src/data/*`; add `data-reveal` on headings/cards; hero h1 gets `data-hero data-hero-title`, tagline + CTAs get `data-hero`.
5. `project-card`: `<Image>` from `astro:assets` with width/height/alt; external links `target="_blank" rel="noopener noreferrer"`; detail link via `withBasePath`.
6. `projects/[slug].astro`: `getStaticPaths` → `render(entry)`; back link; `transition:name` on title/cover for morph from card (progressive enhancement).
7. `404.astro`: on-theme "SIGNAL LOST" page + home link.
8. Responsive pass at 360, 768, 1280 widths.

## Todo List
- [x] base-layout.astro (SEO, ClientRouter, motion flag)
- [x] header (+ mobile menu), footer, skip link
- [x] primitives: section-heading, glass-card, neon-button, tag-chip, project-card
- [x] 6 sections
- [x] index, projects/[slug], 404
- [x] favicon + OG image placeholder
- [x] Responsive + keyboard pass

## Success Criteria
- `npm run build` emits `index.html`, `404.html`, one page per project.
- All nav links work under `/portfolio-app/` base in `npm run preview`.
- Keyboard: tab order logical, focus visible, mobile menu operable, Esc closes.
- No horizontal scroll at 360px.

## Risk Assessment
- Base-path link bugs → always `withBasePath`; e2e test checks links (phase 06).
- Mobile menu script lost after ClientRouter swap → bind on `astro:page-load`.
- `transition:name` conflicts if duplicated on a page → unique per slug.

## Security Considerations
- External links `noopener noreferrer`.
- No user input rendered; Markdown is author-controlled (trusted).

## Next Steps
- Phase 05 animates `data-reveal` / `data-hero-title` targets.
