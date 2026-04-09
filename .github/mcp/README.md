# Playwright MCP — Agent & Developer Guidance

This folder documents how to use the Playwright MCP server for Copilot/agents and local development.

Key points:
- The verification script used during testing was temporary. It's not required every time.
- The canonical MCP config for this repo is `.copilot/mcp-config.json` (committed). Copilot CLI reads `~/.copilot/mcp-config.json`.

Recommended developer steps (manual):
1. Install the repo MCP config into your home directory (non-destructive):

   pnpm run mcp:install-config

   This copies `./.copilot/mcp-config.json` to `~/.copilot/mcp-config.json` if you don't already have one.

2. Start the Playwright MCP server (HTTP, programmatic):

   pnpm run mcp:playwright:start

   (For editor/stdio usage, use `pnpm run mcp:playwright:stdio`.)

3. Start the dev stack (portless mapping):

   pnpm run dev

4. Optional manual verification (headless):

   node .github/mcp/run_login.mjs

   This script is a convenience for maintainers to verify a headless login flow. It is not required for agents to function.

Guidance for automation/CI:
- Prefer using the HTTP MCP server (`--port 8931`) for CI and programmatic checks.
- Avoid automatically overwriting users' `~/.copilot/mcp-config.json` in postinstall hooks. Prefer documented, explicit steps (as above).

If you want a packaged automation for agents, prefer creating a small GitHub Actions workflow that starts the MCP on a runner and uses it for tests, rather than forcing local machine changes.
