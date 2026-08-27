import { describe, expect, it } from "vitest";
import { graphEdges, graphEntities } from ".";

describe("ai-tech conference graph", () => {
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

  it("keeps the AI-domain people linked to an AI org, the event, and their sessions", () => {
    const people = graphEntities.filter(({ id }) => id.startsWith("person:"));
    const orgs = new Set(
      graphEntities.filter(({ id }) => id.startsWith("org:")).map(({ id }) => id),
    );

    expect(people.length).toBeGreaterThan(0);
    for (const { id } of people) {
      const mine = graphEdges.filter(({ source }) => source === id);
      expect(mine.some(({ type }) => type === "Is_a_Person")).toBe(true);
      expect(mine.some(({ type }) => type === "Speaker_at")).toBe(true);
      expect(mine.some(({ target }) => orgs.has(target))).toBe(true);
    }

    const crossDomain = graphEdges.filter(({ type }) => type === "Panelist_in");
    expect(crossDomain.map(({ source }) => source).sort()).toEqual([
      "person:eric-ho",
      "person:jonah-cool",
    ]);
  });
});
