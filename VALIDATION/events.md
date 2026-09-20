# Multi-event validation

| Obligation | Check |
|---|---|
| Three event landings exist and UNLOCK is the default | `src/data/events.test.ts`, `src/controllers/routes.test.ts` |
| Every session has video, original transcript, and fixed transcript (INV-001) | `src/data/events.test.ts` |
| Answer citations link to timestamped video evidence (INV-002) | `src/lib/chat.test.ts`, `src/lib/retrieval.test.ts`, UI tests |
| Retrieval is event-scoped | `src/lib/retrieval.test.ts` and landing construction |
| Fixed transcript is the default and original can be compared | `src/lib/transcriptView.test.ts` and UI tests |
| Glossaries are per event | `src/data/events.test.ts` |
| Knowledge graph spans all events and sessions | `src/data/graph/graph.test.ts` |
| MUI app compiles for production | `npm run build` |
| Layout is usable at desktop and mobile widths | browser screenshots of all landing variants and one reader |
| Existing behavior remains healthy | full `npm test` |

