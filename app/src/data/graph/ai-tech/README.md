# Conference graph — AI/tech domain

This is the **AI/tech/software** slice of the conference graph (23 entities, 31
edges), split out of the combined UNLOCK 2026 graph on 2026-08-27.

Contents:

- The two shared entities (`type:person`, `event:unlock-2026`).
- The AI/tech people and their orgs: Palantir (Jeremy Elser), Goodfire (Daniel
  Balsam, Eric Ho), Anthropic (Jonah Cool), Radical AI (Joseph Krause), Axiom
  Math (Carina Hong), Generalist (Pete Florence).
- All 8 UNLOCK 2026 session entities, kept as the conference context the AI
  people appear in — including the two cross-domain edges (Jonah Cool panelist
  in Dealmaking & Partnerships, Eric Ho panelist in How to Train an AI for
  Science). The sessions themselves are biotech-domain content; the full
  session graph with all biotech participants lives in `../biotech/`.

`edges.json` contains affiliations, event participation, and session roles.
`is_a_person-edges.json` keeps person classification separate to match the import
example. `index.ts` exports both files as one typed graph.

Entity ids may repeat across the two domain graphs (shared entities, sessions);
the unique-ids invariant is checked per domain file. New AI-domain episodes (for
example `episodes/aie-2026-uber-eats-closed-loop-evals`) extend this file.
