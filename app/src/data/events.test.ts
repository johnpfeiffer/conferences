import { describe, expect, it } from "vitest";
import { DEFAULT_EVENT_ID, events, sessions } from "./events";

describe("event archive", () => {
  it("models the three kernel-defined events and keeps UNLOCK as the default", () => {
    expect(DEFAULT_EVENT_ID).toBe("unlock2026");
    expect(events.map(({ id, name, type }) => ({ id, name, type }))).toEqual([
      { id: "unlock2026", name: "UNLOCK 2026", type: "BIOTECH" },
      { id: "2026-08-12-workos-agent-night", name: "WorkOS Agent Night", type: "AI" },
      { id: "aiewf", name: "AI Engineer World's Fair", type: "AI" },
    ]);
    expect(events.map(({ sessions: eventSessions }) => eventSessions.length)).toEqual([8, 1, 1]);
  });

  it("gives every event a source, event-scoped glossary, and grounded sessions", () => {
    for (const event of events) {
      expect(event.sourceUrl).toMatch(/^https:\/\//);
      expect(event.glossary.length).toBeGreaterThan(0);

      for (const session of event.sessions) {
        expect(session.eventId).toBe(event.id);
        expect(session.videoUrl).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/);
        expect(session.transcript.trim()).not.toBe("");
        expect(session.fixedTranscript.trim()).not.toBe("");
        expect(session.originalTranscriptUrl).not.toBe("");
        expect(session.fixedTranscriptFileName).not.toBe("");
      }
    }
  });

  it("provides globally unique session ids across all events", () => {
    expect(sessions).toHaveLength(10);
    expect(new Set(sessions.map(({ id }) => id)).size).toBe(sessions.length);
  });

  it("keeps the AI Engineer glossary focused on people and domain knowledge", () => {
    const aiewf = events.find(({ id }) => id === "aiewf");

    expect(aiewf).toBeDefined();
    expect(aiewf?.glossary.some(({ category }) => category === "Unresolved proper noun")).toBe(false);
    for (const { definition } of aiewf?.glossary ?? []) {
      expect(definition).not.toMatch(/\b(?:ASR|transcrib|garbl|mangl)/i);
    }
  });

  it("uses intentional spacing in the WorkOS headline", () => {
    expect(events.find(({ id }) => id === "2026-08-12-workos-agent-night")?.headline)
      .toBe("AGI arrived — or it is a skill issue.");
  });
});
