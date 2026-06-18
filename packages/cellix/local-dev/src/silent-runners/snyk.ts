import type { CommandSequenceStep } from './index.ts';

export interface SnykScanOptions {
	args?: string[];
	name?: string;
}

/**
 * Runs Snyk dependency scanning (`snyk test`).
 */
export function snykDependencyScan(options: SnykScanOptions = {}): CommandSequenceStep {
	return {
		args: ['exec', 'snyk', 'test', ...(options.args ?? [])],
		command: 'pnpm',
		name: options.name ?? 'snyk:test',
	};
}

/**
 * Runs Snyk code scanning (`snyk code test`).
 */
export function snykCodeScan(options: SnykScanOptions = {}): CommandSequenceStep {
	return {
		args: ['exec', 'snyk', 'code', 'test', ...(options.args ?? [])],
		command: 'pnpm',
		name: options.name ?? 'snyk:code',
	};
}

/**
 * Runs Snyk IaC scanning (`snyk iac test`).
 */
export function snykIacScan(targets: string[] = [], options: SnykScanOptions = {}): CommandSequenceStep {
	return {
		args: ['exec', 'snyk', 'iac', 'test', ...targets, ...(options.args ?? [])],
		command: 'pnpm',
		name: options.name ?? 'snyk:iac',
	};
}
