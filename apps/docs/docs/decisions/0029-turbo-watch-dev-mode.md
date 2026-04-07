---
sidebar_position: 29
sidebar_label: 0029 Turbo Watch Dev Mode
description: "Adopt turbo watch with proper task semantics for coordinated dev workflow, clean configuration, and portless integration without blocking."
status: accepted
date: 2026-04-07
contact: nnoce14
deciders: nnoce14
consulted: turborepo documentation, Portless ADR-0028
informed:
---

# Turbo Watch Dev Mode for Coordinated Development

## Context and Problem Statement

CellixJS is a Turborepo monorepo with multiple applications (`@apps/*`), TypeScript libraries (`@cellix/*`, `@ocom/*`), and code generation tasks. The dev workflow requires:

1. **Parallel app servers** — Azure Functions, Vite frontend, Next.js-like docs, and HTTP mock services running concurrently
2. **Automatic rebuilds** — When library source changes, dependent apps should restart
3. **GraphQL codegen** — When `.graphql` files change, generated types should update before apps rebuild
4. **Portless proxy integration** — Browser-facing routing via `portless` (per ADR-0028) without blocking the dev orchestrator

Previous implementation mixed tasks with incompatible semantics:
- Running `turbo watch //#gen:watch dev build` combined persistent (long-running) and non-persistent (one-shot) tasks, causing infinite loops or hangs
- Using `with` arrays in app configs forced all library watches to start concurrently before app startup, rather than waiting for them to complete
- Portless proxy ran synchronously in the dev script, blocking turbo watch and causing port conflicts on restarts
- Root task `//#gen:watch` was filtered out via `--filter='@apps/*'`, breaking GraphQL change detection

This ADR documents the decision to adopt Turborepo's watch mode with proper task semantics, clean configuration, and non-blocking portless integration.

## Decision Drivers

- **Task semantics clarity** — Distinguish between one-shot watch tasks (library builds, codegen) that complete and persistent tasks (app servers) that stay running
- **Configuration minimization** — Avoid per-package turbo.json overrides where possible; let root config define semantics
- **Portless integration** — Proxy must run as a non-blocking background daemon, not part of turbo watch orchestration
- **Dependency ordering** — Apps must wait for library watches and codegen to complete before starting, not run concurrently
- **Loop prevention** — Task inputs must exclude generated outputs to prevent self-triggering; dependency graph must be acyclic
- **Developer experience** — File changes should trigger predictable, fast rebuilds with clear sequencing

## Considered Options

### Option A: `turbo watch dev build gen` with concurrent execution
- Runs all tasks concurrently after startup
- Simple command line
- **Rejected** — mixing persistent (dev) and non-persistent (build, gen) tasks causes Turbo to wait forever or loop; `--filter` breaks root tasks

### Option B: Separate `turbo run` for setup, then `turbo watch dev`
- Pre-build libraries and gen, then start watch on dev only
- Requires manual two-step startup
- **Rejected** — defeats the purpose of watch mode; changes to libraries or `.graphql` files wouldn't trigger rebuilds

### Option C: `turbo watch dev` with proper dependencies, portless as background daemon
- Root `dev` task depends on `^watch` and `//#gen`
- New explicit `watch` task for library watches (non-persistent)
- Portless starts as `&` background process before turbo watch
- App configs only override what they need (dependsOn, interruptible)
- **Chosen** — aligns with Turborepo best practices, minimizes configuration, ensures proper sequencing

## Decision Outcome

Chosen option: "turbo watch dev with proper dependencies, portless as background daemon", because it:

1. **Separates task semantics** — Persistent tasks (dev servers) stay running; non-persistent tasks (watches, gen) complete and re-run on changes
2. **Minimizes configuration** — Root config defines all task behavior; apps only override `dependsOn` and `interruptible`
3. **Prevents infinite loops** — Clear dependency direction (watch → gen → dev); generated outputs excluded from gen inputs
4. **Integrates portless cleanly** — Proxy runs independently in background; turbo watch not blocked by proxy restarts
5. **Maintains developer velocity** — File changes to libraries trigger fast, predictable rebuilds with correct app restarts

