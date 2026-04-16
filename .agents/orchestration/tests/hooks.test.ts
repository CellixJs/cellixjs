import { spawnSync } from 'node:child_process';
import { describe, expect, test } from 'vitest';
import { checkActionAllowed, checkRoleAllowed, createSession, transitionSession } from '../lib/orchestration-runtime.ts';
import { createTempRepoFixture, repoRoot } from './test-helpers.ts';

describe('orchestration hook checks', () => {
	test('denies reviewer role during implementing', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'agent-check',
			lane: 'tooling-workflow',
			role: 'senior-orchestrator',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'agent-check',
			role: 'senior-orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'evt-plan',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'agent-check',
			role: 'senior-orchestrator',
			toState: 'plan-complete',
			evidence: ['bounded-plan', 'phase-owner-recorded'],
			eventId: 'evt-plan-complete',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'agent-check',
			role: 'senior-orchestrator',
			toState: 'implementing',
			evidence: ['implementation-owner-recorded'],
			eventId: 'evt-implementing',
		});

		const result = checkRoleAllowed(fixtureRoot, 'agent-check', 'qa-reviewer');
		expect(result.allowed).toBe(false);
		expect(result.code).toBe('role-not-allowed');
	});

	test('denies edit actions during reviewing', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'tool-check',
			lane: 'tooling-workflow',
			role: 'senior-orchestrator',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'tool-check',
			role: 'senior-orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'evt-plan',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'tool-check',
			role: 'senior-orchestrator',
			toState: 'plan-complete',
			evidence: ['bounded-plan', 'phase-owner-recorded'],
			eventId: 'evt-plan-complete',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'tool-check',
			role: 'senior-orchestrator',
			toState: 'implementing',
			evidence: ['implementation-owner-recorded'],
			eventId: 'evt-implementing',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'tool-check',
			role: 'implementation-engineer',
			toState: 'reviewing',
			evidence: ['change-summary', 'validation-evidence'],
			eventId: 'evt-reviewing',
		});

		const result = checkActionAllowed(fixtureRoot, 'tool-check', 'qa-reviewer', 'edit');
		expect(result.allowed).toBe(false);
		expect(result.code).toBe('action-not-allowed');
		expect(result.guidance[1]).toContain('inspect');
	});

	test('returns structured json when a required option is missing', () => {
		const fixtureRoot = createTempRepoFixture();
		const result = spawnSync(process.execPath, ['--experimental-strip-types', '.agents/orchestration/cli/orchestration-hook.ts', 'session-init', '--repo', fixtureRoot], {
			cwd: repoRoot(),
			encoding: 'utf8',
		});

		expect(result.status).toBe(1);
		expect(result.stderr).toBe('');
		expect(JSON.parse(result.stdout)).toMatchObject({
			allowed: false,
			code: 'invalid-invocation',
			message: 'Missing required option --session',
		});
	});

	test('returns structured json for unknown subcommands', () => {
		const result = spawnSync(process.execPath, ['--experimental-strip-types', '.agents/orchestration/cli/orchestration-hook.ts', 'unknown-command'], {
			cwd: repoRoot(),
			encoding: 'utf8',
		});

		expect(result.status).toBe(1);
		expect(result.stderr).toBe('');
		expect(JSON.parse(result.stdout)).toMatchObject({
			allowed: false,
			code: 'invalid-invocation',
			message: 'Unknown subcommand "unknown-command"',
		});
	});

	test('accepts shorthand transition invocations used by orchestrator prompts', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'transition-shorthand',
			lane: 'application-feature-delivery',
			role: 'senior-orchestrator',
		});

		const result = spawnSync(
			process.execPath,
			['--experimental-strip-types', '.agents/orchestration/cli/orchestration-hook.ts', 'transition', 'planning', '--repo', fixtureRoot, '--session', 'transition-shorthand', '--owner', 'senior-orchestrator'],
			{
				cwd: repoRoot(),
				encoding: 'utf8',
			},
		);

		expect(result.status).toBe(0);
		expect(JSON.parse(result.stdout)).toMatchObject({
			result: {
				allowed: true,
				code: 'transition-allowed',
				state: 'planning',
			},
			session: {
				state: 'planning',
				recentRole: 'senior-orchestrator',
			},
		});
	});
});
