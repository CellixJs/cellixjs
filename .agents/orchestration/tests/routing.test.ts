import { describe, expect, test } from 'vitest';
import { suggestLaneForChangedPaths } from '../lib/orchestration-routing.ts';
import { createTempRepoFixture, repoRoot } from './test-helpers.ts';

describe('orchestration lane suggestion', () => {
	test('suggests the application delivery lane for application package paths', () => {
		const report = suggestLaneForChangedPaths(repoRoot(), ['apps/ui-community/src/App.tsx']);

		expect(report.suggestedLane).toBe('application-feature-delivery');
		expect(report.confidence).toBe('high');
		expect(report.matchedClasses).toContain('applicationPackages');
	});

	test('suggests the docs lane for docs-only paths', () => {
		const report = suggestLaneForChangedPaths(repoRoot(), ['apps/docs/docs/technical-overview/orchestration-workflow.md']);

		expect(report.suggestedLane).toBe('docs-architecture-planning');
		expect(report.confidence).toBe('high');
		expect(report.matchedClasses).toContain('docs');
	});

	test('returns reusable framework candidates without over-claiming a single lane', () => {
		const report = suggestLaneForChangedPaths(repoRoot(), ['packages/cellix/ui-core/src/index.ts']);

		expect(report.suggestedLane).toBeUndefined();
		expect(report.confidence).toBe('medium');
		expect(report.candidateLanes).toContain('reusable-framework-public-surface');
		expect(report.candidateLanes).toContain('reusable-framework-internal');
	});

	test('respects alternate specs when suggesting a lane', () => {
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

		const report = suggestLaneForChangedPaths(fixtureRoot, ['src/features/dashboard.ts']);
		expect(report.suggestedLane).toBe('application-feature-delivery');
		expect(report.matchedClasses).toEqual(['applicationPackages']);
	});

	test('does not suggest disabled lane families even when paths match a class', () => {
		const fixtureRoot = createTempRepoFixture(`version: 1
profile: mixed-framework-and-app
classes:
  reusableFramework:
    include:
      - packages/**
  applicationPackages:
    include:
      - src/**
  tooling:
    include:
      - .agents/**
  docs:
    include:
      - docs/**
overrides:
  disableLaneFamilies:
    - application-delivery
`);

		const report = suggestLaneForChangedPaths(fixtureRoot, ['src/features/dashboard.ts']);
		expect(report.suggestedLane).toBeUndefined();
		expect(report.confidence).toBe('low');
		expect(report.candidateLanes).toEqual([]);
		expect(report.reasons[0]).toContain('disabled or unavailable');
	});
});
