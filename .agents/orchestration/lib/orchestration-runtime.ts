import { buildSessionArtifactPaths, getSessionArtifactStatus, getSessionCheckpointStatus, loadOrchestrationModel, loadOrchestrationSpec, loadSession, saveSession } from './orchestration-loader.ts';
import type { ActionId, HookResult, LaneId, RoleId, RuntimeSession, StateId } from './types.ts';

const MAX_REVISIONS = 3;
const MAX_BLOCKED_RESUMES = 3;

const ACTIONS_BY_STATE: Record<StateId, ActionId[]> = {
	initialized: ['inspect', 'classify', 'plan', 'document', 'delegate'],
	planning: ['inspect', 'plan', 'document', 'delegate'],
	'plan-complete': ['inspect', 'delegate', 'document'],
	implementing: ['inspect', 'edit', 'execute', 'validate', 'document'],
	reviewing: ['inspect', 'validate', 'document', 'finalize'],
	revising: ['inspect', 'edit', 'execute', 'validate', 'document'],
	blocked: ['inspect', 'document', 'escalate'],
	done: ['inspect', 'document'],
};

function deny(code: string, message: string, guidance: string[], state?: StateId): HookResult {
	return { allowed: false, code, message, guidance, state };
}

function allow(code: string, message: string, guidance: string[], state?: StateId): HookResult {
	return { allowed: true, code, message, guidance, state };
}

function buildGuidance(prefix: string, details: string[]): string[] {
	return [prefix, ...details];
}

function resolveCompletionGates(repoRoot: string, session: RuntimeSession): string[] {
	const spec = loadOrchestrationSpec(repoRoot);
	const model = loadOrchestrationModel(repoRoot);
	return spec.overrides?.completionGates?.[session.lane] ?? model.completionGates[session.lane] ?? [];
}

function resolveCompletionGateEvidence(repoRoot: string, lane: LaneId): string[] {
	const spec = loadOrchestrationSpec(repoRoot);
	const model = loadOrchestrationModel(repoRoot);
	return spec.overrides?.completionGates?.[lane] ?? model.completionGates[lane] ?? [];
}

function resolveTransitionEvidence(repoRoot: string, toState: StateId, fromState?: StateId, lane?: LaneId): string[] {
	switch (toState) {
		case 'planning':
			return ['task-lane-selected', 'session-created'];
		case 'plan-complete':
			return ['bounded-plan', 'phase-owner-recorded'];
		case 'implementing':
			return ['implementation-owner-recorded'];
		case 'reviewing':
			return fromState === 'revising' ? ['revision-summary', 'validation-evidence'] : ['change-summary', 'validation-evidence'];
		case 'revising':
			return ['review-findings'];
		case 'done': {
			const evidence = ['completion-gates-satisfied', 'final-summary'];
			return lane ? [...evidence, ...resolveCompletionGateEvidence(repoRoot, lane)] : evidence;
		}
		case 'blocked':
			return ['blocker-recorded'];
		default:
			return [];
	}
}

function isRoleAllowedForLane(repoRoot: string, role: RoleId, lane: RuntimeSession['lane'], state: StateId, profile: RuntimeSession['profile']): boolean {
	const model = loadOrchestrationModel(repoRoot);
	const laneFamily = model.lanes[lane].family;
	const matchingRule = model.laneSpecificRoleRules.find((rule) => rule.role === role && (rule.lane === lane || rule.laneFamily === laneFamily));

	if (!matchingRule) {
		return true;
	}

	if (matchingRule.requiresProfiles.length > 0 && !matchingRule.requiresProfiles.includes(profile)) {
		return false;
	}

	return matchingRule.allowedStates.includes(state);
}

