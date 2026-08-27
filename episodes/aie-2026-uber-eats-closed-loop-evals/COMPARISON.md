# COMPARISON — sources, agreement, and method notes

## Sources consulted

| Source | What it provided | Timestamps? | Status |
|---|---|---|---|
| yt-dlp `player_client=android,web_embedded` (list-subs) | track inventory (auto-captions only, no manual subs) | — | OK once, then IP 429/bot-gate, 2026-08-27 |
| yt-dlp captions/audio/info (`android`, `web_embedded`, `ios`, `tv`, `tv_downstairs`, `tv_embedded`, `web_safari`, `android_vr`, `web_creator`, `mediaconnect`) | — | — | Bot-gated ("Sign in to confirm you're not a bot"), 2026-08-27 |
| yt-dlp `mweb` / `web_safari` | — | — | No PO token → "Requested format is not available" |
| Direct Innertube POST sweep (7 clients) | — | — | HTTP 400/404 or playability=LOGIN_REQUIRED, no captionTracks |
| invidious/piped sweep (~12 instances across two passes) | — | — | dead, 403, anti-bot pages, or empty caption bodies |
| Transcript mirrors (youtubetotranscript.com, youtubetranscript.com, tactiq.io, kome.ai, notegpt.io) | flattened text only (kome) or blocked | no | Superseded by the watch-page fetch |
| Direct timedtext endpoints | — | — | HTTP 200, 0-byte bodies (unsigned URLs gated) |
| Server-side watch-page fetch | metadata, description, full transcript as flattened text | no | OK, 2026-08-27 → `youtube_raw_untimestamped.txt` |
| **yt-dlp `player_client=android` retry (~2 min later)** | **json3 caption track (en + en-orig, identical), info.json, format-18 audio** | **yes** | **OK, 2026-08-27 — the per-client gate lifted mid-session** |
| ai.engineer/worldsfair/2026 speakers.json + sessions.json | speaker spellings, roles, bios; event/date/track | — | OK (authoritative), 2026-08-27 |
| x.com/guptasoumya12, x.com/jai_chopra, zoominfo profile | speaker corroboration | — | OK, 2026-08-27 |

## Agreement check

The watch-page flattened copy and the json3 caption copy were normalized
(timestamp markers stripped, lowercased, punctuation collapsed to word tokens):
**3801 words each, zero delta** — both render the same YouTube auto-caption
track. As with prior episodes, agreement establishes copy fidelity, not
correctness; name corrections rest on external canonical references (the
conference's own JSON, the video description, speaker socials), per the
fix-transcript lookup order.

## Raw-format notes (kept verbatim, documented not "fixed")

- `[music]` / `>>` / `[applause]` markers are the ASR track's own; kept.
- ASR stutter and fillers ("I'll I'll", "Thanks Thanks,", "it it just") are
  verbatim; only the name inside "Thanks Thanks, Somya." was fixed.
- "we use our eyes", "Oh, my son done", "the technical is low ball",
  "For least for us" — documented in glossary.json as unresolved, not guessed.

## Panel-format pitfalls encountered (per skill docs)

- `hand over to Somya / 8:35 / who's` — the handover spans a timestamp marker;
  fixed by embedding the marker line in the observed string.
- `the false negative / 7:58 / negative cases` — same; the ASR duplicated
  "negative" across the marker.
- Header-mention trap (new variant worth noting): the raw header documents the
  ASR renderings ('Sonya'/'Aruba'/…), so naive bare-token replacements would
  rewrite the documentation itself. All name/employer rules are context-scoped
  ("Sonya. We", "at Aruba.", "at Rue Ba,"), and the residual gate greps the
  body separately from the header.

## Verification highlights (fix evidence)

- `Jay`→**Jai**, `Sonya`/`Somya`→**Soumya**: ai.engineer/worldsfair/2026/speakers.json
  (the conference's own data: "Soumya Gupta, ML Engineer, Uber … she architects
  and scales production-grade Generative AI and Computer Vision"; "Jai Chopra,
  Product Manager, Uber"), plus the video description's X/LinkedIn handles
  (guptasoumya12, jai_chopra). Verified 2026-08-27.
- `Aruba`/`Rue Ba`→**Uber**: video description + sessions.json; Uber Eats is
  transcribed correctly at its first mention one paragraph after "Aruba".
- `e-bows`/`e-bow loops`→**evals**/**eval loops**, `the vowels`→**the evals**:
  the talk title is "Building Closed-Loop Evals for a Multimodal Agent at
  Scale"; "eval" is transcribed correctly elsewhere ("how we eval it").
- `dog dog feeding`/`dog fooding`→**dogfooding**: standard industry term, and
  the next sentences describe exactly it.
- `false negative negative`→**false negative**: confusion-matrix cell names.
- `AI's lock`→**AI slop** (medium): the consumer-distrust passage; recording
  check still open.

## What a future pass could add

- Recording verification for the 3 medium-confidence rules (audio was
  downloaded during the session; re-fetch if expired).
- Speaker labels per block (the caption track has `>>` handoff markers at 0:17,
  8:48, 14:47 — Jai speaks 0:17–8:38, Soumya 8:48–14:40, Jai 14:47–end; an
  attributed variant could be derived without re-fetching).
- Chapter markers: info.json was captured (in /tmp during the session); this
  talk's description carries no chapter list, so none were recorded.
