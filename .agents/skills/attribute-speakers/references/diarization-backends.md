# Diarization backend selection

Backend output is evidence, not authority. Preserve the raw response, exact
model/version, parameters, audio hash, and any known-speaker reference hashes.
Check current provider documentation before running a paid or remote backend;
limits and model names can change.

## OpenAI transcription with diarization

Useful when a simple hosted workflow or known-speaker hints are valuable. The
official OpenAI `transcribe` skill uses `gpt-4o-transcribe-diarize` with
`diarized_json` for speaker-labeled transcription and documents known-speaker
references. Keep this as one backend, not the skill's architectural dependency.

Primary references:

- https://github.com/openai/skills/blob/main/skills/.curated/transcribe/SKILL.md
- https://github.com/openai/skills/blob/main/skills/.curated/transcribe/references/api.md

## pyannote.audio

Use `pyannote/speaker-diarization-community-1` as the open-source/local reference
when its license, model access, and hardware requirements fit. Its exclusive
speaker diarization is useful for timestamp reconciliation. If the participant
count is authoritative, supplying an exact/min/max speaker count can help, but
never treat it as proof that clusters are correct.

Primary reference:

- https://github.com/pyannote/pyannote-audio

## WhisperX

Useful when starting from raw audio and word-level forced alignment is important.
WhisperX combines ASR, alignment, and pyannote diarization, and its speaker
assignment logic uses time overlap. Prefer its JSON/word-level output over plain
text when backchannels or interruptions matter.

Primary references:

- https://github.com/m-bain/whisperX
- https://github.com/m-bain/whisperX/blob/main/whisperx/diarize.py

## Constrained label repair

`diatribe` is a small, non-authoritative project but a useful design reference:
words and timestamps are immutable; heuristics and a constrained LLM may relabel
speakers; edits have reason codes and an edit budget. Borrow the invariants, not
its identity claims.

Reference:

- https://github.com/kieronlawson/diatribe

## Selection questions

Choose the narrowest adequate backend after answering:

- Is audio allowed to leave the machine?
- Is the exact participant count known?
- Are there clean, authorized reference clips?
- Are word-level timestamps required?
- How much overlap or cross-talk is present?
- What cost, latency, GPU, or credential constraints apply?

If a backend already returns names, normalize them to anonymous IDs and record
the names as attribution evidence. Do not copy them directly into every segment.

