# Architecture

The repository separates immutable human-authored requirements, event data,
domain behavior, routing, and MUI presentation. `KERNEL/` is authoritative;
`SPEC/` and `VALIDATION/` record the derived interpretation and proof
obligations.

## System design

```mermaid
flowchart LR
    K[KERNEL: human-authored authority] --> SPEC[SPEC + VALIDATION]
    RAW[Original transcripts] --> DATA[Event data adapters]
    FIX[Fixed transcripts] --> DATA
    GLOSS[Per-event glossaries] --> DATA
    DATA --> MODEL[Event + Session models]
    MODEL --> ROUTES[Route controller]
    MODEL --> RET[Event-scoped retrieval]
    RET --> CHAT[Grounded chat request]
    CHAT --> API[Server-side OpenAI-compatible API]
    MODEL --> VIEWS[MUI landing + reader views]
    ROUTES --> VIEWS
    RET --> VIEWS
    GRAPH[Archive-wide knowledge graph] --> MODEL
```

The browser never receives provider credentials or selects a model. It sends
only the question, short conversation history, and retrieved transcript
excerpts to the shared `/api/openai/chat/completions` endpoint. The backend
supplies credentials and model configuration.

### Layers

- `app/src/models/` defines the event and session domain.
- `app/src/data/` adapts immutable transcript and glossary artifacts into that
  domain and exports the merged knowledge graph.
- `app/src/controllers/` owns URL parsing and internal path construction.
- `app/src/lib/` owns retrieval, chat request construction, and transcript
  comparison behavior.
- `app/src/views/` renders MUI landing pages and transcript readers.

UNLOCK 2026 is the root event. Other events use `/events/:eventId`, while the
legacy `/talk/:sessionId` route continues to open UNLOCK sessions.

## Grounding and evidence

```mermaid
flowchart TD
    Q[Question on an event landing] --> IDX[Active event transcript index]
    IDX --> TOP[Relevant timestamped excerpts]
    TOP --> LLM[Server-side LLM request]
    LLM --> CIT[Answer with numbered citations]
    CIT --> CARD[Source card]
    CARD --> VIDEO[Video at exact timestamp]
    CARD --> TEXT[Transcript excerpt]
```

Retrieval begins after the transcript metadata delimiter. A declared segment
start, such as WorkOS `57:12`, becomes the timestamp for body text that appears
before the first ordinary caption marker.

## User journey

```mermaid
flowchart TD
    OPEN[Open archive] --> DEFAULT[UNLOCK 2026 landing]
    DEFAULT --> SWITCH{Choose event}
    SWITCH --> EVENT[Event landing]
    EVENT --> SOURCE[Open official source]
    EVENT --> ASK[Ask event-scoped question]
    ASK --> EVIDENCE[Review timestamped source cards]
    EVENT --> SESSION[Choose session]
    SESSION --> FIXED[Read fixed transcript]
    FIXED --> COMPARE{Compare wording?}
    COMPARE -->|Yes| ORIGINAL[Reveal original above changed lines]
    COMPARE -->|No| FIXED
    FIXED --> MOMENT[Open video at timestamp]
```

The reader defaults to corrected wording, keeps both transcript versions
downloadable, and uses the browser's vertical scroll rather than nested
transcript scroll areas.
