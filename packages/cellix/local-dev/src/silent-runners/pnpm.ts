import type { CommandOutputMode, CommandSequenceStep } from './index.ts';

export interface PnpmScriptOptions {
	name?: string;
	output?: CommandOutputMode;
}

/**
 * Runs a package-manager script.
 *
 * Use this for project-owned scripts whose internals should remain delegated to
 * the consuming repository.
 */
export function pnpmScript(script: string, options: PnpmScriptOptions = {}): CommandSequenceStep {
	return {
		args: ['run', script],
		command: 'pnpm',
		name: options.name ?? script,
		...(options.output ? { output: options.output } : {}),
	};
}

/**
 * Runs a package-manager script with live output.
 */
export function livePnpmScript(script: string, options: Omit<PnpmScriptOptions, 'output'> = {}): CommandSequenceStep {
	return pnpmScript(script, {
		...options,
		output: 'inherit',
	});
}
