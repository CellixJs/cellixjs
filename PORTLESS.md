Portless + Turborepo integration

Location
- Root config file: portless.config.cjs

Minimal config
- portless.config.cjs
  module.exports = { turbo: true }

Purpose
- Enabling `turbo: true` instructs Portless to delegate monorepo task orchestration to Turborepo for long-running commands (dev/start/watch). This preserves Turbo's task graph, dependency ordering, caching, and `persistent`/`cache` semantics while allowing Portless to provide stable HTTPS local domains.

Env var injection and loader behavior
- Portless injects per-app runtime environment variables into child processes using a loader/require mechanism. Common variables injected are:
  - PORT (internal port the app should bind to)
  - HOST (internal host, usually 127.0.0.1 or 0.0.0.0)
  - PORTLESS_URL (the public URL assigned by Portless)

- Because Portless injects variables via a loader, it can be compatible with Turbo when Portless delegates to Turbo run tasks. When Turbo starts tasked child processes, Portless ensures the environment variables are present on the spawned processes. If your app uses dotenv (.env/.env.local), Portless-injected variables take precedence at process start time unless your start script explicitly overwrites them.

Notes on .env conflicts
- Portless-injected variables (PORT, HOST, PORTLESS_URL) are injected at process spawn time. If your application or startup script reads .env files and overwrites those values, prefer using process.env.PORTLESS_URL or merge logic that respects existing environment values. Typical node frameworks (express, vite, next) will use process.env.PORT when binding; ensure they read env at startup rather than later.

Turbo auto-detection
- Portless can detect turborepo configuration (turbo.json) at the repository root. The repo already contains turbo.json which defines `dev` as a persistent task with proper `dependsOn` ordering. No changes to turbo.json are required for basic delegation.

Opt-out guidance
- If you need to temporarily disable Turborepo delegation and run Portless-only behavior, set `turbo: false` in portless.config.cjs or run Portless commands directly with flags that bypass turbo delegation.
- Behavior when turbo: false:
  - Portless will start apps individually without delegating to Turbo; you'll lose Turbo's task graph ordering and caching.
  - Use this if you need to debug startup ordering outside of Turbo or run a single app in isolation.

Testing recommendations
- Verify delegation locally by running the canonical dev flow:
  pnpm run dev
  - This will run `pnpm proxy:stop`, `pnpm proxy:start`, then delegate to Turbo's watch/dev tasks.
- To inspect environment variables injected into an app, start the target package with a small script that prints process.env for verification (or add a temporary startup log).
- For CI or tooling that needs deterministic behavior, prefer passing explicit env values or use Turbo task inputs to propagate necessary configuration.

References
- Place this file next to the repository root to document the config location and opt-out behavior.
