#!/usr/bin/env python3

import argparse
import json
import re
import sys
from pathlib import Path

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

PLANNER_AGENTS = {"planner"}
IMPLEMENTOR_AGENTS = {"implementor"}
REVIEWER_AGENTS = {"reviewer", "framework-surface-reviewer"}

MARKERS = {
    "plan.md": ("BEGIN PLAN.MD", "END PLAN.MD"),
    "implementer.done": ("BEGIN IMPLEMENTER.DONE", "END IMPLEMENTER.DONE"),
    "review.ok": ("BEGIN REVIEW.OK", "END REVIEW.OK"),
    "review.feedback": ("BEGIN REVIEW.FEEDBACK", "END REVIEW.FEEDBACK"),
}


def normalize(value: object) -> str:
    return str(value).strip().lower()


def canonical_agent(value: object) -> str:
    text = normalize(value)
    if text in KNOWN_AGENTS:
        return text
    return AGENT_ALIASES.get(text, "")


def load_tool_args(payload: dict) -> object:
    value = payload.get("toolArgs", {})
    if isinstance(value, str):
        try:
            return json.loads(value)
        except Exception:
            return value
    return value


def find_structured_agent(value: object) -> str:
    if isinstance(value, dict):
        for key in STRUCTURED_AGENT_KEYS:
            candidate = canonical_agent(value.get(key))
            if candidate:
                return candidate
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


def find_agent_in_text(value: str) -> str:
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


def find_agent_in_result_text(text: str) -> str:
    patterns = [
        r"agent_type:\s*([a-z0-9_-]+)",
        r"\(([a-z0-9_-]+)\)\s+completed",
        r'You are the ([a-z0-9_-]+) agent',
    ]
    for pattern in patterns:
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        for candidate in reversed(matches):
            value = canonical_agent(candidate)
            if value:
                return value
    return find_agent_in_text(text)


def extract_marked_block(text: str, start_marker: str, end_marker: str) -> str:
    pattern = rf"{re.escape(start_marker)}\s*(.*?)\s*{re.escape(end_marker)}"
    matches = re.findall(pattern, text, flags=re.DOTALL | re.IGNORECASE)
    if not matches:
        return ""
    return matches[-1].strip() + "\n"


def strip_agent_wrapper(text: str) -> str:
    cleaned = text.strip()
    if not cleaned:
        return ""
    cleaned = re.sub(r"^Agent completed\.[^\n]*\n*", "", cleaned, count=1, flags=re.IGNORECASE)
    cleaned = re.sub(r"^Agent output[^\n]*:\n*", "", cleaned, count=1, flags=re.IGNORECASE)
    return cleaned.strip()


def extract_status_document(text: str) -> tuple[str, str]:
    lines = text.splitlines()
    indices = [index for index, line in enumerate(lines) if line.strip().lower().startswith("status:")]
    if not indices:
        return "", ""
    start = indices[-1]
    document = "\n".join(lines[start:]).strip()
    status_match = re.match(r"status:\s*(\w+)", lines[start].strip(), flags=re.IGNORECASE)
    status = normalize(status_match.group(1)) if status_match else ""
    return status, document + "\n"


def extract_repo_paths(text: str) -> list[str]:
    matches = re.findall(r"(?<!\S)((?:packages|apps)/[A-Za-z0-9._/\-]+)", text)
    cleaned: list[str] = []
    seen: set[str] = set()
    for match in matches:
        candidate = match.rstrip('.,:)`"\'')
        if candidate.startswith(".agents-work/"):
            continue
        if candidate not in seen:
            seen.add(candidate)
            cleaned.append(candidate)
    return cleaned


def summarize_text(text: str) -> str:
    for line in strip_agent_wrapper(text).splitlines():
        line = line.strip()
        if line and not line.lower().startswith("short agent summary:"):
            return line[:240]
    return "Recovered checkpoint from agent result."


def build_fallback_plan(text: str) -> str:
    body = strip_agent_wrapper(text)
    return (
        "# Recovered Plan\n\n"
        "This plan was reconstructed from the planner result because `.agents-work/current/plan.md` was not visible in the parent workspace.\n\n"
        "## Planner Output\n\n"
        f"{body}\n"
    )


def build_fallback_implementer_done(text: str) -> str:
    document = {
        "summary": summarize_text(text),
        "changed_files": extract_repo_paths(text),
        "validation_runs": [],
        "notes": (
            "Checkpoint reconciled from the implementor result because `.agents-work/current/implementer.done` "
            "was not visible in the parent workspace. Re-run targeted validation if detailed logs are required."
        ),
    }
    return json.dumps(document, indent=2) + "\n"


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf8")


def write_phase(path: Path, phase: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(f"{phase}\n", encoding="utf8")


def remove_if_exists(path: Path) -> None:
    if path.exists():
        path.unlink()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--work-dir", required=True)
    args = parser.parse_args()

    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    tool_name = normalize(payload.get("toolName", ""))
    tool_args = load_tool_args(payload)
    tool_result = payload.get("toolResult", {})
    result_type = normalize(tool_result.get("resultType", ""))
    text_result = str(tool_result.get("textResultForLlm", "") or "")

    if result_type != "success" or not text_result.strip():
        return 0

    if "agent started in background" in text_result.lower():
        return 0

    agent_name = find_structured_agent(tool_args) or find_agent_in_result_text(text_result)
    if not agent_name:
        return 0

    work_dir = Path(args.work_dir)
    phase_file = work_dir / "phase"
    plan_file = work_dir / "plan.md"
    implementer_done = work_dir / "implementer.done"
    review_ok = work_dir / "review.ok"
    review_feedback = work_dir / "review.feedback"

    if agent_name in PLANNER_AGENTS:
        content = extract_marked_block(text_result, *MARKERS["plan.md"])
        if not content and not plan_file.exists():
            content = build_fallback_plan(text_result)
        if content:
            write_text(plan_file, content)
            write_phase(phase_file, "planning")
        return 0

    if agent_name in IMPLEMENTOR_AGENTS:
        content = extract_marked_block(text_result, *MARKERS["implementer.done"])
        if not content and (not implementer_done.exists()) and ("implementer.done" in text_result.lower() or "validation_runs" in text_result or "changed_files" in text_result):
            content = build_fallback_implementer_done(text_result)
        if content:
            remove_if_exists(review_feedback)
            write_text(implementer_done, content)
            write_phase(phase_file, "implementing")
        return 0

    if agent_name in REVIEWER_AGENTS:
        ok_content = extract_marked_block(text_result, *MARKERS["review.ok"])
        feedback_content = extract_marked_block(text_result, *MARKERS["review.feedback"])
        if ok_content:
            remove_if_exists(implementer_done)
            remove_if_exists(review_feedback)
            write_text(review_ok, ok_content)
            write_phase(phase_file, "reviewing")
            return 0
        if feedback_content:
            remove_if_exists(implementer_done)
            remove_if_exists(review_ok)
            write_text(review_feedback, feedback_content)
            write_phase(phase_file, "reviewing")
            return 0

        status, status_document = extract_status_document(text_result)
        if status == "pass":
            remove_if_exists(implementer_done)
            remove_if_exists(review_feedback)
            write_text(review_ok, status_document)
            write_phase(phase_file, "reviewing")
            return 0
        if status in {"fail", "blocked", "revising"}:
            remove_if_exists(implementer_done)
            remove_if_exists(review_ok)
            write_text(review_feedback, status_document)
            write_phase(phase_file, "reviewing")
        return 0

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
