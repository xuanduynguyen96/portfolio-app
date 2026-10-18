# 04: Phase 06 verification

Date: 2026-10-18. Branch `feat/github-derived-character` @ 79a15a8.

## Automated
| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings |
| `npm run test:unit` | 231 pass |
| `npm run test:e2e` | 94 pass (incl. axe both themes on /, boss + derived project, /speedrun/, /changelog/, /credits/, 404; forced colors; no-JS; reduced motion; 360px) |
| Determinism | `CAREER_RPG_NOW=2026-10-19` build twice → `diff -r` empty |
| Client JS | 138,013 B master → 138,013 B branch (zero new JS) |
| Home HTML gzip | 10,273 → 13,640 B (+3.4 KB, budget 6 KB); /speedrun/ +1.6 KB; /credits/ +7.8 KB (14-avatar gallery) |
| Avatar SVG (all 4,096 combos, 192px) | static ≤ 5.3 KB raw; animated ≤ 10.2 KB raw, ≤ 1.9 KB gzip (budget gzip 2.5 KB; raw ceilings 6/11 KB as regression guards) |
| Colors per avatar | ≤ 16 + sticker ring (test-enforced) |
| Silhouettes (pure jobs, tier 0 + tier 3) | cross-class IoU ≤ .80 full / ≤ .85 half size; jobs within a class differ ≥ 12 px |

## Lighthouse 12.8.2 (local preview, fixed build date)
| Page | Mobile perf/a11y/bp/seo | Desktop | CLS (m/d) |
|---|---|---|---|
| / | 99/100/100/100 | 100/100/100/100 | 0.002 / 0.001 |
| /projects/portfolio-app/ | 99/100/100/100 | 100/100/100/100 | 0.001 / 0.000 |
| /speedrun/ | 99/100/100/100 | 100/100/100/100 | 0.001 / 0.001 |
| /credits/ | 99/100/100/100 | 100/100/100/100 | 0.000 / 0.000 |
Home mobile CLS was 0.011 (nameplate + data note reflowing on late web fonts beside the avatar); fixed by keeping the side caption shorter than the avatar and moving the data note after the CTAs. Master: 0.000.

## Contrast (from token hexes, see design-tokens.css comment)
Outline vs sticker ring 4.06 light / 14.97 dark; ring vs page bg 3.35 / 17.59. Nameplate/legend text uses existing AA text tokens.

## Accessibility notes
- Avatar: `role=img`, name = "Class · Job" (aria-labelledby title), gear in `aria-describedby` desc; visible nameplate + gear legend + why panel carry the same meaning as text.
- Action loop: ~4.5 s (5 × 900 ms) then frame A (WCAG 2.2.2); only with `html[data-motion=ok]` and no reduced-motion preference; no-JS = frame A.
- Forced colors: `forced-color-adjust: none` on the avatar (e2e checks fills keep > 4 colors); sticker ring separates it from any background.

## Not done here (needs owner / GitHub)
- Refresh workflow live runs (needs merge to master: workflow_dispatch only works on the default branch): (a) dispatch → commit + deploy, (b) same week → no commit + deploy, (c) `dry_run_no_token` → warning, exit 0.
- Human blind-ID (≥ 5 people, 128px, ≤ 2 s, ≥ 80% class correct): use `node scripts/render-avatar-sheet.ts` sheet or assets/05-avatar-sheet.png.
- Seed snapshot still counts `.claude/` Python (spike data): first live refresh after merge corrects it (`.gitattributes`).

## Unresolved
- Branch protection on master (bot push) unknown.
