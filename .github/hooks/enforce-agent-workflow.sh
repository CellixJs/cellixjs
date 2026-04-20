#!/usr/bin/env bash
# enforce-agent-workflow.sh — preToolUse hook for Copilot CLI agent workflow.
#
# Phase-based state machine with BETWEEN-PHASE GUARDS:
#   planner → implementer(s) → reviewer → [1 feedback cycle] → done
#
# Phases: (empty) → planning → implementing → reviewing → feedback → final-review
#
# KEY DESIGN: Between phases (after a subagent completes but before the next is
# spawned), non-delegation tools are BLOCKED. This prevents the orchestrator
# from doing work itself — it can ONLY delegate to the next agent.
#
# Checkpoint files that trigger between-phase blocks:
#   plan.md           → planner done, must delegate implementer
#   implementer.done  → implementer done, must delegate reviewer (or more implementers)
#   review.feedback   → reviewer done (issues), must delegate implementer
#   review.ok         → reviewer done (pass), allow DONE reporting
#
# workflow.session — marker created on first delegation. Prevents session-bootstrap
# from clearing state when subagent sessions fire sessionStart.
#
# Python helpers (same directory):
#   parse-tool-call.py    — parse JSON payload, detect agent name
#   extract-command.py    — extract command text for git guard
#   deny.py               — emit JSON deny response

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
REPO_ROOT_REAL="$(cd -- "${REPO_ROOT}" && pwd -P)"
WORK_DIR="${REPO_ROOT}/.agents-work/current"
PHASE_FILE="${WORK_DIR}/phase"
WORKFLOW_SESSION="${WORK_DIR}/workflow.session"

INPUT="$(cat)"

# ── Debug logging ────────────────────────────────────────────────────────────
if [[ "${AGENT_WORKFLOW_DEBUG:-}" == "1" ]]; then
  mkdir -p "$WORK_DIR"
  printf '%s\n---\n' "$INPUT" >> "$WORK_DIR/hook-debug.log"
fi

# ── Parse payload ────────────────────────────────────────────────────────────

PARSED="$(printf '%s' "$INPUT" | python3 "${SCRIPT_DIR}/parse-tool-call.py")"

TOOL_NAME="$(printf '%s\n' "$PARSED" | sed -n '1p')"
AGENT_NAME="$(printf '%s\n' "$PARSED" | sed -n '2p')"

# ── Detect agent delegations ────────────────────────────────────────────────

IS_AGENT_DELEGATION=false

case "$TOOL_NAME" in
  agent|custom-agent|task|subagent)
    [[ -n "$AGENT_NAME" ]] && IS_AGENT_DELEGATION=true
    ;;
  orchestrator|planner|implementer|implementer-research|reviewer|security|validator)
    IS_AGENT_DELEGATION=true
    AGENT_NAME="$TOOL_NAME"
    ;;
esac

# ── Helpers ──────────────────────────────────────────────────────────────────

deny() {
  python3 "${SCRIPT_DIR}/deny.py" "$1"
  exit 0
}

current_phase() {
  [[ -f "$PHASE_FILE" ]] && tr -d '[:space:]' < "$PHASE_FILE" || true
}

state_summary() {
  local phase; phase="$(current_phase)"
  local parts="phase=${phase:-empty}"
  [[ -f "${WORK_DIR}/plan.md" ]]            && parts+=", plan.md=YES"            || parts+=", plan.md=no"
  [[ -f "${WORK_DIR}/implementer.done" ]]   && parts+=", implementer.done=YES"
  [[ -f "${WORK_DIR}/review.ok" ]]          && parts+=", review.ok=YES"
  [[ -f "${WORK_DIR}/review.feedback" ]]    && parts+=", review.feedback=YES"
  printf '%s' "$parts"
}

# ── Phase recovery ───────────────────────────────────────────────────────────
# If checkpoint files exist but phase is empty (e.g. session-bootstrap cleared
# it during a subagent session), reconstruct the phase from the checkpoints.

recover_phase() {
  mkdir -p "$WORK_DIR"
  local phase; phase="$(current_phase)"
  if [[ -n "$phase" ]]; then
    return
  fi
  # Phase is empty — try to recover from checkpoint files
  if [[ -f "${WORK_DIR}/review.ok" ]]; then
    echo "final-review" > "$PHASE_FILE"
  elif [[ -f "${WORK_DIR}/review.feedback" ]]; then
    echo "reviewing" > "$PHASE_FILE"
  elif [[ -f "${WORK_DIR}/implementer.done" ]]; then
    echo "implementing" > "$PHASE_FILE"
  elif [[ -f "${WORK_DIR}/plan.md" ]]; then
    echo "planning" > "$PHASE_FILE"
  fi
}

recover_phase

# ── Git commit/push guard (always active) ────────────────────────────────────

