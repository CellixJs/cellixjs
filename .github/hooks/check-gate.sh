#!/usr/bin/env bash
# check-gate.sh — Status reporting for the agent workflow.
#
# Reports the current phase and state files. Used by agents to check
# where they are in the workflow. Enforcement is handled by the
# preToolUse hook (enforce-agent-workflow.sh), not this script.
#
# Usage:
#   bash .github/hooks/check-gate.sh status
#   bash .github/hooks/check-gate.sh <gate>
#
# Gates (legacy, for backward compat):
#   pre-implement   Checks plan.md exists
#   pre-review      Checks changed files exist
#   status          Shows current phase and all state files
#
# Exit codes:
#   0  Check passed / status shown
#   1  Check failed
#   2  Usage error

set -euo pipefail

GATE_STATE_FILES=(phase plan.md implementer.done review.ok review.feedback)
INFO_STATE_FILES=(security.ok security.blocked workflow.session session.started)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
WORK_DIR="${REPO_ROOT}/.agents-work/current"
GATE="${1:-status}"

fail() {
  echo -e "${RED}CHECK FAILED [${GATE}]: $1${NC}"
  exit 1
}

pass() {
  echo -e "${GREEN}CHECK PASSED [${GATE}]${NC}"
  exit 0
}

ensure_work_dir() {
  if [[ ! -d "$WORK_DIR" ]]; then
    mkdir -p "$WORK_DIR"
  fi
}

case "$GATE" in
  status)
    ensure_work_dir
    echo -e "${YELLOW}=== Workflow Status ===${NC}"
    if [[ -f "$WORK_DIR/phase" ]]; then
      echo -e "Phase: ${GREEN}$(cat "$WORK_DIR/phase")${NC}"
    else
      echo -e "Phase: ${YELLOW}(not started)${NC}"
    fi
    echo ""
    echo "Gate-driving state files:"
    for f in "${GATE_STATE_FILES[@]}"; do
      if [[ -f "$WORK_DIR/$f" ]]; then
        echo -e "  ${GREEN}✓${NC} $f"
      else
        echo -e "  ○ $f"
      fi
    done
    echo ""
    echo "Informational state files:"
    for f in "${INFO_STATE_FILES[@]}"; do
      if [[ -f "$WORK_DIR/$f" ]]; then
        echo -e "  ${GREEN}✓${NC} $f"
      else
        echo -e "  ○ $f"
      fi
    done
    echo ""
    echo "Changed files:"
    git -C "$REPO_ROOT" status --short --untracked-files=all -- . ':(exclude).agents-work' 2>/dev/null || echo "  (none)"
    ;;

  pre-implement)
    ensure_work_dir
    if [[ ! -f "$WORK_DIR/plan.md" ]]; then
      fail "plan.md does not exist. Run planner first."
    fi
    pass
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
    pass
    ;;

  *)
    echo -e "${RED}Unknown gate: $GATE${NC}"
    echo "Usage: bash .github/hooks/check-gate.sh {status|pre-implement|pre-review}"
    exit 2
    ;;
esac
