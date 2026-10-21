# Report 02: spike decision (phase 00)

Date: 2026-10-21 · Branch `feat/distinct-job-art` · Verdict: **GO** (user ran `/code` with the plan's defaults for open questions 1-8)

## Defaults applied (open questions)
| Q | Decision |
|---|---|
| 1 overlap | Policy **S**: 1 px gap from body, gear (all tiers), identity boxes; no overlap |
| 2 budgets | lazy chunk gz <= 6,000 B, raw <= 23,000 B; eager stub gz <= +100 B; home HTML gz <= +1,000 B; animated raw ceiling stays 11,264 B unless an Archer look needs 12,288 B (flag then) |
| 3 UI tint | No: sprites only |
| 4 colour cap | Keep 16 |
| 5 Mage 6x19 | Accepted |
| 6 legacy keys | One-time reset (no migration map) |
| 7 version/branch | v1.6, 2026-10-21, `feat/distinct-job-art` |
| 8 metaphors | Proceed; Ranger atom drawn with 2 orbits, Herald `</>` generic, Knight crest has no sharp glyph (plain cross) |

## Baseline (this checkout, `npm ci` + `npm run build`, HEAD 2943738)
| Metric | Raw | Gzip -9 | Doc said |
|---|---|---|---|
| `dist/index.html` | 111,756 | 13,515 | 112,855 / 13,790 |
| `dist/credits/index.html` | 99,691 | 12,832 | - |
| eager stub `class-job-switcher*.js` | 6,944 | 2,992 | 6,457 / 2,826 (pre-v1.5) |
| lazy chunk `look-apply-model*.js` | 18,040 | 4,580 | 18,120 / 4,627 |

Unit 279/279 green. Golden digest `120 grids, sha256 f642d3a8...9d83f7` reproduced. Re-baselined thresholds: lazy gz <= 6,000; stub gz <= 3,092; home gz <= 14,515.

## Zones (`measure-prop-zones.ts`, identical to report 01)
Policy S, inclusive boxes = future `JOB_PROP_ZONES`:
- warrior `{x0:23,y0:0,x1:31,y1:13}` (9x14)
- archer `{x0:23,y0:0,x1:31,y1:12}` (9x13)
- mage `{x0:26,y0:7,x1:31,y1:25}` (6x19)

## Accents (keys + hexes)
Seer moved `#e0527a` -> `#c74bd0` (orchid): skirmisher/seer was dE 19.1.
| Job | Key | Hex | vs outline |
|---|---|---|---|
| knight | A | #8b6fd6 | 4.07 |
| paladin | B | #5aae5c | 5.83 |
| sentinel | C | #4a8fd9 | 4.74 |
| ranger | D | #2fb8d4 | 6.80 |
| skirmisher | E | #d9559b | 4.36 |
| herald | F | #ee7c36 | 5.77 |
| enchanter | H | #b9c93a | 8.75 |
| summoner | J | #c4694a | 4.17 |
| seer | M | #c74bd0 | 4.07 |
Gate: min pairwise dE 25.1 (herald/summoner) >= 20; inside a class 33.2 (knight/sentinel) >= 30; all >= 3:1 vs outline. PASS.

## Trim masks (opaque class pixels recoloured to the accent, z 15 under gear)
Plan's belt candidates rejected: armor's bottom row (belt line) covers the belt on all 3 classes.
- warrior f0: tabard flap (12,23)(13,23)(12,24)(13,24)(11,25)(12,25)(13,25); f1: (12,24)(13,24)(12,25)(13,25)
- archer f0+f1: tunic yoke row 19 x11-19 + left edge x11 rows 20-22 (12 px)
- mage f0: robe bands row 23 x10-21, row 27 x10-22; f1: row 23 x10-21, row 27 x10-22 (staff column x23-24 excluded)
All outside head/held boxes (phase 02 test enforces).

## Motion table (frame A = rest/static, frame B = delta)
| Job | Frame B |
|---|---|
| knight | shield glint moves along the rim |
| paladin | leaf sways, blade tip sparkles |
| sentinel | tower beacon/LEDs swap |
| ranger | electrons advance along both orbits |
| skirmisher | wing flaps, screen lights |
| herald | sound arcs out of the horn |
| enchanter | rune nodes rotate around the circle |
| summoner | crate lid lifts, puff rises |
| seer | eye blinks (A open, B closed) |

## Deviation
Filler prototype (step 4) skipped: real art follows in 03-05 and each batch is measured against the same thresholds (colour cap and animated byte budgets are unit tests; chunk/home sizes measured per batch and in 06). Compose CPU not re-measured (per-pixel constant, no new loops).

## Unresolved questions
None blocking.
