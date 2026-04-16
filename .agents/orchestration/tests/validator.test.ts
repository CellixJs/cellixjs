import { describe, expect, test } from 'vitest';
import { validateRepoConfiguration } from '../lib/orchestration-validator.ts';
import { createTempRepoFixture, repoRoot, writeFixtureFile } from './test-helpers.ts';

describe('orchestration validator', () => {
	test('passes for the current repo configuration', () => {
		const report = validateRepoConfiguration(repoRoot());
		expect(report.ok).toBe(true);
		expect(report.errors).toHaveLength(0);
	});

	test('passes for framework-only and application-only example specs', () => {
		const frameworkOnlyReport = validateRepoConfiguration(repoRoot(), {
			specPath: '.agents/orchestration/examples/framework-only.orchestration.spec.yaml',
		});
		const applicationOnlyReport = validateRepoConfiguration(repoRoot(), {
			specPath: '.agents/orchestration/examples/application-only.orchestration.spec.yaml',
		});

		expect(frameworkOnlyReport.ok).toBe(true);
		expect(frameworkOnlyReport.errors).toHaveLength(0);
		expect(applicationOnlyReport.ok).toBe(true);
		expect(applicationOnlyReport.errors).toHaveLength(0);
	});

	test('fails when application-only enables cellix-tdd', () => {
		const fixtureRoot = createTempRepoFixture(`
version: 1
profile: application-only
classes:
  reusableFramework:
    include: []
  applicationPackages:
    include:
      - apps/**
  tooling:
    include:
      - .agents/**
  docs:
    include:
      - docs/**
overrides:
  frameworkExtensions:
    enable:
      - cellix-tdd
`);

		const report = validateRepoConfiguration(fixtureRoot);
		expect(report.ok).toBe(false);
		expect(report.errors.some((issue) => issue.code === 'framework-extension-in-application-only')).toBe(true);
	});

	test('fails when a required hook script is missing', () => {
		const fixtureRoot = createTempRepoFixture();
		writeFixtureFile(
			fixtureRoot,
			'.agents/orchestration/hooks/hook-manifest.json',
			JSON.stringify(
				{
					version: 1,
					hooks: {
						transition: {
							script: '.agents/orchestration/cli/missing.ts',
							subcommand: 'transition',
							description: 'broken hook',
						},
					},
				},
				null,
				2,
			),
		);

		const report = validateRepoConfiguration(fixtureRoot);
		expect(report.ok).toBe(false);
		expect(report.errors.some((issue) => issue.code === 'missing-hook-script')).toBe(true);
	});
});
