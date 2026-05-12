---
sidebar_position: 28
sidebar_label: 0028 Portless Local Development
description: "Adopt portless for HTTPS local development with stable ownercommunity.localhost domains and explicit app-level dev targets."
status: accepted
date: 2026-04-01
contact: nnoce14
deciders: gidich nnoce14
consulted:
informed:
---

# Adopt Portless For Local Development

## Context and Problem Statement

CellixJS local development had grown around multiple fixed localhost ports, with browser-facing configuration depending on values such as `3000`, `4000`, `7071`, and `3001`. That model worked, but it created drift between public URLs, local authentication configuration, and app startup ownership. It also made the local developer experience less stable than production-like HTTPS domain routing.

This ADR documents the decision to adopt `portless` as the standard local HTTP entry point for browser-facing applications and supporting HTTP mock services in the monorepo.

## Decision Drivers

- Local browser-facing services should use stable HTTPS URLs instead of ad hoc port assignments.
- The same public local URLs must be used consistently by the UI, Azure Functions app, and local OIDC provider.
- The development workflow should remain monorepo-friendly and work naturally with Turborepo task orchestration.
- The local development model should support high-quality developer experience and future agentic workflows, including multiple git worktrees running on the same machine without port conflicts.
- Local services should appear as explicit monorepo development targets rather than being hidden behind custom process spawning inside another application package.
- The implementation should follow a proven monorepo reference where practical, while avoiding outdated assumptions from older examples.

## Considered Options

- Continue using fixed localhost ports for all local development services
- Adopt portless only for the frontend and keep backend and mocks on raw localhost ports
- Adopt portless for browser-facing applications and HTTP mock services, with dedicated app-level dev orchestration

## Decision Outcome

Chosen option: "Adopt portless for browser-facing applications and HTTP mock services, with dedicated app-level dev orchestration", because it gives CellixJS stable HTTPS local URLs, removes browser-facing port coupling from configuration, and keeps each local service visible in the monorepo task graph instead of hiding it behind another app's startup script.

### Consequences

- Good, because local URLs are now stable and intention-revealing: `ownercommunity.localhost`, `data-access.ownercommunity.localhost`, `mock-auth.ownercommunity.localhost`, and `docs.ownercommunity.localhost`.
- Good, because browser-facing config now uses the same public URLs that developers actually visit, reducing OIDC redirect and issuer mismatch risks.
- Good, because parallel development across multiple git worktrees is no longer constrained by hardcoded browser-facing ports; separate worktrees can run their own local routes without competing for `3000`, `4000`, `7071`, or similar ports.
- Good, because mock services participate as explicit app-level development targets instead of being started as hidden child processes of `@apps/api`.
- Good, because the root `dev` flow becomes simpler conceptually: start the proxy, then run app `dev` tasks.
- Neutral, because non-HTTP dependencies such as the MongoDB memory replica set still use an internal port and are not themselves routed through portless.
- Bad, because first-time setup requires trusting a local certificate authority for HTTPS development.
- Bad, because developers must understand the distinction between an app's internal listener port and its external portless URL.

## Key Decisions Made During Adoption

### 1. Use portless default HTTPS URLs, not legacy `:1355` URLs

Older examples in related repositories still reference `:1355`, which reflected an earlier style of running the proxy on a nonstandard public port. We explicitly decided not to preserve that pattern.

Instead, CellixJS uses the current portless model:

- portless manages the public local route
- public browser-facing URLs do not include `:1355`
- the child process receives an internal `PORT` to bind to

This keeps local URLs cleaner and aligned with current portless behavior.

> Addendum (2026-05-01): Optional non-privileged port 1355
>
> For developers who prefer to avoid configuring system certificate trust, the repository supports an alternative non-privileged mode using port 1355. In this mode, mock and browser-facing services may be started on port 1355 and their public BASE_URLs should include `:1355` (for example `https://mock-auth.ownercommunity.localhost:1355`). When using port 1355 the `portless trust` step is optional and the portless proxy is not required for HTTPS access to those explicit origins. See the project README and `apps/*/.env` examples for guidance.

### 2. Standardize on `ownercommunity.localhost` naming

We adopted a domain convention based on the application name rather than a generic or historical prefix:

- UI: `ownercommunity.localhost`
- API: `data-access.ownercommunity.localhost`
- Mock OIDC: `mock-auth.ownercommunity.localhost`
- Docs: `docs.ownercommunity.localhost`

This makes local routes readable and keeps them distinct by responsibility.

It also supports future agentic workflows more cleanly. When multiple agents or linked git worktrees are running different branches on one developer machine, hardcoded public ports create collisions immediately. Portless avoids that coupling by assigning internal ports dynamically while keeping the public route model stable.

### 3. Keep browser-facing services on portless, but leave MongoDB as an internal fixed-port dependency

Portless is an HTTP routing tool. It is a good fit for the UI, Azure Functions host, docs site, and HTTP-based local mock services. It is not the right abstraction for a MongoDB replica set connection string.