export function createSession(
	repoRoot: string,
	input: {
		sessionId: string;
		lane: RuntimeSession['lane'];
		role: RuntimeSession['recentRole'];
		artifactMode?: RuntimeSession['artifactMode'];
		changedPaths?: string[];
	},
): RuntimeSession {
	const spec = loadOrchestrationSpec(repoRoot);
	const existingSession = loadSession(repoRoot, input.sessionId);

	if (existingSession) {
		if (existingSession.changedPaths.length === 0 && (input.changedPaths?.length ?? 0) > 0) {
			existingSession.changedPaths = [...(input.changedPaths ?? [])];
			saveSession(repoRoot, existingSession);
		}
		return existingSession;
	}

	const timestamp = new Date().toISOString();
	const session: RuntimeSession = {
		sessionId: input.sessionId,
		profile: spec.profile,
		lane: input.lane,
		state: 'initialized',
		recentRole: input.role,
		artifactMode: input.artifactMode ?? spec.overrides?.artifactMode ?? loadOrchestrationModel(repoRoot).profiles[spec.profile].defaultArtifactMode,
		changedPaths: [...(input.changedPaths ?? [])],
		artifactPaths: buildSessionArtifactPaths(repoRoot, input.sessionId),
		transitionHistory: [],
		evidenceLog: [],
		counters: {
			reviewPasses: 0,
			revisionCount: 0,
			blockedResumes: 0,
		},
		processedEvents: {},
		createdAt: timestamp,
		updatedAt: timestamp,
	};

	saveSession(repoRoot, session);
	return session;
}

function resolveSessionArtifacts(repoRoot: string, session: RuntimeSession): RuntimeSession['artifactPaths'] {
	const artifactStatus = getSessionArtifactStatus(repoRoot, session.sessionId);
	return {
		intake: artifactStatus.intake.path,
		plan: artifactStatus.plan.path,
		finalSummary: artifactStatus.finalSummary.path,
	};
}

function validateRequiredArtifacts(repoRoot: string, session: RuntimeSession, toState: StateId): HookResult | undefined {
	if (toState !== 'plan-complete') {
		return undefined;
	}

	const artifactStatus = getSessionArtifactStatus(repoRoot, session.sessionId);
	if (artifactStatus.plan.exists) {
		return undefined;
	}

	return deny(
		'missing-artifact',
		`Transition to "plan-complete" requires plan.md at "${artifactStatus.plan.path}".`,
		buildGuidance('Create the bounded plan artifact before advancing the session.', [
			`Expected artifact: ${artifactStatus.plan.path}`,
			'Use the discovery-planner to write the plan artifact, then verify it with `pnpm run orchestration:session-status -- --session <session-id>`.',
		]),
		session.state,
	);
}

function validateCheckpointArtifact(repoRoot: string, session: RuntimeSession, checkpoint: 'implementationResult' | 'reviewDecision' | 'finalSummary'): HookResult | undefined {
	if (checkpoint === 'finalSummary') {
		const artifactStatus = getSessionArtifactStatus(repoRoot, session.sessionId);
		if (artifactStatus.finalSummary.exists) {
			return undefined;
		}

		return deny(
			'missing-artifact',
			`Completion requires final-summary.md at "${artifactStatus.finalSummary.path}".`,
			buildGuidance('Write the final summary before completing the session.', [`Expected artifact: ${artifactStatus.finalSummary.path}`]),
			session.state,
		);
	}

	const checkpointStatus = getSessionCheckpointStatus(repoRoot, session.sessionId);
	if (checkpointStatus[checkpoint].exists) {
		return undefined;
	}

	const labels: Record<'implementationResult' | 'reviewDecision', string> = {
		implementationResult: 'implementation/result.md',
		reviewDecision: 'review/decision.md',
	};

	return deny(
		'missing-checkpoint',
		`Expected checkpoint "${labels[checkpoint]}" before continuing.`,
		buildGuidance('Write the canonical checkpoint artifact before advancing the session.', [`Expected artifact: ${checkpointStatus[checkpoint].path}`]),
		session.state,
	);
}

