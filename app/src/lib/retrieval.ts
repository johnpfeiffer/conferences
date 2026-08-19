import type { Session } from "../data/transcripts";

export type TranscriptChunk = {
  id: string;
  sessionId: string;
  sessionTitle: string;
  timestamp: string;
  seconds: number;
  text: string;
  videoUrl: string;
};

const TIMESTAMP = /^(\d{1,2}:)?\d{1,2}:\d{2}$/;
const STOP_WORDS = new Set([
  "about", "after", "again", "also", "been", "before", "being", "could",
  "does", "from", "have", "into", "just", "more", "most", "only", "other",
  "should", "some", "than", "that", "their", "them", "then", "there", "these",
  "they", "this", "those", "through", "very", "want", "were", "what", "when",
  "where", "which", "while", "with", "would", "your", "unlock", "conference",
]);

export function timestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(":").map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return parts[0] * 60 + parts[1];
}

export function videoAtTimestamp(url: string, seconds: number): string {
  if (!url) return "#";
  const parsed = new URL(url);
  parsed.searchParams.set("t", `${seconds}s`);
  return parsed.toString();
}

export function chunkTranscript(session: Session, targetLength = 1_250): TranscriptChunk[] {
  const lines = session.transcript.split(/\r?\n/).map((line) => line.trim());
  const segments: { timestamp: string; text: string }[] = [];
  let timestamp = "0:00";
  let text: string[] = [];

  const flush = () => {
    const joined = text.join(" ").replace(/\s+/g, " ").trim();
    if (joined) segments.push({ timestamp, text: joined });
    text = [];
  };

  for (const line of lines) {
    if (!line || /^https?:\/\//.test(line)) continue;
    if (TIMESTAMP.test(line)) {
      flush();
      timestamp = line;
    } else {
      text.push(line);
    }
  }
  flush();

  const chunks: TranscriptChunk[] = [];
  let currentText: string[] = [];
  let currentTimestamp = segments[0]?.timestamp ?? "0:00";

  const flushChunk = () => {
    if (!currentText.length) return;
    chunks.push({
      id: `${session.id}-${chunks.length}`,
      sessionId: session.id,
      sessionTitle: session.title,
      timestamp: currentTimestamp,
      seconds: timestampToSeconds(currentTimestamp),
      text: currentText.join(" "),
      videoUrl: session.videoUrl,
    });
    currentText = [];
  };

  for (const segment of segments) {
    const labeled = `[${segment.timestamp}] ${segment.text}`;
    if (currentText.length && currentText.join(" ").length + labeled.length > targetLength) {
      flushChunk();
      currentTimestamp = segment.timestamp;
    }
    if (!currentText.length) currentTimestamp = segment.timestamp;
    currentText.push(labeled);
  }
  flushChunk();
  return chunks;
}

export function buildTranscriptIndex(sessions: Session[]): TranscriptChunk[] {
  return sessions.flatMap((session) => chunkTranscript(session));
}

function tokensFor(value: string): string[] {
  return [...new Set(
    value
      .toLowerCase()
      .match(/[a-z0-9-]{3,}/g)
      ?.filter((token) => !STOP_WORDS.has(token)) ?? [],
  )];
}

export function retrieveSources(
  query: string,
  chunks: TranscriptChunk[],
  limit = 7,
): TranscriptChunk[] {
  const tokens = tokensFor(query);
  const normalizedQuery = query.toLowerCase().trim();
  const scored = chunks.map((chunk, index) => {
    const text = `${chunk.sessionTitle} ${chunk.text}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      const occurrences = text.split(token).length - 1;
      score += Math.min(occurrences, 4) * (chunk.sessionTitle.toLowerCase().includes(token) ? 5 : 2);
    }
    if (normalizedQuery.length > 8 && text.includes(normalizedQuery)) score += 20;
    return { chunk, index, score };
  });

  if (!tokens.length || !scored.some(({ score }) => score > 0)) {
    const seen = new Set<string>();
    return scored
      .filter(({ chunk }) => {
        if (seen.has(chunk.sessionId)) return false;
        seen.add(chunk.sessionId);
        return true;
      })
      .slice(0, Math.min(limit, 4))
      .map(({ chunk }) => chunk);
  }

  const perSession = new Map<string, number>();
  return scored
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .filter(({ chunk }) => {
      const count = perSession.get(chunk.sessionId) ?? 0;
      if (count >= 3) return false;
      perSession.set(chunk.sessionId, count + 1);
      return true;
    })
    .slice(0, limit)
    .map(({ chunk }) => chunk);
}