### Consequences

- Good, because app configurations are 75% smaller (removed `with` arrays)
- Good, because library watches complete cleanly without blocking startup
- Good, because generated outputs can't trigger self-loops
- Good, because GraphQL schema changes trigger full rebuild pipeline (gen → build → app restart)
- Good, because app server restarts can happen cleanly when library watches re-run
- Neutral, because Vite apps (ui-community) use native HMR instead of full restarts (performance improvement)
- Neutral, because portless stays running independently; if it crashes, turbo watch continues
- Bad, because portless must be manually restarted if needed (`pnpm proxy:stop && pnpm proxy:start`)

## Implementation

### Root package.json

**Dev script:**
```json
"dev": "nohup pnpm proxy:start > /dev/null 2>&1 & turbo watch dev"
```

The `nohup` command fully detaches portless from the terminal session (prevents HUP signal on parent exit). The `> /dev/null 2>&1` suppresses all portless output (both stdout and stderr) so it doesn't interfere with turbo's TUI. The `&` makes it non-blocking. Turbo watch begins immediately with a clean terminal UI.

**Proxy start script:**
```json
"proxy:start": "portless proxy stop || true; portless proxy start -p 1355 --https"
```

Ensures clean state: stop any existing proxy, then start fresh. Prevents "address already in use" errors.

### Root turbo.json

**New `watch` task:**
```json
{
  "watch": {
    "description": "Watches package source files and rebuilds on changes (one-shot completion)",
    "cache": false,
    "persistent": false,
    "inputs": [
      "src/**/*.ts",
      "tsconfig*.json",
      "rolldown.config.ts",
      "!coverage/**",
      "!target/**",
      "!tests/**",
      "!**/*.test.*",
      "!**/*.spec.*",
      "!vitest*.config.*"
    ],
    "outputs": ["dist/**", "build/**", "*.tsbuildinfo"]
  }
}
```

- `persistent: false` — Task completes when TypeScript compiles; doesn't run indefinitely
- `cache: false` — Cache disabled in watch mode (files changing frequently)
- Explicit inputs prevent false triggers on test or coverage changes
- Explicit outputs let turbo detect when libraries rebuild

**Updated `dev` task:**
```json
{
  "dev": {
    "description": "Starts application packages dev servers in watch mode",
    "dependsOn": ["^watch", "//#gen"],
    "cache": false,
    "persistent": true,
    "interruptible": true,
    "inputs": [
      "$TURBO_DEFAULT$",
      "!coverage/**",
      "!target/**",
      "!dist/**",
      "!build/**",
      "!deploy/**",
      "!**/*.tsbuildinfo"
    ]
  }
}
```

