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

## Stage 0: suspicious-token discovery

Do not wait for someone to notice mistakes. Systematically enumerate anomalies
in the raw ASR before writing any fix:

1. **Rare-token scan** — tokenize, count, and list alpha tokens with count <= 2
   and length >= 6. ASR mangles names into tokens rarer than any real vocabulary
   (`Koshla`, `Palanteer`, `Toma Braavos`).
2. **Merged/compound anomalies** — tokens that are fused words (`aanthropic`,
   `wellunded`, `taskdriven`) or impossible bigrams. A merged token can also be
   TWO real entities fused: `open aanthropic` was `OpenAI, Anthropic`.
3. **Technical-vocabulary reconciliation** — in a technical discussion, check
   every domain term against its canonical casing/spelling (`A6 chips` was
   `ASIC chips`; `mainet`, `pytorch`). If a common tech noun looks odd, it is odd.
4. **Context windows** — pull ~60 chars around each suspect. Adjacent words
   resolve most of them: `drugs like Katruda` in a cancer passage is `Keytruda`;
   `etched or fractile in the UK` in a chip passage is `Etched` and `Fractile`.
5. **Cluster coherence** — names cluster. `Toma Braavos` + `Orlando` + `Cooper
   and Anna plans` resolve together as Thoma Bravo / Orlando Bravo / Coupa /
   Anaplan (both Bravo take-privates).

## Build the glossary (with provenance)

`glossary.json`: `{schemaVersion, scope, referenceUrls, terms[{term, category,
definition, sources[]}]}`. Categories: Person, Firm, Company, Concept,
`Unresolved proper noun`. Mine the episode's info.json first, then alternates.
ASR consistently confuses similar-sounding names; the glossary is the correction
map.

**Document provenance on every entry** in `sources`: the artifact or URL the
canonical form came from, plus how it was checked:
`"verified YYYY-MM-DD"` (the URL was fetched and the spelling confirmed),
`"canonical reference"` (official domain cited without a fresh fetch),
`"transcript context M:SS"` (internal evidence), `"user review"` (repo owner
supplied). Provenance makes each entry auditable and re-checkable later.

**Looking up associated glossaries / authoritative sources, in order:**

1. Episode metadata: title, description, chapter list, tags (free, already local).
2. Guest/employer official bio pages (name spelling, portfolio companies).
3. Official company sites and `/about` pages (founder names, investor lists —
   Aven's own about page confirmed its Khosla backing).
4. Directories: YC company pages (founder names), Crunchbase/LinkedIn.
5. Official GitHub orgs/repos and product sites for protocol/product spellings —
   `Dodex`/`Aki Naki` resolved to DEX.DO on the Acki Nacki chain from dex.do and
   its CLI repo, not from any transcript.
6. Domain references for technical vocabulary (vendor docs, drug names, standards).
7. Alternate AI transcripts — corroboration only, never ground truth; two agreeing
   AI sources still lose to one authoritative page.

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
- **Count occurrences before writing every replacement** (`grep -c`). One
  occurrence means the bare token is safe; more means scope the replacement with
  context (`"with Ain and"` → `"with Aven and"`).
- **Panel-format pitfall: phrases spanning a timestamp marker never match.** In
  the raw format, `Nova` / `4:10` / `Nordisk` are separate lines, so replacing
  `"Nova Nordisk"` silently applies zero times. Detect this at the completion
  gate (residual grep + per-fix occurrence timestamps are empty), then fix the
  in-chunk fragment (`"Nova"` → `"Novo"`) after confirming its count.
- **Substring traps in validation:** after `ChemCro` → `ChemCrow`,
  `grep ChemCro` still matches inside the corrected word. Residual checks need
  word-boundary context (e.g. `grep "ChemCro[^w]"`).
- **Beware substring corruption across rules.** The applier sorts by
  `len(observed)` descending, so a longer, more specific replacement fires first
  and wins — but if you only add the short rule, it mangles longer tokens:
  `anthropic` → `Anthropic` turned the merged ASR token `aanthropic` into
  `aAnthropic` until `open aanthropic` → `OpenAI, Anthropic` was added.
- Include inflected variants as separate replacements (`base 10's`, `base 10`).
- Record every occurrence timestamp (nearest preceding marker) per fix. For a
  segment raw (see get-transcript's segment scoping) these timestamps are
  video-absolute by design — do not rebase them to segment start.
- **Scope everything to the segment**: glossary terms, fixes, and discovery
  scans cover the segment raw only; content outside the window does not exist
  for this artifact series.
- Never fix what stays unresolved: a documented `(unresolved)` glossary entry
  with all observed renderings beats a guessed correction (e.g. `Liupole` /
  `Leopold`, `Mccore`, `Padron`, `Jack's` vs an alternate source's `Shake Shack`).

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
