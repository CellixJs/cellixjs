#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${CELLIX_WORKFLOW_REPO_ROOT:-$(cd -- "${SCRIPT_DIR}/../.." && pwd)}"
WORK_DIR="${REPO_ROOT}/.agents-work/current"
GATE="${1:-status}"

ensure_work_dir() {
  mkdir -p "$WORK_DIR"
}

fail() {
  echo "$1" >&2
  exit 1
}

phase() {
  [[ -f "$WORK_DIR/phase" ]] && cat "$WORK_DIR/phase" || echo "(not started)"
}

case "$GATE" in
  status)
    ensure_work_dir
    echo "Phase: $(phase)"
    echo "Gate-driving state files:"
    for f in phase plan.md implementer.done review.ok review.feedback; do
      if [[ -f "$WORK_DIR/$f" ]]; then
        echo "  yes $f"
      else
        echo "  no  $f"
      fi
    done
    echo "Informational state files:"
    for f in workflow.session session.started; do
      if [[ -f "$WORK_DIR/$f" ]]; then
        echo "  yes $f"
      else
        echo "  no  $f"
      fi
    done
    ;;
  pre-implement)
    ensure_work_dir
    [[ -f "$WORK_DIR/plan.md" ]]
    ;;
  pre-review)
    ensure_work_dir
    if [[ ! -f "$WORK_DIR/implementer.done" ]]; then
      fail "implementer.done does not exist. Run implementor first."
    fi

    if ! changed_files="$(git -C "$REPO_ROOT" status --short --untracked-files=all -- . ':(exclude).agents-work' 2>/dev/null)"; then
      fail "Failed to read git status for pre-review gate."
    fi

    if [[ -z "$changed_files" ]]; then
      fail "No changed files to review."
    fi
    ;;
  *)
    echo "Unknown gate: $GATE" >&2
    exit 2
    ;;
esac
