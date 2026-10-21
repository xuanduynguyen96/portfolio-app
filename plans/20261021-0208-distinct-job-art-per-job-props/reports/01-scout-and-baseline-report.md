# Scout + baseline: distinct job art (2026-10-21)

Read-only. HEAD `019e7bd` (v1.5 merged), tree clean, branch `master`. `node_modules/` absent in this checkout (phase 00 runs `npm ci`). Numbers below come from `reports/assets/measure-prop-zones.ts`, `check-accent-contrast.ts`, `hash-look-grids.ts` (all run with Node type stripping on pure modules, no build).

## 1. Where "job art" lives today (all anchors verified in code)
| Concern | Where |
|---|---|
| Prop id = job SLOT | `MOTIF_IDS = banner|crystal|hawk` + `JobDefinition.motif` in `src/data/character-job-rules.ts` (Knight/Ranger/Enchanter = banner, etc.) |
| Prop art | `src/data/avatar/avatar-job-motifs.ts` (19 lines): 3 props x 2 frames, 6x11, keys: banner `LRlry`, crystal `ax`, hawk `Lkloy` |
| Placement | `PoseAnchors.motif` per class pose frame: warrior (23,1)/(23,2), archer (23,1)/(23,1), mage (26,4)/(26,4), adventurer (23,1)/(23,0) (unused: no job) |
| Layer | `select-avatar-layers.ts`: `if (look.motif) layers.push(at('job', anchors.motif, motifSprites[look.motif][frame]))`; `LAYER_Z` job 50, fx 60 (fx unused) |
| Look key | `class-looks.ts`: `ClassLook {classId, motif}`, key `class/motif` (`mage/hawk`), `MOTIF_IDS` is the valid set for EVERY combat class; `changeClass` keeps the slot (motif), `changeMotif` |
| Switcher | `class-job-switcher.ts` (`parseMotif`, `changeMotif`, `look.motif`), `switcher-body.ts` (radio `value=motif`) |
| Text | `avatar-description.ts`: ` Job prop: ${profile.motif}.` (prints "banner") |
| Profile | `CharacterProfile.motif` (redundant: `jobId: string | null` already exists), `classify-character.ts` L76/L90 |
| Tests asserting 3 motifs | `avatar-sprites` (6x11 box, identity boxes), `avatar-silhouette` (per-motif IoU, within-class >= 12 px), `class-looks`, `class-labels`, `character-rules` (L27), `classify-character` (L108/126), `compose-avatar-grid` (L55/79/94/107), `avatar-svg-paths` (L61), `look-avatar-model` (L17), helpers `avatar-test-helpers` (`LOOK_KEYS`) |
| e2e touching motif ids | `switcher-helpers.ts` (L22 `jobRadio`, L40), `class-job-switcher.spec.ts` (L12/45/62-70), `class-job-switcher-quality.spec.ts` (L10), `page-navigation-lifecycle.spec.ts` (L67-98) |
| Docs mentioning slots | code-standards L151/163, design-guidelines L113, system-architecture L75/82-84/101/111/146, codebase-summary L56/59/110, PDR L57/70/122, roadmap |
| Not code | no `MOTIF_PROP_NAMES` exists (docs claim it); `credits-data.ts` note is generic; credits gallery and sheet script already iterate `allClassLooks()` |

Existing tests do NOT check gear-vs-prop collision (only prop vs identity boxes). Gear is z 20-40, prop z 50, so a collision would silently paint the prop over gear. New test needed (phase 02).

## 2. Free zones per class pose (gear tier 3 = worst case, both frames, + identity boxes)
Largest free rectangle, union of frame A and B. "gap 1" = prop keeps >= 1 empty px from body/gear/identity so the composer's 1px outline separates silhouettes (today's props sit at x=23 with the body ending x<=21/22, i.e. gap 1).
| Class | gap 0 (touching allowed) | gap 1 (recommended) | Free zone |
|---|---|---|---|
| Warrior | 10 x 15 @ (22,0); 6 x 32 @ (26,0) | **9 x 14 @ (23,0)**; 5 x 32 @ (27,0) | back/top-right: head box ends x21, shield starts y15 |
| Archer | 10 x 14 @ (22,0) (zero slack); 8 x 16 @ (24,0) | **9 x 13 @ (23,0)**; 8 x 14 @ (24,0); 6 x 15 @ (25,0) | same; cape/bow on the left, shield y16+ |
| Mage | 6 x 29 @ (26,3); 7 x 21 @ (25,6); 8 x 11 @ (0,21) | **6 x 19 @ (26,7)**; 5 x 28 @ (27,4); 7 x 10 @ (0,22) | staff (x23-24, y6-28) + orb box (x22-25, y0-5) squeeze the right strip to 6 px; second zone: floor in front of the boots |
| Adventurer | n/a (no job) | n/a | n/a |

