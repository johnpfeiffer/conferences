---
name: attribute-speakers
description: Attribute anonymous transcript speakers to real people using traceable evidence, immutable words/timestamps, separate confidence and verification, and fail-closed rendering. Use for diarization, speaker-label repair, or citation-ready identification; use fix-transcript for wording changes.
---

# Attribute speakers

Own the answer to **who said each passage**. The sibling `get-transcript` skill
owns acquisition; `fix-transcript` owns words. This skill may assign or repair
speaker labels, but it must never alter source words or timestamps.

## Non-negotiable contract

1. Keep anonymous diarization (`SPEAKER_00`) separate from identity attribution
   (`SPEAKER_00` -> `Alice Smith`).
2. Preserve stable speaker IDs even after a name is verified. Render both.
3. Treat `confidence` and `status` as different claims. Confidence is an
   estimate; only `status: "verified"` authorizes a name in citation-ready output.
4. Fail closed. Candidate or probable identities render as anonymous IDs unless
   an explicitly requested review view marks them as uncertain.
5. An LLM may propose speaker-label changes, never word or timestamp changes.
   Apply only verified, segment-scoped changes.
6. Preserve backend output and record the backend, model/version, parameters,
   source hashes, and any known-speaker reference clips.

## Workflow

### 1. Inventory evidence

Locate the corrected timestamped transcript, original audio, expected participant
roster, publisher metadata/show notes, and any clean reference clips. If the
transcript is still uncorrected, run `fix-transcript` first when wording accuracy
matters. Do not infer identities from a participant roster alone.

### 2. Produce anonymous diarization

Choose a backend based on the available audio, privacy/cost constraints, known
speaker clips, and whether word-level alignment is needed. Read
[references/diarization-backends.md](references/diarization-backends.md) when
selecting or operating a backend. Normalize its result to `diarization.json`
without discarding the backend's raw output.

### 3. Reconcile timestamps to speaker IDs

Normalize the corrected repo-format transcript (header, `---`, timestamp/text
blocks) to `transcript-segments.json`. Supply the exact audio-edit duration so
the final segment has a defensible end time:

```bash
python3 scripts/transcript_to_segments.py \
  --transcript corrected_transcript.txt \
  --duration 3960.42 \
  --out transcript-segments.json
```

Then reconcile it with diarization:

```bash
python3 scripts/reconcile_diarization.py \
  --transcript transcript-segments.json \
  --diarization diarization.json \
  --out speaker-segments.json
```

The script assigns the speaker with the greatest time overlap. Insufficient or
near-tied overlap becomes `UNKNOWN`; it does not guess. Prefer word-level aligned
segments when short interruptions and backchannels matter.

### 4. Identify anonymous speakers

Build `speaker-attribution.json`. Read
[references/evidence-model.md](references/evidence-model.md) before promoting an
identity to `probable` or `verified`. Prefer contextual evidence such as explicit
introductions, self-identification, direct address plus a participant roster, and
publisher metadata before voice biometrics. LLM inference alone never verifies a
person.

Keep the state honest:

```text
unknown -> candidate -> probable -> verified
```

### 5. Repair suspicious speaker labels when needed

Inspect micro-turns, one-word backchannels, rapid A-B-A flips, tiny orphan
clusters, overlap, and inconsistent conversational runs. Use deterministic
reasoning first. If an LLM helps, restrict its action space to existing segment
IDs and speaker IDs and give it an edit budget.

Record proposals in `speaker-label-fixes.json`; do not edit `speaker-segments.json`
directly. Apply only fixes whose individual status is `verified`:

```bash
python3 scripts/apply_speaker_fixes.py \
  --segments speaker-segments.json \
  --fixes speaker-label-fixes.json \
  --out verified-speaker-segments.json
```

### 6. Validate and render

Read [references/artifacts.md](references/artifacts.md) when creating or
troubleshooting the canonical JSON artifacts.

```bash
python3 scripts/validate_attribution.py \
  --transcript transcript-segments.json \
  --diarization diarization.json \
  --segments verified-speaker-segments.json \
  --attribution speaker-attribution.json \
  --fixes speaker-label-fixes.json

python3 scripts/render_attributed_transcript.py \
  --segments verified-speaker-segments.json \
  --attribution speaker-attribution.json \
  --out speaker-attributed-transcript.md
```

The default renderer names only verified identities and always includes their
stable speaker ID. `--review-labels` may expose candidate/probable names with a
question mark for human review; never use that mode for citation-ready output.

## Completion gate

Do not report done until:

- raw backend output and normalized `diarization.json` both exist;
- validation proves segment IDs, text, and timestamps match the corrected source;
- every diarized speaker ID has an attribution entry, even if it stays unknown;
- every verified identity has binding evidence beyond metadata or LLM inference;
- every applied speaker-label fix is segment-scoped, verified, and audited;
- uncertain regions and unresolved identities are documented;
- at least the opening exchange, three random passages, and every citation-bound
  passage are checked against the recording; and
- the bundled script tests pass.

## Deliverables

- `diarization.json` plus untouched backend output
- `transcript-segments.json`
- `speaker-segments.json` (and `verified-speaker-segments.json` if repaired)
- `speaker-attribution.json`
- `speaker-label-fixes.json` when repairs were proposed
- `speaker-attributed-transcript.md`
