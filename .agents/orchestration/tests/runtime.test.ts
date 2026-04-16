import { describe, expect, test } from 'vitest';
import { createSession, transitionSession } from '../lib/orchestration-runtime.ts';
import { createTempRepoFixture } from './test-helpers.ts';

describe('orchestration runtime', () => {
	test('initializes a session and applies a valid transition', () => {
		const fixtureRoot = createTempRepoFixture();
		const session = createSession(fixtureRoot, {
			sessionId: 'demo',
			lane: 'tooling-workflow',
			role: 'senior-orchestrator',
		});

		expect(session.state).toBe('initialized');

		const { result, session: updatedSession } = transitionSession(fixtureRoot, {
			sessionId: 'demo',
			role: 'senior-orchestrator',
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
			role: 'senior-orchestrator',
		});

		const first = transitionSession(fixtureRoot, {
			sessionId: 'dup',
			role: 'senior-orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'same-event',
		});
		const second = transitionSession(fixtureRoot, {
			sessionId: 'dup',
			role: 'senior-orchestrator',
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
			role: 'senior-orchestrator',
		});

		const { result } = transitionSession(fixtureRoot, {
			sessionId: 'bad-transition',
			role: 'senior-orchestrator',
			toState: 'implementing',
			evidence: ['implementation-owner-recorded'],
			eventId: 'evt-invalid',
		});

		expect(result.allowed).toBe(false);
		expect(result.code).toBe('invalid-transition');
		expect(result.guidance[1]).toContain('planning');
	});

	test('requires lane-specific completion gates before transitioning to done', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'done-gates',
			lane: 'tooling-workflow',
			role: 'senior-orchestrator',
		});

		transitionSession(fixtureRoot, {
			sessionId: 'done-gates',
			role: 'senior-orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'evt-plan',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'done-gates',
			role: 'senior-orchestrator',
			toState: 'plan-complete',
			evidence: ['bounded-plan', 'phase-owner-recorded'],
			eventId: 'evt-plan-complete',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'done-gates',
			role: 'senior-orchestrator',
			toState: 'implementing',
			evidence: ['implementation-owner-recorded'],
			eventId: 'evt-implementing',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'done-gates',
			role: 'implementation-engineer',
			toState: 'reviewing',
			evidence: ['change-summary', 'validation-evidence'],
			eventId: 'evt-reviewing',
		});

		const { result } = transitionSession(fixtureRoot, {
			sessionId: 'done-gates',
			role: 'senior-orchestrator',
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
			role: 'senior-orchestrator',
		});

		transitionSession(fixtureRoot, {
			sessionId: 'done-complete',
			role: 'senior-orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'evt-plan',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'done-complete',
			role: 'senior-orchestrator',
			toState: 'plan-complete',
			evidence: ['bounded-plan', 'phase-owner-recorded'],
			eventId: 'evt-plan-complete',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'done-complete',
			role: 'senior-orchestrator',
			toState: 'implementing',
			evidence: ['implementation-owner-recorded'],
			eventId: 'evt-implementing',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'done-complete',
			role: 'implementation-engineer',
			toState: 'reviewing',
			evidence: ['change-summary', 'validation-evidence'],
			eventId: 'evt-reviewing',
		});

		const { result, session } = transitionSession(fixtureRoot, {
			sessionId: 'done-complete',
			role: 'senior-orchestrator',
			toState: 'done',
			evidence: ['completion-gates-satisfied', 'final-summary', 'targeted-validation', 'workflow-impact-summary', 'validation-summary'],
			eventId: 'evt-done',
		});

		expect(result.allowed).toBe(true);
		expect(session?.state).toBe('done');
	});
});
