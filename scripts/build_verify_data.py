#!/usr/bin/env python3
"""Split a certificate records file into one JSON file per record.

Usage:
    python3 scripts/build_verify_data.py /path/to/verify-records.json [--prune]

The records file is an array of objects:
    { id, certificate_no, name, program, cohort, date_given, sha256, status }

Output goes to verify/data/<id>.json. No index or list is written, so the
names cannot be downloaded in one request. Keep the combined records file
OUTSIDE this repository (GitHub Pages publishes everything that is committed).

Re-runnable: existing files are rewritten only when their content changed.
Files in verify/data/ that are not in the records file are reported, and
deleted only when --prune is passed.
"""
import argparse
import json
import re
import sys
from pathlib import Path

ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
ID_RE = re.compile(r"^[%s]{8}$" % ALPHABET)
SHA_RE = re.compile(r"^[0-9a-f]{64}$")
FIELDS = ["id", "certificate_no", "name", "program", "cohort", "date_given", "sha256", "status"]
STATUSES = {"valid", "revoked"}
DATA_DIR = Path(__file__).resolve().parent.parent / "verify" / "data"


def load(path):
    with open(path, encoding="utf-8") as fh:
        records = json.load(fh)
    if not isinstance(records, list):
        sys.exit("Records file must be a JSON array.")
    return records


def validate(records):
    errors, seen_ids, seen_nos = [], set(), set()
    for i, rec in enumerate(records, start=1):
        label = "record %d (%s)" % (i, rec.get("id", "?") if isinstance(rec, dict) else "?")
        if not isinstance(rec, dict):
            errors.append("%s: not an object" % label)
            continue
        for f in FIELDS:
            if not isinstance(rec.get(f), str) or not rec[f].strip():
                errors.append("%s: missing or empty '%s'" % (label, f))
        if errors and errors[-1].startswith(label):
            continue
        if not ID_RE.match(rec["id"]):
            errors.append("%s: id must be 8 characters from %s" % (label, ALPHABET))
        if not SHA_RE.match(rec["sha256"]):
            errors.append("%s: sha256 must be 64 lowercase hex characters" % label)
        if rec["status"] not in STATUSES:
            errors.append("%s: status must be one of %s" % (label, sorted(STATUSES)))
        if rec["id"] in seen_ids:
            errors.append("%s: duplicate id" % label)
        if rec["certificate_no"] in seen_nos:
            errors.append("%s: duplicate certificate_no" % label)
        seen_ids.add(rec["id"])
        seen_nos.add(rec["certificate_no"])
    return errors


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("records", help="path to the combined records JSON (keep it outside the repo)")
    ap.add_argument("--prune", action="store_true", help="delete data files that are not in the records file")
    args = ap.parse_args()

    records = load(args.records)
    errors = validate(records)
    if errors:
        print("Not writing anything. Fix these first:", file=sys.stderr)
        for e in errors:
            print("  - " + e, file=sys.stderr)
        sys.exit(1)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    written = unchanged = 0
    for rec in records:
        out = {f: rec[f] for f in FIELDS}
        text = json.dumps(out, ensure_ascii=False, indent=1, sort_keys=False) + "\n"
        target = DATA_DIR / (rec["id"] + ".json")
        if target.exists() and target.read_text(encoding="utf-8") == text:
            unchanged += 1
            continue
        target.write_text(text, encoding="utf-8")
        written += 1

    wanted = {rec["id"] + ".json" for rec in records}
    stale = sorted(p for p in DATA_DIR.glob("*.json") if p.name not in wanted)
    for p in stale:
        if args.prune:
            p.unlink()
            print("deleted " + p.name)
        else:
            print("stale (not in records, kept; use --prune to delete): " + p.name)

    print("%d records: %d written, %d unchanged -> %s" % (len(records), written, unchanged, DATA_DIR))


if __name__ == "__main__":
    main()
