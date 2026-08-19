import { describe, expect, it } from "vitest";
import { sessions, type Session } from "../data/transcripts";
import {
  buildTranscriptIndex,
  chunkTranscript,
  retrieveSources,
  timestampToSeconds,
  videoAtTimestamp,
} from "./retrieval";

const session: Session = {
  id: "test",
  number: "01",
  title: "Scientific evaluation",
  eyebrow: "Test",
  description: "Test session",
  videoUrl: "https://youtube.com/watch?v=abc",
  transcript: `https://youtube.com/watch?v=abc\n\n0:09\nModels need trustworthy evals.\n0:15\nExperiments provide feedback.\n0:30\nPharma partnerships depend on shared data.`,
  transcriptFileName: "test-transcript.txt",
  originalTranscriptUrl: "/test-transcript.txt",
  fixedTranscript: "Fixed test transcript",
  fixedTranscriptFileName: "test-transcript-fixed.txt",
  correctionCount: 1,
};

describe("transcript retrieval", () => {
  it("converts transcript timestamps and creates timestamped video links", () => {
    expect(timestampToSeconds("1:02:03")).toBe(3723);
    expect(videoAtTimestamp(session.videoUrl, 75)).toContain("t=75s");
  });

  it("chunks transcript text and retrieves the most relevant excerpt", () => {
    const chunks = chunkTranscript(session, 55);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].timestamp).toBe("0:09");
    expect(retrieveSources("Why do models need trustworthy evals?", chunks, 1)[0].text)
      .toContain("trustworthy evals");
  });

  it("indexes all eight supplied highlight transcripts in display order", () => {
    const index = buildTranscriptIndex(sessions);
    expect(sessions).toHaveLength(8);
    expect(sessions.slice(-3).map(({ id }) => id)).toEqual([
      "astrazeneca",
      "agents-for-sci",
      "xaira-x-cell",
    ]);
    expect(index.length).toBeGreaterThan(80);
    expect(new Set(index.map((chunk) => chunk.sessionId)).size).toBe(8);
    expect(sessions.every(({ correctionCount }) => correctionCount > 0)).toBe(true);
    expect(sessions.every(({ transcript, fixedTranscript }) => transcript !== fixedTranscript)).toBe(true);
    expect(sessions.every(({ originalTranscriptUrl }) => originalTranscriptUrl.endsWith(".txt"))).toBe(true);
  });
});
