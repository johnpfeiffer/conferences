#!/usr/bin/env python3
"""High-value contract tests for the attribute-speakers workflow."""

from __future__ import annotations

import copy
import unittest

from apply_speaker_fixes import apply_verified_fixes
from reconcile_diarization import reconcile
from render_attributed_transcript import render
from speaker_artifacts import (
    ArtifactError,
    canonical_sha256,
    validate_attribution,
    validate_speaker_segments,
)
from transcript_to_segments import normalize_text


def transcript() -> dict:
    return {
        "schemaVersion": 1,
        "source": {"path": "corrected.txt", "sha256": "a" * 64},
        "segments": [
            {"id": "seg-1", "start": 0.0, "end": 4.0, "text": "Hello there."},
            {"id": "seg-2", "start": 4.0, "end": 6.0, "text": "Thanks, Alice."},
        ],
    }


def diarization() -> dict:
    return {
        "schemaVersion": 1,
        "source": {"path": "audio.wav", "sha256": "b" * 64},
        "backend": {"name": "fixture", "model": "fixture-v1", "version": "1"},
        "segments": [
            {"start": 0.0, "end": 3.8, "speaker_id": "SPEAKER_00"},
            {"start": 4.0, "end": 5.0, "speaker_id": "SPEAKER_00"},
            {"start": 5.0, "end": 6.0, "speaker_id": "SPEAKER_01"},
        ],
    }


def speaker_map(segments: dict) -> dict:
    return {
        "schemaVersion": 1,
        "sourceSegments": {"sha256": canonical_sha256(segments)},
        "speakers": [
            {
                "speaker_id": "SPEAKER_00",
                "name": "Alice Smith",
                "status": "verified",
                "confidence": 0.99,
                "evidence": [
                    {
                        "type": "dialogue_identity_link",
                        "source": "audio",
                        "claim": "The guest addresses this cluster as Alice.",
                    }
                ],
            },
            {
                "speaker_id": "SPEAKER_01",
                "name": "Bob Jones",
                "status": "probable",
                "confidence": 0.9,
                "evidence": [
                    {
                        "type": "publisher_metadata",
                        "source": "show notes",
                        "claim": "Bob is listed as a participant.",
                    }
                ],
            },
        ],
    }


class ReconcileTests(unittest.TestCase):
    def test_repo_transcript_normalization_uses_audio_duration(self) -> None:
        raw = "header\n---\n0:00\nHello.\n\n0:04.250\nGoodbye.\n"
        result = normalize_text(raw, "corrected.txt", "a" * 64, 6.0)
        self.assertEqual(
            [(item["start"], item["end"]) for item in result["segments"]],
            [(0.0, 4.25), (4.25, 6.0)],
        )
        self.assertEqual(result["segments"][1]["text"], "Goodbye.")

    def test_maximum_overlap_and_tie_fail_closed(self) -> None:
        result = reconcile(transcript(), diarization())
        self.assertEqual(result["segments"][0]["speaker_id"], "SPEAKER_00")
        self.assertEqual(result["segments"][1]["speaker_id"], "UNKNOWN")
        self.assertEqual(
            [item["text"] for item in result["segments"]],
            [item["text"] for item in transcript()["segments"]],
        )

    def test_insufficient_coverage_fails_closed(self) -> None:
        sparse = diarization()
        sparse["segments"] = [
            {"start": 0.0, "end": 1.0, "speaker_id": "SPEAKER_00"}
        ]
        result = reconcile(transcript(), sparse)
        self.assertEqual(result["segments"][0]["speaker_id"], "UNKNOWN")


class ValidationTests(unittest.TestCase):
    def test_immutable_text_change_is_rejected(self) -> None:
        result = reconcile(transcript(), diarization())
        result["segments"][0]["text"] = "Rewritten."
        with self.assertRaisesRegex(ArtifactError, "immutable field text"):
            validate_speaker_segments(result, transcript())

    def test_metadata_only_cannot_verify_identity(self) -> None:
        attribution = speaker_map(reconcile(transcript(), diarization()))
        attribution["speakers"][0]["evidence"] = [
            {
                "type": "publisher_metadata",
                "source": "show notes",
                "claim": "Alice is listed as host.",
            }
        ]
        with self.assertRaisesRegex(ArtifactError, "binding evidence"):
            validate_attribution(attribution)


class RepairAndRenderTests(unittest.TestCase):
    def setUp(self) -> None:
        self.segments = reconcile(transcript(), diarization())
        self.segments["segments"][1]["speaker_id"] = "SPEAKER_00"
        self.segments["segments"].append(
            {
                "id": "seg-3",
                "start": 6.0,
                "end": 7.0,
                "text": "Goodbye.",
                "speaker_id": "SPEAKER_01",
                "assignment": {
                    "overlapSeconds": 1.0,
                    "segmentCoverage": 1.0,
                    "runnerUpSpeakerId": None,
                    "runnerUpOverlapSeconds": 0.0,
                },
            }
        )

    def test_only_verified_fixes_apply_and_words_remain_immutable(self) -> None:
        fixes = {
            "schemaVersion": 1,
            "sourceSegments": {"sha256": canonical_sha256(self.segments)},
            "fixes": [
                {
                    "id": "fix-verified",
                    "segmentIds": ["seg-2"],
                    "observedSpeakerId": "SPEAKER_00",
                    "proposedSpeakerId": "SPEAKER_01",
                    "status": "verified",
                    "confidence": 0.98,
                    "reasonCode": "backchannel",
                    "evidence": [{"source": "audio", "claim": "Voice checked."}],
                },
                {
                    "id": "fix-proposed",
                    "segmentIds": ["seg-1"],
                    "observedSpeakerId": "SPEAKER_00",
                    "proposedSpeakerId": "SPEAKER_01",
                    "status": "proposed",
                    "confidence": 0.8,
                    "reasonCode": "floor_holding",
                    "evidence": [],
                },
            ],
        }
        before = copy.deepcopy(self.segments["segments"])
        result, applied = apply_verified_fixes(self.segments, fixes)
        self.assertEqual(applied, ["fix-verified"])
        self.assertEqual(result["segments"][0]["speaker_id"], "SPEAKER_00")
        self.assertEqual(result["segments"][1]["speaker_id"], "SPEAKER_01")
        for old, new in zip(before, result["segments"]):
            self.assertEqual(
                tuple(old[field] for field in ("id", "start", "end", "text")),
                tuple(new[field] for field in ("id", "start", "end", "text")),
            )

    def test_renderer_hides_probable_name_by_default(self) -> None:
        attribution = speaker_map(self.segments)
        output = render(self.segments, attribution)
        self.assertIn("Alice Smith [SPEAKER_00]", output)
        self.assertIn("**SPEAKER_01**", output)
        self.assertNotIn("Bob Jones", output)
        review = render(self.segments, attribution, review=True)
        self.assertIn("Bob Jones? [SPEAKER_01; probable]", review)


if __name__ == "__main__":
    unittest.main()
