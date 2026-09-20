# Lessons from Conferences

A multi-event recap and transcript-grounded chat experience.

The archive currently includes UNLOCK 2026, WorkOS Agent Night, and AI Engineer
World's Fair. UNLOCK remains the default landing page; the event selector opens
the other event-scoped archives.

## Routes

| Route | View |
|---|---|
| `/` | UNLOCK 2026 landing page |
| `/events/2026-08-12-workos-agent-night` | WorkOS Agent Night landing page |
| `/events/aiewf` | AI Engineer World's Fair landing page |
| `/talk/:sessionId` | Backward-compatible UNLOCK transcript reader |
| `/events/:eventId/talk/:sessionId` | Event-scoped transcript reader |

The deployed `/conferences` prefix is detected automatically and retained in
internal links.

## How the chat works

- Supplied transcripts are bundled from their event directories under
  `app/src/data/`; UNLOCK's eight transcripts remain in `data/transcripts/`.
- `app/src/lib/retrieval.ts` breaks them into timestamped excerpts and selects relevant passages in the browser.
- Retrieval and chat are scoped to the active event. `app/src/lib/chat.ts`
  sends only selected excerpts to `/api/openai/chat/completions` without
  selecting a model or provider configuration.
- The shared backend supplies the OpenAI-compatible provider credentials, selects the model, and enforces the balanced completion window.
- Assistant citations jump to source cards that link to the cited video
  timestamp.

The deployment backend requires `OPENAI_API_BASE`, `OPENAI_API_KEY`, and
`OPENAI_MODEL`. These are server-only settings and must never be exposed through
Vite variables or browser code.


# To develop or build

Node.js 24.20.0 or later is required by the Vite/Vitest toolchain (see
`app/package.json` `engines`). Install dependencies and start the app with:

```bash
cd app
npm install
npm run dev
```

Build the production bundle with `npm run build` from `app/`.

# To test

Run `npm test` from the `app/` directory. The suite validates event data,
routing, transcript parsing/diffing, timestamped retrieval, chat request shape,
and the merged knowledge graph.

# To add data

To add an event or session, add its supplied transcript artifacts under
`app/src/data/` and register the event in `app/src/data/events.ts`. Every
session must have a video URL plus original and fixed transcript text.

The archive-wide knowledge graph lives in `app/src/data/graph` and is exported
through `app/src/data/graph/index.ts`. It merges domain graphs and cross-event
entities.

Glossaries are attached to their event in `app/src/data/events.ts`. UNLOCK's
biotech and AI term sets are presented together as its event glossary; the two
new events use the glossaries in their own data directories.

`app/src/data/proposed-transcript-fixes.json` records traceable correction proposals without changing the original transcript text.

Each session has a dedicated reading view that starts with the fixed transcript and can overlay the original automatic transcript line by line. Both versions remain downloadable.
