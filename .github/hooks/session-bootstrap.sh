#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
WORK_DIR="${REPO_ROOT}/.agents-work/current"

INPUT="$(cat)"
SOURCE="$(printf '%s' "$INPUT" | python3 "${SCRIPT_DIR}/parse-session-event.py")"

mkdir -p "$WORK_DIR"

if [[ "$SOURCE" == "new" ]]; then
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
fi

date -u +"%Y-%m-%dT%H:%M:%SZ" > "$WORK_DIR/session.started"
