#!/usr/bin/env python3
"""Parse a Copilot CLI session event JSON payload.

Reads JSON from stdin. Prints the 'source' field to stdout.
Used by session-bootstrap.sh to detect new sessions.
"""

import json
import sys

try:
    payload = json.load(sys.stdin)
except Exception:
    print("")
    raise SystemExit(0)

print(payload.get("source", ""))
