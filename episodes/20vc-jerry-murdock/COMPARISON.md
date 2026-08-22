# Approach comparison and source cross-reference

Episode: 20VC with Harry Stebbings — "The AI Bubble WILL Burst" (Jerry Murdock), 2026-08-22, 1:10:08.
Video: https://www.youtube.com/watch?v=R1336Jyb-qk

## 1. ChatGPT's yt-dlp approach vs what actually worked

ChatGPT's suggested commands:

```
yt-dlp --list-subs 'https://www.youtube.com/watch?v=R1336Jyb-qk'

yt-dlp --skip-download --write-subs --write-auto-subs \
  --sub-langs 'en' --sub-format vtt \
  'https://www.youtube.com/watch?v=R1336Jyb-qk'
```

| Aspect | ChatGPT approach | Executed approach |
|---|---|---|
| Bot check | **Fails from this environment.** Default web extraction returns HTTP 429 then "Sign in to confirm you're not a bot" — standard YouTube behavior toward datacenter IPs. Both commands would stop here. | Adds `--extractor-args "youtube:player_client=android,web_embedded"`, which hits different player API endpoints that were not bot-gated. No cookies needed. |
| Subtitle discovery | `--list-subs` is right, and correctly anticipates auto-subs. | Same, plus the extraction args. Result: no manual subtitles exist; auto captions available in ~100 languages (translations of the English ASR). |
| Format | `vtt`. YouTube auto-caption VTTs use rolling-window cues (each cue repeats the previous line), so clean text needs a dedup pass. | `json3` (with vtt fallback). json3 events are already sequential, non-overlapping segments with word timing, so text extraction is a straight concatenation. |
| Metadata | Not captured. | `--write-info-json` → title, description, 18 chapter markers, tags, guest bio. This became the correction glossary's ground truth (e.g. "Murdock" spelling, chapter-styled "Neo Clouds"/"Quick-Fire Round"). |
| Post-processing | None specified. | json3 → repo-style raw transcript (header + M:SS lines) → proposed-fixes JSON → fixed transcript, per the conferences-repo conventions. |

Verdict: ChatGPT's commands are the textbook recipe and work from a residential IP, but (a) they
break on datacenter IPs without the player-client override or cookies, and (b) `--sub-format vtt`
buys you a dedup problem that `json3` avoids for free.

## 2. Transcript source cross-reference

| | YouTube ASR (primary) | audioscrape.com | bidclub.ai |
|---|---|---|---|
| Coverage | Full 1:10:08, 865 caption blocks, ~11.9k words | Preview only (~first 4 min); full text behind Google/Microsoft sign-in | Full episode, ~10.6k words |
| Speaker attribution | No (only `>>` change hints) | Yes (preview) | Yes (Jerry Murdock / Harry Stebbings throughout) |
| Timestamps | Yes, per block | Yes, but on the podcast-audio timeline | No |
| Ads | None in the YouTube edit | Includes dynamically-inserted reads (Zerohash, MongoDB, Framer) | No ad reads in transcript |
| Extra structure | — | Section headings | TL;DR + 8-section research digest + section headings in transcript |
| Access | Free via yt-dlp | Sign-in for full text | Free, full text on page |

### Confirmed discrepancies found by cross-checking
1. **Dropped sentence (YouTube ASR):** both alternates have "Neoclouds right now, there's a whole
   bunch of them." after "Let's take neoclouds." YouTube's ASR skips it. Not restored in the fixed
   transcript (fix pipeline only rewrites observed strings; noted here for the record).
2. **"hot seat stage" (YouTube) vs "hot seat today" (audioscrape):** medium-confidence fix applied.
3. **Intro ordering:** bidclub moves Harry's "best job in the world / dumb as rocks" line before the
   first question; YouTube has the "hot seat" intro first, then that line at 0:56. Editorial, not an
   ASR error in either.
4. **Unresolved in every AI source:** "Aki Naki"/"Akinaki" (inference exchange with "DODEx") and
   "Leopold" (the 3.5x-levered fund blowup). Documented in glossary.json, deliberately not "fixed".

## 3. Artifact series (conferences-repo conventions)

| File | Role |
|---|---|
| `youtube_raw.txt` | Immutable raw transcript, repo format: URL header, description, `---`, alternating M:SS / text lines |
| `alternate_bidclub_full.md` | Full speaker-attributed BidClub transcript |
| `alternate_audioscrape_preview.md` | Audioscrape preview (partial; ads flagged) |
| `glossary.json` | 50 canonical terms (people/firms/companies/concepts), incl. 3 flagged unresolved |
| `proposed-transcript-fixes.json` | 26 traceable fix rules with timestamps, confidence, reasons; raw untouched |
| `fixed_transcript.txt` | Raw + fixes applied via the repo's exact algorithm (flatten, sort by len(observed) desc, split/join): **74 corrections** |

## 4. What a next iteration could add
- Speaker labels on the fixed transcript by aligning bidclub's attributed text to the timestamped
  blocks (fuzzy sentence matching).
- A Whisper large-v3 local re-transcription as a third opinion on the unresolved names.
- The overlay reading view: fixed text with the original ASR line on hover, like the conferences site.
