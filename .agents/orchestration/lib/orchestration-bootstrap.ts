import { loadOrchestrationModel, loadOrchestrationSpec, loadSession } from './orchestration-loader.ts';
import { suggestLaneForChangedPaths } from './orchestration-routing.ts';
import { createSession, transitionSession } from './orchestration-runtime.ts';
import type { ArtifactMode, HookResult, LaneId, PathClassId, ProfileId, RoleId, RuntimeSession } from './types.ts';

function resolveArtifactMode(repoRoot: string): ArtifactMode {
	const spec = loadOrchestrationSpec(repoRoot);
	const model = loadOrchestrationModel(repoRoot);
	return spec.overrides?.artifactMode ?? model.profiles[spec.profile].defaultArtifactMode;
}

function resolveActiveFrameworkExtensions(repoRoot: string, profile: ProfileId): string[] {
	const spec = loadOrchestrationSpec(repoRoot);
	const model = loadOrchestrationModel(repoRoot);
	const enabled = new Set(model.profiles[profile].frameworkExtensions);

	for (const extensionId of spec.overrides?.frameworkExtensions?.enable ?? []) {
		enabled.add(extensionId);
	}

	for (const extensionId of spec.overrides?.frameworkExtensions?.disable ?? []) {
		enabled.delete(extensionId);
	}

	return [...enabled];
}

function resolveRecommendedFrameworkExtensions(repoRoot: string, profile: ProfileId, lane?: LaneId): string[] {
	if (!lane) {
		return [];
	}

	const model = loadOrchestrationModel(repoRoot);
	return resolveActiveFrameworkExtensions(repoRoot, profile).filter((extensionId) => {
		const extension = model.frameworkExtensions[extensionId];
		return extension && extension.allowedProfiles.includes(profile) && extension.allowedLanes.includes(lane);
	});
}

function isLaneAllowed(candidateLanes: LaneId[], lane: LaneId): boolean {
	return candidateLanes.length === 0 || candidateLanes.includes(lane);
}

export interface BootstrapReport {
	sessionId?: string;
	paths: string[];
	matchedClasses: PathClassId[];
	candidateLanes: LaneId[];
	suggestedLane?: LaneId;
	selectedLane?: LaneId;
	confidence: 'high' | 'medium' | 'low';
	reasons: string[];
	shouldSplitPhases: boolean;
	requiresLaneDecision: boolean;
	profile: ProfileId;
	artifactMode: ArtifactMode;
	activeFrameworkExtensions: string[];
	recommendedFrameworkExtensions: string[];
	nextActions: string[];
	session?: RuntimeSession;
	artifactPaths?: RuntimeSession['artifactPaths'];
	sessionInit?: { allowed: true; code: 'session-created'; message: string };
	planningTransition?: HookResult;
}

export function bootstrapOrchestrationSession(
	repoRoot: string,
	input: {
		changedPaths: string[];
		sessionId?: string;
		lane?: LaneId;
		role?: RoleId;
		artifactMode?: ArtifactMode;
		startPlanning?: boolean;
		eventId?: string;
	},
): BootstrapReport {
	const spec = loadOrchestrationSpec(repoRoot);
	const report = suggestLaneForChangedPaths(repoRoot, input.changedPaths);
	const selectedLane = input.lane ?? report.suggestedLane;
	const shouldSplitPhases = report.matchedClasses.includes('reusableFramework') && report.matchedClasses.includes('applicationPackages');
	const requiresLaneDecision = !selectedLane;
	const artifactMode = input.artifactMode ?? resolveArtifactMode(repoRoot);
	const activeFrameworkExtensions = resolveActiveFrameworkExtensions(repoRoot, spec.profile);
	const recommendedFrameworkExtensions = resolveRecommendedFrameworkExtensions(repoRoot, spec.profile, selectedLane);
	const nextActions: string[] = [];

	if (shouldSplitPhases) {
		nextActions.push('Split the work into bounded phases before delegating implementation.');
	}

	if (requiresLaneDecision) {
		nextActions.push('Select one primary lane explicitly before creating or advancing a session.');
	}

	if (selectedLane && recommendedFrameworkExtensions.includes('cellix-tdd')) {
		nextActions.push('Use cellix-tdd during planning and implementation for the selected reusable-framework lane.');
	}

	if (selectedLane && !requiresLaneDecision && !shouldSplitPhases && input.sessionId) {
		nextActions.push('Delegate planning to discovery-planner after the session reaches planning.');
		nextActions.push('Write the bounded plan to the session plan artifact, then use the implementing handoff to advance automatically.');
	}

	const result: BootstrapReport = {
		sessionId: input.sessionId,
		paths: report.paths,
		matchedClasses: report.matchedClasses,
		candidateLanes: report.candidateLanes,
		suggestedLane: report.suggestedLane,
		selectedLane,
		confidence: report.confidence,
		reasons: report.reasons,
		shouldSplitPhases,
		requiresLaneDecision,
		profile: spec.profile,
		artifactMode,
		activeFrameworkExtensions,
		recommendedFrameworkExtensions,
		nextActions,
	};

	if (!input.sessionId || !selectedLane || requiresLaneDecision) {
		return result;
	}

	if (!isLaneAllowed(report.candidateLanes, selectedLane)) {
		return {
			...result,
			nextActions: [...result.nextActions, `Selected lane "${selectedLane}" does not match the candidate lanes inferred from the provided paths.`],
		};
	}

	if (shouldSplitPhases && !input.lane) {
		return result;
	}

	const role = input.role ?? 'senior-orchestrator';
	const sessionBefore = loadSession(repoRoot, input.sessionId);
	const session = createSession(repoRoot, {
		sessionId: input.sessionId,
		lane: selectedLane,
		role,
		artifactMode,
		changedPaths: report.paths,
	});

	result.session = session;
	result.artifactPaths = session.artifactPaths;
	if (!sessionBefore) {
		result.sessionInit = {
			allowed: true,
			code: 'session-created',
			message: `Created session "${input.sessionId}" for lane "${selectedLane}".`,
		};
	}

	if (input.startPlanning === false || session.state !== 'initialized') {
		return result;
	}

	const planningTransition = transitionSession(repoRoot, {
		sessionId: input.sessionId,
		role,
		toState: 'planning',
		evidence: ['task-lane-selected', 'session-created'],
		eventId: input.eventId ?? `${input.sessionId}-planning`,
		note: 'Bootstrapped by the senior orchestrator after lane classification.',
	});

	result.planningTransition = planningTransition.result;
	result.session = planningTransition.session ?? session;
	return result;
}
