import { describe, expect, test } from 'vitest';
import { bootstrapOrchestrationSession } from '../lib/orchestration-bootstrap.ts';
import { createTempRepoFixture } from './test-helpers.ts';

describe('orchestration bootstrap', () => {
	test('bootstraps a clean tooling task directly into planning', () => {
		const fixtureRoot = createTempRepoFixture();
		const report = bootstrapOrchestrationSession(fixtureRoot, {
			changedPaths: ['.agents/orchestration/tests/runtime.test.ts'],
			sessionId: 'bootstrap-tooling',
		});

		expect(report.selectedLane).toBe('tooling-workflow');
		expect(report.requiresLaneDecision).toBe(false);
		expect(report.shouldSplitPhases).toBe(false);
		expect(report.session?.state).toBe('planning');
		expect(report.planningTransition?.allowed).toBe(true);
	});

	test('classifies directory-style application paths during bootstrap', () => {
		const fixtureRoot = createTempRepoFixture();
		const report = bootstrapOrchestrationSession(fixtureRoot, {
			changedPaths: ['apps/server-oauth2-mock'],
			sessionId: 'bootstrap-app-directory',
		});

		expect(report.matchedClasses).toContain('applicationPackages');
		expect(report.selectedLane).toBe('application-feature-delivery');
		expect(report.requiresLaneDecision).toBe(false);
		expect(report.session?.state).toBe('planning');
	});

	test('returns split guidance for mixed framework and application paths without starting a session', () => {
		const fixtureRoot = createTempRepoFixture();
		const report = bootstrapOrchestrationSession(fixtureRoot, {
			changedPaths: ['apps/server-oauth2-mock/src/index.ts', 'packages/cellix/server-oauth2-mock-seedwork/src/index.ts'],
			sessionId: 'bootstrap-mixed',
		});

		expect(report.requiresLaneDecision).toBe(true);
		expect(report.shouldSplitPhases).toBe(true);
		expect(report.session).toBeUndefined();
		expect(report.nextActions.some((action) => action.includes('Split the work into bounded phases'))).toBe(true);
	});

	test('allows explicit phase bootstrap for one lane when mixed paths require a split', () => {
		const fixtureRoot = createTempRepoFixture();
		const report = bootstrapOrchestrationSession(fixtureRoot, {
			changedPaths: ['apps/server-oauth2-mock/src/index.ts', 'packages/cellix/server-oauth2-mock-seedwork/src/index.ts'],
			sessionId: 'bootstrap-framework-phase',
			lane: 'reusable-framework-public-surface',
		});

		expect(report.selectedLane).toBe('reusable-framework-public-surface');
		expect(report.shouldSplitPhases).toBe(true);
		expect(report.session?.state).toBe('planning');
		expect(report.recommendedFrameworkExtensions).toContain('cellix-tdd');
	});

	test('respects alternate repo specs when resolving framework extensions', () => {
		const fixtureRoot = createTempRepoFixture(`version: 1
profile: application-only
classes:
  reusableFramework:
    include: []
  applicationPackages:
    include:
      - src/**
  tooling:
    include:
      - .agents/**
  docs:
    include:
      - docs/**
`);

		const report = bootstrapOrchestrationSession(fixtureRoot, {
			changedPaths: ['src/feature.ts'],
			sessionId: 'bootstrap-app-only',
		});

		expect(report.selectedLane).toBe('application-feature-delivery');
		expect(report.activeFrameworkExtensions).toEqual([]);
		expect(report.recommendedFrameworkExtensions).toEqual([]);
	});
});
