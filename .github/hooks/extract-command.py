#!/usr/bin/env python3
"""Extract command text from execute/bash/shell tool arguments.

Reads JSON from stdin. Prints the lowercased command blob to stdout.
Used by the hook to detect git commit/push commands.
"""

import json
import sys


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return

    args = payload.get("toolArgs", "")
    if isinstance(args, dict):
        blob = " ".join(str(v) for v in args.values())
    else:
        blob = str(args)
    print(blob.lower())


if __name__ == "__main__":
    main()
