# @cellix/local-dev

Local developer wrappers for Cellix verification commands.

This package is intentionally small on this branch. Other pull requests add
additional local-development modules to the same package; this change owns only
the silent command runner export and its portable tool wrappers.

## Install

In this monorepo, consumers use the workspace package directly:

```json
{
	"devDependencies": {
		"@cellix/local-dev": "workspace:*"
	}
}
```

## Silent Runners

`runSilentCommand` captures stdout and stderr while a command is running. If the
command succeeds, nothing is printed. If it fails, whatever the command wrote to
stdout and stderr is replayed before the failing status is returned.

```js
import { runSilentCommand } from '@cellix/local-dev/silent-runners';

const result = runSilentCommand({
	command: 'snyk',
	args: ['test', '--all-projects'],
});

process.exitCode = result.status;
```

Use `runSilentCommandSequence` when a wrapper needs to run several commands in
order. Steps are silent by default; mark steps such as e2e or acceptance suites
with `output: 'inherit'` when their live runner output should remain visible.

```js
import { runSilentCommandSequence } from '@cellix/local-dev/silent-runners';

const result = runSilentCommandSequence({
	steps: [
		{ name: 'format:check', command: 'pnpm', args: ['run', 'format:check'] },
		{ name: 'test:e2e', command: 'pnpm', args: ['run', 'test:e2e'], output: 'inherit' },
	],
});

process.exitCode = result.status;
```

Prefer the named tool wrappers when a command has a known CLI shape:

```js
import { knipCheck, pnpmAudit, runSilentCommandSequence, snykCodeScan, snykDependencyScan } from '@cellix/local-dev/silent-runners';

const result = runSilentCommandSequence({
	steps: [
		knipCheck(),
		pnpmAudit({ auditLevel: 'high', dependencyType: 'prod' }),
		snykDependencyScan({ args: ['--all-projects', '--org=my-org'] }),
		snykCodeScan({ args: ['--org=my-org'] }),
	],
});
```

## Public API

Exports are available from `@cellix/local-dev` and
`@cellix/local-dev/silent-runners`:

- `runSilentCommand`
- `runSilentCommandSequence`
- `CommandOutputMode`
- `CommandSequenceStep`
- `architectureTests`
- `coverageMerge`
- `e2eTests`
- `knipCheck`
- `livePnpmScript`
- `pnpmAudit`
- `pnpmScript`
- `SilentCommandOptions`
- `SilentCommandResult`
- `SilentCommandSequenceOptions`
- `SilentCommandSequenceResult`
- `SilentRunnerSpawnSync`
- `SilentRunnerStreams`
- `snykCodeScan`
- `snykDependencyScan`
- `snykIacScan`
- `sonarPullRequestAnalysis`
- `sonarQualityGate`

## Notes

- Tool wrappers encode reusable CLI shape; scripts still own project-specific arguments such as org names, paths, and CI policy.
- Success is silent; failure replays whatever the command wrote to stdout/stderr.
- Commands run without shell interpolation. Pass the executable as `command` and arguments as `args`.
