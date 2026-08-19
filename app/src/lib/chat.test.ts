import { describe, expect, it, vi } from "vitest";
import { askConference, buildChatRequest, CHAT_ENDPOINT, LLM_MODEL } from "./chat";
import type { TranscriptChunk } from "./retrieval";

const source: TranscriptChunk = {
  id: "session-0",
  sessionId: "session",
  sessionTitle: "A scientific session",
  timestamp: "2:10",
  seconds: 130,
  text: "A grounded transcript excerpt.",
  videoUrl: "https://youtube.com/watch?v=abc",
};

describe("conference chat", () => {
  it("pins the Cerebras model and includes numbered transcript sources", () => {
    const request = buildChatRequest("What happened?", [source]);
    expect(request.model).toBe(LLM_MODEL);
    expect(request.messages.at(-1)?.content).toContain("[1] A scientific session");
  });

  it("keeps a full retrieval request under the middleware body limit", () => {
    const sources = Array.from({ length: 7 }, (_, index) => ({
      ...source,
      id: `session-${index}`,
      text: "grounded transcript text ".repeat(55),
    }));
    const body = JSON.stringify(
      buildChatRequest("Compare the sessions", sources, [
        { role: "user", content: "Earlier question ".repeat(200) },
        { role: "assistant", content: "Earlier answer ".repeat(200) },
      ]),
    );
    expect(body.length).toBeLessThan(32_000);
  });

  it("uses the shared endpoint and returns the assistant content", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "Grounded answer [1]" } }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    await expect(askConference("Question", [source], [], fetchImpl)).resolves.toBe("Grounded answer [1]");
    expect(fetchImpl).toHaveBeenCalledWith(CHAT_ENDPOINT, expect.objectContaining({ method: "POST" }));
  });
});
