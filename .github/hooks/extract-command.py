#!/usr/bin/env python3
import json
import sys


def load_tool_args(payload: dict):
    value = payload.get("toolArgs", {})
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except Exception:
            return value
    return value


def find_command(value):
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        for key in ("command", "cmd", "bash", "shell", "script"):
            candidate = value.get(key)
            if isinstance(candidate, str) and candidate.strip():
                return candidate
    return ""


try:
    payload = json.load(sys.stdin)
except Exception:
    print("")
    raise SystemExit(0)

print(find_command(load_tool_args(payload)))
