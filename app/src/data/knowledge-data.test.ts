import { describe, expect, it } from "vitest";
import glossaryBiotech from "./glossary.biotech.json";
import glossaryAiTech from "./glossary.ai-tech.json";
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

const glossaries = [
  ["biotech", glossaryBiotech],
  ["ai-tech", glossaryAiTech],
] as const;

describe("conference knowledge data", () => {
  it("contains a substantial glossary with unique canonical terms", () => {
    const allTerms = glossaries.flatMap(([, glossary]) => glossary.terms);
    const normalizedTerms = allTerms.map(({ term }) => term.toLocaleLowerCase());

    expect(allTerms.length).toBeGreaterThan(200);
    expect(new Set(normalizedTerms).size).toBe(normalizedTerms.length);
    expect(allTerms.every(({ term, category, definition }) =>
      term.trim() && category.trim() && definition.trim())).toBe(true);
  });

  it("splits the glossary into substantial, disjoint biotech and ai-tech domains", () => {
    const biotechTerms = new Set(glossaryBiotech.terms.map(({ term }) => term));
    const aiTechTerms = new Set(glossaryAiTech.terms.map(({ term }) => term));

    expect(glossaryBiotech.terms.length).toBeGreaterThan(100);
    expect(glossaryAiTech.terms.length).toBeGreaterThan(50);
    for (const term of biotechTerms) {
      expect(aiTechTerms.has(term), `term in both domains: ${term}`).toBe(false);
    }
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
