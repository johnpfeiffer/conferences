#!/usr/bin/env python3
"""Join immutable transcript segments to anonymous diarization by time overlap."""

from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

from speaker_artifacts import (
    ArtifactError,
    canonical_sha256,
    load_json,
    validate_diarization,
    validate_speaker_segments,
    validate_transcript,
)


def _covered_seconds(intervals: list[tuple[float, float]]) -> float:
    if not intervals:
        return 0.0
    merged = 0.0
    current_start, current_end = sorted(intervals)[0]
    for start, end in sorted(intervals)[1:]:
        if start <= current_end:
            current_end = max(current_end, end)
        else:
            merged += current_end - current_start
            current_start, current_end = start, end
    return merged + current_end - current_start


def assign_segment(
    segment: dict[str, Any],
    diarization_segments: list[dict[str, Any]],
    min_overlap_ratio: float,
    ambiguity_margin_ratio: float,
) -> tuple[str, dict[str, Any]]:
    start, end = float(segment["start"]), float(segment["end"])
    duration = end - start
    overlaps: dict[str, list[tuple[float, float]]] = defaultdict(list)
    for turn in diarization_segments:
        overlap_start = max(start, float(turn["start"]))
        overlap_end = min(end, float(turn["end"]))
        if overlap_end > overlap_start:
            overlaps[turn["speaker_id"]].append((overlap_start, overlap_end))

    ranked = sorted(
        ((speaker, _covered_seconds(intervals)) for speaker, intervals in overlaps.items()),
        key=lambda item: (-item[1], item[0]),
    )
    best_id, best = ranked[0] if ranked else (None, 0.0)
    runner_id, runner = ranked[1] if len(ranked) > 1 else (None, 0.0)
    coverage = best / duration
    margin = (best - runner) / duration
    accepted = (
        best_id is not None
        and coverage >= min_overlap_ratio
        and (runner_id is None or margin >= ambiguity_margin_ratio)
    )
    assignment = {
        "overlapSeconds": round(best, 6),
        "segmentCoverage": round(coverage, 6),
        "runnerUpSpeakerId": runner_id,
        "runnerUpOverlapSeconds": round(runner, 6),
    }
    return (best_id if accepted else "UNKNOWN"), assignment


def reconcile(
    transcript: dict[str, Any],
    diarization: dict[str, Any],
    min_overlap_ratio: float = 0.5,
    ambiguity_margin_ratio: float = 0.1,
) -> dict[str, Any]:
    validate_transcript(transcript)
    validate_diarization(diarization)
    if not 0 <= min_overlap_ratio <= 1:
        raise ArtifactError("min overlap ratio must be in [0, 1]")
    if not 0 <= ambiguity_margin_ratio <= 1:
        raise ArtifactError("ambiguity margin ratio must be in [0, 1]")

    attributed = []
    for segment in transcript["segments"]:
        speaker_id, assignment = assign_segment(
            segment,
            diarization["segments"],
            min_overlap_ratio,
            ambiguity_margin_ratio,
        )
        attributed.append(
            {
                "id": segment["id"],
                "start": segment["start"],
                "end": segment["end"],
                "text": segment["text"],
                "speaker_id": speaker_id,
                "assignment": assignment,
            }
        )
    result = {
        "schemaVersion": 1,
        "sources": {
            "transcriptCanonicalSha256": canonical_sha256(transcript),
            "diarizationCanonicalSha256": canonical_sha256(diarization),
        },
        "join": {
            "method": "maximum_overlap",
            "minOverlapRatio": min_overlap_ratio,
            "ambiguityMarginRatio": ambiguity_margin_ratio,
        },
        "segments": attributed,
    }
    validate_speaker_segments(result, transcript)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--transcript", required=True)
    parser.add_argument("--diarization", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--min-overlap-ratio", type=float, default=0.5)
    parser.add_argument("--ambiguity-margin-ratio", type=float, default=0.1)
    args = parser.parse_args()
    try:
        result = reconcile(
            load_json(args.transcript),
            load_json(args.diarization),
            args.min_overlap_ratio,
            args.ambiguity_margin_ratio,
        )
        Path(args.out).write_text(
            json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
    except (ArtifactError, OSError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    unknown = sum(item["speaker_id"] == "UNKNOWN" for item in result["segments"])
    print(f"wrote {args.out}: {len(result['segments'])} segments, {unknown} unknown")
    return 0


if __name__ == "__main__":
    sys.exit(main())

