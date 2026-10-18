# 03: Classifier dry-run (committed seed snapshot)

Date: 2026-10-17. Command: `npm run character:explain`. Params: half-life 48 mo (user: go ahead with default), public repos only.

```
xuanduynguyen96 as of 2026-10-12: Warrior · Vanguard
scores backend 3.396 | data 0.118 | frontend 2.661
primary backend, secondary frontend, motif frontend

Per repo (weighted vote):
  aspnet_framework_docker_ex     b 0.532  d 0.000  f 0.000
  MiniWebServer                  b 0.670  d 0.000  f 0.000
  online-resume                  b 0.011  d 0.000  f 0.659
  PersonalPortfolio              b 0.092  d 0.000  f 0.410
  portfolio-app                  b 0.235  d 0.118  f 0.858
  QrCodeScanner                  b 0.245  d 0.000  f 0.283
  ShopDemo                       b 0.241  d 0.000  f 0.451
  spring-jenkins                 b 0.722  d 0.000  f 0.000
  WeatherApp                     b 0.647  d 0.000  f 0.000

Why (signals):
  backend   0.722  spring-jenkins: Java 100% of code, keyword "api", keyword "spring"
  backend   0.670  MiniWebServer: C# 100% of code, keyword "server"
  backend   0.647  WeatherApp: C# 100% of code
  backend   0.532  aspnet_framework_docker_ex: keyword "aspnet", keyword "asp", keyword "mvc"
  backend   0.245  QrCodeScanner: C# 100% of code
  frontend  0.858  portfolio-app: TypeScript 38% of code, Astro 17% of code, JavaScript 13% of code, keyword "portfolio"
  frontend  0.659  online-resume: HTML 61% of code, CSS 28% of code, JavaScript 11% of code, keyword "resume"

Gear:
  Armor   Security    tier 0  -
  Shield  Testing     tier 1  portfolio-app
  Boots   Automation  tier 2  aspnet_framework_docker_ex, portfolio-app, spring-jenkins
  Amulet  Docs        tier 0  -
```

## Notes
- Matches spike: **Warrior · Vanguard** (backend 3.40 vs frontend 2.66; ratio .78 >= .35 → frontend motif).
- `portfolio-app` data 0.118 = `.claude/` Python still counted in the seed (spike data). `.gitattributes` (phase 01) fixes it after merge + linguist re-index; first live refresh corrects the seed. Expected after fix: data 0, frontend slightly up; class unchanged (backend margin ~0.6).
- Gear: Armor 0 (no SECURITY.md/dependabot/CodeQL), Shield 1 (portfolio-app `tests/`), Boots 2 (portfolio-app workflow, `spring-jenkins` + `aspnet_framework_docker_ex` keywords), Amulet 0 (no repo with 3 docs signals; portfolio-app has README + docs/, adding a description or license → tier 1).
- Languages stored as exact bytes (was KiB floor: dropped spring-jenkins' <1 KiB Java vote).

## Unresolved
- None blocking. Owner can raise Armor/Amulet with repo hygiene (SECURITY.md, description, license, topics) — HUD hints in phase 03.
