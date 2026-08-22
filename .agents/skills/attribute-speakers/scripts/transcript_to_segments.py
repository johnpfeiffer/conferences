#!/usr/bin/env python3
"""Normalize a repo-format timestamped transcript to immutable JSON segments."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

from speaker_artifacts import ArtifactError, file_sha256, validate_transcript


TIMESTAMP = re.compile(
    r"^\[?(?:(?P<hours>\d+):)?(?P<minutes>\d{1,2}):(?P<seconds>\d{2})"
    r"(?:\.(?P<millis>\d{1,3}))?\]?$"
)


def parse_timestamp(value: str) -> float | None:
    match = TIMESTAMP.fullmatch(value.strip())
    if match is None:
        return None
    hours = int(match.group("hours") or 0)
    minutes = int(match.group("minutes"))
    seconds = int(match.group("seconds"))
    if minutes >= 60 and match.group("hours") is not None:
        raise ArtifactError(f"invalid timestamp minutes: {value}")
    if seconds >= 60:
        raise ArtifactError(f"invalid timestamp seconds: {value}")
    millis_text = match.group("millis") or ""
    millis = int(millis_text.ljust(3, "0")) if millis_text else 0
    return hours * 3600 + minutes * 60 + seconds + millis / 1000


def normalize_text(
    raw: str, source_path: str, source_sha256: str, duration: float
) -> dict[str, Any]:
    if duration <= 0:
        raise ArtifactError("duration must be positive")
    lines = raw.splitlines()
    try:
        delimiter = lines.index("---")
    except ValueError as exc:
        raise ArtifactError("transcript must contain a line equal to ---") from exc

    blocks: list[tuple[float, str]] = []
    current_start: float | None = None
    current_text: list[str] = []

    def flush() -> None:
        nonlocal current_start, current_text
        if current_start is None:
            return
        while current_text and not current_text[0].strip():
            current_text.pop(0)
        while current_text and not current_text[-1].strip():
            current_text.pop()
        text = "\n".join(current_text)
        if not text:
            raise ArtifactError(f"timestamp {current_start} has no transcript text")
        blocks.append((current_start, text))

    for line in lines[delimiter + 1 :]:
        timestamp = parse_timestamp(line)
        if timestamp is not None:
            flush()
            current_start = timestamp
            current_text = []
        elif current_start is not None:
            current_text.append(line)
        elif line.strip():
            raise ArtifactError("non-empty body text appears before first timestamp")
    flush()

    if not blocks:
        raise ArtifactError("transcript contains no timestamped text blocks")
    if blocks[-1][0] >= duration:
        raise ArtifactError("duration must be later than the final segment start")

    segments = []
    for index, (start, text) in enumerate(blocks):
        end = blocks[index + 1][0] if index + 1 < len(blocks) else duration
        if end <= start:
            raise ArtifactError("transcript timestamps must be strictly increasing")
        segments.append(
            {
                "id": f"seg-{index + 1:06d}",
                "start": start,
                "end": end,
                "text": text,
            }
        )
    result = {
        "schemaVersion": 1,
        "source": {"path": source_path, "sha256": source_sha256},
        "segments": segments,
    }
    validate_transcript(result)
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--transcript", required=True)
    parser.add_argument("--duration", required=True, type=float, help="audio seconds")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()
    try:
        path = Path(args.transcript)
        result = normalize_text(
            path.read_text(encoding="utf-8"),
            str(path),
            file_sha256(path),
            args.duration,
        )
        Path(args.out).write_text(
            json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
    except (ArtifactError, OSError, json.JSONDecodeError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    print(f"wrote {args.out}: {len(result['segments'])} immutable segments")
    return 0


if __name__ == "__main__":
    sys.exit(main())