if [[ "$TOOL_NAME" == "execute" || "$TOOL_NAME" == "bash" || "$TOOL_NAME" == "shell" ]]; then
  CMD_BLOB="$(printf '%s' "$INPUT" | python3 "${SCRIPT_DIR}/extract-command.py")"

  if python3 - "$CMD_BLOB" <<'PY'
import shlex
import sys

blob = sys.argv[1]
try:
    tokens = shlex.split(blob, posix=True)
except Exception:
    tokens = blob.split()

git_flags_with_value = {
    "-c",
    "-C",
    "--git-dir",
    "--work-tree",
    "--namespace",
    "--super-prefix",
    "--config-env",
}

found = False
i = 0
while i < len(tokens):
    if tokens[i] != "git":
        i += 1
        continue

    j = i + 1
    while j < len(tokens):
        token = tokens[j]
        if token in {"commit", "push"}:
            found = True
            break
        if token in {"&&", "||", ";", "|"}:
            break
        if token in git_flags_with_value:
            j += 2
            continue
        if token.startswith("-"):
            j += 1
            continue
        break

    if found:
        break
    i += 1

raise SystemExit(0 if found else 1)
PY
  then
    deny "BLOCKED: git commit/push. All changes must remain local and uncommitted. [$(state_summary)]"
  fi
fi

# ═══════════════════════════════════════════════════════════════════════════════
# BETWEEN-PHASE GUARDS — for non-delegation, non-infrastructure tools
# ═══════════════════════════════════════════════════════════════════════════════
#
# The orchestrator should ONLY delegate agents. Between phases, any tool that
# isn't a delegation or CLI infrastructure is blocked. During a phase (subagent
# running), all tools pass because the subagent needs them.
#
# Phase checkpoints:
#   planning   + plan.md            → planner done, must delegate implementer
#   implementing + implementer.done → implementer done, must delegate reviewer
#   reviewing  + review.feedback    → reviewer done (issues), must delegate implementer
#   reviewing  + review.ok          → reviewer done (pass), allow DONE reporting
#   feedback   + implementer.done   → feedback implementer done, must delegate reviewer

if [[ "$IS_AGENT_DELEGATION" != "true" ]]; then
  # Infrastructure tools always pass through
  case "$TOOL_NAME" in
    report_intent|ask_user|sql|todo|memory|log)
      exit 0
      ;;
  esac

  # ── Allow reads/views of files OUTSIDE the workspace ───────────────────────
  # The CLI uses `read` on temp files (/var/folders/.../copilot-tool-output-*.txt)
  # to relay subagent results. These MUST be allowed or the orchestrator can't
  # see what its subagents produced and gives up.
  case "$TOOL_NAME" in
    read|view)
      TOOL_PATH="$(printf '%s' "$INPUT" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    a = d.get('toolArgs', {})
    if isinstance(a, str):
        import json as j; a = j.loads(a)
    if isinstance(a, dict):
        print(a.get('path', a.get('filePath', a.get('file', a.get('uri', '')))))
    else:
        print('')
