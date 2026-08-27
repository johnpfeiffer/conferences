import entitiesData from "./entities.json";
import edgesData from "./edges.json";
import personEdgesData from "./is_a_person-edges.json";

export type GraphEntity = {
  id: string;
  name: string;
};

export type GraphEdge = {
  source: string;
  target: string;
  type: string;
};

export const graphEntities: GraphEntity[] = entitiesData.entities;
export const graphEdges: GraphEdge[] = [
  ...edgesData.edges,
  ...personEdgesData.edges,
];

export const conferenceGraph = {
  entities: graphEntities,
  edges: graphEdges,
};
