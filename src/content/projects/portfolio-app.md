---
# TODO(content): agent draft from this repo's history; owner to review wording and metrics before launch.
title: RPG Portfolio
summary: This site. An Astro portfolio that reads my public GitHub, picks my RPG class, job and gear, and draws the character as a pixel sprite.
isBoss: true
obstacles:
  - Turning public repos into a class people can read at a glance, without hand-picking the answer
  - Keeping the build deterministic and offline while the data comes from the GitHub API
  - Making a pixel avatar readable at 32px in both themes, with motion that respects user settings
metrics:
  - { label: End-to-end tests, value: 86 }
  - { label: GraphQL points per weekly refresh, value: 8 }
---

## Overview

This portfolio is a small role-playing game about my own work. Instead of a hand-written skills list, a weekly job reads my public GitHub profile, keeps only public repositories, and commits a normalized snapshot. The build then turns that snapshot into a character: a class (Warrior, Mage or Archer), a job from my second strongest area, and gear tiers for security, testing, automation and documentation.

## The problem

Self-reported skill bars say little. I wanted the page to show evidence, and to stay honest when the evidence is thin. The hard parts were privacy, because the repository is public, determinism, because a build must not depend on the network, and readability, because a tiny sprite has to say "warrior" before anyone reads a label.

## What I did

A dependency-free fetch script runs in a separate workflow job before any npm code, so the write token never meets third-party packages. A pure normalizer drops private repos twice and rounds dates to ISO weeks. The classifier gives every repository at most one vote, weighted by recency and activity, and explains its answer. The avatar is composed at build time from hand-drawn layers into one inline SVG.

## Highlights

- Class, job and gear derived from public repositories, with the reasons listed
- Weekly refresh that never fails the deploy and never stores private data
- Inline SVG sprite with a two-frame action loop that stops for reduced motion
