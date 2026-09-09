---
sidebar_position: 34
sidebar_label: 0034 TypeScript Language Service
description: "Pin VS Code and Grok/agent TypeScript intelligence to the workspace TypeScript 6 language service, while builds continue to use tsgo."
status: accepted
date: 2026-09-09
contact: nnoce14
deciders: gidich nnoce14
consulted:
informed:
---

# TypeScript Language Service For Editors And Agents

## Context and Problem Statement

CellixJS is a TypeScript monorepo. Builds use `tsgo` from `@typescript/native-preview` (see [ADR-0030](./0030-typescript-7-upgrade.md)), while editor and programmatic tooling stay on the catalog `typescript@6.0.3` JavaScript language service. Developers in VS Code and coding agents (including Grok) need a consistent, workspace-local TypeScript language service so go-to-definition, hover, references, and diagnostics match the TypeScript version the repo actually types against.

Without a checked-in configuration, each developer or agent may fall back to a globally installed TypeScript, a different `tsserver`, or no language server at all.

## Decision Drivers

- Editor and agent intelligence should use the workspace TypeScript SDK, not a global or editor-bundled compiler.
- Grok and other LSP clients need a stdio Language Server Protocol server; VS Code's built-in TypeScript support talks to `tsserver` directly and does not use `typescript-language-server`.
- The language service must stay aligned with ADR-0030: `typescript@6.0.3` for editor/tooling, `tsgo` for builds.
- The server binary should be installed with the workspace so every developer and agent gets the same version after `pnpm i`.

## Considered Options

- Leave TypeScript editor/agent setup unconfigured and rely on each person's global tools
- Point Grok at `tsgo --lsp` from `@typescript/native-preview` and switch VS Code to the TypeScript 7 native language server
- Install `typescript-language-server` in the workspace, configure Grok via `.grok/lsp.json`, and pin VS Code to the workspace `typescript@6.0.3` SDK

## Decision Outcome

Chosen option: "Install `typescript-language-server` in the workspace, configure Grok via `.grok/lsp.json`, and pin VS Code to the workspace `typescript@6.0.3` SDK", because it gives agents a real LSP, keeps VS Code on the same JS `tsserver` ADR-0030 already selected for editor integration, and does not require a global language-server install.

### Consequences

- Good, because Grok loads `.grok/lsp.json` automatically in this repository and can query TypeScript via the `lsp` tool when `GROK_LSP_TOOLS` is enabled.
- Good, because VS Code IntelliSense uses `node_modules/typescript/lib` (`js/ts.tsdk.path`), matching catalog `typescript@6.0.3`.
- Good, because `typescript-language-server` is a workspace devDependency; `pnpm i` is sufficient for developers and agents.
- Neutral, because VS Code does not speak LSP to TypeScript: it uses the built-in TypeScript language features extension wrapping `tsserver`. Configuring `js/ts.tsdk.path` is the VS Code equivalent of the Grok LSP setup.
- Neutral, because Grok's model-visible `lsp` tool also requires `GROK_LSP_TOOLS=1` or `[features] lsp_tools = true` in the user's Grok config. This repo sets `GROK_LSP_TOOLS` in `mise.toml` for mise-activated shells. Passive diagnostics still run from `.grok/lsp.json` alone.
- Bad, because `tsgo --lsp` is not used yet. When TypeScript 7's native language server is the workspace standard, this ADR should be revisited so editors and agents switch together.

## Configuration

| Client | Mechanism | TypeScript implementation |
| --- | --- | --- |
| Grok CLI / agents | `.grok/lsp.json` → `pnpm exec typescript-language-server --stdio` | workspace `typescript@6.0.3` `tsserver` |
| VS Code | `.vscode/settings.json` `js/ts.tsdk.path` and `js/ts.tsdk.promptToUseWorkspaceVersion` | workspace `typescript@6.0.3` `tsserver` |
| Package builds | `tsgo` | `@typescript/native-preview` (ADR-0030) |

`mise.toml` exports `GROK_LSP_TOOLS=1` so Grok sessions started from a mise-activated checkout expose the `lsp` tool. Developers who launch Grok outside mise should set `[features] lsp_tools = true` in `~/.grok/config.toml`.

VS Code still requires a one-time local opt-in (**Use Workspace Version**, or accept the workspace-SDK prompt). That selection is per machine and is not committed; the checked-in settings only advertise the SDK and show the prompt.

## More Information

- [ADR-0030: TypeScript 7.0 Upgrade](./0030-typescript-7-upgrade.md)
- Repository Grok LSP config: `.grok/lsp.json`
- [typescript-language-server](https://github.com/typescript-language-server/typescript-language-server)
