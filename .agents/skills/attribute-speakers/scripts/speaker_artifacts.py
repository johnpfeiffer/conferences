#!/usr/bin/env python3
"""Shared validation and hashing for attribute-speakers artifacts."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any, Iterable


ALLOWED_STATUSES = {"unknown", "candidate", "probable", "verified"}
BINDING_EVIDENCE_TYPES = {
    "self_identification",
    "dialogue_identity_link",
    "human_audio_verification",
    "user_verification",
    "voice_reference_match",
}
FIX_STATUSES = {"proposed", "verified", "rejected"}


class ArtifactError(ValueError):
    """Raised when a canonical speaker artifact violates its contract."""


def load_json(path: str | Path) -> dict[str, Any]:
    with Path(path).open(encoding="utf-8") as handle:
        value = json.load(handle)
    if not isinstance(value, dict):
        raise ArtifactError(f"{path}: top-level JSON value must be an object")
    return value


def canonical_sha256(value: Any) -> str:
    payload = json.dumps(
        value, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def file_sha256(path: str | Path) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _require_schema(doc: dict[str, Any], label: str) -> None:
    if doc.get("schemaVersion") != 1:
        raise ArtifactError(f"{label}: schemaVersion must be 1")


def _segments(doc: dict[str, Any], label: str) -> list[dict[str, Any]]:
    _require_schema(doc, label)
    segments = doc.get("segments")
    if not isinstance(segments, list) or not segments:
        raise ArtifactError(f"{label}: segments must be a non-empty array")
    return segments


def _number(value: Any, field: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ArtifactError(f"{field} must be a number")
    return float(value)


def validate_transcript(doc: dict[str, Any]) -> None:
    segments = _segments(doc, "transcript")
    seen: set[str] = set()
    previous_start = -1.0
    for index, segment in enumerate(segments):
        prefix = f"transcript.segments[{index}]"
        if not isinstance(segment, dict):
            raise ArtifactError(f"{prefix} must be an object")
        segment_id = segment.get("id")
        if not isinstance(segment_id, str) or not segment_id:
            raise ArtifactError(f"{prefix}.id must be a non-empty string")
        if segment_id in seen:
            raise ArtifactError(f"transcript: duplicate segment id {segment_id}")
        seen.add(segment_id)
        start = _number(segment.get("start"), f"{prefix}.start")
        end = _number(segment.get("end"), f"{prefix}.end")
        if start < 0 or end <= start:
            raise ArtifactError(f"{prefix}: require 0 <= start < end")
        if start < previous_start:
            raise ArtifactError("transcript: segments must be ordered by start")
        previous_start = start
        if not isinstance(segment.get("text"), str) or not segment["text"]:
            raise ArtifactError(f"{prefix}.text must be a non-empty string")


def validate_diarization(doc: dict[str, Any]) -> None:
    segments = _segments(doc, "diarization")
    backend = doc.get("backend")
    if not isinstance(backend, dict) or not backend.get("name"):
        raise ArtifactError("diarization.backend.name is required")
    previous_start = -1.0
    for index, segment in enumerate(segments):
        prefix = f"diarization.segments[{index}]"
        if not isinstance(segment, dict):
            raise ArtifactError(f"{prefix} must be an object")
        start = _number(segment.get("start"), f"{prefix}.start")
        end = _number(segment.get("end"), f"{prefix}.end")
        if start < 0 or end <= start:
            raise ArtifactError(f"{prefix}: require 0 <= start < end")
        if start < previous_start:
            raise ArtifactError("diarization: segments must be ordered by start")
        previous_start = start
        speaker_id = segment.get("speaker_id")
        if not isinstance(speaker_id, str) or not speaker_id:
            raise ArtifactError(f"{prefix}.speaker_id must be a non-empty string")


def validate_speaker_segments(
    doc: dict[str, Any], transcript: dict[str, Any] | None = None
) -> set[str]:
    segments = _segments(doc, "speaker-segments")
    seen: set[str] = set()
    speaker_ids: set[str] = set()
    previous_start = -1.0
    for index, segment in enumerate(segments):
        prefix = f"speaker-segments.segments[{index}]"
        if not isinstance(segment, dict):
            raise ArtifactError(f"{prefix} must be an object")
        segment_id = segment.get("id")
        if not isinstance(segment_id, str) or not segment_id:
            raise ArtifactError(f"{prefix}.id must be a non-empty string")
        if segment_id in seen:
            raise ArtifactError(f"speaker-segments: duplicate segment id {segment_id}")
        seen.add(segment_id)
        start = _number(segment.get("start"), f"{prefix}.start")
        end = _number(segment.get("end"), f"{prefix}.end")
        if start < 0 or end <= start:
            raise ArtifactError(f"{prefix}: require 0 <= start < end")
        if start < previous_start:
            raise ArtifactError("speaker-segments: segments must be ordered by start")
        previous_start = start
        if not isinstance(segment.get("text"), str) or not segment["text"]:
            raise ArtifactError(f"{prefix}.text must be a non-empty string")
        speaker_id = segment.get("speaker_id")
        if not isinstance(speaker_id, str) or not speaker_id:
            raise ArtifactError(f"{prefix}.speaker_id must be a non-empty string")
        speaker_ids.add(speaker_id)

    if transcript is not None:
        validate_transcript(transcript)
        source = transcript["segments"]
        if len(source) != len(segments):
            raise ArtifactError("speaker-segments: segment count changed from transcript")
        for original, attributed in zip(source, segments):
            for field in ("id", "start", "end", "text"):
                if original[field] != attributed.get(field):
                    raise ArtifactError(
                        f"speaker-segments: immutable field {field} changed for "
                        f"{original['id']}"
                    )
    return speaker_ids


def _validate_evidence(evidence: Any, prefix: str) -> list[dict[str, Any]]:
    if not isinstance(evidence, list):
        raise ArtifactError(f"{prefix} must be an array")
    for index, item in enumerate(evidence):
        if not isinstance(item, dict):
            raise ArtifactError(f"{prefix}[{index}] must be an object")
        for field in ("type", "source", "claim"):
            if not isinstance(item.get(field), str) or not item[field]:
                raise ArtifactError(f"{prefix}[{index}].{field} is required")
    return evidence


def validate_attribution(
    doc: dict[str, Any], speaker_ids: Iterable[str] | None = None
) -> None:
    _require_schema(doc, "attribution")
    speakers = doc.get("speakers")
    if not isinstance(speakers, list) or not speakers:
        raise ArtifactError("attribution.speakers must be a non-empty array")
    mapped: set[str] = set()
    for index, speaker in enumerate(speakers):
        prefix = f"attribution.speakers[{index}]"
        if not isinstance(speaker, dict):
            raise ArtifactError(f"{prefix} must be an object")
        speaker_id = speaker.get("speaker_id")
        if not isinstance(speaker_id, str) or not speaker_id:
            raise ArtifactError(f"{prefix}.speaker_id is required")
        if speaker_id in mapped:
            raise ArtifactError(f"attribution: duplicate speaker id {speaker_id}")
        mapped.add(speaker_id)
        status = speaker.get("status")
        if status not in ALLOWED_STATUSES:
            raise ArtifactError(f"{prefix}.status must be one of {sorted(ALLOWED_STATUSES)}")
        name = speaker.get("name")
        confidence = speaker.get("confidence")
        evidence = _validate_evidence(speaker.get("evidence"), f"{prefix}.evidence")
        if status == "unknown":
            if name is not None or confidence is not None:
                raise ArtifactError(f"{prefix}: unknown identity cannot assert name/confidence")
            if evidence:
                raise ArtifactError(f"{prefix}: unknown identity must have empty evidence")
            continue
        if not isinstance(name, str) or not name.strip():
            raise ArtifactError(f"{prefix}.name is required for status {status}")
        numeric_confidence = _number(confidence, f"{prefix}.confidence")
        if not 0 <= numeric_confidence <= 1:
            raise ArtifactError(f"{prefix}.confidence must be in [0, 1]")
        if not evidence:
            raise ArtifactError(f"{prefix}: status {status} requires evidence")
        if status == "verified" and not any(
            item["type"] in BINDING_EVIDENCE_TYPES for item in evidence
        ):
            raise ArtifactError(
                f"{prefix}: verified identity requires binding evidence; "
                "metadata/context/LLM inference alone is insufficient"
            )

    if speaker_ids is not None:
        required = set(speaker_ids) - {"UNKNOWN"}
        missing = required - mapped
        if missing:
            raise ArtifactError(f"attribution: missing speaker ids {sorted(missing)}")


def validate_speaker_fixes(
    doc: dict[str, Any], segments: dict[str, Any] | None = None
) -> None:
    _require_schema(doc, "speaker-label-fixes")
    fixes = doc.get("fixes")
    if not isinstance(fixes, list):
        raise ArtifactError("speaker-label-fixes.fixes must be an array")
    segment_by_id: dict[str, dict[str, Any]] = {}
    known_speakers: set[str] = set()
    if segments is not None:
        known_speakers = validate_speaker_segments(segments)
        segment_by_id = {item["id"]: item for item in segments["segments"]}
        expected_hash = doc.get("sourceSegments", {}).get("sha256")
        actual_hash = canonical_sha256(segments)
        if expected_hash != actual_hash:
            raise ArtifactError("speaker-label-fixes: sourceSegments.sha256 mismatch")

    fix_ids: set[str] = set()
    verified_targets: set[str] = set()
    for index, fix in enumerate(fixes):
        prefix = f"speaker-label-fixes.fixes[{index}]"
        if not isinstance(fix, dict):
            raise ArtifactError(f"{prefix} must be an object")
        fix_id = fix.get("id")
        if not isinstance(fix_id, str) or not fix_id:
            raise ArtifactError(f"{prefix}.id is required")
        if fix_id in fix_ids:
            raise ArtifactError(f"speaker-label-fixes: duplicate fix id {fix_id}")
        fix_ids.add(fix_id)
        status = fix.get("status")
        if status not in FIX_STATUSES:
            raise ArtifactError(f"{prefix}.status must be one of {sorted(FIX_STATUSES)}")
        targets = fix.get("segmentIds")
        if not isinstance(targets, list) or not targets or not all(
            isinstance(item, str) and item for item in targets
        ):
            raise ArtifactError(f"{prefix}.segmentIds must be a non-empty string array")
        observed = fix.get("observedSpeakerId")
        proposed = fix.get("proposedSpeakerId")
        if not isinstance(observed, str) or not isinstance(proposed, str):
            raise ArtifactError(f"{prefix}: observed/proposed speaker IDs are required")
        if observed == proposed:
            raise ArtifactError(f"{prefix}: proposed speaker must differ from observed")
        confidence = _number(fix.get("confidence"), f"{prefix}.confidence")
        if not 0 <= confidence <= 1:
            raise ArtifactError(f"{prefix}.confidence must be in [0, 1]")
        if not isinstance(fix.get("reasonCode"), str) or not fix["reasonCode"]:
            raise ArtifactError(f"{prefix}.reasonCode is required")
        evidence = fix.get("evidence")
        if not isinstance(evidence, list) or (status == "verified" and not evidence):
            raise ArtifactError(f"{prefix}: verified fixes require evidence")
        if status == "verified":
            for evidence_index, item in enumerate(evidence):
                if not isinstance(item, dict):
                    raise ArtifactError(
                        f"{prefix}.evidence[{evidence_index}] must be an object"
                    )
                for field in ("source", "claim"):
                    if not isinstance(item.get(field), str) or not item[field]:
                        raise ArtifactError(
                            f"{prefix}.evidence[{evidence_index}].{field} is required"
                        )
        if segments is not None:
            if proposed != "UNKNOWN" and proposed not in known_speakers:
                raise ArtifactError(f"{prefix}: proposed speaker {proposed} is not in source")
            for target in targets:
                if target not in segment_by_id:
                    raise ArtifactError(f"{prefix}: unknown segment id {target}")
                if segment_by_id[target]["speaker_id"] != observed:
                    raise ArtifactError(
                        f"{prefix}: {target} is not assigned to observed speaker {observed}"
                    )
                if status == "verified":
                    if target in verified_targets:
                        raise ArtifactError(
                            f"speaker-label-fixes: multiple verified fixes target {target}"
                        )
                    verified_targets.add(target)
