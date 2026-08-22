# 20VC: "The AI Bubble WILL Burst" — Jerry Murdock (2026-08-22)

A standalone episode artifact series, following this repository's transcript
conventions (immutable raw + traceable proposed fixes + glossary + fixed transcript).
Not a UNLOCK 2026 session and not wired into the app; this folder is data/documentation only.

- Video: https://www.youtube.com/watch?v=R1336Jyb-qk (1:10:08, 20VC with Harry Stebbings)
- No manual subtitles exist; the raw transcript is YouTube's auto-generated captions
  (fetched with yt-dlp, `player_client=android,web_embedded` to pass YouTube's datacenter
  bot check, json3 format to avoid VTT rolling-window dedup).

## Files

| File | Role |
|---|---|
| `youtube_raw.txt` | Immutable raw transcript (URL header, `---`, alternating M:SS / text lines) |
| `proposed-transcript-fixes.json` | 26 traceable correction rules (observed→proposed, timestamps, confidence, reason). Raw text is never modified. |
| `fixed_transcript.txt` | Raw + fixes applied with the same algorithm as `app/src/data/transcriptFixes.ts` (74 corrections) |
| `glossary.json` | 50 canonical terms for the episode; names no source could confirm are marked `(unresolved)` instead of being guessed |
| `alternate_bidclub_full.md` | Full speaker-attributed transcript from bidclub.ai (cross-reference) |
| `alternate_audioscrape_preview.md` | Audioscrape preview, partial (full text requires their sign-in); includes podcast-only ad reads |
| `COMPARISON.md` | Method comparison (yt-dlp variants) and source cross-reference findings |

## Known limitations

- ASR is verbatim: disfluencies, no speaker labels in the YouTube source (`>>` marks
  speaker-change hints only), and two names remain unresolved in every AI source
  ("Aki Naki"/DODEx, "Leopold").
- Medium-confidence fixes should be checked against the recording before being treated
  as final, per the conventions in `app/src/data/proposed-transcript-fixes.json`.
- The podcast-audio edit (audioscrape) contains ~2.5 min of dynamically inserted ads
  absent from the YouTube edit, so cross-source timestamps drift.
