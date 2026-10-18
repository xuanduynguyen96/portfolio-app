# Phase 04: Integration: hero + character sheet

## Context Links
- Parent: [plan.md](plan.md) · Depends on: 03 · Blocks: 05
- Inputs: [report 01](reports/01-scout-and-baseline-report.md) (DOM facts), phase 02 hooks (`data-tryon-avatar`, `data-tryon-name`, `data-tryon-class|job|badge`)
- Docs: `docs/design-guidelines.md#character-avatar`, `docs/code-standards.md#component-conventions`

## Overview
- Date: 2026-10-18 · Priority: P0 · Effort: S (3h) · Implementation: Not started · Review: Not started
- Tag the two real avatars and nameplates as try-on targets, mount the control in the character-sheet portrait panel, add the preview badge. Default render (no interaction, no JS) must stay byte-for-byte equivalent in text and size to v1.3 so existing e2e/Lighthouse results hold.

## Key Insights
- Targets today: hero `CharacterAvatar size=256 animate` + `CharacterNameplate` (in `figcaption`); sheet `CharacterPortraitPanel` -> `CharacterAvatar size=192` + `CharacterNameplate as="h3"`. `/speedrun/` header and `/credits/` gallery are separate components and are NOT tagged (out of scope; they keep showing the actual identity, also after soft nav).
- `character-avatar.astro` must stay pure markup + CSS: only an attribute is added (`data-tryon-avatar` on the wrapper `<span class="avatar">`); the script touches `svg > title|desc|g` only.
- Existing e2e asserts `.hero .nameplate-class` `toHaveText(title)` (Playwright reads `textContent`, hidden children included): the badge must be a SIBLING of `.nameplate-class`, never a child. Class/job spans get hooks (`data-tryon-class`, `data-tryon-job`); a plain space text node sits between them (collapsed whitespace is ignored by `toHaveText`).
- Control location: character sheet (hero at 360x640 must keep the name above the fold; `character-sheet-section.astro` is 153 lines and untouched, the panel is the right owner). The preview then shows in hero when the visitor scrolls up, flagged by the badge.
- Why panel ("Why Warrior?") and gear legend stay actual; the control's scope note says so. Not changed here (follow-up if confusing).

## Requirements
- Hero + sheet avatars/nameplates change together; default state identical to v1.3 output (same text, same 288/216 px SVG boxes).
- Preview badge ("Preview · try-on") appears by BOTH nameplates when the look is not the actual one; hidden otherwise; text, not colour-only.
- Control mounted once, in the portrait panel details column, above the gear legend.
- No change to `index.astro`, `base-layout.astro`, speedrun, credits, data files.

## Architecture
```
hero-section.astro ── CharacterAvatar(256, animate, tryon) + CharacterNameplate(level, tryon)     [targets]
character-portrait-panel.astro ── CharacterAvatar(192, tryon) + CharacterNameplate(as h3, tryon)  [targets]
                               └─ .portrait-details: ClassTryonSwitcher(character) → GearLegend → ClassWhyPanel → GithubDataNote
```
```astro
<!-- character-nameplate.astro (tryon) -->
<div class="nameplate" data-tryon-name={tryon ? '' : undefined}>
  <Tag class="nameplate-class hud-text"><span data-tryon-class>{character.className}</span>{' '}<span class="nameplate-job" data-tryon-job hidden={!character.jobName}>{character.jobName ? `· ${character.jobName}` : ''}</span></Tag>
  {tryon && <p class="tryon-badge hud-text pixel-frame" data-tryon-badge hidden>{TRYON_BADGE_TEXT}</p>}
  {level && <p class="nameplate-level hud-text">…</p>}
</div>
```

## Related Code Files
Modify:
- `/home/user/portfolio-app/src/components/avatar/character-avatar.astro` (prop `tryon?: boolean` -> `data-tryon-avatar`; fix header comment "zero client JS")
- `/home/user/portfolio-app/src/components/career-rpg/character-nameplate.astro` (prop `tryon?`, hooks, badge + style)
- `/home/user/portfolio-app/src/components/sections/hero-section.astro` (pass `tryon` to avatar + nameplate)
- `/home/user/portfolio-app/src/components/career-rpg/character-portrait-panel.astro` (pass `tryon`, mount `ClassTryonSwitcher`)
- `/home/user/portfolio-app/src/utils/avatar/avatar-svg-markup.ts` (comment only: "zero client JS" header)
Read: `src/components/career-rpg/quest-tier-badge.astro` (chip style tokens), `src/styles/effects.css`, `tests/e2e/character-avatar.spec.ts`, `character-sheet-and-hud.spec.ts`.

## Implementation Steps
1. Baseline from phase 00 scratch build: `dist/index.html` text + SVG box sizes (hero 288, sheet 216) and gzip 13,452 B.
2. `character-avatar.astro`: add `tryon` prop and the attribute; no markup/CSS change otherwise.
3. `character-nameplate.astro`: hooks + sibling badge (framed chip, tokens only, Pixelify, >= 14px, wraps under 360px, `text-wrap: balance`); the job span `hidden` for Adventurer (no job).
4. Hero + portrait panel: pass `tryon`; mount the control in `.portrait-details`.
5. `npm run check`, `npm run test:unit`, `npm run test:e2e` unchanged-green (231 unit + new, 94 e2e).
6. `astro build`: diff `dist/index.html` vs baseline: only the control markup, 2 attributes x 2, 2 hidden badges, one script reference (inline or `_astro` file); gzip growth <= 2 KB.
7. Visual check 360x640 and 1280x800, light/dark, default + one preview (e.g. Mage · Sorcerer, Archer · Arcane Archer for longest name), hero layout at 360 with preview (badge wrap), screenshots into `reports/assets/`.

## Todo List
- [ ] `tryon` prop on avatar + nameplate
- [ ] hero + portrait panel wired, control mounted
- [ ] default-state parity (text, boxes) confirmed
- [ ] HTML gzip growth measured (<= 2 KB)
- [ ] screenshots 360/1280, light/dark, default + preview

## Success Criteria
- Existing 94 e2e + 231 unit pass untouched
- Hero and sheet show the same preview simultaneously; badge text appears in both, hidden by default
- `/speedrun/` and `/credits/` avatars unaffected after previewing and soft-navigating
- No new class names in global CSS; scoped styles; files < 200 lines

## Risk Assessment
- Nameplate edit breaks `toHaveText(title)` -> badge is a sibling; run `character-avatar.spec.ts` first.
- Long names ("Archer · Arcane Archer") wrap in the 360px hero caption -> user-initiated, nowrap on the job span already; verify visually, no reserve needed.
- Reduced hero space on small screens: control lives below the fold in the sheet, so hero height is unchanged.

## Security Considerations
- Only static attributes added; badge text constant from `tryon-labels.ts`; no new external links, no user data rendered.

## Next Steps
- 05 verification. Unresolved: plan Q2/Q3 (hero entry point, reset in hero).
