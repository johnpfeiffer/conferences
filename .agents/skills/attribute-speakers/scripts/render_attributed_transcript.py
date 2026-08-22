#!/usr/bin/env python3
"""Render citation-safe speaker labels from validated attribution artifacts."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from speaker_artifacts import (
    ArtifactError,
    canonical_sha256,
    load_json,
    validate_attribution,
    validate_speaker_segments,
)


def format_timestamp(seconds: float) -> str:
    milliseconds = round(seconds * 1000)
    hours, remainder = divmod(milliseconds, 3_600_000)
    minutes, remainder = divmod(remainder, 60_000)
    secs, millis = divmod(remainder, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def label_for(speaker_id: str, speaker: dict[str, Any] | None, review: bool) -> str:
    if speaker is None or speaker["status"] == "unknown":
        return speaker_id
    if speaker["status"] == "verified":
        return f"{speaker['name']} [{speaker_id}]"
    if review:
        return f"{speaker['name']}? [{speaker_id}; {speaker['status']}]"
    return speaker_id


def render(
    segments: dict[str, Any], attribution: dict[str, Any], review: bool = False
) -> str:
    speaker_ids = validate_speaker_segments(segments)
    validate_attribution(attribution, speaker_ids)
    expected_hash = attribution.get("sourceSegments", {}).get("sha256")
    actual_hash = canonical_sha256(segments)
    if expected_hash != actual_hash:
        raise ArtifactError("attribution: sourceSegments.sha256 mismatch")
    mapping = {item["speaker_id"]: item for item in attribution["speakers"]}
    lines = ["# Speaker-attributed transcript", ""]
    if review:
        lines.extend(
            [
                "> Review view: question-marked identities are not verified and must not be cited as fact.",
                "",
            ]
        )
    for segment in segments["segments"]:
        speaker_id = segment["speaker_id"]
        label = label_for(speaker_id, mapping.get(speaker_id), review)
        start = format_timestamp(float(segment["start"]))
        end = format_timestamp(float(segment["end"]))
        lines.extend([f"[{start}-{end}] **{label}**", "", segment["text"], ""])
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--segments", required=True)
    parser.add_argument("--attribution", required=True)
    parser.add_argument("--out", required=True)
    parser.add_argument("--review-labels", action="store_true")
    args = parser.parse_args()
    try:
        text = render(
            load_json(args.segments),
            load_json(args.attribution),
            review=args.review_labels,
        )
        Path(args.out).write_text(text, encoding="utf-8")
    except (ArtifactError, OSError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    print(f"wrote {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

