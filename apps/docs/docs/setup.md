# Developer setup

This document is the canonical developer setup guide for the repository. Other docs link here to avoid duplicated, drifting instructions.

## Canonical installer snippet

Prefer the Homebrew installation on macOS. Use the installer script as a fallback on other platforms.

```bash
# macOS (recommended)
brew install mise

# Fallback (cross-platform)
curl -fsSL https://get.mise.dev | sh
```

After installing, follow the installer's activation instructions (e.g. `eval "$(~/.local/bin/mise activate zsh)"`). Then, from the repository root:

```bash
# Install tools pinned in mise.toml (will provision Node 22.22.2)
mise install

# Enable Corepack and activate the pinned pnpm for this workspace
corepack enable && corepack prepare pnpm@10.30.1 --activate

# Install dependencies, build, and run project
pnpm run clean && pnpm install && pnpm run build
pnpm run dev

# Run full verification locally (lint, tests, Snyk, SonarCloud, etc.)
pnpm run verify
```

Notes:
- The workspace `mise.toml` pins Node = "22.22.2". `mise install` will provision the correct Node version for this repo.
- Prefer `brew install mise` on macOS. The `curl -fsSL https://get.mise.dev | sh` installer is a documented fallback.
- See https://mise.jdx.dev/getting-started.html for the official mise docs and platform-specific activation steps.
