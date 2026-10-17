# Phase 07: Opt-in chiptune SFX (optional)

## Context Links
- Parent: [plan.md](plan.md) · Depends on: [01](phase-01-tokens-and-theme-infrastructure.md) (header-controls), [03](phase-03-pixel-icon-system.md) (sound icons), [04](phase-04-surfaces-and-core-components.md) (button/nav done) · Parallel with: [05](phase-05-career-rpg-components-restyle.md), [06](phase-06-motion-adaptation.md) (06 also edits `neon-button`/header → do 07 attr edits after 06 or coordinate one-line merges)
- Research: [researcher-02 §2.4 SFX](research/researcher-02-theme-fonts-sfx-report.md) (no `prefers-reduced-sound` exists [V])
- Refs: MDN Web Audio API, autoplay policy (AudioContext starts suspended until gesture)

## Overview
- Date: 2026-10-17 · Priority: P2 · Effort: M (4h) · Implementation: Deferred (user decision 2026-10-17; not built) · Review: N/A
- Header "Sound effects" toggle, muted by default, persisted. When on: tiny synthesized square/triangle bleeps (OscillatorNode + GainNode envelope) on select/open/confirm. Synth module lazy-loaded only after opt-in. Zero audio files.

## Key Insights
- Synth vs OGG: synth = ~1-2 KB JS, 0 downloads, fits 8-bit, no license; OGG (Kenney CC0) needs blocked download + decode + Safari codec check. Synth wins (KISS).
- No `AudioContext` until user clicks toggle (gesture) → no autoplay warnings, testable by wrapping constructor.
- Persisted "on" after reload: no gesture yet → create context lazily on first `click` that triggers a cue (click is a gesture).
- Default off covers reduced-motion users (no reduced-sound feature; don't design around one).
- ClientRouter: keep `AudioContext` + delegated listeners in module scope, bound once (`document` survives swaps); toggle button re-synced on `astro:page-load`.
- Delegation via `data-sfx="select|open|confirm"` hooks (code-standards: data attributes). `<details>` `toggle` event doesn't bubble → capture listener.

## Requirements
- Functional: toggle `button[data-sfx-toggle][aria-pressed]`, name "Sound effects"; on → plays `confirm`; off → silence + `ctx.suspend()`; pref `localStorage['rpg-sfx'] = 'on'|'off'` (try/catch); cues on `[data-sfx]` click and details open; none when `document.hidden`.
- Non-functional: synth module not requested until enabled (separate chunk via dynamic `import()`); master gain <=0.08; cue <=150ms; no-JS → toggle hidden; >=44px target.

## Architecture
```
header-controls.astro ─ sfx-toggle.astro (button + sound-on/off icons, hidden w/o JS)
scripts/sfx-toggle.ts (eager, tiny): read pref → aria-pressed; click → set pref → import('./sfx/chiptune-synth')
                                     → synth.unlock() (new AudioContext in gesture) → play('confirm')
                                     binds once: document click [data-sfx] → play(cue); details toggle (capture) → play('open')
                                     visibilitychange → synth.suspend()/resume()
scripts/sfx/chiptune-synth.ts (lazy chunk): CUES = { select: [[880, .04]], open: [[660,.05],[990,.06]], confirm: [[523,.05],[659,.05],[784,.08]] }
                                     play(name): per note OscillatorNode('square') → GainNode (attack 5ms, exp decay) → master → destination
```
```ts
export function createSynth() {
  const ctx = new AudioContext(); const master = ctx.createGain(); master.gain.value = 0.08; master.connect(ctx.destination);
  const play = (name: CueName) => { if (document.hidden) return; let t = ctx.currentTime;
    for (const [freq, dur] of CUES[name]) { const osc = ctx.createOscillator(); const env = ctx.createGain();
      osc.type = 'square'; osc.frequency.value = freq; env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(1, t + 0.005); env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(env).connect(master); osc.start(t); osc.stop(t + dur + 0.01); t += dur; } };
  return { play, suspend: () => ctx.suspend(), resume: () => ctx.resume() };
}
```

## Related Code Files
Create:
- `/home/user/portfolio-app/src/components/sfx-toggle.astro`
- `/home/user/portfolio-app/src/scripts/sfx-toggle.ts`
- `/home/user/portfolio-app/src/scripts/sfx/chiptune-synth.ts`
- `/home/user/portfolio-app/tests/e2e/sound-effects-toggle.spec.ts`
Modify:
- `/home/user/portfolio-app/src/components/header-controls.astro`: mount `<SfxToggle />`
- `/home/user/portfolio-app/src/components/neon-button.astro`: `data-sfx="select"`
- `/home/user/portfolio-app/src/components/site-header.astro`: `data-sfx="select"` on nav links
- `/home/user/portfolio-app/src/components/theme-toggle.astro`: `data-sfx="confirm"`

## Implementation Steps
1. `chiptune-synth.ts` as above; `type CueName = keyof typeof CUES`; guard missing `AudioContext` (return no-op synth).
2. `sfx-toggle.ts`: `let synth: Synth | null = null; let enabled = readPref();` `ensureSynth = async () => (synth ??= (await import('./sfx/chiptune-synth')).createSynth())`. Bind document listeners once (`if (bound) return`). Cue path: `if (!enabled) return; (await ensureSynth()).play(cue)`. Toggle click: flip, write pref, sync `aria-pressed` on all `[data-sfx-toggle]`, on → `play('confirm')`, off → `synth?.suspend()`.
3. `sfx-toggle.astro`: button + both icons (CSS swaps by `aria-pressed`), visually-hidden "Sound effects"; hidden under `:root:not([data-theme])` (JS-ran flag from 01).
4. Add `data-sfx` attrs (4 files). Confirm theme toggle click with SFX on plays once (not twice: toggle's own `data-sfx` ok; sfx toggle has none).
5. e2e `sound-effects-toggle.spec.ts`: init script wraps `window.AudioContext` counting constructions; (a) default `aria-pressed=false`, click CTA/nav/open details → count 0, no request for synth chunk (`page.on('request')` filter `chiptune-synth`); (b) click toggle → pressed true, count 1, chunk requested; (c) reload → still pressed, count 0 until a `[data-sfx]` click; (d) soft nav → toggle state kept, no second context; (e) no-JS → toggle hidden; (f) storage throwing → default off, no errors.
6. check/unit/e2e; manual listen (headed Chromium) for click/pop artifacts; tune envelope.

## Todo List
- [ ] chiptune-synth (lazy chunk)
- [ ] sfx-toggle script (pref, delegation, visibility)
- [ ] sfx-toggle component + header mount
- [ ] data-sfx hooks
- [ ] e2e spec 6 cases
- [ ] manual listen + suite green

## Success Criteria
- Default path: 0 `AudioContext`, 0 synth chunk requests (spec a)
- Opt-in works across reload + soft nav; no console errors; Lighthouse BP unchanged (no autoplay warnings)

## Risk Assessment
- Vite inlines tiny dynamic import into main chunk → verify separate chunk in `dist/_astro`; if inlined, accept (still no AudioContext) and relax spec to constructor count only.
- iOS silent switch mutes Web Audio → acceptable (decorative).
- Annoyance → low gain, short cues, only on explicit actions (not hover).

## Security Considerations
- No network audio; pref whitelisted (`on|off`); no eval/innerHTML.

## Next Steps
- 08 credits: "Sounds synthesized in-browser (own work)"; 09 docs (data-sfx hooks, lifecycle).
