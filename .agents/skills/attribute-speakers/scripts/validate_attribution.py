#!/usr/bin/env python3
"""Validate speaker artifacts and their cross-file immutability contracts."""

from __future__ import annotations

import argparse
import json
import sys

from speaker_artifacts import (
    ArtifactError,
    canonical_sha256,
    load_json,
    validate_attribution,
    validate_diarization,
    validate_speaker_fixes,
    validate_speaker_segments,
    validate_transcript,
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--transcript")
    parser.add_argument("--diarization")
    parser.add_argument("--segments")
    parser.add_argument("--attribution")
    parser.add_argument("--fixes")
    args = parser.parse_args()
    if not any(vars(args).values()):
        parser.error("provide at least one artifact")

    try:
        transcript = load_json(args.transcript) if args.transcript else None
        diarization = load_json(args.diarization) if args.diarization else None
        segments = load_json(args.segments) if args.segments else None
        attribution = load_json(args.attribution) if args.attribution else None
        fixes = load_json(args.fixes) if args.fixes else None

        if transcript is not None:
            validate_transcript(transcript)
        if diarization is not None:
            validate_diarization(diarization)
        speaker_ids = None
        if segments is not None:
            speaker_ids = validate_speaker_segments(segments, transcript)
            sources = segments.get("sources", {})
            if transcript is not None and sources.get(
                "transcriptCanonicalSha256"
            ) != canonical_sha256(transcript):
                raise ArtifactError("speaker-segments: transcript source hash mismatch")
            if diarization is not None and sources.get(
                "diarizationCanonicalSha256"
            ) != canonical_sha256(diarization):
                raise ArtifactError("speaker-segments: diarization source hash mismatch")
        if attribution is not None:
            validate_attribution(attribution, speaker_ids)
            if segments is not None and attribution.get("sourceSegments", {}).get(
                "sha256"
            ) != canonical_sha256(segments):
                raise ArtifactError("attribution: sourceSegments.sha256 mismatch")
        if fixes is not None:
            validate_speaker_fixes(fixes, segments)
    except (ArtifactError, OSError, json.JSONDecodeError) as exc:
        print(f"invalid: {exc}", file=sys.stderr)
        return 1

    validated = [name for name, value in vars(args).items() if value]
    print(f"valid: {', '.join(validated)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

