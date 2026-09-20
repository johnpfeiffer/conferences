import entitiesData from "./entities.json";
import edgesData from "./edges.json";
import personEdgesData from "./is_a_person-edges.json";
import type { GraphEdge, GraphEntity } from "../biotech";

export const graphEntities: GraphEntity[] = entitiesData.entities;
export const graphEdges: GraphEdge[] = [...edgesData.edges, ...personEdgesData.edges];

export const conferenceGraph = { entities: graphEntities, edges: graphEdges };

