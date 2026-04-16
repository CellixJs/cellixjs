export type ProfileId = 'mixed-framework-and-app' | 'framework-only' | 'application-only';

export type PathClassId = 'reusableFramework' | 'applicationPackages' | 'tooling' | 'docs';

export type LaneFamilyId = 'reusable-framework' | 'application-delivery' | 'tooling-workflow' | 'docs-planning';

export type LaneId =
	| 'reusable-framework-public-surface'
	| 'reusable-framework-internal'
	| 'application-feature-delivery'
	| 'tooling-workflow'
	| 'docs-architecture-planning';

export type StateId = 'initialized' | 'planning' | 'plan-complete' | 'implementing' | 'reviewing' | 'revising' | 'blocked' | 'done';

export type ArtifactMode = 'minimal' | 'elevated';

export type RoleId =
	| 'senior-orchestrator'
	| 'discovery-planner'
	| 'implementation-engineer'
	| 'qa-reviewer'
	| 'framework-surface-reviewer';

export type ActionId = 'inspect' | 'classify' | 'plan' | 'document' | 'delegate' | 'edit' | 'execute' | 'validate' | 'finalize' | 'escalate';

export interface ClassMapping {
	include: string[];
	exclude?: string[];
}

export interface OrchestrationSpec {
	version: number;
	profile: ProfileId;
	classes: Record<PathClassId, ClassMapping>;
	overrides?: {
		artifactMode?: ArtifactMode;
		disableLaneFamilies?: LaneFamilyId[];
		completionGates?: Partial<Record<LaneId, string[]>>;
		frameworkExtensions?: {
			enable?: string[];
			disable?: string[];
		};
	};
}

export interface OrchestrationModel {
	version: number;
	authorityOrder: Array<{ rank: number; layer: string; description: string }>;
	pathClasses: Record<PathClassId, { description: string }>;
	laneFamilies: Record<LaneFamilyId, { description: string }>;
	lanes: Record<LaneId, { family: LaneFamilyId; entryClasses: PathClassId[]; description: string }>;
	profiles: Record<ProfileId, { description: string; laneFamilies: LaneFamilyId[]; defaultArtifactMode: ArtifactMode; frameworkExtensions: string[] }>;
	roles: Record<RoleId, { description: string }>;
	states: Record<
		StateId,
		{
			phase: string;
			allowedRoles: RoleId[];
			transitions: Partial<Record<StateId, { requires: string[] }>>;
		}
	>;
	laneSpecificRoleRules: Array<{
		lane?: LaneId;
		laneFamily?: LaneFamilyId;
		role: RoleId;
		allowedStates: StateId[];
		requiresProfiles: ProfileId[];
	}>;
	frameworkExtensions: Record<string, { description: string; allowedProfiles: ProfileId[]; allowedLanes: LaneId[] }>;
	artifactPolicy: {
		defaultMode: ArtifactMode;
		modes: Record<ArtifactMode, { requiredArtifacts: string[]; recommendedArtifacts?: string[]; description: string }>;
		promotionSignals: string[];
	};
	completionGates: Record<LaneId, string[]>;
}

export interface ValidationIssue {
	code: string;
	message: string;
	path?: string;
	suggestion?: string;
}

export interface ValidationReport {
	ok: boolean;
	errors: ValidationIssue[];
	warnings: ValidationIssue[];
}

export interface TransitionRecord {
	eventId: string;
	fromState: StateId;
	toState: StateId;
	role: RoleId;
	evidence: string[];
	note?: string;
	timestamp: string;
}

export interface EvidenceRecord {
	type: string;
	summary: string;
	role: RoleId;
	timestamp: string;
}

export interface RuntimeSession {
	sessionId: string;
	profile: ProfileId;
	lane: LaneId;
	state: StateId;
	recentRole: RoleId;
	artifactMode: ArtifactMode;
	transitionHistory: TransitionRecord[];
	evidenceLog: EvidenceRecord[];
	counters: {
		reviewPasses: number;
		revisionCount: number;
		blockedResumes: number;
	};
	processedEvents: Record<string, HookResult>;
	createdAt: string;
	updatedAt: string;
}

export interface HookResult {
	allowed: boolean;
	code: string;
	message: string;
	guidance: string[];
	state?: StateId;
}

export interface HookManifest {
	version: number;
	hooks: Record<string, { script: string; subcommand: string; description: string }>;
}

export interface LaneSuggestionReport {
	paths: string[];
	matchedClasses: PathClassId[];
	candidateLanes: LaneId[];
	suggestedLane?: LaneId;
	confidence: 'high' | 'medium' | 'low';
	reasons: string[];
}
