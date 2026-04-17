#!/usr/bin/env python3
import json
import sys

try:
    payload = json.load(sys.stdin)
except Exception:
    print("")
    raise SystemExit(0)

value = payload.get("source", "")
print(str(value).strip())
