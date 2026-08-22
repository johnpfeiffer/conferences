#!/usr/bin/env python3
"""Apply a proposed-transcript-fixes.json file to a raw transcript.

Exact port of app/src/data/transcriptFixes.ts from github.com/johnpfeiffer/conferences:
flatten all replacements, sort by len(observed) DESCENDING (so longer phrases win
before their prefixes, e.g. "base 10's" before "base 10"), then case-sensitive
split/join. The raw transcript file is never modified.

Usage:
    python3 apply_transcript_fixes.py \
        --transcript youtube_raw.txt \
        --fixes proposed-transcript-fixes.json \
        --out fixed_transcript.txt
"""
import argparse, json, sys


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--transcript", required=True, help="raw transcript file")
    ap.add_argument("--fixes", required=True, help="proposed-transcript-fixes.json")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    doc = json.load(open(a.fixes))
    text = open(a.transcript).read()

    # The site applies only fixes whose occurrences list this transcript file.
    import os
    name = os.path.basename(a.transcript)
    repls = [
        r
        for f in doc["fixes"]
        if any(o["transcript"] in (name, os.path.basename(a.transcript)) for o in f.get("occurrences", []))
        for r in f["replacements"]
    ]
    if not repls:  # fallback: apply everything (single-transcript workflows)
        repls = [r for f in doc["fixes"] for r in f["replacements"]]
    repls.sort(key=lambda r: -len(r["observed"]))

    count = 0
    for r in repls:
        segs = text.split(r["observed"])
        count += len(segs) - 1
        text = r["proposed"].join(segs)

    open(a.out, "w").write(text)
    print(f"wrote {a.out}: {count} corrections from {len(doc['fixes'])} fix rules")
    return 0


if __name__ == "__main__":
    sys.exit(main())