For that reason:

- HTTP services use portless public URLs
- the MongoDB memory replica set remains on its internal fixed port for connection-string compatibility

### 4. Model mock services as dedicated app-level dev targets

We decided that local mock services should participate in the monorepo as dedicated `apps/*` development targets instead of being spawned indirectly by `@apps/api`.

In practice:

- `@apps/api` starts only the API
- the local OIDC mock service runs as its own app-level dev target
- the local MongoDB memory server runs as its own app-level dev target

This keeps the root workflow as the coordinator, keeps each `dev` target focused on a single responsibility, and avoids coupling one app's startup lifecycle to unrelated child processes.

We also aligned the package split with the ShareThrift reference:

- runnable local services live under `apps/*`
- reusable server logic lives under `packages/cellix/*-seedwork`

That keeps environment variables, portless routes, and app-specific defaults in the app layer while preserving reusable seedwork for future mock services.

#### 4a. Mock OAuth2 Server Refactoring

As part of adopting portless, the OAuth2 mock server was refactored into:

- **`@cellix/server-oauth2-mock-seedwork`** — reusable OIDC server logic (endpoints, token generation, JWT signing)
- **`@apps/server-oauth2-mock`** — application-level configuration and environment setup

This separation enables:

- **Reusability** — any CellixJS application can use the seedwork for local OIDC simulation
- **Clarity** — server logic is separate from app-specific configuration
- **Automatic session persistence** — the `sub` (user subject ID) is generated once at startup and cached, ensuring the same user identity persists across multiple login attempts without additional configuration

The `@apps/server-oauth2-mock` package can be customized per application via environment variables (`.env` and `.env.local`), and runs under portless on `mock-auth.ownercommunity.localhost`.

### 5. Add portless as a repo-managed dependency

We chose to install `portless` from the repository rather than rely on a mutable global installation. This makes the tool version explicit in the workspace and keeps the local development contract reproducible across contributors and CI-like environments.

## Pros and Cons of the Options

### Continue using fixed localhost ports

- Good, because it is familiar and requires no new local trust setup.
- Good, because non-HTTP tools and scripts already understand fixed port values.
- Bad, because browser-facing configuration must hard-code port-specific URLs.
- Bad, because authentication redirects and issuer settings are more likely to drift from the URLs developers actually use.
- Bad, because multiple applications and worktrees compete for well-known local ports.

### Adopt portless only for the frontend

- Good, because it improves the primary browser entry point with minimal change.
- Good, because it reduces migration scope.
- Neutral, because backend tooling could stay unchanged.
- Bad, because the UI would still need to call backend and auth services configured with raw localhost ports.
- Bad, because it preserves the mismatch between browser-facing URLs and supporting service configuration.

### Adopt portless for browser-facing applications and HTTP mock services, with dedicated app-level dev orchestration

- Good, because all browser-relevant URLs become stable HTTPS routes.
- Good, because UI, API, and mock auth configuration can share the same public URL model.
- Good, because the approach scales better to parallel local workflows, including multiple git worktrees and agent-driven validation on one machine.
- Good, because dedicated app-level orchestration makes local dependencies explicit in the monorepo task graph.
- Neutral, because some non-HTTP dependencies still require fixed internal ports.
- Bad, because certificate trust and proxy lifecycle become part of local setup.

## Validation

Evidence used to validate the adoption:

- `pnpm --filter @apps/api run build`
- `pnpm --filter @apps/ui-community run build`
- `pnpm --filter @apps/docs run build`
- `pnpm --filter @apps/server-oauth2-mock run build`
- `pnpm --filter @apps/server-mongodb-memory-mock run build`
- `pnpm exec turbo run dev --filter=@apps/api --filter=@apps/ui-community --filter=@apps/docs --dry=json`
- Review of local environment/configuration values to confirm browser-facing URLs no longer depend on `localhost:3000`, `localhost:4000`, `localhost:7071`, `localhost:3001`, or public `:1355` URLs

## Developer Notes

- `pnpm run dev` is the canonical full local-development entry point.
- Public local URLs should use the portless domains, not explicit browser-facing localhost ports.
### TLS Trust & Development Setup

To establish HTTPS trust for portless-developed custom domains, run the repository-local trust command once per machine:

```bash
pnpm exec portless trust
```

Repository script guidance (canonical):
```bash
# stop a running portless proxy (port-agnostic)
pnpm exec portless proxy stop || true

# start the repository-recommended non-privileged proxy mode
pnpm exec portless proxy start --https -p 1355
```

Notes:

- Running the command beforehand configures your machine to trust the development CA and avoids an interactive prompt when starting the dev environment. Re-running the command is idempotent.
- OS-specific prompts you may see:
  - macOS: the Keychain may prompt for permission to modify trusted certificates (approve and enter your password if prompted).
  - Windows: UAC may prompt for administrator approval to add the CA to the system certificate store.
  - Linux: behavior varies by distribution; some distros require `sudo` or manual placement of the CA into `/usr/local/share/ca-certificates/` followed by `sudo update-ca-certificates`.
