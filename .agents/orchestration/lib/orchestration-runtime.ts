import { loadOrchestrationModel, loadOrchestrationSpec, loadSession, saveSession } from './orchestration-loader.ts';
import type { ActionId, HookResult, RoleId, RuntimeSession, StateId } from './types.ts';

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
	input: { sessionId: string; lane: RuntimeSession['lane']; role: RuntimeSession['recentRole']; artifactMode?: RuntimeSession['artifactMode'] },
): RuntimeSession {
	const spec = loadOrchestrationSpec(repoRoot);
	const existingSession = loadSession(repoRoot, input.sessionId);

	if (existingSession) {
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
		session.processedEvents[input.eventId] = roleCheck;
		saveSession(repoRoot, session);
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
		session.processedEvents[input.eventId] = denial;
		saveSession(repoRoot, session);
		return { result: denial, session };
	}

	const missingEvidence = transitionDefinition.requires.filter((requiredItem) => !input.evidence.includes(requiredItem));
	if (missingEvidence.length > 0) {
		const denial = deny(
			'missing-evidence',
			`Transition to "${input.toState}" is missing required evidence.`,
			buildGuidance('Provide the required evidence keys for this transition.', [`Missing: ${missingEvidence.join(', ')}`]),
			session.state,
		);
		session.processedEvents[input.eventId] = denial;
		saveSession(repoRoot, session);
		return { result: denial, session };
	}

	if (input.toState === 'revising' && session.counters.revisionCount >= MAX_REVISIONS) {
		const denial = deny(
			'revision-loop-limit',
			`Revision loop limit reached for session "${session.sessionId}".`,
			buildGuidance('Stop revising the same phase repeatedly.', ['Escalate the task or return to planning with a narrower scope.']),
			session.state,
		);
		session.processedEvents[input.eventId] = denial;
		saveSession(repoRoot, session);
		return { result: denial, session };
	}

	if (session.state === 'blocked' && input.toState !== 'blocked' && session.counters.blockedResumes >= MAX_BLOCKED_RESUMES) {
		const denial = deny(
			'blocked-loop-limit',
			`Blocked resume limit reached for session "${session.sessionId}".`,
			buildGuidance('Avoid retrying the same blocked flow indefinitely.', ['Escalate the blocker with new context or reset the plan.']),
			session.state,
		);
		session.processedEvents[input.eventId] = denial;
		saveSession(repoRoot, session);
		return { result: denial, session };
	}

	const fromState = session.state;
	session.state = input.toState;
	session.recentRole = input.role;
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
