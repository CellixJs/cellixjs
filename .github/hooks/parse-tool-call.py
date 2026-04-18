#!/usr/bin/env python3
import json
import sys

KNOWN_AGENTS = [
    "planner",
    "implementor",
    "reviewer",
    "framework-surface-reviewer",
    "validator",
    "security",
    "orchestrator",
]

STRUCTURED_AGENT_KEYS = [
    "agent",
    "agentName",
    "agent_name",
    "agentType",
    "agent_type",
    "target",
    "subagent",
    "customAgent",
    "name",
]


def normalize(text):
    return str(text).strip().lower()


def load_tool_args(payload):
    value = payload.get("toolArgs", {})
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except Exception:
            return value
    return value


def find_structured_agent(value):
    if isinstance(value, dict):
        for key in STRUCTURED_AGENT_KEYS:
            candidate = value.get(key)
            if normalize(candidate) in KNOWN_AGENTS:
                return normalize(candidate)
        for nested in value.values():
            candidate = find_structured_agent(nested)
            if candidate:
                return candidate
    if isinstance(value, list):
        for nested in value:
            candidate = find_structured_agent(nested)
            if candidate:
                return candidate
    return ""


def find_agent_in_text(value):
    text = normalize(value)
    if not text:
        return ""
    matches = [(text.find(agent), agent) for agent in KNOWN_AGENTS if text.find(agent) >= 0]
    matches.sort()
    return matches[0][1] if matches else ""


try:
    payload = json.load(sys.stdin)
except Exception:
    print("")
    print("")
    raise SystemExit(0)

tool_name = normalize(payload.get("toolName", ""))
tool_args = load_tool_args(payload)
agent_name = find_structured_agent(tool_args)
if not agent_name:
    agent_name = find_agent_in_text(tool_args)
if not agent_name and tool_name in KNOWN_AGENTS:
    agent_name = tool_name

print(tool_name)
print(agent_name)
