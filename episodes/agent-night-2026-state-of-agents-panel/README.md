# Agent Night Live — Panel: The State of Agents (segment artifact series)

WorkOS *Agent Night Live: Introducing Intent-Based Access Control*, 2026-08-14,
Regency Ballroom, San Francisco. Source video: https://www.youtube.com/watch?v=wcYdO0v1K1k
(1:30:01 full length).

**This folder covers only the closing panel, 57:12 → 1:27:46 (end of panel).**
Keynote, lightning demos, and the closing WorkOS announcements are intentionally
out of scope (owner decision, 2026-08-23/26). Timestamps are video-absolute, so
every marker matches the source video.

Panel: **Jaya Gupta** (Foundation Capital), **Flo Crivello** (Lindy),
**Shawn "swyx" Wang** (AI Engineer / latent.space), moderated by WorkOS CEO
**Michael Grinich**.

## Files

| File | What |
|---|---|
| `youtube_raw.txt` | Immutable raw. Owner-copied YouTube transcript-panel text with timestamps (see COMPARISON.md for why this is the basis). |
| `proposed-transcript-fixes.json` | 58 fix rules → 75 corrections (45 high / 13 medium confidence). |
| `fixed_transcript.txt` | Raw + fixes applied by `.agents/skills/fix-transcript/scripts/apply_transcript_fixes.py` (exact port of `app/src/data/transcriptFixes.ts`). |
| `glossary.json` | 50 terms (Person/Firm/Company/Concept) with per-entry provenance, incl. 9 documented-unresolved items. |
| `video_metadata.md` | Title/channel/date/duration, description, chapter list, scope rationale — captured via server-side fetch while yt-dlp was bot-gated. |
| `COMPARISON.md` | Sources, agreement checks, fetch-blockage log, method notes, unresolved list. |

## How this was produced

1. `get-transcript` skill: fetch attempts of 2026-08-23 (all bot-gated, see
   COMPARISON.md) → server-side full-text captures (no timestamps) kept as
   cross-check material → owner hand-copied the transcript panel with
   timestamps on 2026-08-26 → that copy became the immutable raw (49/49
   agreement probes against both fetched copies pass).
2. `fix-transcript` skill: Stage 0 suspicious-token scan (627 rare-token
   candidates) → cluster/context resolution → web verification of candidate
   resolutions against authoritative sources (Foundation Capital, dbreunig.com,
   claude.com, thenewstack.io, Aug-2026 frontier-model roundups) → fixes JSON
   with per-occurrence timestamps → deterministic apply → residual gate
   (0 observed strings remain).

## Reproduce

```bash
python3 ../../.agents/skills/fix-transcript/scripts/apply_transcript_fixes.py \
  --transcript youtube_raw.txt \
  --fixes proposed-transcript-fixes.json \
  --out fixed_transcript.txt   # expect: 75 corrections from 58 fix rules
```

## Confidence model

- **high** (45 rules): video metadata, verified canonical reference, or
  unambiguous context (e.g. `Palunteer`→Palantir with Alex Karp named correctly
  two lines later).
- **medium** (13 rules): strong context but invented spelling — each says
  "verify against recording" in its reason; the glossary marks the entry
  `user review pending (recording)`.
- **unresolved** (10 glossary entries): documented with candidates, not
  guessed — including `'soul'` in the GPT-5.6/Soul/Fable model list (Fable 5
  turned out to be a real Claude model; "soul" itself was later owner-resolved to OpenAI's Sol).
