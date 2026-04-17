import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { buildSessionArtifactPaths, buildSessionCheckpointPaths } from '../lib/orchestration-loader.ts';
import { checkActionAllowed, checkRoleAllowed, createSession, transitionSession } from '../lib/orchestration-runtime.ts';
import { createTempRepoFixture, repoRoot, writeFixtureFile } from './test-helpers.ts';

function runWorkspaceHook(scriptName: string, fixtureRoot: string, payload: unknown) {
	return spawnSync('bash', [join(repoRoot(), `.github/hooks/${scriptName}`)], {
		cwd: repoRoot(),
		encoding: 'utf8',
		input: JSON.stringify(payload),
		env: {
			...process.env,
			CELLIX_WORKFLOW_REPO_ROOT: fixtureRoot,
		},
	});
}

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
		writeFileSync(buildSessionArtifactPaths(fixtureRoot, 'tool-check').plan, '# Plan\n', 'utf8');
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

	test('reports session artifact status for planner verification', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'session-status',
			lane: 'application-feature-delivery',
			role: 'senior-orchestrator',
			changedPaths: ['apps/server-oauth2-mock/src/index.ts'],
		});

		const result = spawnSync(process.execPath, ['--experimental-strip-types', '.agents/orchestration/cli/orchestration-session-status.ts', '--repo', fixtureRoot, '--session', 'session-status', '--json'], {
			cwd: repoRoot(),
			encoding: 'utf8',
		});

		expect(result.status).toBe(0);
		expect(JSON.parse(result.stdout)).toMatchObject({
			sessionId: 'session-status',
			state: 'initialized',
			changedPaths: ['apps/server-oauth2-mock/src/index.ts'],
			sessionDirectory: expect.stringContaining('.agents-work/orchestration/sessions/session-status'),
			phaseDirectories: {
				implementation: expect.stringContaining('.agents-work/orchestration/sessions/session-status/implementation'),
				review: expect.stringContaining('.agents-work/orchestration/sessions/session-status/review'),
			},
			artifactStatus: {
				plan: {
					exists: false,
				},
			},
			checkpointStatus: {
				implementationResult: {
					exists: false,
				},
				reviewDecision: {
					exists: false,
				},
			},
		});
	});

	test('handoff subcommand advances planning into implementing once the plan exists', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'handoff-cli',
			lane: 'application-feature-delivery',
			role: 'senior-orchestrator',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'handoff-cli',
			role: 'senior-orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'evt-plan',
		});
		writeFileSync(buildSessionArtifactPaths(fixtureRoot, 'handoff-cli').plan, '# Plan\n', 'utf8');

		const result = spawnSync(
			process.execPath,
			['--experimental-strip-types', '.agents/orchestration/cli/orchestration-hook.ts', 'handoff', 'implementing', '--repo', fixtureRoot, '--session', 'handoff-cli', '--role', 'senior-orchestrator'],
			{
				cwd: repoRoot(),
				encoding: 'utf8',
			},
		);

		expect(result.status).toBe(0);
		expect(JSON.parse(result.stdout)).toMatchObject({
			result: {
				allowed: true,
				code: 'phase-ready',
				state: 'implementing',
			},
			session: {
				state: 'implementing',
			},
		});
	});

	test('complete subcommand resolves reviewing into done from checkpoints', () => {
		const fixtureRoot = createTempRepoFixture();
		createSession(fixtureRoot, {
			sessionId: 'complete-cli',
			lane: 'application-feature-delivery',
			role: 'senior-orchestrator',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'complete-cli',
			role: 'senior-orchestrator',
			toState: 'planning',
			evidence: ['task-lane-selected', 'session-created'],
			eventId: 'evt-plan',
		});
		writeFileSync(buildSessionArtifactPaths(fixtureRoot, 'complete-cli').plan, '# Plan\n', 'utf8');
		transitionSession(fixtureRoot, {
			sessionId: 'complete-cli',
			role: 'senior-orchestrator',
			toState: 'plan-complete',
			evidence: ['bounded-plan', 'phase-owner-recorded'],
			eventId: 'evt-plan-complete',
		});
		transitionSession(fixtureRoot, {
			sessionId: 'complete-cli',
			role: 'senior-orchestrator',
			toState: 'implementing',
			evidence: ['implementation-owner-recorded'],
			eventId: 'evt-implementing',
		});
		writeFileSync(buildSessionCheckpointPaths(fixtureRoot, 'complete-cli').implementationResult, '# Implementation result\n', 'utf8');
		transitionSession(fixtureRoot, {
			sessionId: 'complete-cli',
			role: 'implementation-engineer',
			toState: 'reviewing',
			evidence: ['change-summary', 'validation-evidence'],
			eventId: 'evt-reviewing',
		});
		writeFileSync(buildSessionCheckpointPaths(fixtureRoot, 'complete-cli').reviewDecision, '# Approved\n', 'utf8');
		writeFileSync(buildSessionArtifactPaths(fixtureRoot, 'complete-cli').finalSummary, '# Final summary\n', 'utf8');

		const result = spawnSync(
			process.execPath,
			['--experimental-strip-types', '.agents/orchestration/cli/orchestration-hook.ts', 'complete', 'done', '--repo', fixtureRoot, '--session', 'complete-cli', '--role', 'senior-orchestrator'],
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
				state: 'done',
			},
			session: {
				state: 'done',
			},
		});
	});

	test('postToolUse reconciles plan.md from planner response markers', () => {
		const fixtureRoot = createTempRepoFixture();
		const result = runWorkspaceHook('reconcile-agent-workflow.sh', fixtureRoot, {
			toolName: 'read_agent',
			toolArgs: {
				agent_id: 'task211-planner',
			},
			toolResult: {
				resultType: 'success',
				textResultForLlm:
					'Agent completed. agent_id: task211-planner, agent_type: planner, status: completed\n\nBEGIN PLAN.MD\n# Plan\n\n## Lane\nreusable-framework-public-surface\n\n## Scope\n- packages/cellix/server-oauth2-mock-seedwork/src/index.ts\nEND PLAN.MD\n\nSummary: framework-first phase.',
			},
		});

		expect(result.status).toBe(0);
		expect(readFileSync(join(fixtureRoot, '.agents-work/current/plan.md'), 'utf8')).toContain('# Plan');
		expect(readFileSync(join(fixtureRoot, '.agents-work/current/phase'), 'utf8')).toContain('planning');
	});

	test('postToolUse reconciles missing implementer.done so review can start', () => {
		const fixtureRoot = createTempRepoFixture();
		writeFixtureFile(fixtureRoot, '.agents-work/current/plan.md', '# Plan\n');
		writeFixtureFile(fixtureRoot, '.agents-work/current/phase', 'implementing\n');

		const reconcileResult = runWorkspaceHook('reconcile-agent-workflow.sh', fixtureRoot, {
			toolName: 'read_agent',
			toolArgs: {
				agent_id: 'task211-implementor',
			},
			toolResult: {
				resultType: 'success',
				textResultForLlm:
					'Agent completed. agent_id: task211-implementor, agent_type: implementor, status: completed\n\nimplementer.done created .agents-work/current/implementer.done',
			},
		});

		expect(reconcileResult.status).toBe(0);
		expect(readFileSync(join(fixtureRoot, '.agents-work/current/implementer.done'), 'utf8')).toContain('Checkpoint reconciled from the implementor result');

		const reviewStart = runWorkspaceHook('enforce-agent-workflow.sh', fixtureRoot, {
			toolName: 'task',
			toolArgs: {
				agent_type: 'framework-surface-reviewer',
				name: 'task211-framework-reviewer',
				mode: 'background',
			},
		});

		expect(reviewStart.status).toBe(0);
		expect(reviewStart.stdout).toBe('');
		expect(readFileSync(join(fixtureRoot, '.agents-work/current/phase'), 'utf8')).toContain('reviewing');
	});

	test('postToolUse reconciles review.feedback so implementor retry is allowed', () => {
		const fixtureRoot = createTempRepoFixture();
		writeFixtureFile(fixtureRoot, '.agents-work/current/plan.md', '# Plan\n');
		writeFixtureFile(fixtureRoot, '.agents-work/current/implementer.done', '{"summary":"done"}\n');
		writeFixtureFile(fixtureRoot, '.agents-work/current/phase', 'reviewing\n');

		const reconcileResult = runWorkspaceHook('reconcile-agent-workflow.sh', fixtureRoot, {
			toolName: 'read_agent',
			toolArgs: {
				agent_id: 'task211-framework-reviewer-3',
			},
			toolResult: {
				resultType: 'success',
				textResultForLlm:
					'Agent completed. agent_id: task211-framework-reviewer-3, agent_type: framework-surface-reviewer, status: completed\n\nstatus: fail\nsummary: "Need fix"\nfindings:\n  - file: packages/cellix/server-oauth2-mock-seedwork/src/index.ts\n    issue: "Root/default mismatch"\nretry_required: true\n',
			},
		});

		expect(reconcileResult.status).toBe(0);
		expect(readFileSync(join(fixtureRoot, '.agents-work/current/review.feedback'), 'utf8')).toContain('status: fail');

		const implementorRetry = runWorkspaceHook('enforce-agent-workflow.sh', fixtureRoot, {
			toolName: 'task',
			toolArgs: {
				agent_type: 'implementor',
				name: 'task211-implementor-retry-2',
				mode: 'background',
			},
		});

		expect(implementorRetry.status).toBe(0);
		expect(implementorRetry.stdout).toBe('');
		expect(readFileSync(join(fixtureRoot, '.agents-work/current/phase'), 'utf8')).toContain('implementing');
	});
});
