import type { CommandSequenceStep } from './index.ts';
import { pnpmScript } from './pnpm.ts';

export interface SonarScriptOptions {
	script?: string;
}

/**
 * Runs a repository-owned Sonar pull-request analysis script.
 *
 * The PR-number and branch-resolution policy is intentionally delegated to the
 * consuming repository because those details vary by CI provider.
 */
export function sonarPullRequestAnalysis(options: SonarScriptOptions = {}): CommandSequenceStep {
	return pnpmScript(options.script ?? 'sonar:pr', {
		name: 'sonar:pr',
	});
}

/**
 * Runs a repository-owned Sonar quality-gate script.
 */
export function sonarQualityGate(options: SonarScriptOptions = {}): CommandSequenceStep {
	return pnpmScript(options.script ?? 'check-sonar', {
		name: 'check-sonar',
	});
}
