import type { SpawnSyncOptionsWithStringEncoding, SpawnSyncReturns } from 'node:child_process';
import {
	architectureTests,
	coverageMerge,
	e2eTests,
	knipCheck,
	pnpmAudit,
	pnpmScript,
	runSilentCommand,
	runSilentCommandSequence,
	type SilentRunnerSpawnSync,
	snykCodeScan,
	snykDependencyScan,
	sonarPullRequestAnalysis,
	sonarQualityGate,
} from '@cellix/local-dev/silent-runners';
import { describe, expect, it } from 'vitest';

function createVerifySpawn(options: { failStep?: string } = {}) {
	const calls: Array<{ args: string[]; command: string; stdio: SpawnSyncOptionsWithStringEncoding['stdio'] }> = [];
	const spawn = (command: string, args: string[], spawnOptions: SpawnSyncOptionsWithStringEncoding): SpawnSyncReturns<string> => {
		const stepName = getStepName(command, args);
		calls.push({
			args,
			command,
			stdio: spawnOptions.stdio,
		});

		return {
			output: [`${stepName} stdout`, '', ''],
			pid: 123,
			signal: null,
			status: options.failStep === stepName ? 9 : 0,
			stderr: `${stepName} stderr\n`,
			stdout: `${stepName} stdout\n`,
		};
	};

	return { calls, spawn };
}

function getStepName(command: string, args: string[]): string {
	if (command === 'pnpm' && args[0] === 'run' && args[1]) {
		return args[1];
	}

	if (command === 'pnpm' && args[0] === 'audit') {
		return args.includes('--prod') ? 'audit:prod' : 'audit:dev';
	}

	if (command === 'pnpm' && args[0] === 'exec' && args[1] === 'knip') {
		return 'knip';
	}

	if (command === 'pnpm' && args[0] === 'exec' && args[1] === 'snyk' && args[2] === 'test') {
		return 'snyk:test';
	}

	if (command === 'pnpm' && args[0] === 'exec' && args[1] === 'snyk' && args[2] === 'code' && args[3] === 'test') {
		return 'snyk:code';
	}

	return command;
}

describe('@cellix/local-dev/silent-runners', () => {
	it('keeps successful local verification commands silent', () => {
		const output = {
			stderr: '',
			stdout: '',
		};
		const spawn: SilentRunnerSpawnSync = (command, args, options) => {
			expect(command).toBe('snyk');
			expect(args).toEqual(['test']);
			expect(options.stdio).toBe('pipe');
			return {
				output: ['tool output', '', ''],
				pid: 123,
				signal: null,
				status: 0,
				stderr: 'hidden success stderr',
				stdout: 'hidden success stdout',
			};
		};

		const result = runSilentCommand({
			args: ['test'],
			command: 'snyk',
			spawn,
			streams: {
				stderr: {
					write: (chunk: string) => {
						output.stderr += chunk;
						return true;
					},
				},
				stdout: {
					write: (chunk: string) => {
						output.stdout += chunk;
						return true;
					},
				},
			},
		});

		expect(result).toMatchObject({
			status: 0,
			stderr: 'hidden success stderr',
			stdout: 'hidden success stdout',
		});
		expect(output).toEqual({
			stderr: '',
			stdout: '',
		});
	});

	it('replays local verification command output when a command fails', () => {
		const output = {
			stderr: '',
			stdout: '',
		};
		const spawn: SilentRunnerSpawnSync = () => ({
			output: ['tool output', '', ''],
			pid: 123,
			signal: null,
			status: 2,
			stderr: 'failure stderr',
			stdout: 'failure stdout',
		});

		const result = runSilentCommand({
			args: ['code', 'test'],
			command: 'snyk',
			spawn,
			streams: {
				stderr: {
					write: (chunk: string) => {
						output.stderr += chunk;
						return true;
					},
				},
				stdout: {
					write: (chunk: string) => {
						output.stdout += chunk;
						return true;
					},
				},
			},
		});

		expect(result.status).toBe(2);
		expect(output).toEqual({
			stderr: 'failure stderr',
			stdout: 'failure stdout',
		});
	});

	it('keeps the verify sequence silent except for e2e passthrough steps', () => {
		const { calls, spawn } = createVerifySpawn();
		const output = { stderr: '', stdout: '' };
		const steps = [
			pnpmScript('format:check'),
			architectureTests(),
			coverageMerge(),
			e2eTests(),
			knipCheck(),
			pnpmAudit({ auditLevel: 'high', dependencyType: 'prod', name: 'audit:prod' }),
			pnpmAudit({ auditLevel: 'critical', dependencyType: 'dev', name: 'audit:dev' }),
			snykDependencyScan({ args: ['--all-projects'] }),
			snykCodeScan(),
			sonarPullRequestAnalysis(),
			sonarQualityGate(),
		];

		const result = runSilentCommandSequence({
			spawn,
			steps,
			streams: {
				stderr: {
					write: (chunk: string) => {
						output.stderr += chunk;
						return true;
					},
				},
				stdout: {
					write: (chunk: string) => {
						output.stdout += chunk;
						return true;
					},
				},
			},
		});

		expect(result.status).toBe(0);
		expect(output).toEqual({ stderr: '', stdout: '' });
		expect(calls.map((call) => getStepName(call.command, call.args))).toEqual(steps.map((step) => step.name));
		expect(calls).toEqual(
			steps.map((step) => ({
				args: step.args ?? [],
				command: step.command,
				stdio: step.output === 'inherit' ? 'inherit' : 'pipe',
			})),
		);
	});

	it('replays output from the failing silent verify step and stops before later work', () => {
		const { calls, spawn } = createVerifySpawn({ failStep: 'snyk:code' });
		const output = { stderr: '', stdout: '' };
		const steps = [
			pnpmScript('format:check'),
			architectureTests(),
			coverageMerge(),
			e2eTests(),
			knipCheck(),
			pnpmAudit({ auditLevel: 'high', dependencyType: 'prod', name: 'audit:prod' }),
			pnpmAudit({ auditLevel: 'critical', dependencyType: 'dev', name: 'audit:dev' }),
			snykDependencyScan({ args: ['--all-projects'] }),
			snykCodeScan(),
			sonarPullRequestAnalysis(),
			sonarQualityGate(),
		];

		const result = runSilentCommandSequence({
			spawn,
			steps,
			streams: {
				stderr: {
					write: (chunk: string) => {
						output.stderr += chunk;
						return true;
					},
				},
				stdout: {
					write: (chunk: string) => {
						output.stdout += chunk;
						return true;
					},
				},
			},
		});

		expect(result.status).toBe(9);
		expect(result.step.name).toBe('snyk:code');
		expect(output).toEqual({
			stderr: 'snyk:code stderr\n',
			stdout: 'snyk:code stdout\n',
		});
		expect(calls.map((call) => getStepName(call.command, call.args))).toEqual(['format:check', 'test:arch', 'test:coverage:merge', 'test:e2e', 'knip', 'audit:prod', 'audit:dev', 'snyk:test', 'snyk:code']);
	});
});