function ensureTransitionSucceeded(result: { result: HookResult; session?: RuntimeSession }): RuntimeSession | undefined {
	return result.result.allowed ? result.session : undefined;
}

function handoffAllowedRoles(phase: 'implementing' | 'reviewing'): RoleId[] {
	return phase === 'implementing' ? ['implementation-engineer'] : ['qa-reviewer', 'framework-surface-reviewer'];
}

export function checkRoleAllowed(repoRoot: string, sessionId: string, role: RoleId): HookResult {
	const session = loadSession(repoRoot, sessionId);
	if (!session) {
		return deny('missing-session', `Session "${sessionId}" does not exist.`, ['Initialize the session first with the session-init hook.']);
	}

	const model = loadOrchestrationModel(repoRoot);
	const allowedByState = model.states[session.state].allowedRoles.includes(role);
	const allowedByLane = isRoleAllowedForLane(repoRoot, role, session.lane, session.state, session.profile);

	if (allowedByState && allowedByLane) {
		return allow('role-allowed', `Role "${role}" is allowed in state "${session.state}".`, ['Proceed with the requested action.'], session.state);
	}

	return deny(
		'role-not-allowed',
		`Role "${role}" is not allowed in state "${session.state}" for lane "${session.lane}".`,
		buildGuidance('Use one of the allowed roles for the active phase.', [`Allowed roles in state "${session.state}": ${model.states[session.state].allowedRoles.join(', ')}`]),
		session.state,
	);
}

export function checkActionAllowed(repoRoot: string, sessionId: string, role: RoleId, action: ActionId): HookResult {
	const session = loadSession(repoRoot, sessionId);
	if (!session) {
		return deny('missing-session', `Session "${sessionId}" does not exist.`, ['Initialize the session first with the session-init hook.']);
	}

	const roleCheck = checkRoleAllowed(repoRoot, sessionId, role);
	if (!roleCheck.allowed) {
		return roleCheck;
	}

	if (ACTIONS_BY_STATE[session.state].includes(action)) {
		return allow('action-allowed', `Action "${action}" is allowed in state "${session.state}".`, ['Proceed with the requested action.'], session.state);
	}

	return deny(
		'action-not-allowed',
		`Action "${action}" is not allowed in state "${session.state}".`,
		buildGuidance('Use an action that matches the current phase.', [`Allowed actions in "${session.state}": ${ACTIONS_BY_STATE[session.state].join(', ')}`]),
		session.state,
	);
}

export function logEvidence(repoRoot: string, sessionId: string, role: RoleId, type: string, summary: string): RuntimeSession {
	const session = loadSession(repoRoot, sessionId);
	if (!session) {
		throw new Error(`Session "${sessionId}" does not exist.`);
	}

	session.evidenceLog.push({
		type,
		summary,
		role,
		timestamp: new Date().toISOString(),
	});
	session.updatedAt = new Date().toISOString();
	saveSession(repoRoot, session);
	return session;
}

