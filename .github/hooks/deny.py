#!/usr/bin/env python3
"""Print a JSON deny response for the Copilot CLI preToolUse hook."""

import json
import sys

reason = sys.argv[1] if len(sys.argv) > 1 else "Denied."
print(json.dumps({
    "permissionDecision": "deny",
    "permissionDecisionReason": reason,
}))
