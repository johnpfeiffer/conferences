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
- The conference selector is prominently labeled, displays each event's date in
  its choices, and is the only event-switching control in the top-right area.
- UNLOCK's default landing restores its bespoke original presentation: oversized
  editorial typography, mint and acid accents, a framed transcript-grounded
  conversation, numbered session rows, and the branded footer.
- WorkOS uses a light MUI presentation with violet-to-blue gradients, rounded
  controls, and layered system-status cards inspired by its source site.
- AI Engineer World's Fair uses a dark MUI presentation with a subtle grid,
  centered typography, and gold accents inspired by its source site.
- All presentation paths consume the same event/session models, route controller,
  retrieval, and grounded-chat behavior. Unknown future events retain a neutral
  generic MUI landing rather than inheriting another conference's identity.
- Loading states are visible, content uses at least 14px text, controls have
  visible boundaries, and the browser owns normal page scrolling.
- Event source and session video links are relative to the current application
  state only where they are internal; external sources remain direct links.

## Knowledge data

- Glossaries are associated with events, not with the entire archive.
- User-facing glossary entries describe people, organizations, and domain
  concepts. ASR variants, unresolved caption fragments, and correction notes
  belong to the transcript-fix workflow and are excluded from glossary terms
  and definitions.
- The merged knowledge graph includes all three events and all ten sessions.
