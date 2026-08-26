#!/usr/bin/env python3
"""Convert YouTube json3 captions to the conferences-repo raw transcript format.

Raw format: header block, '---', then alternating M:SS timestamp / text lines.
Prefers json3 over vtt because YouTube auto-caption VTTs use rolling-window cues
(each cue repeats the previous line) and need a dedup pass; json3 events are
already sequential, non-overlapping segments.

Usage:
    python3 youtube_to_raw.py --json3 VIDEOID.en-orig.json3 \
        --url https://www.youtube.com/watch?v=VIDEOID \
        --description "One-paragraph episode description." \
        --speakers "Host (host), Guest (guest)" \
        --out youtube_raw.txt

Segment scoping (feature requested 2026-08-23, WorkOS Agent Night panel):
    --start 57:12 --end 1:25:40 keeps only events whose tStartMs falls inside
    the window. Timestamps in the output stay VIDEO-ABSOLUTE (57:12, not 0:00),
    so fix-rule occurrence timestamps remain comparable with the source video
    and with any full-video transcript. The segment window is recorded in the
    header; the cut is made once and the raw is immutable afterwards.
"""
import argparse, json, re, sys


def fmt_ts(ms: int) -> str:
    s = ms // 1000
    h, m, sec = s // 3600, (s % 3600) // 60, s % 60
    return f"{h}:{m:02d}:{sec:02d}" if h else f"{m}:{sec:02d}"


def parse_ts(v: str) -> int:
    """Accept SS, M:SS or H:MM:SS and return milliseconds."""
    parts = v.split(":")
    if not 1 <= len(parts) <= 3 or not all(p.isdigit() for p in parts):
        raise ValueError(f"bad timestamp {v!r} (use SS, M:SS or H:MM:SS)")
    secs = 0
    for p in parts:
        secs = secs * 60 + int(p)
    return secs * 1000


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json3", required=True)
    ap.add_argument("--url", required=True)
    ap.add_argument("--description", default="")
    ap.add_argument("--speakers", default="")
    ap.add_argument("--basis", default="YouTube auto-generated captions (ASR)")
    ap.add_argument("--start", default=None,
                    help="segment start (SS, M:SS or H:MM:SS, video-absolute)")
    ap.add_argument("--end", default=None,
                    help="segment end, exclusive (SS, M:SS or H:MM:SS)")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    data = json.load(open(a.json3))
    events = [e for e in data.get("events", []) if e.get("segs")]
    if not events:
        print("error: no caption events with text found", file=sys.stderr)
        return 1

    start_ms = parse_ts(a.start) if a.start else None
    end_ms = parse_ts(a.end) if a.end else None
    if start_ms is not None or end_ms is not None:
        events = [e for e in events
                  if (start_ms is None or e["tStartMs"] >= start_ms)
                  and (end_ms is None or e["tStartMs"] < end_ms)]
        if not events:
            print("error: segment window selected zero caption events",
                  file=sys.stderr)
            return 1

    header = a.url + "\n\n"
    if start_ms is not None or end_ms is not None:
        seg = f"{fmt_ts(start_ms or 0)}-{fmt_ts(end_ms) if end_ms else 'end'}"
        header += (f"Segment: {seg} of the source video; the rest of the "
                   f"recording is intentionally out of scope for this "
                   f"artifact. Timestamps are video-absolute.\n\n")
    if a.description:
        header += a.description + "\n\n"
    if a.speakers:
        header += f"Speakers: {a.speakers}\n\n"
    header += f"Transcript basis: {a.basis}.\n\n---\n"

    lines = []
    for e in events:
        txt = "".join(s.get("utf8", "") for s in e["segs"])
        txt = re.sub(r"\s*\n\s*", " ", txt).strip()
        if txt:
            lines.append(f"{fmt_ts(e['tStartMs'])}\n{txt}")

    open(a.out, "w").write(header + "\n".join(lines) + "\n")
    span = f"{fmt_ts(events[0]['tStartMs'])} -> {fmt_ts(events[-1]['tStartMs'])}"
    words = len(" ".join(lines).split())
    print(f"wrote {a.out}: {len(lines)} blocks, ~{words} words, span {span}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
