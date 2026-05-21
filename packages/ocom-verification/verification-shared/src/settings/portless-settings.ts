/**
 * Re-export of the canonical portless hostname helpers used by both the
 * dev:worktree scripts and the E2E test harness. Keeping the .mjs file as
 * the single source of truth means there is exactly one place that derives
 * hostnames from .env and applies the WORKTREE_NAME suffix.
 */
export { buildPortlessUrl, getHostnames, PORTLESS_PORT } from '../../../../../build-pipeline/scripts/portless-hostnames.mjs';
