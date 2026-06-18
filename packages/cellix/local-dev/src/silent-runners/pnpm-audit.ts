import type { CommandSequenceStep } from './index.ts';

export interface PnpmAuditOptions {
	auditLevel: 'low' | 'moderate' | 'high' | 'critical';
	dependencyType: 'prod' | 'dev';
	name?: string;
}

/**
 * Runs `pnpm audit` for one dependency class and audit threshold.
 */
export function pnpmAudit(options: PnpmAuditOptions): CommandSequenceStep {
	return {
		args: ['audit', `--audit-level=${options.auditLevel}`, `--${options.dependencyType}`],
		command: 'pnpm',
		name: options.name ?? `audit:${options.dependencyType}`,
	};
}
