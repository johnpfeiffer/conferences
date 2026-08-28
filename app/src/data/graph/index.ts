import { conferenceGraph as biotechGraph } from "./biotech";
import { conferenceGraph as aiTechGraph } from "./ai-tech";
import type { GraphEntity, GraphEdge } from "./biotech";

export type { GraphEntity, GraphEdge };

export { biotechGraph, aiTechGraph };

/**
 * Legacy merged view: both domains concatenated and deduped by id/edge so the
 * historical `graphEntities`/`graphEdges` consumers keep working. Prefer the
 * per-domain exports (`biotechGraph`, `aiTechGraph`) for domain-aware views;
 * ids may repeat across domains (shared entities, sessions).
 */
const dedupeById = (entities: GraphEntity[]): GraphEntity[] => [
  ...new Map(entities.map((entity) => [entity.id, entity])).values(),
];

const dedupeEdge = (edges: GraphEdge[]): GraphEdge[] => [
  ...new Map(
    edges.map((edge) => [`${edge.source}|${edge.type}|${edge.target}`, edge]),
  ).values(),
];

export const graphEntities: GraphEntity[] = dedupeById([
  ...biotechGraph.entities,
  ...aiTechGraph.entities,
]);

export const graphEdges: GraphEdge[] = dedupeEdge([
  ...biotechGraph.edges,
  ...aiTechGraph.edges,
]);

export const conferenceGraph = {
  entities: graphEntities,
  edges: graphEdges,
};
