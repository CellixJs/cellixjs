#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${CELLIX_WORKFLOW_REPO_ROOT:-$(cd -- "${SCRIPT_DIR}/../.." && pwd)}"
WORK_DIR="${REPO_ROOT}/.agents-work/current"
WORKFLOW_SESSION="${WORK_DIR}/workflow.session"

INPUT="$(cat)"
SOURCE="$(printf '%s' "$INPUT" | python3 "${SCRIPT_DIR}/parse-session-event.py")"

mkdir -p "$WORK_DIR"

clear_workflow_state() {
  rm -f \
    "$WORK_DIR/phase" \
    "$WORK_DIR/plan.md" \
    "$WORK_DIR/implementer.done" \
    "$WORK_DIR/review.ok" \
    "$WORK_DIR/review.feedback" \
    "$WORK_DIR/review.blocked" \
    "$WORK_DIR/notes.md" \
    "$WORK_DIR/hook-debug.log" \
    "$WORK_DIR/workflow.session"
}

current_phase() {
  [[ -f "$WORK_DIR/phase" ]] && tr -d '[:space:]' < "$WORK_DIR/phase" || true
}

workflow_state_reset_reason() {
  local phase
  phase="$(current_phase)"

  if [[ -f "$WORK_DIR/review.ok" ]]; then
    printf '%s\n' "completed-review"
    return 0
  fi

  if [[ ! -f "$WORKFLOW_SESSION" ]]; then
    return 1
  fi

  if [[ -z "$phase" ]] \
    && [[ ! -f "$WORK_DIR/plan.md" ]] \
    && [[ ! -f "$WORK_DIR/implementer.done" ]] \
    && [[ ! -f "$WORK_DIR/review.ok" ]] \
    && [[ ! -f "$WORK_DIR/review.feedback" ]]; then
    printf '%s\n' "marker-only"
    return 0
  fi

  if [[ "$phase" == "implementing" ]] && [[ ! -f "$WORK_DIR/plan.md" ]]; then
    printf '%s\n' "implementing-without-plan"
    return 0
  fi

  if [[ "$phase" == "reviewing" ]]; then
    if [[ ! -f "$WORK_DIR/plan.md" ]]; then
      printf '%s\n' "reviewing-without-plan"
      return 0
    fi
    if [[ ! -f "$WORK_DIR/implementer.done" ]] \
      && [[ ! -f "$WORK_DIR/review.ok" ]] \
      && [[ ! -f "$WORK_DIR/review.feedback" ]]; then
      printf '%s\n' "reviewing-without-review-input"
      return 0
    fi
  fi

  return 1
}

if [[ "$SOURCE" == "new" ]]; then
  if workflow_state_reset_reason >/dev/null; then
    clear_workflow_state
  elif [[ ! -f "$WORKFLOW_SESSION" ]]; then
    clear_workflow_state
  fi
fi

date -u +"%Y-%m-%dT%H:%M:%SZ" > "$WORK_DIR/session.started"
