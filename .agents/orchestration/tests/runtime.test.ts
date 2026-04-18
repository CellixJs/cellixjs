import { writeFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { buildSessionArtifactPaths, buildSessionCheckpointPaths } from '../lib/orchestration-loader.ts';
import { completeSession, createSession, handoffPhase, transitionSession } from '../lib/orchestration-runtime.ts';
import { createTempRepoFixture } from './test-helpers.ts';

describe('orchestration runtime', () => {
	test('initializes a session and applies a valid transition', () => {
		const fixtureRoot = createTempRepoFixture();
		const session = createSession(fixtureRoot, {
			sessionId: 'demo',
			lane: 'tooling-workflow',
			role: 'orchestrator',
		});

		expect(session.state).toBe('initialized');

		const { result, session: updatedSession } = transitionSession(fixtureRoot, {
			sessionId: 'demo',
			role: 'orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'evt-1',
		});

		expect(result.allowed).toBe(true);
		expect(updatedSession?.state).toBe('planning');
	});

	test('treats duplicate events as idempotent', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'dup',
			lane: 'tooling-workflow',
			role: 'orchestrator',
		});

		const first = transitionSession(fixtureRoot, {
			sessionId: 'dup',
			role: 'orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'same-event',
		});
		const second = transitionSession(fixtureRoot, {
			sessionId: 'dup',
			role: 'orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'same-event',
		});

		expect(first.result.allowed).toBe(true);
		expect(second.result.allowed).toBe(true);
		expect(second.session?.transitionHistory).toHaveLength(1);
	});

	test('blocks invalid state transitions with guidance', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'bad-transition',
			lane: 'tooling-workflow',
			role: 'orchestrator',
		});

		const { result } = transitionSession(fixtureRoot, {
			sessionId: 'bad-transition',
			role: 'orchestrator',
			toState: 'implementing',
			evidence: ['implementation-owner-recorded'],
			eventId: 'evt-invalid',
		});

		expect(result.allowed).toBe(false);
		expect(result.code).toBe('invalid-transition');
		expect(result.guidance[1]).toContain('planning');
	});

	test('requires plan artifact before transitioning to plan-complete', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'missing-plan-artifact',
			lane: 'tooling-workflow',
			role: 'orchestrator',
			changedPaths: ['.agents/orchestration/lib/orchestration-runtime.ts'],
		});

		transitionSession(fixtureRoot, {
			sessionId: 'missing-plan-artifact',
			role: 'orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'evt-plan',
		});

		const { result } = transitionSession(fixtureRoot, {
			sessionId: 'missing-plan-artifact',
			role: 'orchestrator',
			toState: 'plan-complete',
			evidence: ['bounded-plan', 'phase-owner-recorded'],
			eventId: 'evt-plan-complete',
		});

		expect(result.allowed).toBe(false);
		expect(result.code).toBe('missing-artifact');
		expect(result.guidance[1]).toContain('plan.md');
	});

	test('allows retry after a missing plan artifact once the canonical plan exists', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'plan-artifact-present',
			lane: 'tooling-workflow',
			role: 'orchestrator',
			changedPaths: ['.agents/orchestration/lib/orchestration-runtime.ts'],
		});

		transitionSession(fixtureRoot, {
			sessionId: 'plan-artifact-present',
			role: 'orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'evt-plan',
		});

		const deniedAttempt = transitionSession(fixtureRoot, {
			sessionId: 'plan-artifact-present',
			role: 'orchestrator',
			toState: 'plan-complete',
			evidence: ['bounded-plan', 'phase-owner-recorded'],
			eventId: 'evt-plan-complete',
		});
		expect(deniedAttempt.result.allowed).toBe(false);

		writeFileSync(buildSessionArtifactPaths(fixtureRoot, 'plan-artifact-present').plan, '# Plan\n', 'utf8');

		const { result, session } = transitionSession(fixtureRoot, {
			sessionId: 'plan-artifact-present',
			role: 'orchestrator',
			toState: 'plan-complete',
			evidence: ['bounded-plan', 'phase-owner-recorded'],
			eventId: 'evt-plan-complete',
		});

		expect(result.allowed).toBe(true);
		expect(session?.state).toBe('plan-complete');
	});

	test('handoff implementing auto-promotes planning once the plan checkpoint exists', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'handoff-implementing',
			lane: 'application-feature-delivery',
			role: 'orchestrator',
		});

		transitionSession(fixtureRoot, {
			sessionId: 'handoff-implementing',
			role: 'orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'evt-plan',
		});
		writeFileSync(buildSessionArtifactPaths(fixtureRoot, 'handoff-implementing').plan, '# Plan\n', 'utf8');

		const { result, session } = handoffPhase(fixtureRoot, {
			sessionId: 'handoff-implementing',
			role: 'orchestrator',
			phase: 'implementing',
			owner: 'implementor',
		});

		expect(result.allowed).toBe(true);
		expect(result.code).toBe('phase-ready');
		expect(session?.state).toBe('implementing');
	});

	test('handoff reviewing requires implementation result checkpoint', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'handoff-reviewing',
			lane: 'application-feature-delivery',
			role: 'orchestrator',
		});

		transitionSession(fixtureRoot, {
			sessionId: 'handoff-reviewing',
			role: 'orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'evt-plan',
		});
		writeFileSync(buildSessionArtifactPaths(fixtureRoot, 'handoff-reviewing').plan, '# Plan\n', 'utf8');
		handoffPhase(fixtureRoot, {
			sessionId: 'handoff-reviewing',
			role: 'orchestrator',
			phase: 'implementing',
			owner: 'implementor',
		});

		const blockedReview = handoffPhase(fixtureRoot, {
			sessionId: 'handoff-reviewing',
			role: 'orchestrator',
			phase: 'reviewing',
			owner: 'reviewer',
		});
		expect(blockedReview.result.allowed).toBe(false);
		expect(blockedReview.result.code).toBe('missing-checkpoint');

		writeFileSync(buildSessionCheckpointPaths(fixtureRoot, 'handoff-reviewing').implementationResult, '# Implementation result\n', 'utf8');
		const reviewReady = handoffPhase(fixtureRoot, {
			sessionId: 'handoff-reviewing',
			role: 'orchestrator',
			phase: 'reviewing',
			owner: 'reviewer',
		});

		expect(reviewReady.result.allowed).toBe(true);
		expect(reviewReady.session?.state).toBe('reviewing');
	});

	test('requires lane-specific completion gates before transitioning to done', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'done-gates',
			lane: 'tooling-workflow',
			role: 'orchestrator',
		});

		transitionSession(fixtureRoot, {
			sessionId: 'done-gates',
			role: 'orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'evt-plan',
		});
		writeFileSync(buildSessionArtifactPaths(fixtureRoot, 'done-gates').plan, '# Plan\n', 'utf8');
		transitionSession(fixtureRoot, {
			sessionId: 'done-gates',
			role: 'orchestrator',
			toState: 'plan-complete',
			evidence: ['bounded-plan', 'phase-owner-recorded'],
			eventId: 'evt-plan-complete',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'done-gates',
			role: 'orchestrator',
			toState: 'implementing',
			evidence: ['implementation-owner-recorded'],
			eventId: 'evt-implementing',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'done-gates',
			role: 'implementor',
			toState: 'reviewing',
			evidence: ['change-summary', 'validation-evidence'],
			eventId: 'evt-reviewing',
		});

		const { result } = transitionSession(fixtureRoot, {
			sessionId: 'done-gates',
			role: 'orchestrator',
			toState: 'done',
			evidence: ['completion-gates-satisfied', 'final-summary', 'targeted-validation'],
			eventId: 'evt-done',
		});

		expect(result.allowed).toBe(false);
		expect(result.code).toBe('missing-completion-gates');
		expect(result.guidance[1]).toContain('workflow-impact-summary');
	});

	test('allows done transition when lane-specific completion gates are present', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'done-complete',
			lane: 'tooling-workflow',
			role: 'orchestrator',
		});

		transitionSession(fixtureRoot, {
			sessionId: 'done-complete',
			role: 'orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'evt-plan',
		});
		writeFileSync(buildSessionArtifactPaths(fixtureRoot, 'done-complete').plan, '# Plan\n', 'utf8');
		transitionSession(fixtureRoot, {
			sessionId: 'done-complete',
			role: 'orchestrator',
			toState: 'plan-complete',
			evidence: ['bounded-plan', 'phase-owner-recorded'],
			eventId: 'evt-plan-complete',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'done-complete',
			role: 'orchestrator',
			toState: 'implementing',
			evidence: ['implementation-owner-recorded'],
			eventId: 'evt-implementing',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'done-complete',
			role: 'implementor',
			toState: 'reviewing',
			evidence: ['change-summary', 'validation-evidence'],
			eventId: 'evt-reviewing',
		});

		const { result, session } = transitionSession(fixtureRoot, {
			sessionId: 'done-complete',
			role: 'orchestrator',
			toState: 'done',
			evidence: ['completion-gates-satisfied', 'final-summary', 'targeted-validation', 'workflow-impact-summary', 'validation-summary'],
			eventId: 'evt-done',
		});

		expect(result.allowed).toBe(true);
		expect(session?.state).toBe('done');
	});

	test('complete session uses review checkpoints instead of manual evidence wiring', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'complete-with-checkpoints',
			lane: 'application-feature-delivery',
			role: 'orchestrator',
		});

		transitionSession(fixtureRoot, {
			sessionId: 'complete-with-checkpoints',
			role: 'orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'evt-plan',
		});
		writeFileSync(buildSessionArtifactPaths(fixtureRoot, 'complete-with-checkpoints').plan, '# Plan\n', 'utf8');
		handoffPhase(fixtureRoot, {
			sessionId: 'complete-with-checkpoints',
			role: 'orchestrator',
			phase: 'implementing',
			owner: 'implementor',
		});
		writeFileSync(buildSessionCheckpointPaths(fixtureRoot, 'complete-with-checkpoints').implementationResult, '# Implementation result\n', 'utf8');
		handoffPhase(fixtureRoot, {
			sessionId: 'complete-with-checkpoints',
			role: 'orchestrator',
			phase: 'reviewing',
			owner: 'reviewer',
		});

		const missingReviewDecision = completeSession(fixtureRoot, {
			sessionId: 'complete-with-checkpoints',
			role: 'orchestrator',
			outcome: 'done',
		});
		expect(missingReviewDecision.result.allowed).toBe(false);
		expect(missingReviewDecision.result.code).toBe('missing-checkpoint');

		writeFileSync(buildSessionCheckpointPaths(fixtureRoot, 'complete-with-checkpoints').reviewDecision, '# Approved\n', 'utf8');
		writeFileSync(buildSessionArtifactPaths(fixtureRoot, 'complete-with-checkpoints').finalSummary, '# Final summary\n', 'utf8');

		const done = completeSession(fixtureRoot, {
			sessionId: 'complete-with-checkpoints',
			role: 'orchestrator',
			outcome: 'done',
		});

		expect(done.result.allowed).toBe(true);
		expect(done.session?.state).toBe('done');
	});
});
