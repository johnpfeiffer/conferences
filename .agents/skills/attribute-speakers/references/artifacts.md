# Canonical artifacts

All times are seconds from the start of the exact audio edit used for
diarization. Use JSON numbers, not timestamp strings. Use SHA-256 to bind derived
files to their inputs.

## `transcript-segments.json`

This is a deterministic normalization of the corrected transcript. Use
`scripts/transcript_to_segments.py` for the repository's header + `---` +
timestamp/text format. Segment IDs, text, and timestamps become immutable inputs
to attribution. The final end time comes from the exact audio-edit duration, not
an estimate from the last caption start.

```json
{
  "schemaVersion": 1,
  "source": {
    "path": "corrected_transcript.txt",
    "sha256": "64 lowercase hex characters"
  },
  "segments": [
    {
      "id": "seg-000001",
      "start": 0.0,
      "end": 4.82,
      "text": "Welcome to the show."
    }
  ]
}
```

Use the source file's byte-level SHA-256 in `source.sha256`. The workflow scripts
also compute a canonical JSON hash when binding one JSON artifact to another.

## `diarization.json`

Keep the backend's raw response separately. This normalized derivative contains
only anonymous speaker timing plus provenance.

```json
{
  "schemaVersion": 1,
  "source": {
    "path": "episode.wav",
    "sha256": "64 lowercase hex characters"
  },
  "backend": {
    "name": "pyannote.audio",
    "model": "pyannote/speaker-diarization-community-1",
    "version": "installed version",
    "parameters": {"num_speakers": 2}
  },
  "segments": [
    {"start": 0.2, "end": 4.7, "speaker_id": "SPEAKER_00"}
  ]
}
```

Record a known-speaker clip as input evidence, including its path/hash and the
name supplied to the backend. A backend-provided name is still evidence to
evaluate; normalize its cluster to a stable `SPEAKER_N` ID.

## `speaker-segments.json`

`reconcile_diarization.py` copies every transcript segment and adds only a
speaker assignment and audit details:

```json
{
  "schemaVersion": 1,
  "sources": {
    "transcriptCanonicalSha256": "...",
    "diarizationCanonicalSha256": "..."
  },
  "join": {
    "method": "maximum_overlap",
    "minOverlapRatio": 0.5,
    "ambiguityMarginRatio": 0.1
  },
  "segments": [
    {
      "id": "seg-000001",
      "start": 0.0,
      "end": 4.82,
      "text": "Welcome to the show.",
      "speaker_id": "SPEAKER_00",
      "assignment": {
        "overlapSeconds": 4.5,
        "segmentCoverage": 0.93361,
        "runnerUpSpeakerId": null,
        "runnerUpOverlapSeconds": 0.0
      }
    }
  ]
}
```

`UNKNOWN` means the evidence did not support a deterministic assignment.

## `speaker-attribution.json`

Identity is a mapping, never copied into every segment:

```json
{
  "schemaVersion": 1,
  "sourceSegments": {
    "path": "verified-speaker-segments.json",
    "sha256": "canonical JSON SHA-256"
  },
  "speakers": [
    {
      "speaker_id": "SPEAKER_00",
      "name": "Alice Smith",
      "status": "verified",
      "confidence": 0.99,
      "evidence": [
        {
          "id": "ev-001",
          "type": "dialogue_identity_link",
          "source": "episode audio",
          "timestamp": "00:00:08",
          "claim": "The guest addresses this cluster as Alice immediately after the host introduction."
        },
        {
          "id": "ev-002",
          "type": "publisher_metadata",
          "source": "episode info.json",
          "claim": "Alice Smith is the published host."
        }
      ]
    },
    {
      "speaker_id": "SPEAKER_01",
      "name": null,
      "status": "unknown",
      "confidence": null,
      "evidence": []
    }
  ],
  "notes": []
}
```

Allowed statuses are `unknown`, `candidate`, `probable`, and `verified`.
Candidate/probable/verified entries need a name, confidence in `[0,1]`, and
evidence. Unknown entries must not assert a name or confidence.

## `speaker-label-fixes.json`

Repairs target stable segment IDs and change speaker labels only:

```json
{
  "schemaVersion": 1,
  "sourceSegments": {"sha256": "canonical JSON SHA-256"},
  "fixes": [
    {
      "id": "speaker-fix-001",
      "segmentIds": ["seg-000042"],
      "observedSpeakerId": "SPEAKER_00",
      "proposedSpeakerId": "SPEAKER_01",
      "status": "verified",
      "confidence": 0.97,
      "reasonCode": "backchannel",
      "evidence": [
        {
          "source": "episode audio",
          "timestamp": "00:03:17",
          "claim": "Voice and turn structure match SPEAKER_01."
        }
      ]
    }
  ]
}
```

Use `status: "proposed"` until recording review or other binding evidence makes
the change safe to apply. Useful reason codes include `backchannel`,
`micro_turn`, `floor_holding`, `cluster_split`, `cluster_merge`, `overlap`, and
`human_review`.

## Hash semantics

The scripts use canonical JSON SHA-256 for JSON-to-JSON bindings: UTF-8 JSON with
sorted keys and compact separators. `source.sha256` for an audio/text source is
the ordinary byte-level file hash. Do not substitute one for the other.
