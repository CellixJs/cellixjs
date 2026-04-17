#!/usr/bin/env python3
import json
import sys

reason = sys.argv[1] if len(sys.argv) > 1 else "Blocked by repository workflow policy."
print(json.dumps({"permissionDecision": "deny", "permissionDecisionReason": reason}, separators=(",", ":")))
