import type { CommandSequenceStep } from './index.ts';

/**
 * Runs Knip unused-code/dependency analysis.
 */
export function knipCheck(): CommandSequenceStep {
	return {
		args: ['exec', 'knip'],
		command: 'pnpm',
		name: 'knip',
	};
}
