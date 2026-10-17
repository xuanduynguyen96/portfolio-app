---
# TODO(content): placeholder project. Metrics and evidence must be real before launch.
title: Realtime Chat
summary: Lightweight chat app with presence indicators, optimistic updates and end-to-end typed events.
tags: [Node.js, WebSockets, TypeScript]
cover: ../../assets/projects/realtime-chat-cover.svg
coverAlt: Chat bubbles in cyan and magenta outlines on a dark purple background
order: 2
difficulty: main
skills: [nodejs, typescript]
obstacles:
  - Messages arrived out of order after flaky mobile reconnects
metrics:
  - { label: Median send-to-render, value: 45, unit: ms }
evidence:
  - { type: repo, url: 'https://github.com/xuanduynguyen96' }
---

## Overview

A small, fast chat application focused on perceived performance: messages appear instantly and reconcile with the server in the background.

## The problem

Chat feels broken the moment a message hesitates. Early prototypes waited for a server round trip before showing anything, and on unstable mobile connections reconnects replayed events in the wrong order, so conversations visibly reshuffled. Presence was polled, which wasted battery and still lagged behind reality.

## What I did

Every event type is defined once in a shared, typed protocol used by both client and server, so a mismatch fails at compile time instead of in production. Messages render optimistically with a client id and are reconciled when the server acknowledges them. Each event carries a sequence number; the client buffers gaps and applies events strictly in order after a reconnect. Presence and typing indicators ride the same socket with short expiry timers rather than polling.

## Highlights

- Typed event protocol shared by client and server
- Presence and typing indicators
- Reconnect with exponential backoff
