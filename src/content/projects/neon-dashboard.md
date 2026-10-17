---
# TODO(content): placeholder project. Metrics, obstacles and evidence must be real before launch.
title: Neon Analytics Dashboard
summary: Real-time analytics dashboard with animated charts, keyboard-first navigation and a themeable design-token system.
tags: [TypeScript, Astro, GSAP, D3]
cover: ../../assets/projects/neon-dashboard-cover.svg
coverAlt: Dark dashboard layout with a cyan-to-magenta line chart, bar chart and ring gauge
featured: true
order: 1
difficulty: raid
isBoss: true
skills: [typescript, astro, gsap, design-systems]
obstacles:
  - Charts re-rendered on every tick and dropped frames under load
  - Screen readers announced nothing when live values changed
metrics:
  - { label: Interaction latency cut, value: 62, unit: '%' }
  - { label: Layout shift score, value: 0, unit: CLS }
  - { label: Chart JS shipped, value: 38, unit: KB }
evidence:
  - { type: repo, url: 'https://github.com/xuanduynguyen96' }
---

## Overview

A dashboard that streams metrics and renders them with smooth, GPU-friendly animations. Every chart is navigable by keyboard and announces updates to screen readers.

## The problem

The first version redrew every chart on every incoming data point. With a dozen widgets on screen the main thread was saturated, frames were dropped and the page felt sluggish exactly when people needed it most: during incidents, when numbers move fast. The charts were also silent for assistive technology, so a blind operator had no way to notice that a value crossed a threshold.

## What I did

I moved rendering to a batched update loop that coalesces ticks per animation frame and only animates transform and opacity. Chart geometry is computed once and interpolated, so a new value never forces layout. A polite live region summarises significant changes instead of reading every number. Colours, spacing and motion timing come from shared design tokens, so charts and the surrounding interface always match and can be re-themed in one place.

## Highlights

- Live updates without layout shift
- Motion that respects `prefers-reduced-motion`
- Design tokens shared between charts and UI
