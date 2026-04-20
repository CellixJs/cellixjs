#!/usr/bin/env bash
# session-bootstrap.sh — sessionStart hook for Copilot CLI agent workflow.
#
# Clears workflow state on genuinely NEW conversations only.
# Subagent sessions (planner/implementer/reviewer spawned by the orchestrator)
# also fire sessionStart with source=new, so we use a "workflow.session" marker
# to distinguish: if the marker exists, the workflow is in progress and we must
# NOT clear state.

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
WORK_DIR="${REPO_ROOT}/.agents-work/current"
WORKFLOW_SESSION="${WORK_DIR}/workflow.session"

INPUT="$(cat)"

SOURCE="$(printf '%s' "$INPUT" | python3 "${SCRIPT_DIR}/parse-session-event.py")"

mkdir -p "$WORK_DIR"

if [[ "$SOURCE" == "new" ]]; then
  if [[ -f "$WORKFLOW_SESSION" ]]; then
    # Subagent session within an active workflow — do NOT clear state.
    # The workflow.session marker was created by the preToolUse hook when the
    # first delegation was allowed.
    :
  else
    # Genuinely new conversation — clear workflow state used by the current
    # phase machine plus informational markers written by helper agents/hooks.
    rm -f \
      "$WORK_DIR/phase" \
      "$WORK_DIR/plan.md" \
      "$WORK_DIR/plan.approved" \
      "$WORK_DIR/plan.implementer.md" \
      "$WORK_DIR/review.ok" \
      "$WORK_DIR/review.feedback" \
      "$WORK_DIR/review.blocked" \
      "$WORK_DIR/security.ok" \
      "$WORK_DIR/security.blocked" \
      "$WORK_DIR/implementer.done" \
      "$WORK_DIR/workflow.mode" \
      "$WORK_DIR/workflow.session" \
      "$WORK_DIR/notes.md" \
      "$WORK_DIR/hook-debug.log"
  fi
fi

date -u +"%Y-%m-%dT%H:%M:%SZ" > "$WORK_DIR/session.started"
