#!/usr/bin/env python3
"""Apply only verified, segment-scoped speaker-label fixes."""

from __future__ import annotations

import argparse
import copy
import json
import sys
from pathlib import Path
from typing import Any

from speaker_artifacts import (
    ArtifactError,
    load_json,
    validate_speaker_fixes,
    validate_speaker_segments,
)


IMMUTABLE_FIELDS = ("id", "start", "end", "text")


def apply_verified_fixes(
    segments: dict[str, Any], fixes: dict[str, Any]
) -> tuple[dict[str, Any], list[str]]:
    validate_speaker_segments(segments)
    validate_speaker_fixes(fixes, segments)
    result = copy.deepcopy(segments)
    by_id = {item["id"]: item for item in result["segments"]}
    applied: list[str] = []
    for fix in fixes["fixes"]:
        if fix["status"] != "verified":
            continue
        for segment_id in fix["segmentIds"]:
            by_id[segment_id]["speaker_id"] = fix["proposedSpeakerId"]
        applied.append(fix["id"])

    for before, after in zip(segments["segments"], result["segments"]):
        for field in IMMUTABLE_FIELDS:
            if before[field] != after[field]:
                raise ArtifactError(f"immutable field {field} changed for {before['id']}")
    result["appliedSpeakerFixes"] = applied
    validate_speaker_segments(result)
    return result, applied


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--segments", required=True)
    parser.add_argument("--fixes", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    try:
        result, applied = apply_verified_fixes(
            load_json(args.segments), load_json(args.fixes)
        )
        Path(args.out).write_text(
            json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
    except (ArtifactError, OSError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    print(f"wrote {args.out}: {len(applied)} verified fixes applied")
    return 0


if __name__ == "__main__":
    sys.exit(main())

