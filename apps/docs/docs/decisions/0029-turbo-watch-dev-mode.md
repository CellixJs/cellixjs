# 0029: Turbo watch dev-mode

Date: 2026-04-09

Status: Accepted

Context
-------
The repository uses Turborepo to orchestrate build, test and dev tasks across multiple packages. Developers expect a responsive local development experience: long-running processes (dev servers, Storybook, emulators) should remain running while one-shot tasks (codegen, type checks, builds) re-run when sources change.

Turborepo provides `turbo run` for single-shot execution and `turbo watch` for persistent watch-mode workflows. `turbo watch` keeps persistent tasks running and restarts interruptible tasks when their inputs change; it also provides a daemon that improves responsiveness for watch workflows.

Decision
--------
1. Use `turbo watch dev` from the repository root as the primary local development command. This keeps persistent tasks running and re-runs interruptible tasks on file changes.

2. Configure a `dev` task in `turbo.json` with `persistent: true` and `dependsOn: ["^build"]`. One-shot package tasks should be interruptible so `turbo watch` can restart them when inputs change.

3. Invoke watch with package filters in the npm script (e.g., `turbo watch dev --filter='./apps/*' --filter='./packages/*'`) so common development sessions are scoped and fast by default.

4. Start a local HTTP/HTTPS proxy (portless) before `turbo watch` to ensure local assets, authentication, and cross-origin flows behave like production. See ADR 0028 — [Portless Local Development](../decisions/0028-portless-local-development.md) for one-time TLS trust steps and the canonical proxy start/stop commands. Avoid POSIX-only script chaining in package.json; prefer safe command chaining at the npm-script level as documented in ADR-0028.

5. Enable Turborepo future flags used by this workflow (e.g., `watchUsingTaskInputs`) in `turbo.json` to stabilize watch semantics and avoid cache misses or false cache hits for watch-triggered runs.

Consequences
------------
- Improved local developer feedback loops: persistent servers remain available while build/codegen tasks rerun on change.
- Task design must account for persistent vs. interruptible semantics. Persistent tasks cannot be depended on by other tasks; use `^build` or explicit package-level orchestration to preserve build ordering.
- Package.json script chaining should avoid POSIX-only separators (`;`) and instead use `&&`/`||` patterns that work on both Unix shells and Windows `cmd.exe` in npm scripts.

Implementation notes
--------------------
- Root `turbo.json` defines `dev` and `start` tasks; `dev` is `persistent: true` and depends on `^build`.
- The root `dev` npm script coordinates proxy lifecycle and `turbo watch` invocation; see ADR-0028 — [Portless Local Development](../decisions/0028-portless-local-development.md) for canonical examples of proxy lifecycle commands and recommended non-privileged mode usage (including the `:1355` example).
- Note: when invoking the repository-local `portless` binary, use `pnpm exec portless ...` so the package manager resolves the local binary instead of relying on a globally installed one.

Alternatives considered
-----------------------
- Shell-only chaining with `;` and `|| true`: rejected due to cross-platform incompatibility on Windows `cmd.exe`.
- Adding a third-party tool to normalize cross-platform shell semantics (e.g., `npm-run-all`): rejected to avoid an additional dependency; the npm scripts provide sufficient expressiveness when written with `&&`/`||`.
- Using small Node wrapper scripts to abstract startup logic: considered but rejected in favor of keeping tooling simple and avoiding extra files unless startup logic becomes more complex.

Follow-ups
----------
- Document the developer workflow in repository README with example `pnpm` commands and recommended `--filter` patterns.
- Add CI checks or guidance to ensure packages that need to be interruptible are configured correctly in `turbo.json`.
