import type { CommandSequenceStep } from './index.ts';
import { livePnpmScript, pnpmScript } from './pnpm.ts';

/**
 * Runs the repository's architecture test script silently.
 */
export function architectureTests(script = 'test:arch'): CommandSequenceStep {
	return pnpmScript(script);
}

/**
 * Runs the repository's coverage-and-merge script silently.
 */
export function coverageMerge(script = 'test:coverage:merge'): CommandSequenceStep {
	return pnpmScript(script);
}

/**
 * Runs the repository's e2e test script with live output.
 */
export function e2eTests(script = 'test:e2e'): CommandSequenceStep {
	return livePnpmScript(script);
}