- When restarting the root dev flow after changing proxy/network configuration, use the `--force` flag to ensure portless restarts cleanly:

```bash
pnpm run dev -- --force
```

Security:

- The CA created by portless is for development only. Do not reuse or export the private key for production.
- Treat portless and its CA as development-only artifacts; do not publish private keys or CA artifacts.

This section consolidates the TLS trust guidance previously documented separately; for troubleshooting and platform-specific details see the surrounding ADR text above.

- When wiring a new browser-facing app or HTTP mock service, prefer a dedicated portless subdomain under `*.ownercommunity.localhost`.
- When wiring a non-HTTP dependency, evaluate it separately; portless should not be used just for consistency if the protocol does not benefit from HTTP routing.

### Turborepo Integration (Portless 0.11.1+)

Portless 0.11.1 introduced optional delegation of app-level `dev`/`watch` commands to Turborepo's task runner when the workspace-level configuration enables `turbo: true`. This means the repository can preserve the Turbo task graph, caching, and dependency ordering while still providing per-app environment injection for portless-managed routes.

Why use it

- Preserves Turborepo's task graph, incremental caching, and ordered dependency execution for `dev` flows.
- Keeps app-level `dev` scripts documented and visible to Turbo while allowing portless to manage the public HTTPS routing layer.

Config example

Add (or update) the repository-level portless configuration to opt into Turbo delegation:

```js
// portless.config.cjs
module.exports = {
	turbo: true, // delegate dev/watch to turbo when available
};
```

How it works

- When `turbo: true` is set, portless delegates the execution of `dev` and `watch` lifecycle scripts to `turbo` (e.g., `pnpm exec turbo run dev`).
- Portless still injects per-app environment variables (for example, PORT, HOST, and PORTLESS_URL) into each spawned app process via a small `--require` loader that runs before the app's entrypoint. This loader sets the run-time environment for the child process so apps receive the correct internal listener port and public URL.

Environment variable precedence

- The injected variables are applied at process spawn time by the loader and therefore appear in `process.env` for the spawned application.
- These injected values may be overridden by application-level `.env` files, explicit `process.env` assignments in app startup code, or subsequent scripts that mutate environment variables before the application binds. In other words, the portless-injected values are the defaults for the spawned process but not immutable.

Opt-out and tradeoffs

- If you prefer not to delegate to Turbo (for example to preserve an existing custom start flow or loader ordering), set `turbo: false` in `portless.config.cjs`.
- Opting out preserves current portless behavior but loses Turborepo's task-graph optimizations (incremental rebuilds, remote caching, and ordered dependency execution) for delegated `dev` flows.

Verification

To confirm delegation is active and environment injection is functioning:

1. Run the canonical dev flow at the repo root:

   ```bash
   pnpm run dev
   ```

2. Confirm Turbo is driving the `dev` tasks (you should see `turbo` in the process tree or in the CLI output when the root `dev` flow starts).
3. In a running app, inspect `process.env` (for example by logging `process.env.PORT` and `process.env.PORTLESS_URL` at early startup) to verify the injected values are present and match the portless route configuration.

If delegation is not desired or if you observe incompatible loader ordering, disable `turbo: true` and run the app's `dev` script directly. Note this tradeoff removes Turbo's caching and task-graph benefits for those delegated flows.

## Future Evolution: Multi-Provider OIDC Support

CellixJS applications may eventually require multiple independent OIDC providers running simultaneously (e.g., B2C on `/b2c/*` and AAD B2C on `/aadb2c/*`). Two approaches are viable:

### Option A: Multiple Server Instances (Current Approach)

Run separate instances of `@apps/server-oauth2-mock` with different configurations:

```bash
pnpm run dev                    # Provider 1 on :4000
pnpm run dev:aadb2c             # Provider 2 on :4001
```

This requires no changes to the seedwork. Each instance is fully isolated.

### Option B: Single Server with Route-Based Providers (Future Enhancement)

Evolve the seedwork to accept a map of providers and route incoming requests based on path:

```typescript
const config: MockOAuth2ServerConfig = {
  providers: {
    '/b2c': { ...b2cConfig },
    '/aadb2c': { ...aadb2cConfig },
  },
};
```

This would require changes to `MockOAuth2ServerConfig`, route handlers, and OIDC discovery endpoints.

For now, **Option A (multiple instances) is recommended**. In the future, we should look to evolve to a more flexible approach to serve our needs, and **Option B will be designed and implemented as a focused enhancement**.

## More Information

- [ShareThrift package.json](https://github.com/simnova/sharethrift/blob/main/package.json)
- [ShareThrift apps/api package.json](https://github.com/simnova/sharethrift/blob/main/apps/api/package.json)
- [ShareThrift apps/ui-sharethrift package.json](https://github.com/simnova/sharethrift/blob/main/apps/ui-sharethrift/package.json)
- [Portless README](https://github.com/vercel-labs/portless/blob/main/README.md)
