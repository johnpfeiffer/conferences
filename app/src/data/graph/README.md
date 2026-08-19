# UNLOCK 2026 conference graph

This dataset follows the `IMPORT` example's entity-and-edge JSON structure. Semantic ids are used so
the relationships remain readable and stable as more transcripts are added.

Sources:

- The UNLOCK 2026 speaker roster and affiliations on <https://www.unlockscience.ai/>, reviewed
  August 16, 2026.
- Speaker, panelist, and moderator metadata embedded at the top of the eight transcript files in
  `../transcripts`.

`edges.json` contains affiliations, event participation, and transcript-session roles.
`is_a_person-edges.json` keeps person classification separate to match the import example.
`index.ts` exports both files as one typed graph.
