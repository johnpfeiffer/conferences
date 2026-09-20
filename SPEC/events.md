# Multi-event transcript archive specification

This document is derived from `KERNEL/INVARIANTS.md`,
`KERNEL/requirements-v2.md`, and `KERNEL/DESIGN.md`. The kernel remains the
authority if this interpretation is incomplete or incorrect.

## Event model

- The archive contains `UNLOCK 2026`, `WorkOS Agent Night`, and
  `AI Engineer World's Fair`.
- `/` (and the deployed `/conferences/` equivalent) opens UNLOCK 2026.
- Every event has a stable slug, type, official source URL, landing-page copy,
  event-scoped glossary, and one or more sessions.
- UNLOCK 2026 has eight sessions. WorkOS Agent Night and AI Engineer World's
  Fair initially have one session each.
- Event routes use `/events/:eventId`; session routes use
  `/events/:eventId/talk/:sessionId`. Existing UNLOCK `/talk/:sessionId` links
  remain valid.

## Grounding

- Every session carries an original transcript, fixed transcript, and source
  video URL (INV-001).
- Retrieval is scoped to the active event so a landing-page answer cannot
  silently mix unrelated events.
- Answer citations resolve to source cards whose links include the cited video
  timestamp (INV-002).
- The reader defaults to the fixed transcript and can reveal the original
  wording line by line.

## Presentation

- Navigation between events is available from every landing and reader view.
- Each landing is a light-mode, minimal homage to its official source while
  using MUI components and defaults.
- Loading states are visible, content uses at least 14px text, controls have
  visible boundaries, and the browser owns normal page scrolling.
- Event source and session video links are relative to the current application
  state only where they are internal; external sources remain direct links.

## Knowledge data

- Glossaries are associated with events, not with the entire archive.
- The merged knowledge graph includes all three events and all ten sessions.

