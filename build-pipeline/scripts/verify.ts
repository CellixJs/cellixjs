#!/usr/bin/env node
/// <reference types="node" />

import { architectureTests, coverageMerge, e2eTests, knipCheck, pnpmAudit, pnpmScript, snykCodeScan, snykDependencyScan, sonarPullRequestAnalysis, sonarQualityGate, verificationSequence } from '@cellix/local-dev/silent-runners';

const snykOrgArgs = ['--org=cellixjs', '--remote-repo-url=https://github.com/CellixJs/cellixjs'];
const snykDependencyArgs = [...snykOrgArgs, '--all-projects', '--policy-path=.snyk', '--exclude=dist,build,.turbo,coverage,.agents-work,.agents,.claude,.github,requirements.txt'];

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
			args: snykDependencyArgs,
		}),
	)
	.addStep(
		snykCodeScan({
			args: snykOrgArgs,
		}),
	)
	.addStep(sonarPullRequestAnalysis())
	.addStep(sonarQualityGate());

function runVerifyCommand(): void {
	const result = cellixVerify.run();
	if (result.status === 0) {
		process.stdout.write('verify passed\n');
	}
	process.exitCode = result.status;
}

runVerifyCommand();