except:
    print('')" 2>/dev/null)"
      # Absolute path NOT under repo root → external file (agent output) → allow
      if [[ -n "$TOOL_PATH" ]] && [[ "$TOOL_PATH" == /* ]]; then
        TOOL_REAL="$(python3 - "$TOOL_PATH" <<'PY'
import os
import sys

path = sys.argv[1]
print(os.path.realpath(path) if os.path.exists(path) else os.path.abspath(path))
PY
)"
        if [[ "$TOOL_REAL" != "$REPO_ROOT_REAL" ]] && [[ "$TOOL_REAL" != "$REPO_ROOT_REAL"/* ]]; then
          exit 0
        fi
      fi
      ;;
  esac

  mkdir -p "$WORK_DIR"
  PHASE="$(current_phase)"

  case "$PHASE" in
    "")
      # No phase → orchestrator must delegate planner first
      deny "BLOCKED: Workflow not started. You MUST delegate to the planner agent as your FIRST action. Tool '${TOOL_NAME}' is denied. [$(state_summary)]"
      ;;

    planning)
      if [[ -f "${WORK_DIR}/plan.md" ]]; then
        # Planner finished (plan.md written) → orchestrator must delegate implementer
        deny "BLOCKED: Planning complete — plan.md exists. Delegate to an implementer agent now. Do NOT read files or explore — delegate immediately. [$(state_summary)]"
      fi
      # Plan doesn't exist yet → planner subagent still running → allow its tools
      exit 0
      ;;

    implementing)
      if [[ -f "${WORK_DIR}/implementer.done" ]]; then
        # Implementer finished → orchestrator must delegate reviewer (or another implementer)
        deny "BLOCKED: Implementer finished (implementer.done exists). Delegate to the reviewer agent now, or delegate another implementer if tasks remain. Do NOT read files yourself. [$(state_summary)]"
      fi
      # No implementer.done yet → implementer subagent still running → allow its tools
      exit 0
      ;;

    reviewing)
      if [[ -f "${WORK_DIR}/review.ok" ]]; then
        # Review passed → workflow done → allow orchestrator to report
        exit 0
      fi
      if [[ -f "${WORK_DIR}/review.feedback" ]]; then
        # Reviewer flagged issues → must delegate implementer for fixes
        deny "BLOCKED: Review found issues (review.feedback exists). Delegate to an implementer agent to fix the feedback. Do NOT read files yourself. [$(state_summary)]"
      fi
      # No verdict yet → reviewer subagent still running → allow its tools
      exit 0
      ;;

    feedback)
      if [[ -f "${WORK_DIR}/implementer.done" ]]; then
        # Feedback implementer finished → must delegate reviewer for final review
        deny "BLOCKED: Feedback implementer finished (implementer.done exists). Delegate to the reviewer agent for final review. [$(state_summary)]"
      fi
      # Implementer fixing review feedback → allow its tools
      exit 0
      ;;

    final-review)
      # Final reviewer running or done → allow (orchestrator reports DONE after)
      exit 0
      ;;

    *)
      # Unknown phase → allow (safe fallback)
      exit 0
      ;;
  esac
fi

# ═══════════════════════════════════════════════════════════════════════════════
# AGENT DELEGATION GATING — enforce phase ordering for agent spawns
# ═══════════════════════════════════════════════════════════════════════════════

mkdir -p "$WORK_DIR"

# ── Create workflow.session marker on first delegation ───────────────────────
# This prevents session-bootstrap from clearing state when subagent sessions
# fire sessionStart with source=new.
if [[ ! -f "$WORKFLOW_SESSION" ]]; then
  date -u +"%Y-%m-%dT%H:%M:%SZ" > "$WORKFLOW_SESSION"
fi

PHASE="$(current_phase)"

case "$AGENT_NAME" in

  # ── PLANNER: only at start or during planning phase ────────────────────────
  planner)
    case "$PHASE" in
      ""|planning)
        echo "planning" > "$PHASE_FILE"
        ;;
      *)
        deny "BLOCKED: Planner — planning is already complete (phase=${PHASE}). Delegate to an implementer agent next. [$(state_summary)]"
        ;;
    esac
    ;;

  # ── IMPLEMENTER: requires plan.md + correct phase ─────────────────────────
  implementer|implementer-research)
    if [[ ! -f "${WORK_DIR}/plan.md" ]]; then
      deny "BLOCKED: Implementer — plan.md does not exist. The planner must create .agents-work/current/plan.md first. Re-delegate to the planner if needed. [$(state_summary)]"
    fi

    # Clear implementer.done from previous implementer (new implementer starting)
    rm -f "${WORK_DIR}/implementer.done"

    case "$PHASE" in
      planning)
        # First implementer after plan → transition to implementing
        echo "implementing" > "$PHASE_FILE"
        ;;
      implementing)
        # More implementers → stay in implementing
        ;;
      reviewing)
        # After reviewer flagged issues → transition to feedback round
        if [[ ! -f "${WORK_DIR}/review.feedback" ]]; then
          deny "BLOCKED: Implementer — reviewer has not written review.feedback yet. If review.ok exists, proceed to DONE — no more implementation needed. [$(state_summary)]"
        fi
        echo "feedback" > "$PHASE_FILE"
        ;;
      feedback)
        # More implementers during feedback round → stay in feedback
        ;;
      final-review)
        deny "BLOCKED: Implementer — final review phase. The feedback cycle is complete — no more implementation allowed. Report DONE. [$(state_summary)]"
        ;;
      *)
        deny "BLOCKED: Implementer — unexpected phase '${PHASE}'. Expected: planning (after plan.md), implementing, reviewing (with feedback), or feedback. [$(state_summary)]"
        ;;
    esac
    ;;

  # ── REVIEWER: requires implementing or feedback phase ──────────────────────
  reviewer)
    # Clear implementer.done (moving to review, not between implementers)
    rm -f "${WORK_DIR}/implementer.done"

    case "$PHASE" in
      implementing)
        # First review after implementation
        echo "reviewing" > "$PHASE_FILE"
        ;;
      feedback)
        # Final review after feedback fixes — no more cycles
        echo "final-review" > "$PHASE_FILE"
        ;;
      *)
        deny "BLOCKED: Reviewer — expected phase 'implementing' or 'feedback', got '${PHASE}'. Complete implementation before requesting review. [$(state_summary)]"
        ;;
    esac
    ;;

  # ── HELPER AGENTS: allowed any time after planning starts ──────────────────
  security|validator)
    if [[ -z "$PHASE" ]]; then
      deny "BLOCKED: ${AGENT_NAME} — workflow not started. Delegate to the planner first. [$(state_summary)]"
    fi
    ;;

  # ── ORCHESTRATOR: self-delegation — always allow ───────────────────────────
  orchestrator)
    ;;

  # ── UNKNOWN: allow through ─────────────────────────────────────────────────
  *)
    ;;
esac

exit 0
