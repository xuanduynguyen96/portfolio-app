# Phase 07: Recruiter Speedrun Route

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [phase-03](phase-03-quests-and-boss-battle-ui.md) (quest scores, badge), [phase-04](phase-04-character-sheet-and-hud.md) (level/title, `xp-progress-bar`)
- Docs: `docs/system-architecture.md` (root flags, lifecycle), `docs/code-standards.md` (animation rules 5-6)

## Overview
- Date: 2026-10-17 · Priority: P0 · Effort: S · Implementation: Not started · Review: Not reviewed
- Static `/speedrun/`: one-screen recruiter summary — identity + level/title, availability, top 3 achievements (from boss + featured quest metrics), contact CTA, link to full portfolio. Optional decorative 60s countdown. Linked from header nav + hero CTA.

## Key Insights
- `src/pages/speedrun.astro` => `dist/speedrun/index.html` (default `build.format: 'directory'`), served at `/portfolio-app/speedrun/`.
- Countdown = decoration: `aria-hidden="true"`, never gates/hides content, reduced-motion => static "60s" (no ticking), no-JS => static "60s". Fixed width (`min-inline-size: 5ch; font-variant-numeric: tabular-nums`) => CLS 0.
- Ticking text every 1s is not animated transform, but still motion-ish for vestibular/attention => skip under reduce (WCAG 2.2.2 pause/stop/hide: <5s rule doesn't apply; aria-hidden + static fallback + stops at 0 => acceptable; add no auto-restart).
- Script must follow lifecycle: bind on `astro:page-load`, clear interval on `astro:before-swap` (ClientRouter).
- `site-header.astro` at 194 lines: adding one `navItems` entry (+1 line) OK; no other header changes.
- Availability: single source `siteConfig.availability` (hero already uses it after phase 02).

## Requirements
- Functional: h1 "Recruiter speedrun"; name/role/level/title; availability status pill (open/limited/closed text); 3 achievement cards (metric value + unit large, label, quest title link to detail); primary CTA `mailto:` "Email me", socials, ghost CTA "Full portfolio" -> `/`; countdown "01:00" -> "00:00" then "GG".
- Non-functional: everything readable no-JS / reduced-motion; axe 0 serious; Lighthouse >=95, CLS 0; <200 lines per file.

## Architecture
```
speedrun.astro (BaseLayout title "Speedrun | name")
 ├─ header: eyebrow "// speedrun", h1, identity line, availability pill, <span data-speedrun-countdown aria-hidden>01:00</span>
 ├─ ol.achievements (role=list) > GlassCard as="li" data-reveal  x <=3   (state.achievements)
 └─ CTAs: NeonButton mailto / NeonButton ghost withBasePath('/') + socials
src/scripts/speedrun-countdown.ts
  on astro:page-load: el = [data-speedrun-countdown]; if !el or reduce => return
                      start = performance.now(); interval 1s -> render remaining; at 0 => "GG", clear
  on astro:before-swap: clearInterval
```
Countdown seconds from `xpRules.speedrun.countdownSeconds` via `data-seconds` attr (no import of rules in client bundle).

## Related Code Files
Create:
- `/home/user/portfolio-app/src/pages/speedrun.astro`
- `/home/user/portfolio-app/src/scripts/speedrun-countdown.ts`
Modify:
- `/home/user/portfolio-app/src/components/site-header.astro`: `navItems` + `{ label: 'Speedrun', href: withBasePath('/speedrun/') }`
- `/home/user/portfolio-app/src/components/sections/hero-section.astro`: 3rd CTA `NeonButton variant="ghost" href={withBasePath('/speedrun/')}` "60s recruiter view"

## Implementation Steps
1. `speedrun.astro` reading `loadCareerState()` (achievements, level, title) + `siteConfig`.
2. Availability pill: status text visible (not color-only); `open` cyan dot reuse hero `.status-dot` styles (copy minimal CSS or extract shared class to `effects.css` if used twice — DRY: move `.status-dot` to `effects.css`).
3. Achievement cards: value `<p class="achievement-value neon-text">` (large display text => gradient allowed), label, quest link.
4. Countdown element static text `01:00` server-rendered; script import inside page `<script>` tag.
5. `speedrun-countdown.ts`: matchMedia reduce check; `setInterval` with drift-safe computation; idempotent (clear existing before bind); try/catch logs + leaves static text.
6. Header nav item; hero CTA.
7. Build; test `/speedrun/` no-JS, reduced motion, 360px.

## Todo List
- [ ] speedrun.astro
- [ ] availability pill (+ `.status-dot` to effects.css)
- [ ] achievement cards
- [ ] speedrun-countdown.ts lifecycle-safe
- [ ] header nav + hero CTA
- [ ] build + manual checks

## Success Criteria
- `/portfolio-app/speedrun/` 200 in preview; 3 achievements with placeholder content (boss has >=2 metrics so 3 fill even if featured count low).
- Countdown never alters layout (CLS 0) and is absent from a11y tree.
- Soft-nav away/back: no duplicate intervals, no console errors.

## Risk Assessment
- Fewer than 3 metrics in content => render what exists; phase 01 handles gracefully.
- Hero gets 3 CTAs => wraps at 360px (flex-wrap present); verify no h-scroll.
- Header >200 lines => if exceeded, extract nav items array to `src/data/site-config.ts` `nav` (single source).

## Security Considerations
- `mailto:` from config; socials external with `rel="noopener noreferrer"`. No third-party scripts.

## Next Steps
- Phase 08: speedrun e2e (clock), axe, Lighthouse.
