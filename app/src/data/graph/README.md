# Conference knowledge graphs (split by domain)

The conference graph is split into per-domain subgraphs so biotech and AI/tech
content can be browsed and extended independently:

- [`biotech/`](./biotech/) — UNLOCK 2026 biotech/pharma/life-sciences graph
  (76 entities, 134 edges; the full conference graph, since UNLOCK is an
  AI x life-sciences summit).
- [`ai-tech/`](./ai-tech/) — AI/tech/software slice (23 entities, 31 edges):
  the AI people and orgs, the shared type/event entities, and the session
  context they appear in.

Each domain folder follows the same entity-and-edge JSON structure (`entities.json`,
`edges.json`, `is_a_person-edges.json`) with semantic ids, an `index.ts` typed export,
and its own `graph.test.ts`. Entity ids may repeat across domains (shared entities,
session context); invariants such as unique ids hold **per domain file**.

`index.ts` here re-exports both domains (`biotechGraph`, `aiTechGraph`) plus a
deduped legacy merged view (`graphEntities`, `graphEdges`, `conferenceGraph`) for
existing consumers.

Sources:

- The UNLOCK 2026 speaker roster and affiliations on <https://www.unlockscience.ai/>, reviewed
  August 16, 2026.
- Speaker, panelist, and moderator metadata embedded at the top of the eight transcript files in
  `../transcripts`.

Split on 2026-08-27 (domain assignment keys on application domain, not technique;
see `biotech/README.md` for the borderline calls).
