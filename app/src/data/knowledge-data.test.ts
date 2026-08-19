import { describe, expect, it } from "vitest";
import glossary from "./glossary.json";
import proposedFixes from "./proposed-transcript-fixes.json";

const transcriptFiles = new Set([
  "unlock-2026-agents-for-scientific-discovery.txt",
  "unlock-2026-astrazeneca-ai-playbook.txt",
  "unlock-2026-dealmaking-and-partnerships.txt",
  "unlock-2026-how-to-train-an-ai-for-science.txt",
  "unlock-2026-noetik.txt",
  "unlock-2026-predictions-to-proof.txt",
  "unlock-2026-what-is-hype-and-what-is-real.txt",
  "unlock-2026-xaira-x-cell-drug-discovery.txt",
]);

describe("conference knowledge data", () => {
  it("contains a substantial glossary with unique canonical terms", () => {
    const normalizedTerms = glossary.terms.map(({ term }) => term.toLocaleLowerCase());

    expect(glossary.terms.length).toBeGreaterThan(200);
    expect(new Set(normalizedTerms).size).toBe(normalizedTerms.length);
    expect(glossary.terms.every(({ term, category, definition }) =>
      term.trim() && category.trim() && definition.trim())).toBe(true);
  });

  it("keeps every proposed fix traceable to a known transcript", () => {
    const fixIds = proposedFixes.fixes.map(({ id }) => id);

    expect(new Set(fixIds).size).toBe(fixIds.length);
    for (const fix of proposedFixes.fixes) {
      expect(["high", "medium"]).toContain(fix.confidence);
      expect(fix.replacements.length).toBeGreaterThan(0);
      expect(fix.occurrences.length).toBeGreaterThan(0);
      expect(fix.replacements.every(({ observed, proposed }) =>
        observed.trim() && proposed.trim() && observed !== proposed)).toBe(true);
      expect(fix.occurrences.every(({ transcript, timestamps }) =>
        transcriptFiles.has(transcript) && timestamps.length > 0)).toBe(true);
    }
  });
});
