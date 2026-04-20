#!/usr/bin/env python3
"""Parse a Copilot CLI preToolUse JSON payload.

Reads JSON from stdin. Prints two lines to stdout:
  Line 1: toolName (lowercase, trimmed)
  Line 2: detected agent name (empty string if not an agent delegation)

Agent detection priority:
  1. toolName IS a known agent name
  2. Structured arg field (agent, agent_type, name, etc.) matches an agent
  3. Earliest text occurrence of agent name (only for delegation-style tool names)
"""

import json
import sys
from pathlib import Path


def load_agents():
    """Derive known agent names from .github/agents/*.agent.md."""
    agents_dir = Path(__file__).resolve().parent.parent / "agents"
    agents = {
        path.name.removesuffix(".agent.md")
        for path in agents_dir.glob("*.agent.md")
    }
    if not agents:
        agents = {
            "implementer-research",
            "orchestrator",
            "implementer",
            "validator",
            "planner",
            "reviewer",
            "security",
        }
    return tuple(sorted(agents, key=lambda agent: (-len(agent), agent)))


AGENTS = load_agents()

# Tool names that represent an agent delegation call
DELEGATION_TOOLS = frozenset({"agent", "custom-agent", "task", "subagent"})


def walk_strings(value):
    """Yield all string values nested inside dicts and lists."""
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for v in value.values():
            yield from walk_strings(v)
    elif isinstance(value, list):
        for v in value:
            yield from walk_strings(v)


def match_agent(value):
    """Return agent name if value starts with a known agent, else empty string."""
    v = value.strip().lower()
    for agent in AGENTS:
        if v == agent or v.startswith(agent + " ") or v.startswith(agent + "-"):
            return agent
    return ""


def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        print("")
        print("")
        return

    tool_name = str(payload.get("toolName", "")).strip().lower()
    tool_args_raw = payload.get("toolArgs", "")

    # Normalise args to dict if possible
    tool_args = None
    if isinstance(tool_args_raw, str):
        try:
            tool_args = json.loads(tool_args_raw)
        except Exception:
            pass
    elif isinstance(tool_args_raw, dict):
        tool_args = tool_args_raw

    agent_name = ""

    # Priority 1: toolName IS a known agent
    for agent in AGENTS:
        if tool_name == agent:
            agent_name = agent
            break

    # Priority 2: Structured arg fields
    if not agent_name and isinstance(tool_args, dict):
        for field in (
            "agent", "agent_type", "agentName", "agent_name",
            "agentId", "name", "type", "role", "subagent",
        ):
            val = str(tool_args.get(field, "")).strip().lower()
            if val:
                m = match_agent(val)
                if m:
                    agent_name = m
                    break

    # Priority 3: Earliest text occurrence (ONLY for delegation-style tool names)
    # Regular tools like create/edit/read never trigger text scanning — prevents
    # false positives when tool content mentions agent names.
    if not agent_name and tool_name in DELEGATION_TOOLS:
        haystacks = []
        if isinstance(tool_args_raw, str):
            haystacks.append(tool_args_raw.lower())
        if tool_args is not None:
            for item in walk_strings(tool_args):
                haystacks.append(item.lower())
        text = "\n".join(haystacks)
        if text:
            earliest_pos = len(text) + 1
            for agent in AGENTS:
                pos = text.find(agent)
                if pos != -1 and pos < earliest_pos:
                    earliest_pos = pos
                    agent_name = agent

    print(tool_name)
    print(agent_name)


if __name__ == "__main__":
    main()
