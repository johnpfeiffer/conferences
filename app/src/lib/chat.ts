import type { TranscriptChunk } from "./retrieval";

export const LLM_MODEL = "gemma-4-31b";
export const CHAT_ENDPOINT = "/api/cerebras/chat/completions";

export type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

export function buildChatRequest(
  question: string,
  sources: TranscriptChunk[],
  history: ConversationTurn[] = [],
) {
  const sourceText = sources
    .map(
      (source, index) =>
        `[${index + 1}] ${source.sessionTitle}, starting at ${source.timestamp}\n${source.text}`,
    )
    .join("\n\n");

  return {
    model: LLM_MODEL,
    temperature: 0.25,
    max_tokens: 700,
    messages: [
      {
        role: "system",
        content:
          "You are the guide to the UNLOCK 2026 conference transcript archive. Answer exclusively from the supplied transcript excerpts. Be direct, synthesize across sessions when useful, and cite each factual claim with bracketed source numbers like [1]. Never invent speakers, claims, or event details. If the excerpts do not answer the question, say so clearly and suggest a narrower question. Use short paragraphs and no markdown heading.",
      },
      ...history.slice(-4).map((turn) => ({
        role: turn.role,
        content: turn.content.slice(0, 2_000),
      })),
      {
        role: "user",
        content: `TRANSCRIPT EXCERPTS\n\n${sourceText}\n\nQUESTION\n${question}`,
      },
    ],
  };
}

export async function askConference(
  question: string,
  sources: TranscriptChunk[],
  history: ConversationTurn[] = [],
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const response = await fetchImpl(CHAT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildChatRequest(question, sources, history)),
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 180);
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const answer = payload.choices?.[0]?.message?.content?.trim();
  if (!answer) throw new Error("The model returned an empty answer.");
  return answer;
}
