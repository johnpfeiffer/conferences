# COMPARISON — sources, agreement, and method notes

## Sources consulted

| Source | What it provided | Timestamps? | Status |
|---|---|---|---|
| yt-dlp (6 player clients) + youtube-transcript-api | — | — | Bot-gated from working IP, 2026-08-23 |
| invidious/piped sweep (14 instances) | track list only (inv.nadeko.net); caption body empty | — | Instances down, gated, or empty, 2026-08-23 |
| Real Chrome via agent-browser | — | — | `google.com/sorry` interstitial (whole-IP rate limit), 2026-08-23 |
| Server-side watch-page fetch | metadata, chapters, full transcript as flattened text | no | OK, 2026-08-23 |
| youtubetotranscript.com (server-side fetch) | second flattened full text | no (toggle is client-side) | OK, 2026-08-23 (Cloudflare-blocked for direct browser) |
| **Owner-copied transcript panel** | **raw basis** | **yes (video-absolute)** | **OK, 2026-08-26** |

## Agreement check

The owner copy was verified against both fetched full-texts: 49/49 distinctive
panel probes (including every mangled name: `Voyman`, `misdraw`, `DeepSync`,
`tweettorm`, `claw tag victor town`, …) appear identically in all three copies.
All three render the same YouTube auto-caption track, so ASR errors are shared
across sources — agreement establishes copy fidelity, not correctness. Name
corrections therefore rest on external canonical references, not on the
alternate renderings (per the fix-transcript lookup order).

## Raw-format notes (kept verbatim, documented not "fixed")

- First block carries no timestamp in the copy (it begins at the requested
  57:12 mark). Same quirk as the repo's UNLOCK raw.
- The line `Panel: The State of Agents with Jaya Gupta (foundation capital), …`
  between 57:29 and 57:35 is YouTube's inline chapter marker, not speech; kept
  verbatim including its lowercase '(foundation capital)'.
- Marker 1:15:29 appears twice in a row in the copy; kept verbatim.

## Panel-format pitfalls encountered (per skill docs)

- `the AI engineer / 58:38 / world fair` — the event name spans a marker; fixed
  as two in-chunk fragments (`the AI Engineer`, `World's Fair`).
- `for ten of the / 1:01:09 / price` — same; fixed as `for a tenth of the`.
- Substring traps respected: case-scoped `claude`→`Claude` (4 lowercase
  occurrences, all the product) leaves `Cloud Code` alone; `co-work`→`Cowork`
  leaves `remote coworker` alone; `phone number for cloud`→`…for Claude` is
  scoped because `sent to the cloud` (1:26:54) is legitimate.

## Verification highlights (fix evidence)

- `contact graph`→**context graph**: Foundation Capital essay by Jaya Gupta &
  Ashu Garg, foundationcapital.com (verified 2026-08-26); correctly transcribed
  later in the same panel (1:15:54).
- `powers MD to deepsee`→**powers Lindy to DeepSeek**: Lindy's 100% switch to
  DeepSeek v4, Flo Crivello's June 2026 announcement (thenewstack.io, X post;
  verified 2026-08-26). "MD"→"Lindy" remains medium confidence.
- `Drew Brunig`→**Drew Breunig** and `skilled doctor`→**DrSkill**: dbreunig.com
  + github.com/dbreunig/drskill (verified 2026-08-26); ASR spoonerized the tool
  name.
- `5.6 soul and fable`: GPT-5.6 and **Claude Fable 5** are real Aug-2026
  frontier models (CASRAI/mungomash roundups) — 'Fable' would never have been
  guessed without verification; 'soul' stayed unresolved.
- `co-work`→**Cowork**: claude.com/product/cowork (verified 2026-08-26).
- `A6 versus GPUs`→**ASICs versus GPUs**: same ASR pattern as the 20VC
  episode's 'A6 chips'→ASIC.
- The von Neumann riff carried **five** distinct manglings (`Voyman`, `Vman`,
  `godman's`, `Boy Nman`, `von Noman` ×2) in 30 seconds — all resolved.

## Unresolved (documented in glossary.json, not guessed)

`'soul'` (model name?), `claw tag victor town`, `cushion loop`/`SL loop`/`SL code`,
`limit harness is on there`, `I got boots so hard`, `Patty was by great`,
`like a big rocked`, `Jimmy needs`, `I will Hello`, `replicate it com like`.

## What a future pass could add

- Recording verification for the 14 medium-confidence rules.
- Speaker labels per block (the panel copy has no speaker attribution; PR #2's
  attribution skill or a WhisperX/pyannote pass on the audio would supply it).
- The preceding segments (keynote + lightning demos) as their own artifact
  series if ever wanted — the two fetched full-texts already cover them.
