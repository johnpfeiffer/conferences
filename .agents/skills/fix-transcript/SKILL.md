---
name: fix-transcript
description: Correct a raw ASR transcript using the conferences-repo convention of immutable raw text + canonical glossary + traceable proposed fixes, with confidence levels, case-sensitive replacement tactics, and a validation gate. Use when asked to clean up, correct, or proper-noun-fix a transcript. Pair with the get-transcript skill for fetching.
---

# Fix transcript

Corrects a raw transcript (from the sibling skill `get-transcript`) without ever
modifying it. Conventions match `app/src/data/glossary.json` and
`app/src/data/proposed-transcript-fixes.json`; the apply algorithm is an exact
port of `app/src/data/transcriptFixes.ts`.

## Principles

1. **Raw is immutable.** Corrections are proposals in JSON, applied to a copy.
2. **Traceable.** Every fix has timestamps, a confidence level, and a reason.
3. **Never guess names.** If every source renders a name differently, mark it
   `(unresolved)` in the glossary with candidate spellings; do not "fix" it.
4. **Ground truth order:** video metadata (title/description/chapters) → public
   company/product names → two agreeing AI transcripts → one AI transcript
   (medium confidence, verify against the recording).

## Build the glossary

`glossary.json`: `{schemaVersion, scope, referenceUrls, terms[{term, category,
definition}]}`. Categories: Person, Firm, Company, Concept, `Unresolved proper
noun`. Mine the episode's info.json first, then alternates. ASR consistently
confuses similar-sounding names; the glossary is the correction map.

## Build the fixes

`proposed-transcript-fixes.json`: `{schemaVersion, status: "proposed-only",
notes, referenceUrls, fixes[{id, replacements[{observed, proposed}],
occurrences[{transcript, timestamps[]}], confidence, reason}]}`.

- `high`: video metadata, a public company name, or unambiguous context.
- `medium`: strongly suggested by context or another AI transcript; must be
  verified against the recording before treated as final.
- Replacements are **case-sensitive** exact strings — use that deliberately:
  lowercase-only `anthropic` → `Anthropic` leaves correct instances untouched;
  `SAS` → `SaaS` only when no legitimate `SAS` exists in the text (grep first).
- Include inflected variants as separate replacements (`base 10's`, `base 10`).
- Record every occurrence timestamp (nearest preceding marker) per fix.

## Apply

```bash
python3 scripts/apply_transcript_fixes.py \
  --transcript youtube_raw.txt \
  --fixes proposed-transcript-fixes.json \
  --out fixed_transcript.txt
```

Flattens all replacements, sorts by `len(observed)` **descending** (longer
phrases win before their prefixes), case-sensitive split/join, reports the
correction count. Never edits the raw file.

## Optional: LLM cleanup pass

Guardrails (from the `youtube-transcript-pdf` skill): the LLM may merge/split
paragraphs and fix capitalization, punctuation, and obvious ASR mistakes, but
**must not paraphrase, add, delete, or reorder** content or change speaker
order. Reject the output if the normalized body-token delta is large, write an
audit file beside the output, and fall back to the deterministic fixed
transcript on failure. Keep raw, pre-LLM, and final files side by side.

## Completion gate

Do not report done until:

- Both JSON files parse; every fix rule reports its occurrence timestamps.
- Zero `observed` strings remain in the fixed output (grep a sample).
- Correction count is reported (rules × replacements).
- 3 random segments of the fixed transcript spot-checked against an alternate
  source; unresolved names documented in the glossary.
- `npm test` passes if anything in `app/` changed (data-only work skips this).

## Deliverables checklist

- [ ] `glossary.json`
- [ ] `proposed-transcript-fixes.json`
- [ ] `fixed_transcript.txt` + correction count
- [ ] Notes: discrepancies across sources, unresolved names, medium-confidence
      items awaiting recording verification

## References

- Worked example: `episodes/20vc-jerry-murdock/` in this repo
- Sibling skill: `.agents/skills/get-transcript/`
- steipete/summarize: https://github.com/steipete/summarize/blob/main/.agents/skills/summarize/SKILL.md (verify gates; never print secrets; do not infer speaker identities without evidence)
- aniketpanjwani/youtube-transcript-pdf: https://github.com/aniketpanjwani/skills/blob/main/skills/general/youtube-transcript-pdf/SKILL.md (LLM cleanup guardrails + rejection, audit files, keep raw beside final)
- beanels01/youtube-transcript: https://github.com/beanels01/youtube-transcript/blob/main/SKILL.md (correction maps for similar-sounding names)

## Ownership

These two skills are the canonical transcript workflow for this repository.
Upstream skills above are references, not copies; borrow patterns, link at a
pinned commit, and keep repo-specific conventions (schemas, apply algorithm,
completion gates) here only.