export function transitionSession(
	repoRoot: string,
	input: {
		sessionId: string;
		role: RoleId;
		toState: StateId;
		evidence: string[];
		eventId: string;
		note?: string;
	},
): { result: HookResult; session?: RuntimeSession } {
	const session = loadSession(repoRoot, input.sessionId);
	if (!session) {
		return {
			result: deny('missing-session', `Session "${input.sessionId}" does not exist.`, ['Initialize the session first with the session-init hook.']),
		};
	}

	if (session.processedEvents[input.eventId]) {
		return {
			result: session.processedEvents[input.eventId],
			session,
		};
	}

	const roleCheck = checkRoleAllowed(repoRoot, input.sessionId, input.role);
	if (!roleCheck.allowed) {
		return { result: roleCheck, session };
	}

	const model = loadOrchestrationModel(repoRoot);
	const transitionDefinition = model.states[session.state].transitions[input.toState];
	if (!transitionDefinition) {
		const denial = deny(
			'invalid-transition',
			`Cannot transition from "${session.state}" to "${input.toState}".`,
			buildGuidance('Use a valid next state.', [`Valid transitions from "${session.state}": ${Object.keys(model.states[session.state].transitions).join(', ') || 'none'}`]),
			session.state,
		);
		return { result: denial, session };
	}

	const missingArtifact = validateRequiredArtifacts(repoRoot, session, input.toState);
	if (missingArtifact) {
		return { result: missingArtifact, session };
	}

	const missingEvidence = transitionDefinition.requires.filter((requiredItem) => !input.evidence.includes(requiredItem));
	if (missingEvidence.length > 0) {
		const denial = deny(
			'missing-evidence',
			`Transition to "${input.toState}" is missing required evidence.`,
			buildGuidance('Provide the required evidence keys for this transition.', [`Missing: ${missingEvidence.join(', ')}`]),
			session.state,
		);
		return { result: denial, session };
	}

	if (input.toState === 'done') {
		const laneCompletionGates = resolveCompletionGates(repoRoot, session);
		const missingCompletionGates = laneCompletionGates.filter((gate) => !input.evidence.includes(gate));

		if (missingCompletionGates.length > 0) {
			const denial = deny(
				'missing-completion-gates',
				`Transition to "done" is missing lane-specific completion gates for "${session.lane}".`,
				buildGuidance('Provide the completion-gate evidence required for the active lane.', [`Missing: ${missingCompletionGates.join(', ')}`]),
				session.state,
			);
			return { result: denial, session };
		}
	}

	if (input.toState === 'revising' && session.counters.revisionCount >= MAX_REVISIONS) {
		const denial = deny(
			'revision-loop-limit',
			`Revision loop limit reached for session "${session.sessionId}".`,
			buildGuidance('Stop revising the same phase repeatedly.', ['Escalate the task or return to planning with a narrower scope.']),
			session.state,
		);
		return { result: denial, session };
	}

	if (session.state === 'blocked' && input.toState !== 'blocked' && session.counters.blockedResumes >= MAX_BLOCKED_RESUMES) {
		const denial = deny(
			'blocked-loop-limit',
			`Blocked resume limit reached for session "${session.sessionId}".`,
			buildGuidance('Avoid retrying the same blocked flow indefinitely.', ['Escalate the blocker with new context or reset the plan.']),
			session.state,
		);
		return { result: denial, session };
	}

	const fromState = session.state;
	session.state = input.toState;
	session.recentRole = input.role;
	session.artifactPaths = resolveSessionArtifacts(repoRoot, session);
	session.updatedAt = new Date().toISOString();
	session.transitionHistory.push({
		eventId: input.eventId,
		fromState,
		toState: input.toState,
		role: input.role,
		evidence: input.evidence,
		note: input.note,
		timestamp: session.updatedAt,
	});

	if (input.toState === 'reviewing') {
		session.counters.reviewPasses += 1;
	}

	if (input.toState === 'revising') {
		session.counters.revisionCount += 1;
	}

	if (fromState === 'blocked' && input.toState !== 'blocked') {
		session.counters.blockedResumes += 1;
	}

	const success = allow('transition-allowed', `Transitioned from "${fromState}" to "${input.toState}".`, ['Continue with the next phase owner for the new state.'], session.state);
	session.processedEvents[input.eventId] = success;
	saveSession(repoRoot, session);
	return { result: success, session };
}

