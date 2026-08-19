import proposedTranscriptFixes from "./proposed-transcript-fixes.json";

export type FixedTranscript = {
  text: string;
  correctionCount: number;
};

export function applyProposedTranscriptFixes(
  transcript: string,
  transcriptFileName: string,
): FixedTranscript {
  const replacements = proposedTranscriptFixes.fixes
    .filter(({ occurrences }) =>
      occurrences.some(({ transcript: occurrenceFile }) => occurrenceFile === transcriptFileName))
    .flatMap(({ replacements: fixReplacements }) => fixReplacements)
    .sort((a, b) => b.observed.length - a.observed.length);

  let text = transcript;
  let correctionCount = 0;

  for (const { observed, proposed } of replacements) {
    const segments = text.split(observed);
    const matches = segments.length - 1;
    if (!matches) continue;

    correctionCount += matches;
    text = segments.join(proposed);
  }

  return { text, correctionCount };
}
