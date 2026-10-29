#!/usr/bin/env python3
"""Parse Jest `--json` output from stdin, maintain a pass/fail manifest on disk,
and print a COMPACT summary (counts + failures + regressions).

This is the mechanism that keeps the checker cheap as the suite grows: the full
per-test result lives in a file, not in the model's context. Regression detection
is a deterministic diff against the previous manifest, so "implementing X silently
broke Y" is caught without the orchestrator having to hold every test name in memory.

Usage (the checker agent runs this, from femmie/):
  npx jest --ci --json --outputFile=/tmp/checker_tests.json
  python3 .claude/scripts/check_tests.py < /tmp/checker_tests.json

Jest's JSON shape matches what this parser expects: a top-level `testResults` array,
each entry a test FILE with `name` (path) and `assertionResults` (the individual
tests, with `status`, `title`, `fullName`, `ancestorTitles`). Vitest's
`--reporter=json` emits the same shape, so this script works for either runner.

Output lines (tab-separated), consumed by the checker agent:
  PASSED_COUNT <n>
  FAILED_COUNT <n>
  PREV_PASSED_COUNT <n>
  FAIL<TAB><test name>        (one per currently-failing test)
  REGRESSED<TAB><test name>   (passed in the previous manifest, not passing now)
  PARSE_ERROR <msg>           (stdin was not valid runner JSON; manifest untouched)
"""
import sys
import json
import os

STATE_DIR = os.environ.get("CHECKER_STATE_DIR", ".claude/state")
MANIFEST = os.path.join(STATE_DIR, "test-manifest.json")

raw = sys.stdin.read()
try:
    data = json.loads(raw)
except Exception as e:
    # Do NOT touch the manifest on a parse failure — wiping the baseline would
    # make every test look regressed on the next healthy run.
    print("PASSED_COUNT 0")
    print("FAILED_COUNT 0")
    print("PREV_PASSED_COUNT 0")
    print(f"PARSE_ERROR checker input was not valid JSON — {e}")
    sys.exit(2)

# Current run: "<relative file> > <full test name>" -> "pass" | "fail" | "skip"
root = os.getcwd()
cur = {}
suite_failures = []  # files that failed to load/compile (no assertions parsed)
for tf in data.get("testResults", []):
    fname = tf.get("name", "") or tf.get("testFilePath", "")
    rel = os.path.relpath(fname, root) if os.path.isabs(fname) else fname
    assertions = tf.get("assertionResults", [])
    file_status = tf.get("status")
    if not assertions and file_status in ("failed", "error"):
        suite_failures.append(rel)
        continue
    for a in assertions:
        full = a.get("fullName")
        if not full:
            ancestors = a.get("ancestorTitles") or []
            full = " ".join([*ancestors, a.get("title", "")]).strip()
        nm = f"{rel} > {full}"
        status = a.get("status")
        if status == "passed":
            cur[nm] = "pass"
        elif status == "failed":
            cur[nm] = "fail"
        else:  # skipped / pending / todo / disabled — present but not passing
            cur[nm] = "skip"

# Previous run (trusted baseline written by the last checker pass)
prev = {}
if os.path.exists(MANIFEST):
    try:
        with open(MANIFEST) as fh:
            prev = json.load(fh).get("tests", {})
    except Exception:
        prev = {}

passed = sorted(n for n, r in cur.items() if r == "pass")
failed = sorted(n for n, r in cur.items() if r == "fail")
# A regression = anything that passed last run and is no longer passing
# (now failing, skipped, OR gone missing — the latter catches deleted tests).
regressed = sorted(n for n, r in prev.items() if r == "pass" and cur.get(n) != "pass")

os.makedirs(STATE_DIR, exist_ok=True)
with open(MANIFEST, "w") as fh:
    json.dump({"tests": cur}, fh)

print("PASSED_COUNT", len(passed))
print("FAILED_COUNT", len(failed) + len(suite_failures))
print("PREV_PASSED_COUNT", sum(1 for r in prev.values() if r == "pass"))
for n in failed:
    print("FAIL\t" + n)
for n in suite_failures:
    print("FAIL\t" + n + " (suite failed to load — compile/import error)")
for n in regressed:
    print("REGRESSED\t" + n)
