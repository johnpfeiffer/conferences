# UNLOCK 2026 conference graph — biotech domain

This is the **biotech/pharma/life-sciences** subgraph. Because UNLOCK 2026 is an
AI x life-sciences summit, this file currently holds the full conference graph
(76 entities, 134 edges); the AI/tech slice lives in `../ai-tech/`.

Same entity-and-edge JSON structure as before the 2026-08-27 domain split, with
semantic ids so relationships stay readable as more transcripts are added.

Sources:

- The UNLOCK 2026 speaker roster and affiliations on <https://www.unlockscience.ai/>, reviewed
  August 16, 2026.
- Speaker, panelist, and moderator metadata embedded at the top of the eight transcript files in
  `../../transcripts`.

`edges.json` contains affiliations, event participation, and transcript-session roles.
`is_a_person-edges.json` keeps person classification separate to match the import example.
`index.ts` exports both files as one typed graph.

Domain note: entities are assigned by application domain, not technique — AI-for-bio
companies (Noetik, Xaira, Edison Scientific, …) and the life-sciences investors
(Khosla, Lux, Menlo, Dimension, Atria) are biotech here; pure AI/software orgs
(Anthropic, Goodfire, Palantir, Radical AI, Axiom Math, Generalist) and their people
are in `../ai-tech/`. `type:person` and `event:unlock-2026` are shared and appear in
both domains; entity ids may repeat across domains, so the unique-ids invariant is
checked per domain file.
