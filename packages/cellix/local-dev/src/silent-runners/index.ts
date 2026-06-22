import { type SpawnSyncOptionsWithStringEncoding, type SpawnSyncReturns, spawnSync } from 'node:child_process';

const DEFAULT_MAX_BUFFER_BYTES = 64 * 1024 * 1024;

export { knipCheck } from './knip.ts';
export { livePnpmScript, type PnpmScriptOptions, pnpmScript } from './pnpm.ts';
export { type PnpmAuditOptions, pnpmAudit } from './pnpm-audit.ts';
export { type SnykScanOptions, snykCodeScan, snykDependencyScan, snykIacScan } from './snyk.ts';
export { type SonarScriptOptions, sonarPullRequestAnalysis, sonarQualityGate } from './sonar.ts';
export { architectureTests, coverageMerge, e2eTests } from './test-runners.ts';

/**
 * Spawn function used by silent command runners.
 *
 * Consumers usually rely on the default `child_process.spawnSync`; tests and
 * advanced wrappers can inject this to observe command execution without
 * running the external tool.
 */
export type SilentRunnerSpawnSync = (command: string, args: string[], options: SpawnSyncOptionsWithStringEncoding) => SpawnSyncReturns<string>;

/**
 * Writable stream surface used when replaying captured output after a command
 * fails.
 */
export interface SilentRunnerStreams {
	/** Stream that receives captured stdout when the command fails. */
	stdout?: Pick<NodeJS.WriteStream, 'write'>;
	/** Stream that receives captured stderr when the command fails. */
	stderr?: Pick<NodeJS.WriteStream, 'write'>;
}

/**
 * Options for running an external command silently until failure.
 */
export interface SilentCommandOptions {
	/** Executable name. */
	command: string;
	/** Command-line arguments passed without shell interpolation. */
	args?: string[];
	/** Working directory for the command. Defaults to the current process cwd. */
	cwd?: string;
	/** Environment to pass to the command. Defaults to the current process env. */
	env?: NodeJS.ProcessEnv;
	/** Process spawner used by tests and advanced consumers. Defaults to `child_process.spawnSync`. */
	spawn?: SilentRunnerSpawnSync;
	/** Streams used when replaying captured failure output. Defaults to `process.stdout` and `process.stderr`. */
	streams?: SilentRunnerStreams;
}

/**
 * How a command in a verification sequence should handle output.
 */
export type CommandOutputMode = 'silent' | 'inherit';

/**
 * One command in a verification sequence.
 */
export interface CommandSequenceStep {
	/** Human-readable step name for tests and orchestration logs. */
	name: string;
	/** Executable name. */
	command: string;
	/** Command-line arguments passed without shell interpolation. */
	args?: string[];
	/** Output policy for this step. Defaults to `silent`. */
	output?: CommandOutputMode;
}

/**
 * Options for running a verification sequence.
 */
export interface SilentCommandSequenceOptions {
	/** Steps to run in order until one fails. */
	steps: CommandSequenceStep[];
	/** Working directory for each command. Defaults to the current process cwd. */
	cwd?: string;
	/** Environment to pass to each command. Defaults to the current process env. */
	env?: NodeJS.ProcessEnv;
	/** Process spawner used by tests and advanced consumers. Defaults to `child_process.spawnSync`. */
	spawn?: SilentRunnerSpawnSync;
	/** Streams used when replaying captured failure output. Defaults to `process.stdout` and `process.stderr`. */
	streams?: SilentRunnerStreams;
}

interface CommandSequenceContext {
	cwd: string | undefined;
	env: NodeJS.ProcessEnv | undefined;
	spawn: SilentRunnerSpawnSync | undefined;
	streams: SilentRunnerStreams | undefined;
}

/**
 * Result returned by a silent command runner.
 */
export interface SilentCommandResult {
	/** Exit status reported by the child process. */
	status: number;
	/** Signal reported by the child process, when it was terminated by a signal. */
	signal: NodeJS.Signals | null;
	/** Captured stdout. This is replayed only when the command fails. */
	stdout: string;
	/** Captured stderr. This is replayed only when the command fails. */
	stderr: string;
	/** Spawn error, such as an executable that could not be found. */
	error?: Error;
}

/**
 * Result returned by a command sequence.
 */
export interface SilentCommandSequenceResult extends SilentCommandResult {
	/** Step that produced the returned status. */
	step: CommandSequenceStep;
}

export type VerificationSequenceOptions = Omit<SilentCommandSequenceOptions, 'steps'>;

/**
 * Runs a command with stdout and stderr captured instead of inherited.
 *
 * Successful commands produce no terminal output. Failed commands replay their
 * captured stdout and stderr so local verification stays quiet when healthy and
 * still shows whatever the command wrote when something breaks.
 *
 * @param options - Command, arguments, process context, and optional test seams.
 * @returns The child-process result with captured output and normalized status.
 *
 * @example
 * ```ts
 * import { runSilentCommand } from '@cellix/local-dev/silent-runners';
 *
 * const result = runSilentCommand({
 *   command: 'snyk',
 *   args: ['test', '--all-projects'],
 * });
 *
 * process.exitCode = result.status;
 * ```
 */