Conclusions: the brief's "~10 x 14" holds only for Warrior/Archer with gap 0; with gap 1 it is 9 x 14 / 9 x 13. Mage props are a tall narrow 6-wide column unless the overlap policy changes (open question). Area vs today (66 px box): Warrior 126, Archer 117, Mage 114 (about 1.8x). Warrior frame B body dips 1 px: a 1 px prop offset in frame B is allowed inside the 14-row zone (prop <= 13 rows when it bobs).

## 3. Colour cap (<= 16 colours per look, test `avatar-svg-paths`)
Keys incl. outline `o`, gear tier 3: warrior 11 (spare 5), archer 14 (spare 2), mage 14 (spare 2). Today `archer/banner` t3 and `mage/banner` already sit at exactly 16. Per-job accent adds 1 key per look, so: **new colours a prop may add beyond accent = warrior 4, archer 1, mage 1**. Mage props can be drawn entirely with keys the Mage already has (`ILSabciklosuxy`) plus the accent. Plan keeps the cap at 16 (open question: raise to 18).

## 4. Size baseline
Current animated markup (hero, size 256): max 10,015 B raw (archer/crystal t3) vs ceiling 11,264 B (headroom 1.2 KB); max gzip 1,859 B vs 2,560 B. Static (sheet, 192) max 5,214 B vs 6,144 B. A deliberately noisy synthetic prop (random 55-80% fill, worse than real art) gave animated raw: warrior 10.2-10.5 KB, mage 10.3-10.5 KB, **archer 11.4-11.6 KB (over the ceiling)**, gzip <= 2.14 KB. So raw ceiling may need 11 -> 12 KB for Archer; gzip budget holds.
Docs baseline (v1.4/v1.5, to re-measure in phase 00): eager stub 6,457 B raw / 2,826 B gz; lazy chunk 18,120 B raw / 4,627 B gz; home HTML 112,855 B raw / 13,790 B gz; Lighthouse mobile 99/100/100/100, CLS 0.0016; compose+apply 10-14 ms warm at 4x CPU.
Static art estimate for the lazy chunk: sprite rows today 639 B JSON (194 B gz); 9 props x 2 frames x <= 126 cells = <= 2.3 KB raw rows (+1.7 KB raw, roughly +0.5-0.7 KB gz) plus 9 palette entries, style map, trim masks (+0.3 KB gz) => predicted +0.8-1.0 KB gz.

## 5. Accent colours (provisional, `check-accent-contrast.ts`)
Art colours are one hex in both themes; only the ring switches (light `#9a7b52`, dark `#fbf7ee`, outline `#2a1f1d`). Any mid-tone accent has 1.0-2.2:1 against the light ring, so the real neighbour is the outline: all 9 candidates are 4.07-8.75:1 against `#2a1f1d` (gate >= 3:1). Against the dark ring 1.7-3.7:1 (informational). Lowest pairwise CIE76 distance 19.1 (skirmisher/seer, different classes; phase 00 nudges one hue to reach >= 20), lowest inside a class 33.2.

## 6. Trim (accent on outfit) candidates, pose rows verified
Warrior: tabard `r/R` below the belt (rows 22-25, x12-13, ~8 px, outside head/held boxes). Archer: belt row 23 (`LyyLLLLLLL`, x11-20, ~10 px); no distinct cape exists (bow limb on the left is the identity box). Mage: robe hem bands rows 26 and 29 (`I` runs x10-23/24, ~26 px); no cape. Hood/hat/plume/weapons are identity and stay untouched. Adventurer has no job, so no trim.

## 7. Golden digest for the refactor (phase 01)
`hash-look-grids.ts` on HEAD: 120 grids, sha256 `f642d3a8b5825837b18da966191bb7ace7ccc1f7b0180011de1f879cda9d83f7`. The job-keyed refactor must reproduce it exactly.

## Unresolved
Overlap policy; lazy-chunk ceiling; colour cap; Mage prop size; accent tint beyond the avatar (see plan.md).