- `dependsOn: ["^watch", "//#gen"]` — Wait for library watches and codegen to complete before starting apps
- `persistent: true` — App servers stay running (don't exit after startup)
- `interruptible: true` — Turbo can restart them when dependency watches re-run
- Inputs exclude build outputs to prevent false triggers on rebuilt libraries

**Updated `//#gen` task inputs:**
```json
{
  "//#gen": {
    "inputs": [
      "codegen.yml",
      "**/*.graphql",
      "**/*.resolvers.ts",
      "**/*.permissions.ts",
      "packages/cellix/graphql-codegen/plugins/**",
      "!src/generated/**",
      "!**/*.generated.ts",
      "!**/generated.ts",
      "!**/generated.tsx",
      "!**/graphql.schema.json"
    ]
  }
}
```

Excludes generated outputs to prevent self-triggering. Only runs when `.graphql` or plugin source changes.

**New `//#gen:watch` task:**
```json
{
  "//#gen:watch": {
    "description": "Runs graphql-codegen in watch mode",
    "cache": false,
    "persistent": false,
    "inputs": [/* same as //#gen */],
    "outputs": [/* same as //#gen */]
  }
}
```

Non-persistent watch task; completes on each codegen run and re-runs on schema changes.

### App Package turbo.json Files

**Minimal overrides** — only `dependsOn` and `interruptible` where needed:

```json
{
  "extends": ["//"],
  "tasks": {
    "dev": {
      "dependsOn": ["^watch", "//#gen"],
      "interruptible": true
    }
  }
}
```

**Why this works:**
- `"extends": ["//"]` — Inherits root task definitions (cache, persistent, inputs, etc.)
- `"dependsOn": ["^watch", "//#gen"]` — Override to declare explicit dependencies (automatic via caret)
- `"interruptible": true"` — Only for services that should restart on dependency changes
- No `with` arrays needed — Turbo handles dependency ordering automatically

All libraries inherit root config via `extends: ["//"]` in their minimal turbo.json files. **No per-library config needed.**

## Task Execution Flow

### Initial Startup
```
1. pnpm run dev
   ├─ Background: portless proxy start (non-blocking)
   └─ Foreground: turbo watch dev
      ├─ Identify: ^watch tasks (all library watches)
      ├─ Run: ^watch tasks in parallel
      ├─ Wait: for all ^watch tasks to complete
      ├─ Run: //#gen task
      ├─ Wait: for //#gen to complete
      └─ Run: dev tasks (all app servers)
         ├─ apps/api: func host start (persistent)
         ├─ apps/ui-community: vite (persistent)
         ├─ apps/docs: docusaurus (persistent)
         ├─ apps/server-oauth2-mock: node (persistent)
         └─ apps/server-mongodb-memory-mock: node (persistent)
```

### On Library Source Change (e.g., packages/ocom/graphql/src/index.ts)
```
1. Edit and save file
2. Turbo detects file change via watch inputs
3. Re-run: @ocom/graphql#watch
   └─ tsc --build --watch completes with new dist/
4. Turbo detects downstream dependency: @apps/api#dev depends on @ocom/graphql
5. Turbo re-run: @apps/api#dev (because of interruptible: true)
   └─ func host start exits and restarts
   └─ Reads new @ocom/graphql dist/ and starts
6. Vite (ui-community) detects linked package change via native HMR
   └─ Reloads without full restart (for Vite apps)
```

### On GraphQL Schema Change (e.g., packages/ocom/graphql/schema.graphql)
```
1. Edit and save .graphql file
2. Turbo detects file change via //#gen inputs
3. Re-run: //#gen task
   └─ graphql-codegen completes with new generated.ts files
4. Turbo detects downstream dependency: build depends on //#gen
5. Re-run: affected build tasks
6. Turbo detects: dev depends on //#gen
7. Turbo re-run: dev tasks (because //#gen is dependency, not persistent)
   └─ @apps/api#dev restarts with new generated types
```

### On App Source Change (e.g., apps/ui-community/src/App.tsx)
```
1. Edit and save .tsx file
2. Vite detects change via native file watcher
3. Vite HMR reloads component (no full restart)
```

## Validation

Testing strategy to validate the implementation:

1. **Dev startup** — `pnpm run dev` launches portless and all app servers
2. **Library rebuild** — Edit library source → library rebuilds → app restarts
3. **GraphQL codegen** — Edit .graphql file → gen runs → build runs → app restarts
4. **No infinite loops** — Idle dev session shows no spurious task re-runs
5. **Portless reliability** — Proxy stays running; no "address in use" errors on app restart
6. **App hot reload** — Vite-based apps HMR without full restart; traditional apps restart cleanly

## Trade-Offs

### vs. Concurrent `with` Model
- **`dependsOn` (chosen)**: Libraries finish before apps start; guaranteed correct state
- **`with` (rejected)**: Libraries and apps start concurrently; apps might start before libraries are ready

### vs. Manual Root Orchestration
- **Turbo watch (chosen)**: Automatic dependency discovery and sequencing
- **Manual (rejected)**: Complex shell scripts; harder to maintain; more error-prone

### vs. Portless Inside turbo.json
- **Background daemon (chosen)**: Proxy independent; turbo focuses on watch coordination
- **Turbo task (rejected)**: Proxy becomes part of task graph; failures block watch; harder to manage lifecycle

## Future Evolution

### Multiple OIDC Providers
Per ADR-0028, multiple OIDC providers may eventually be needed. Options:

1. **Multiple instances** — Run separate `@apps/server-oauth2-mock` with different configs
2. **Route-based multiplexing** — Evolve seedwork to accept provider map (future enhancement)

Current implementation supports Option 1 without changes.

### Caching in Watch Mode
Turborepo watch mode has experimental cache support via `--experimental-write-cache`. Future work could enable incremental rebuilds by caching library builds between watch sessions.

### Performance Optimization
For large monorepos, watch-mode performance can be optimized by:
- Narrowing task inputs further (exclude more non-source files)
- Using Turborepo's `--filter` at startup (after initial build)
- Leveraging TypeScript's incremental build via `tsconfig.json` `incremental: true`

## Developer Notes

### Starting Dev Mode
```bash
pnpm run dev
```

This is the canonical entry point. Portless starts in background; turbo watch begins immediately.

### Stopping Dev Mode
```bash
# Ctrl+C to stop turbo watch
# Portless continues running

# To stop portless:
pnpm proxy:stop
```

### Troubleshooting: Dev Mode Doesn't Start
```bash
# Check if portless is already running
portless proxy status

# Clean stop and restart
pnpm proxy:stop
pnpm run dev
```

### Troubleshooting: Portless output interferes with turbo TUI
Portless output is intentionally suppressed (`nohup ... > /dev/null 2>&1`) using `nohup` for full terminal detachment. This keeps turbo's TUI completely clean. The `nohup` command ensures portless won't receive a HUP (hang up) signal even if the parent shell session ends.

If you need to see portless logs:

```bash
# Check proxy status without output interference
portless proxy status

# For debugging: restart proxy with visible output
pnpm proxy:stop
portless proxy start -p 1355 --https  # Will show diagnostic output
# Then stop dev mode (Ctrl+C) and restart: pnpm run dev

# If portless is still showing output in your terminal:
# 1. Make sure you're using the updated dev script with nohup
# 2. Try: nohup portless proxy start -p 1355 --https > /dev/null 2>&1 &
# 3. Verify by checking: pnpm proxy:stop && sleep 1 && pnpm run dev
```

### Troubleshooting: Port Conflicts
The `proxy:start` script includes `portless proxy stop || true`, which cleanly stops any existing proxy before starting a new one. This prevents "address already in use" errors.

If you still see port conflicts:
```bash
# Find process on port 1355
lsof -i :1355

# Kill if needed (use PID from lsof output)
kill -9 <PID>

# Then restart dev
pnpm run dev
```

### Troubleshooting: File Changes Don't Trigger Rebuilds
- Check watch task has explicit `inputs` defined (not using defaults)
- Check generated outputs aren't tracked in git (breaks change detection)
- Verify `watchUsingTaskInputs: true` in root turbo.json

## References

- [Turborepo Watch Mode Documentation](https://turborepo.dev/docs/reference/watch)
- [Turborepo Task Configuration Reference](https://turborepo.dev/docs/reference/configuration#tasks)
- [Issue #189: Extend dev command with turbo watch mode](https://github.com/CellixJs/cellixjs/issues/189)
- [ADR-0019: Monorepo + Turborepo](./0019-monorepo-turborepo.md)
- [ADR-0028: Portless Local Development](./0028-portless-local-development.md)
- [Turborepo: Crafting Your Repository - Developing with Watch Mode](https://turborepo.dev/docs/crafting-your-repository/developing-applications#watch-mode)
