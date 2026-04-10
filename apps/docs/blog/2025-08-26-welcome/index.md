---
slug: welcome
title: Welcome to CellixJs
authors: [gidich]
tags: [hello, cellixjs]
---

CellixJs documentation features are designed to help developers understand and implement Domain-Driven Design patterns with Azure Functions and modern web technologies.

Here are a few tips to get you started with CellixJs development.

<!-- truncate -->

Simply explore the `apps` and `packages` directories to understand the modular architecture.

Regular contributors can be added to the team through our development workflow.

The project follows semantic versioning and clear release cycles:

- Architecture Decision Records (ADRs) document key decisions
- Domain contexts are organized under `packages/ocom/domain/src/domain/contexts/`

CellixJs provides comprehensive examples for DDD implementation:

![CellixJs Architecture](./cellixjs-architecture-banner.jpg)

The documentation supports categorized content as well!

**Getting Started**: Clone the repository, ensure mise is installed and available on your PATH (see note below), activate the repository Node version, and use pnpm (via Corepack) to install and build:

```bash
# macOS (recommended)
brew install mise

# Or use the installer script (fallback)
curl -fsSL https://get.mise.dev | sh

# Activate the repo Node version and install dependencies
mise install

# Enable Corepack and activate the pinned pnpm version
corepack enable && corepack prepare pnpm@10.30.1 --activate

# Clean, install, build, and start dev server
pnpm run clean && pnpm install && pnpm run build
pnpm run dev

# Run full verification locally (lint, tests, Snyk, SonarCloud, etc.)
pnpm run verify
```

Notes:
- The above assumes mise is installed and on your PATH. On macOS, prefer `brew install mise`; otherwise use the curl installer as a fallback.
- Corepack is used to manage pnpm; if Corepack is not enabled on your system, run `corepack enable` first.

