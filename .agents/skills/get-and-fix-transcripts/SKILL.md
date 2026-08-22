---
name: get-and-fix-transcripts
description: Fetch a YouTube/podcast transcript (yt-dlp with datacenter bot-check workarounds), cross-reference AI transcript mirrors (bidclub, audioscrape), and produce a corrected transcript using this repo's immutable-raw + glossary + proposed-fixes convention. Use when asked to download, transcribe, clean up, correct, or proper-noun-fix a video or podcast transcript.
---

# Get and fix transcripts

Produces an artifact series: immutable raw transcript, alternate transcriptions,
a glossary, traceable proposed fixes, and a fixed transcript. Conventions match
`app/src/data/glossary.json` and `app/src/data/proposed-transcript-fixes.json`.

## Phase 1: Get the transcript

```bash
pip install yt-dlp
yt-dlp --skip-download --list-subs \
  --extractor-args "youtube:player_client=android,web_embedded" "$URL"
yt-dlp --skip-download --write-auto-subs --write-subs --sub-langs "en.*" \
  --sub-format "json3/vtt" --write-info-json \
  --extractor-args "youtube:player_client=android,web_embedded" "$URL"
```

Pitfalls, in the order you will hit them:

1. **Bot check from datacenter IPs.** Default extraction fails with HTTP 429 /
   "Sign in to confirm you're not a bot". `player_client=android,web_embedded`
   usually bypasses it. If not, fall back to `--cookies-from-browser` or
   `--cookies` exported from a logged-in browser.
2. **Prefer json3 over vtt.** Auto-caption VTTs use rolling-window cues (each cue
   repeats the previous line) and need dedup. json3 events are sequential and
   non-overlapping; concatenate segment text directly.
3. **Check for manual subs first** (`--list-subs`); only use `--write-auto-subs`
   when no manual track exists. Auto captions are verbatim ASR: no guaranteed
   punctuation, mangled proper nouns, occasional dropped sentences.
4. **Always keep the info.json.** Title, description, chapter list, and tags are
   the ground-truth glossary for proper nouns (guest name spelling, company names,
   chapter terminology) before any AI cross-reference exists.

Convert with `scripts/youtube_to_raw.py` (json3 -> repo raw format), or download
audio (`yt-dlp -x --audio-format wav`) for a local Whisper run only when ASR
quality is unacceptable (slow on CPU; not the default).

## Phase 2: Cross-reference alternates

Fetch any mirror pages and compare the opening minutes and all proper nouns:

| Source | What you get | Gotchas |
|---|---|---|
| bidclub.ai | Full speaker-attributed transcript, free | No timestamps; verify against raw |
| audioscrape.com | Preview only without sign-in | Podcast-audio edit: has inserted ad reads the YouTube edit lacks; timestamps drift ~2-3 min |

Typical findings to record: sentences the YouTube ASR dropped, different name
renderings, edit differences (intro ordering, ads). Two AI sources agreeing is a
strong signal; one AI source alone is not. Never "fix" a name every source
renders differently: mark it `(unresolved)` in the glossary instead.

## Phase 3: Fix (immutable raw, traceable proposals)

1. Build `glossary.json`: `{schemaVersion, scope, referenceUrls, terms[{term,
   category, definition}]}`. Categories: Person, Firm, Company, Concept,
   `Unresolved proper noun`.
2. Build `proposed-transcript-fixes.json`: `{schemaVersion, status:
   "proposed-only", notes, referenceUrls, fixes[{id, replacements[{observed,
   proposed}], occurrences[{transcript, timestamps[]}], confidence, reason}]}`.
   - `high`: supported by video metadata, a public company name, or unambiguous
     context. `medium`: strongly suggested by context or another AI transcript;
     must be verified against the recording before being treated as final.
   - Replacements are **case-sensitive** exact strings. Use that deliberately,
     e.g. lowercase-only `anthropic` -> `Anthropic` leaves correct instances alone.
   - List a longer variant before its prefix is unnecessary; the applier sorts by
     `len(observed)` descending, but keep both forms as separate replacements
     (`base 10's` and `base 10`).
3. Apply with `scripts/apply_transcript_fixes.py` (port of
   `app/src/data/transcriptFixes.ts`: flatten replacements, sort by observed
   length descending, split/join, count). Raw file stays untouched.

## Phase 4: Validate

- Both JSON files parse; fixed output contains zero occurrences of any `observed`
  string (`grep` for a sample of them).
- Correction count is reported and each fix lists the timestamps where it fired.
- Spot-check 3 random segments of the fixed transcript against an alternate source.
- If anything in `app/` changed, `npm test` must pass. Data-only additions
  (episode folders, this skill) do not require it.

## Deliverables checklist

- [ ] `youtube_raw.txt` (or `<episode>_raw.txt`) — immutable
- [ ] `alternate_<source>.md` per mirror used, with coverage notes
- [ ] `glossary.json`
- [ ] `proposed-transcript-fixes.json`
- [ ] `fixed_transcript.txt` + correction count
- [ ] Notes file recording method, discrepancies, and unresolved names

Worked example: `episodes/20vc-jerry-murdock/` in this repo.
