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

AGENT_ALIASES = {
    "discovery-planner": "planner",
    "implementer": "implementor",
    "implementer-research": "implementor",
    "implementation-engineer": "implementor",
    "qa-reviewer": "reviewer",
}

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


def canonical_agent(text):
    value = normalize(text)
    if value in KNOWN_AGENTS:
        return value
    return AGENT_ALIASES.get(value, "")


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
            canonical = canonical_agent(candidate)
            if canonical:
                return canonical
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
    matches = []
    for agent in KNOWN_AGENTS:
        pos = text.find(agent)
        if pos >= 0:
            matches.append((pos, agent))
    for alias, canonical in AGENT_ALIASES.items():
        pos = text.find(alias)
        if pos >= 0:
            matches.append((pos, canonical))
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
if not agent_name:
    agent_name = canonical_agent(tool_name)

print(tool_name)
print(agent_name)
