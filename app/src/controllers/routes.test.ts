import { describe, expect, it } from "vitest";
import { eventPath, parseAppRoute, sessionPath } from "./routes";

describe("archive routes", () => {
  it("keeps UNLOCK at the root and accepts its legacy talk routes", () => {
    expect(parseAppRoute("/conferences/")).toEqual({ kind: "event", eventId: "unlock2026" });
    expect(parseAppRoute("/conferences/talk/proof")).toEqual({
      kind: "session",
      eventId: "unlock2026",
      sessionId: "proof",
    });
  });

  it("parses event landing and session routes", () => {
    expect(parseAppRoute("/events/aiewf")).toEqual({ kind: "event", eventId: "aiewf" });
    expect(parseAppRoute("/conferences/events/aiewf/talk/aiewf-closed-loop-evals")).toEqual({
      kind: "session",
      eventId: "aiewf",
      sessionId: "aiewf-closed-loop-evals",
    });
  });

  it("builds relative internal links for root and deployed paths", () => {
    expect(eventPath("unlock2026", "")).toBe("/");
    expect(eventPath("aiewf", "/conferences")).toBe("/conferences/events/aiewf");
    expect(sessionPath("unlock2026", "proof", "/conferences")).toBe("/conferences/talk/proof");
    expect(sessionPath("aiewf", "aiewf-closed-loop-evals", "")).toBe(
      "/events/aiewf/talk/aiewf-closed-loop-evals",
    );
  });
});