export function handoffPhase(
	repoRoot: string,
	input: {
		sessionId: string;
		role: RoleId;
		phase: 'implementing' | 'reviewing';
		owner: RoleId;
		eventId?: string;
		note?: string;
	},
): { result: HookResult; session?: RuntimeSession } {
	const session = loadSession(repoRoot, input.sessionId);
	if (!session) {
		return {
			result: deny('missing-session', `Session "${input.sessionId}" does not exist.`, ['Initialize the session first with orchestration:bootstrap.']),
		};
	}

	const allowedOwners = handoffAllowedRoles(input.phase);
	if (!allowedOwners.includes(input.owner)) {
		return {
			result: deny('invalid-owner', `Role "${input.owner}" cannot own the "${input.phase}" handoff.`, buildGuidance('Use a role that matches the target phase.', [`Allowed owners: ${allowedOwners.join(', ')}`]), session.state),
			session,
		};
	}

	if (input.phase === 'implementing') {
		if (session.state === 'implementing' || session.state === 'revising') {
			const ownerCheck = checkRoleAllowed(repoRoot, input.sessionId, input.owner);
			return {
				result: ownerCheck.allowed ? allow('phase-ready', `Phase "${session.state}" is ready for "${input.owner}".`, ['Delegate the bounded implementation work.'], session.state) : ownerCheck,
				session,
			};
		}

		if (session.state === 'planning') {
			const planReady = validateRequiredArtifacts(repoRoot, session, 'plan-complete');
			if (planReady) {
				return { result: planReady, session };
			}

			const planComplete = transitionSession(repoRoot, {
				sessionId: input.sessionId,
				role: input.role,
				toState: 'plan-complete',
				evidence: resolveTransitionEvidence(repoRoot, 'plan-complete', session.state, session.lane),
				eventId: input.eventId ? `${input.eventId}-plan-complete` : `${input.sessionId}-planning-plan-complete`,
				note: input.note ?? 'Plan artifact is present; advancing to implementation handoff.',
			});
			if (!planComplete.result.allowed) {
				return planComplete;
			}
		}

		const sessionAfterPlan = loadSession(repoRoot, input.sessionId);
		if (!sessionAfterPlan || sessionAfterPlan.state !== 'plan-complete') {
			return {
				result: deny(
					'phase-not-ready',
					`Session "${input.sessionId}" is not ready to enter implementing from state "${sessionAfterPlan?.state ?? session.state}".`,
					['Ensure planning completed and the canonical plan artifact exists before delegating implementation.'],
					sessionAfterPlan?.state ?? session.state,
				),
				session: sessionAfterPlan ?? session,
			};
		}

		const implementing = transitionSession(repoRoot, {
			sessionId: input.sessionId,
			role: input.role,
			toState: 'implementing',
			evidence: resolveTransitionEvidence(repoRoot, 'implementing', sessionAfterPlan.state, sessionAfterPlan.lane),
			eventId: input.eventId ? `${input.eventId}-implementing` : `${input.sessionId}-plan-complete-implementing`,
			note: input.note ?? `Delegated bounded implementation to ${input.owner}.`,
		});
		const updatedSession = ensureTransitionSucceeded(implementing) ?? implementing.session;
		if (!implementing.result.allowed || !updatedSession) {
			return implementing;
		}

		const ownerCheck = checkRoleAllowed(repoRoot, input.sessionId, input.owner);
		return {
			result: ownerCheck.allowed ? allow('phase-ready', `Session "${input.sessionId}" is ready for "${input.owner}" in "${updatedSession.state}".`, ['Delegate the bounded implementation work.'], updatedSession.state) : ownerCheck,
			session: updatedSession,
		};
	}

	if (session.state === 'reviewing') {
		const ownerCheck = checkRoleAllowed(repoRoot, input.sessionId, input.owner);
		return {
			result: ownerCheck.allowed ? allow('phase-ready', `Phase "reviewing" is ready for "${input.owner}".`, ['Delegate the review work using the canonical review checkpoint path.'], session.state) : ownerCheck,
			session,
		};
	}

	if (!['implementing', 'revising'].includes(session.state)) {
		return {
			result: deny(
				'phase-not-ready',
				`Session "${input.sessionId}" cannot enter reviewing from "${session.state}".`,
				['Implementation or revision work must complete first.', 'Write the implementation result checkpoint before delegating review.'],
				session.state,
			),
			session,
		};
	}

	const implementationCheckpoint = validateCheckpointArtifact(repoRoot, session, 'implementationResult');
	if (implementationCheckpoint) {
		return { result: implementationCheckpoint, session };
	}

	const reviewing = transitionSession(repoRoot, {
		sessionId: input.sessionId,
		role: input.role,
		toState: 'reviewing',
		evidence: resolveTransitionEvidence(repoRoot, 'reviewing', session.state, session.lane),
		eventId: input.eventId ? `${input.eventId}-reviewing` : `${input.sessionId}-${session.state}-reviewing`,
		note: input.note ?? `Delegated bounded review to ${input.owner}.`,
	});
	const updatedSession = ensureTransitionSucceeded(reviewing) ?? reviewing.session;
	if (!reviewing.result.allowed || !updatedSession) {
		return reviewing;
	}

	const ownerCheck = checkRoleAllowed(repoRoot, input.sessionId, input.owner);
	return {
		result: ownerCheck.allowed ? allow('phase-ready', `Session "${input.sessionId}" is ready for "${input.owner}" in "reviewing".`, ['Delegate the bounded review work.'], updatedSession.state) : ownerCheck,
		session: updatedSession,
	};
}

