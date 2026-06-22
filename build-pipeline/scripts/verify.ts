#!/usr/bin/env node
/// <reference types="node" />

import { architectureTests, coverageMerge, e2eTests, knipCheck, pnpmAudit, pnpmScript, snykCodeScan, snykDependencyScan, sonarPullRequestAnalysis, sonarQualityGate, verificationSequence } from '@cellix/local-dev/silent-runners';

const snykOrgArgs = ['--org=cellixjs', '--remote-repo-url=https://github.com/CellixJs/cellixjs'];

const cellixVerify = verificationSequence
	.addStep(pnpmScript('format:check'))
	.addStep(architectureTests())
	.addStep(coverageMerge())
	.addStep(e2eTests())
	.addStep(knipCheck())
	.addStep(pnpmAudit({ auditLevel: 'high', dependencyType: 'prod', name: 'audit:prod' }))
	.addStep(pnpmAudit({ auditLevel: 'critical', dependencyType: 'dev', name: 'audit:dev' }))
	.addStep(
		snykDependencyScan({
			args: [...snykOrgArgs, '--policy-path=.snyk', '--file=package.json', '--severity-threshold=high'],
		}),
	)
	.addStep(
		snykCodeScan({
			args: snykOrgArgs,
		}),
	)
	.addStep(sonarPullRequestAnalysis())
	.addStep(sonarQualityGate());

const isRunningAsCommand = import.meta.main;

function runVerifyCommand(): void {
	const result = cellixVerify.run();
	if (result.status !== 0) {
		process.stderr.write(`\nverify failed at step "${result.step.name}" (exit ${result.status})\n`);
	} else {
		process.stdout.write('verify passed\n');
	}
	process.exitCode = result.status;
}

if (isRunningAsCommand) {
	runVerifyCommand();
}
