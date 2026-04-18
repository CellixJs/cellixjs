#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${CELLIX_WORKFLOW_REPO_ROOT:-$(cd -- "${SCRIPT_DIR}/../.." && pwd)}"
WORK_DIR="${REPO_ROOT}/.agents-work/current"
PHASE_FILE="${WORK_DIR}/phase"
WORKFLOW_SESSION="${WORK_DIR}/workflow.session"

INPUT="$(cat)"

if [[ "${AGENT_WORKFLOW_DEBUG:-}" == "1" ]]; then
  mkdir -p "$WORK_DIR"
  printf '%s\n---\n' "$INPUT" >> "$WORK_DIR/hook-debug.log"
fi

PARSED="$(printf '%s' "$INPUT" | python3 "${SCRIPT_DIR}/parse-tool-call.py")"
TOOL_NAME="$(printf '%s\n' "$PARSED" | sed -n '1p')"
AGENT_NAME="$(printf '%s\n' "$PARSED" | sed -n '2p')"

deny() {
  python3 "${SCRIPT_DIR}/deny.py" "$1"
  exit 0
}

current_phase() {
  [[ -f "$PHASE_FILE" ]] && tr -d '[:space:]' < "$PHASE_FILE" || true
}

write_phase() {
  mkdir -p "$WORK_DIR"
  printf '%s\n' "$1" > "$PHASE_FILE"
}

state_summary() {
  local phase
  phase="$(current_phase)"
  local parts="phase=${phase:-empty}"
  [[ -f "${WORK_DIR}/plan.md" ]] && parts+=", plan.md=YES" || parts+=", plan.md=no"
  [[ -f "${WORK_DIR}/implementer.done" ]] && parts+=", implementer.done=YES"
  [[ -f "${WORK_DIR}/review.ok" ]] && parts+=", review.ok=YES"
  [[ -f "${WORK_DIR}/review.feedback" ]] && parts+=", review.feedback=YES"
  printf '%s' "$parts"
}

recover_phase() {
  mkdir -p "$WORK_DIR"
  local phase
  phase="$(current_phase)"
  if [[ -n "$phase" ]]; then
    return
  fi
  if [[ -f "${WORK_DIR}/review.ok" || -f "${WORK_DIR}/review.feedback" ]]; then
    write_phase "reviewing"
    return
  fi
  if [[ -f "${WORK_DIR}/implementer.done" ]]; then
    write_phase "implementing"
    return
  fi
  if [[ -f "${WORK_DIR}/plan.md" ]]; then
    write_phase "planning"
  fi
}

recover_phase

case "$TOOL_NAME" in
  bash|sh|zsh|shell)
  CMD_BLOB="$(printf '%s' "$INPUT" | python3 "${SCRIPT_DIR}/extract-command.py")"
  if printf '%s' "$CMD_BLOB" | grep -qE 'git\s+(commit|push)'; then
    deny "git commit and git push are blocked during orchestrated workflow runs. Keep changes local until the user asks to publish them. [$(state_summary)]"
  fi
  ;;
esac

case "$AGENT_NAME" in
  planner|implementor|reviewer|framework-surface-reviewer|validator|security)
    ;;
  *)
    exit 0
    ;;
esac

mkdir -p "$WORK_DIR"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$WORKFLOW_SESSION"

PHASE="$(current_phase)"

case "$AGENT_NAME" in
  planner)
    case "$PHASE" in
      ""|planning)
        write_phase "planning"
        exit 0
        ;;
      *)
        deny "Planning is already complete for this workflow. Delegate the implementor next. [$(state_summary)]"
        ;;
    esac
    ;;

  implementor)
    if [[ ! -f "${WORK_DIR}/plan.md" ]]; then
      deny "The planner must create .agents-work/current/plan.md before implementation can start. [$(state_summary)]"
    fi

    case "$PHASE" in
      planning|implementing)
        rm -f "${WORK_DIR}/implementer.done"
        write_phase "implementing"
        exit 0
        ;;
      "")
        deny "Workflow not started. Delegate the planner first. [$(state_summary)]"
        ;;
      reviewing)
        if [[ -f "${WORK_DIR}/review.feedback" ]]; then
          rm -f "${WORK_DIR}/implementer.done"
          rm -f "${WORK_DIR}/review.feedback"
          write_phase "implementing"
          exit 0
        fi
        deny "Implementation is only allowed after planning or in response to review feedback. [$(state_summary)]"
        ;;
      *)
        exit 0
        ;;
    esac
    ;;

  reviewer|framework-surface-reviewer)
    if [[ ! -f "${WORK_DIR}/plan.md" ]]; then
      deny "A review requires .agents-work/current/plan.md so the reviewer can compare changes against the plan. [$(state_summary)]"
    fi

    if [[ ! -f "${WORK_DIR}/implementer.done" ]]; then
      deny "The implementor must finish and write .agents-work/current/implementer.done before review can start. [$(state_summary)]"
    fi

    case "$PHASE" in
      implementing|reviewing)
        rm -f "${WORK_DIR}/review.ok"
        rm -f "${WORK_DIR}/review.feedback"
        write_phase "reviewing"
        exit 0
        ;;
      "")
        deny "Workflow not started. Delegate the planner first. [$(state_summary)]"
        ;;
      *)
        exit 0
        ;;
    esac
    ;;

  validator|security)
    if [[ ! -f "${WORK_DIR}/review.ok" ]]; then
      deny "Validation and security checks are only allowed after review passes and .agents-work/current/review.ok exists. [$(state_summary)]"
    fi
    exit 0
    ;;
esac

exit 0
