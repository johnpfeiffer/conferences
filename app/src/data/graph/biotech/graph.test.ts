import { describe, expect, it } from "vitest";
import { graphEdges, graphEntities } from ".";

describe("biotech conference graph", () => {
  it("uses unique entity ids and valid edge endpoints", () => {
    const entityIds = graphEntities.map(({ id }) => id);
    const knownIds = new Set(entityIds);

    expect(knownIds.size).toBe(entityIds.length);
    for (const edge of graphEdges) {
      expect(knownIds.has(edge.source), `Unknown source: ${edge.source}`).toBe(true);
      expect(knownIds.has(edge.target), `Unknown target: ${edge.target}`).toBe(true);
    }
  });

  it("classifies every person and connects all eight sessions to UNLOCK 2026", () => {
    const people = graphEntities.filter(({ id }) => id.startsWith("person:"));
    const personEdges = graphEdges.filter(({ type }) => type === "Is_a_Person");
    const sessionEdges = graphEdges.filter(({ type }) => type === "Session_of");

    expect(personEdges).toHaveLength(people.length);
    expect(sessionEdges).toHaveLength(8);
    expect(sessionEdges.every(({ target }) => target === "event:unlock-2026")).toBe(true);
  });
});
