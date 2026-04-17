#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${CELLIX_WORKFLOW_REPO_ROOT:-$(cd -- "${SCRIPT_DIR}/../.." && pwd)}"
WORK_DIR="${REPO_ROOT}/.agents-work/current"

mkdir -p "$WORK_DIR"
python3 "${SCRIPT_DIR}/reconcile-agent-result.py" --work-dir "$WORK_DIR"
