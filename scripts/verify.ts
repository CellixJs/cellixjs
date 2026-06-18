#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import {
	architectureTests,
	coverageMerge,
	e2eTests,
	knipCheck,
	pnpmAudit,
	pnpmScript,
	runSilentCommandSequence,
	type SilentCommandSequenceOptions,
	type SilentCommandSequenceResult,
	snykCodeScan,
	snykDependencyScan,
	sonarPullRequestAnalysis,
	sonarQualityGate,
} from '@cellix/local-dev/silent-runners';

const SNYK_ORG_ARGS = ['--org=cellixjs', '--remote-repo-url=https://github.com/CellixJs/cellixjs'];

export const CELLIX_VERIFY_STEPS = [
	pnpmScript('format:check'),
	architectureTests(),
	coverageMerge(),
	e2eTests(),
	knipCheck(),
	pnpmAudit({ auditLevel: 'high', dependencyType: 'prod', name: 'audit:prod' }),
	pnpmAudit({ auditLevel: 'critical', dependencyType: 'dev', name: 'audit:dev' }),
	snykDependencyScan({
		args: [...SNYK_ORG_ARGS, '--policy-path=.snyk', '--file=package.json', '--severity-threshold=high'],
	}),
	snykCodeScan({
		args: SNYK_ORG_ARGS,
	}),
	sonarPullRequestAnalysis(),
	sonarQualityGate(),
];

export type CellixVerifyOptions = Omit<SilentCommandSequenceOptions, 'steps'>;

export function runCellixVerify(options: CellixVerifyOptions = {}): SilentCommandSequenceResult {
	return runSilentCommandSequence({
		...options,
		steps: CELLIX_VERIFY_STEPS,
	});
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const result = runCellixVerify();
	if (result.status !== 0) {
		process.stderr.write(`\nverify failed at step "${result.step.name}" (exit ${result.status})\n`);
	}
	process.exitCode = result.status;
}
