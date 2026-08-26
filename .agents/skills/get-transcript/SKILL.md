---
name: get-transcript
description: Fetch a YouTube/podcast transcript plus its related resources (info.json metadata, chapter list, alternate AI transcripts) with datacenter bot-check workarounds and caption-format pitfalls documented. Use when asked to download, extract, or transcribe a video/podcast transcript. Pair with the fix-transcript skill for correction.
metadata: {"openclaw":{"requires":{"bins":["yt-dlp","python3"]}}}
---

# Get transcript

Deliverable: an immutable raw transcript plus the related resources that later
correction work needs. Fixing lives in the sibling skill `fix-transcript`.

## Start

Confirm the tool and current contract before running the real workflow:

```bash
yt-dlp --version
pip install -U yt-dlp   # stale versions break on YouTube changes
```

Run the narrowest workflow that gets the data. Quote URLs.

## Fetch captions

```bash
# 1. Inventory: prefer manual subtitles over auto-captions
yt-dlp --skip-download --list-subs \
  --extractor-args "youtube:player_client=android,web_embedded" "$URL"

# 2. Download best track + metadata
yt-dlp --skip-download --write-subs --write-auto-subs --sub-langs "en.*" \
  --sub-format "json3/vtt" --write-info-json \
  --extractor-args "youtube:player_client=android,web_embedded" "$URL"
```

Pitfalls, in the order you will hit them:

1. **Bot check from datacenter IPs** — HTTP 429 / "Sign in to confirm you're not a bot".
   `player_client=android,web_embedded` usually bypasses it. Otherwise try other
   clients (`ios`, `mweb`, `tv`), then `--cookies-from-browser` or exported
   `--cookies`. Note the bypass list is per-IP and per-day: a client combo that
   worked yesterday can be gated today. `youtube-transcript-api` shares the same
   IP reputation and is not a bypass. If every path is gated, **an existing
   owner-supplied transcript of the same video (e.g. copied from the YouTube
   transcript panel) is a valid immutable raw basis** — record the fetch failure
   and the substitution in the artifacts.
2. **Prefer json3 over vtt** — auto-caption VTTs use rolling-window cues (each cue
   repeats the previous line) and need a dedup pass; json3 events are sequential
   and non-overlapping. Concatenate segment text directly.
3. **Auto-captions are verbatim ASR** — mangled proper nouns, no guaranteed
   punctuation, occasional dropped sentences. Fine as raw material; never present
   as corrected.
4. **Check the span** — caption start/end should cover the full video duration.
   A short span means a partial track, not a short video.

Convert to the repo raw format (header, `---`, alternating M:SS / text lines):

```bash
python3 scripts/youtube_to_raw.py --json3 VIDEOID.en-orig.json3 --url "$URL" \
  --description "..." --speakers "Host (host), Guest (guest)" --out youtube_raw.txt
```

## Collect the related resources

These are what make later correction possible; always grab them alongside the text.

| Resource | How | Why |
|---|---|---|
| `info.json` | `--write-info-json` (above) | Title, description, chapters, tags = ground truth for proper nouns (guest spelling, company names) |
| Chapter list | inside info.json | Section markers for a structured final transcript |
| Description links | inside info.json | Guest socials, sponsor names, canonical terminology |
| bidclub.ai | fetch episode page | Full **speaker-attributed** AI transcript, free; no timestamps |
| audioscrape.com | fetch episode page | Preview only without sign-in; podcast-audio edit has inserted ad reads the YouTube edit lacks, timestamps drift ~2-3 min |

Cross-check the opening minutes across sources. Two AI sources agreeing is a
signal; one alone is not. Record dropped sentences and edit differences; do not
"restore" text into the raw transcript.

Also harvest anything that will later serve as an **authoritative glossary**
for correction (the lookup procedure lives in `fix-transcript`): the guest's
official bio page, portfolio/company sites named in the description, directory
pages (e.g. YC company pages for founder names), and official repos/product
sites for protocol spellings. Record what was consulted, with dates — glossary
entries without provenance are guesses.

## Fallback: local transcription

Only when captions are missing or unacceptable. Download audio
(`yt-dlp -x --audio-format wav`) and run faster-whisper (`large-v3`;
`large-v3-turbo` when speed matters, `medium` + `--device cpu` on small machines).
For speaker diarization on interviews, the strongest pattern (from the
`youtube-transcript-pdf` skill) is **hybrid**: keep YouTube captions as canonical
text, overlay WhisperX/pyannote speaker boundaries. Never infer speaker identities
without evidence in the text or metadata.

## Completion gate

Do not report done until:

- Raw transcript exists, non-empty, and the caption span ≈ video duration.
- `info.json` saved; chapters and description mined for the resource table above.
- Each alternate source was fetched, or its unavailability is recorded.
- Method and source caveats (ASR, ads, edit differences) are written down.

Then hand off to `fix-transcript` for correction.

## References

- Worked example: `episodes/20vc-jerry-murdock/` in this repo
- Sibling skill: `.agents/skills/fix-transcript/`
- steipete/summarize: https://github.com/steipete/summarize/blob/main/.agents/skills/summarize/SKILL.md (capability-first start, verify discipline, no-secret-printing)
- aniketpanjwani/youtube-transcript-pdf: https://github.com/aniketpanjwani/skills/blob/main/skills/general/youtube-transcript-pdf/SKILL.md (manual-over-auto track priority, hybrid diarization, whisper fallback flags, audit trail)
- beanels01/youtube-transcript: https://github.com/beanels01/youtube-transcript/blob/main/SKILL.md (pipeline shape, role indicators for speaker mapping)
