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
"""
import argparse, json, re, sys


def fmt_ts(ms: int) -> str:
    s = ms // 1000
    h, m, sec = s // 3600, (s % 3600) // 60, s % 60
    return f"{h}:{m:02d}:{sec:02d}" if h else f"{m}:{sec:02d}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json3", required=True)
    ap.add_argument("--url", required=True)
    ap.add_argument("--description", default="")
    ap.add_argument("--speakers", default="")
    ap.add_argument("--basis", default="YouTube auto-generated captions (ASR)")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    data = json.load(open(a.json3))
    events = [e for e in data.get("events", []) if e.get("segs")]
    if not events:
        print("error: no caption events with text found", file=sys.stderr)
        return 1

    header = a.url + "\n\n"
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
