---
sidebar_position: 34
sidebar_label: 0034 TypeScript Language Service
description: "Use tsgo --lsp for Grok and the TypeScript 7 native language service in VS Code so editor, agents, and builds share the same compiler."
status: accepted
date: 2026-09-09
contact: nnoce14
deciders: gidich nnoce14
consulted:
informed:
---

# TypeScript Language Service For Editors And Agents

## Context and Problem Statement

CellixJS is a TypeScript monorepo. Builds use `tsgo` from `@typescript/native-preview` (see [ADR-0030](./0030-typescript-7-upgrade.md)). Catalog `typescript@6.0.3` remains for the JavaScript compiler API (knip, GraphQL codegen, archunit). Developers in VS Code and coding agents (including Grok) need a language service that reports the same diagnostics as `tsgo`, not VS Code's bundled TypeScript and not `typescript@6.0.3` `tsserver`.

Without a checked-in configuration, each developer or agent may fall back to a globally installed TypeScript, VS Code's bundled compiler, or `typescript-language-server` wrapping `tsserver.js`. That mismatch can show editor diagnostics `tsgo` would not report, or hide errors the compiler would.

## Decision Drivers

- Editor and agent diagnostics should match `tsgo`, which is the build compiler.
- Grok and other LSP clients need a stdio language server. `tsgo --lsp --stdio` is that server on the pinned `@typescript/native-preview` binary.
- ADR-0030 still requires catalog `typescript@6.0.3` for the JS compiler API; that package must not be the editor language service.
- The server binary should come from the workspace so every developer and agent gets the same version after `pnpm i`.

## Considered Options

- Leave TypeScript editor/agent setup unconfigured and rely on each person's global tools
- Point Grok at `tsgo --lsp` from `@typescript/native-preview` and switch VS Code to the TypeScript 7 native language server
- Install `typescript-language-server` in the workspace, configure Grok via `.grok/lsp.json`, and pin VS Code to the workspace `typescript@6.0.3` SDK

## Decision Outcome

Chosen option: "Point Grok at `tsgo --lsp` from `@typescript/native-preview` and switch VS Code to the TypeScript 7 native language server", because the pinned `tsgo` binary already implements LSP (`--lsp --stdio`, server name `typescript-go`, version `7.0.0-dev.20260428.1`) with hover, definition, references, symbols, and diagnostics. That is the same compiler as package builds.

The `typescript-language-server` + `typescript@6.0.3` `tsserver` option was rejected for editor/agent use: it would keep a second typechecker in the loop. Catalog `typescript@6.0.3` stays only for the JS compiler API (ADR-0030).

### Consequences

- Good, because Grok, VS Code, and `pnpm run build` share `tsgo`.
- Good, because Grok loads `.grok/lsp.json` (`pnpm exec tsgo --lsp --stdio`) and can query TypeScript via the `lsp` tool when `GROK_LSP_TOOLS` is enabled.
- Good, because VS Code is switched to the native language service with `js/ts.experimental.useTsgo` and the TypeScript Native Preview extension.
- Neutral, because catalog `typescript@6.0.3` remains for knip, GraphQL codegen, and archunit. It is not used as the editor language service.
- Neutral, because Grok's model-visible `lsp` tool also requires `GROK_LSP_TOOLS=1` or `[features] lsp_tools = true` in the user's Grok config. This repo sets `GROK_LSP_TOOLS` in `mise.toml` for mise-activated shells.
- Bad, because developers need the TypeScript Native Preview VS Code extension (or equivalent `useTsgo` support). Without it, `js/ts.experimental.useTsgo` can leave the built-in TS 6 language features disabled.

## Configuration

| Client | Mechanism | TypeScript implementation |
| --- | --- | --- |
| Grok CLI / agents | `.grok/lsp.json` → `pnpm exec tsgo --lsp --stdio` | `@typescript/native-preview` (`tsgo`) |
| VS Code | `.vscode/settings.json` `js/ts.experimental.useTsgo` and the TypeScript Native Preview extension | `@typescript/native-preview` (`tsgo`) |
| Package builds | `tsgo` | `@typescript/native-preview` (ADR-0030) |
| JS compiler API (knip, codegen, archunit) | `import from 'typescript'` | catalog `typescript@6.0.3` |

`mise.toml` exports `GROK_LSP_TOOLS=1` so Grok sessions started from a mise-activated checkout expose the `lsp` tool. Developers who launch Grok outside mise should set `[features] lsp_tools = true` in `~/.grok/config.toml`.

## More Information

- [ADR-0030: TypeScript 7.0 Upgrade](./0030-typescript-7-upgrade.md)
- Repository Grok LSP config: `.grok/lsp.json`
- [TypeScript Native Previews](https://devblogs.microsoft.com/typescript/announcing-typescript-native-previews/)