export function completeSession(
	repoRoot: string,
	input: {
		sessionId: string;
		role: RoleId;
		outcome: 'done' | 'revising' | 'blocked';
		eventId?: string;
		note?: string;
	},
): { result: HookResult; session?: RuntimeSession } {
	const session = loadSession(repoRoot, input.sessionId);
	if (!session) {
		return {
			result: deny('missing-session', `Session "${input.sessionId}" does not exist.`, ['Initialize the session first with orchestration:bootstrap.']),
		};
	}

	if (input.outcome === 'blocked') {
		return blockSession(repoRoot, {
			sessionId: input.sessionId,
			role: input.role,
			eventId: input.eventId ?? `${input.sessionId}-blocked`,
			note: input.note ?? 'Blocked during orchestration completion.',
		});
	}

	if (session.state === input.outcome) {
		return {
			result: allow('phase-ready', `Session "${input.sessionId}" is already in "${session.state}".`, ['Proceed with the next bounded step or finalize the session output.'], session.state),
			session,
		};
	}

	if (session.state !== 'reviewing') {
		return {
			result: deny('phase-not-ready', `Session "${input.sessionId}" cannot complete with outcome "${input.outcome}" from "${session.state}".`, ['Only the reviewing phase can resolve to done or revising.'], session.state),
			session,
		};
	}

	const reviewCheckpoint = validateCheckpointArtifact(repoRoot, session, 'reviewDecision');
	if (reviewCheckpoint) {
		return { result: reviewCheckpoint, session };
	}

	if (input.outcome === 'revising') {
		return transitionSession(repoRoot, {
			sessionId: input.sessionId,
			role: input.role,
			toState: 'revising',
			evidence: resolveTransitionEvidence(repoRoot, 'revising', session.state, session.lane),
			eventId: input.eventId ?? `${input.sessionId}-reviewing-revising`,
			note: input.note ?? 'Review requested revision.',
		});
	}

	const finalSummary = validateCheckpointArtifact(repoRoot, session, 'finalSummary');
	if (finalSummary) {
		return { result: finalSummary, session };
	}

	return transitionSession(repoRoot, {
		sessionId: input.sessionId,
		role: input.role,
		toState: 'done',
		evidence: resolveTransitionEvidence(repoRoot, 'done', session.state, session.lane),
		eventId: input.eventId ?? `${input.sessionId}-reviewing-done`,
		note: input.note ?? 'Review approved completion.',
	});
}

export function blockSession(repoRoot: string, input: { sessionId: string; role: RoleId; eventId: string; note: string }): { result: HookResult; session?: RuntimeSession } {
	return transitionSession(repoRoot, {
		sessionId: input.sessionId,
		role: input.role,
		toState: 'blocked',
		evidence: ['blocker-recorded'],
		eventId: input.eventId,
		note: input.note,
	});
}
