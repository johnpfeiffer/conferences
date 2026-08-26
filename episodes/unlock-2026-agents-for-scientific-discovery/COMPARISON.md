# Method notes — UNLOCK 2026 "Agents for Scientific Discovery"

## 1. Fetch attempt (get-transcript skill), 2026-08-23

| Attempt | Result |
|---|---|
| yt-dlp `player_client=android,web_embedded` (worked 2026-08-22 for the 20VC episode) | "Sign in to confirm you're not a bot" |
| yt-dlp `ios` / `mweb` / `tv` / `web_creator` / `mediaconnect` | same bot-gate |
| youtube-transcript-api | `IpBlocked` |

Conclusion: YouTube escalated bot defenses against this environment's IP within
~a day; the bypass list is per-IP and per-day, and the cookie fallback needs a
browser profile that doesn't exist here. Fallback taken: the owner-copied
YouTube-panel transcript already in the repo (same ASR source), copied
byte-identical (md5-verified) as this folder's immutable raw. The skill's
fallback ladder should treat an existing owner-supplied transcript as a valid
raw basis and record it.

## 2. Associated glossaries used (fix-transcript skill)

Authoritative sources actually consulted, in the skill's lookup order:

1. Session header in the transcript itself (speaker, affiliation, Kosmos/Edison).
2. `app/src/data/proposed-transcript-fixes.json` — 11 owner-authored fixes for
   this transcript, inherited unchanged (METR, FutureHouse, PaperQA, GPT-4,
   Kosmos, LAB-Bench, BixBench x2, ProteinCrow/Claude Code/OpenClaw medium,
   co-founded, bioinformatics x2, covalent/pan-KRAS).
3. `app/src/data/glossary.json` — 250-term canonical conference glossary
   (reconciliation target for casing/spelling).
4. `app/src/data/graph/entities.json` — 76 knowledge-graph entities (people/orgs).
5. Canonical references cited without fresh fetch (papers/products): ReAct,
   Coscientist (Nature 2023), ChemCrow, bioRxiv, Novo Nordisk.
6. No alternate AI transcripts exist for this conference talk (bidclub/
   audioscrape are podcast indexes); recorded as unavailable.

## 3. What the suspicious-token discovery added

Delta over the site's own fixed view: **+12 corrections (39 vs 27)**.

- Rare-token scan (count <= 2, len >= 7, glossary-filtered): 274 candidates, of
  which ~a dozen genuine anomalies after context windows.
- Cluster win: the 4:08-4:50 history passage hid five mangles in eight lines
  (Nova/Novo Nordisk, Shenu Yao/Shunyu Yao, react/ReAct, Gabe Gomez/Gabe Gomes,
  co-scientist/Coscientist, ChemCro/ChemCrow) — all in the 2022-2023 agent-paper
  recap.
- Panel-format pitfall (now documented in the skill): a phrase split across a
  timestamp marker (`...at Nova` / `4:10` / `Nordisk...`) never matches a
  whole-phrase replacement — the fix silently applies zero times. The completion
  gate's residual grep is what catches this; fix the in-chunk fragment after
  counting occurrences.
- Substring false positive to know when validating: after `ChemCro` →
  `ChemCrow`, a naive `grep ChemCro` still matches inside `ChemCrow`; use a
  word-boundary check (`ChemCro[^w]`).

## 4. Unresolved (documented in glossary, not guessed)

- "Luzison" (4:46) — IBM cloud-lab location; candidates Zurich/Rüschlikon.
- "Antonio's" (13:26) — first-name-only paper citation.
- "Sam" (~2:59) — Edison co-founding reference; likely Sam Rodriques, unverified.
