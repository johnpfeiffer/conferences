import { describe, expect, it } from "vitest";
import { buildTranscriptRows, diffTranscriptWords } from "./transcriptView";

describe("transcript reader data", () => {
  it("aligns fixed and original lines under their timestamps", () => {
    const original = "metadata\n---\n0:09\nAstroenica uses models.\n0:12\nUnchanged.";
    const fixed = "metadata\n---\n0:09\nAstraZeneca uses models.\n0:12\nUnchanged.";
    const rows = buildTranscriptRows(original, fixed);

    expect(rows).toEqual([
      {
        id: 3,
        timestamp: "0:09",
        original: "Astroenica uses models.",
        fixed: "AstraZeneca uses models.",
        changed: true,
      },
      {
        id: 5,
        timestamp: "0:12",
        original: "Unchanged.",
        fixed: "Unchanged.",
        changed: false,
      },
    ]);
  });

  it("marks only replaced words as changed", () => {
    const diff = diffTranscriptWords("Cosmos is an AI scientist.", "Kosmos is an AI scientist.");

    expect(diff.original.filter(({ changed }) => changed).map(({ text }) => text)).toEqual(["Cosmos"]);
    expect(diff.fixed.filter(({ changed }) => changed).map(({ text }) => text)).toEqual(["Kosmos"]);
  });

  it("uses a declared segment start for transcript text before the first timestamp", () => {
    const original = "Segment: 57:12-1:27:46 of the source video\n---\nOpening words\n57:15\nNext line";
    const fixed = "Segment: 57:12-1:27:46 of the source video\n---\nOpening words\n57:15\nNext line";

    expect(buildTranscriptRows(original, fixed)[0]).toMatchObject({
      timestamp: "57:12",
      original: "Opening words",
    });
  });
});