export function runSilentCommand(options: SilentCommandOptions): SilentCommandResult {
	const {
		args = [],
		command,
		cwd,
		env,
		spawn = spawnCommandSync,
		streams = {
			stderr: process.stderr,
			stdout: process.stdout,
		},
	} = options;
	const result = spawn(command, args, {
		cwd,
		encoding: 'utf8',
		env,
		maxBuffer: DEFAULT_MAX_BUFFER_BYTES,
		stdio: 'pipe',
	});
	const normalizedResult = toSilentCommandResult(result);

	if (normalizedResult.status !== 0) {
		replayFailureOutput(normalizedResult, streams);
	}

	return normalizedResult;
}

/**
 * Runs commands in order, stopping at the first failure.
 *
 * Steps default to silent output. Use `output: 'inherit'` only when live output
 * is part of the command's intended consumer experience.
 *
 * @param options - Sequence steps and optional process context.
 * @returns The final successful step result or the first failing step result.
 */
export function runSilentCommandSequence(options: SilentCommandSequenceOptions): SilentCommandSequenceResult {
	const { cwd, env, spawn, steps, streams } = options;
	if (steps.length === 0) {
		throw new Error('runSilentCommandSequence requires at least one step');
	}

	let lastResult: SilentCommandSequenceResult | undefined;

	for (const step of steps) {
		const context: CommandSequenceContext = { cwd, env, spawn, streams };
		const result = step.output === 'inherit' ? runInheritedCommand(buildCommandOptions(step, context)) : runSilentCommand(buildCommandOptions(step, context));
		lastResult = {
			...result,
			step,
		};

		if (result.status !== 0) {
			return lastResult;
		}
	}

	if (!lastResult) {
		throw new Error('runSilentCommandSequence requires at least one step');
	}

	return lastResult;
}

/**
 * Fluent builder for an ordered sequence of verification commands.
 *
 * Steps execute in insertion order and stop at the first failure. The sequence
 * can be configured once with shared process options and run repeatedly.
 *
 * @example
 * ```ts
 * const verify = verificationSequence
 *   .addStep(pnpmScript('format:check'))
 *   .addStep(pnpmScript('test'));
 *
 * const result = verify.run();
 * process.exitCode = result.status;
 * ```
 */
export class VerificationSequence {
	readonly #options: VerificationSequenceOptions;
	readonly #steps: CommandSequenceStep[];

	constructor(options: VerificationSequenceOptions = {}, steps: CommandSequenceStep[] = []) {
		this.#options = options;
		this.#steps = steps;
	}

	/**
	 * Appends a command to the sequence.
	 *
	 * @param step - Command descriptor to execute after previously added steps.
	 * @returns A new sequence containing the appended step.
	 */
	addStep(step: CommandSequenceStep): VerificationSequence {
		return new VerificationSequence(this.#options, [...this.#steps, step]);
	}

	/**
	 * Runs the configured steps in insertion order.
	 *
	 * Per-run options override options supplied when the sequence was created.
	 *
	 * @param options - Optional process context and test seams for this run.
	 * @returns The final successful result or the first failing step result.
	 * @throws When the sequence has no steps.
	 */
	run(options: VerificationSequenceOptions = {}): SilentCommandSequenceResult {
		return runSilentCommandSequence({
			...this.#options,
			...options,
			steps: [...this.#steps],
		});
	}
}

/**
 * Empty reusable verification sequence for fluent workflow definitions.
 *
 * Adding a step returns a new sequence, so this shared object remains empty and
 * can safely be reused by multiple consumers.
 */
export const verificationSequence = new VerificationSequence();

function runInheritedCommand(options: SilentCommandOptions): SilentCommandResult {
	const { args = [], command, cwd, env, spawn = spawnCommandSync } = options;
	return toSilentCommandResult(
		spawn(command, args, {
			cwd,
			encoding: 'utf8',
			env,
			stdio: 'inherit',
		}),
	);
}

function buildCommandOptions(step: CommandSequenceStep, options: CommandSequenceContext): SilentCommandOptions {
	return {
		...(step.args ? { args: step.args } : {}),
		...(options.cwd ? { cwd: options.cwd } : {}),
		...(options.env ? { env: options.env } : {}),
		...(options.spawn ? { spawn: options.spawn } : {}),
		...(options.streams ? { streams: options.streams } : {}),
		command: step.command,
	};
}

function toSilentCommandResult(result: SpawnSyncReturns<string>): SilentCommandResult {
	return {
		...(result.error ? { error: result.error } : {}),
		signal: result.signal,
		status: result.status ?? 1,
		stderr: result.stderr ?? '',
		stdout: result.stdout ?? '',
	};
}

function spawnCommandSync(command: string, args: string[], options: SpawnSyncOptionsWithStringEncoding): SpawnSyncReturns<string> {
	return spawnSync(command, args, {
		...options,
		encoding: 'utf8',
	});
}

function replayFailureOutput(result: SilentCommandResult, streams: SilentRunnerStreams): void {
	streams.stdout?.write(result.stdout);
	streams.stderr?.write(result.stderr);
	if (result.error) {
		streams.stderr?.write(`${result.error.message}\n`);
	}
}
