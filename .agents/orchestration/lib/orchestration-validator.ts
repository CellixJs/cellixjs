import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadHookManifest, loadOrchestrationModel, loadOrchestrationSpec } from './orchestration-loader.ts';
import type { LaneFamilyId, OrchestrationModel, OrchestrationSpec, PathClassId, ProfileId, ValidationIssue, ValidationReport } from './types.ts';

const REQUIRED_CLASSES_BY_PROFILE: Record<ProfileId, PathClassId[]> = {
	'mixed-framework-and-app': ['reusableFramework', 'applicationPackages', 'tooling', 'docs'],
	'framework-only': ['reusableFramework', 'tooling', 'docs'],
	'application-only': ['applicationPackages', 'tooling', 'docs'],
};

const BASE_REQUIRED_SKILLS = ['cellix-task-intake', 'cellix-session-state', 'cellix-feature-delivery', 'cellix-phase-review'];
const BASE_REQUIRED_AGENTS = ['senior-orchestrator', 'discovery-planner', 'implementation-engineer', 'qa-reviewer'];

function pushError(errors: ValidationIssue[], code: string, message: string, suggestion?: string, path?: string): void {
	errors.push({ code, message, suggestion, path });
}

export function resolveActiveLaneFamilies(spec: OrchestrationSpec, model: OrchestrationModel): LaneFamilyId[] {
	const defaults = model.profiles[spec.profile].laneFamilies;
	const disabled = new Set(spec.overrides?.disableLaneFamilies ?? []);
	return defaults.filter((family) => !disabled.has(family));
}

export function validateModel(model: OrchestrationModel): ValidationIssue[] {
	const errors: ValidationIssue[] = [];

	const sortedRanks = [...model.authorityOrder].map((entry) => entry.rank).sort((left, right) => left - right);
	sortedRanks.forEach((rank, index) => {
		if (rank !== index + 1) {
			pushError(errors, 'invalid-authority-order', `Authority order rank ${rank} is out of sequence.`);
		}
	});

	for (const [stateId, state] of Object.entries(model.states)) {
		for (const role of state.allowedRoles) {
			if (!model.roles[role]) {
				pushError(errors, 'unknown-role', `State "${stateId}" references unknown role "${role}".`);
			}
		}

		for (const transitionTarget of Object.keys(state.transitions)) {
			if (!model.states[transitionTarget as keyof typeof model.states]) {
				pushError(errors, 'unknown-transition-target', `State "${stateId}" transitions to unknown state "${transitionTarget}".`);
			}
		}
	}

	for (const [laneId, lane] of Object.entries(model.lanes)) {
		if (!model.laneFamilies[lane.family]) {
			pushError(errors, 'unknown-lane-family', `Lane "${laneId}" references unknown lane family "${lane.family}".`);
		}

		for (const entryClass of lane.entryClasses) {
			if (!model.pathClasses[entryClass]) {
				pushError(errors, 'unknown-path-class', `Lane "${laneId}" references unknown path class "${entryClass}".`);
			}
		}
	}

	for (const [profileId, profile] of Object.entries(model.profiles)) {
		for (const family of profile.laneFamilies) {
			if (!model.laneFamilies[family]) {
				pushError(errors, 'invalid-profile-lane-family', `Profile "${profileId}" references unknown lane family "${family}".`);
			}
		}

		for (const extensionId of profile.frameworkExtensions) {
			if (!model.frameworkExtensions[extensionId]) {
				pushError(errors, 'invalid-framework-extension', `Profile "${profileId}" references unknown framework extension "${extensionId}".`);
			}
		}
	}

	for (const [laneId, gates] of Object.entries(model.completionGates)) {
		if (!model.lanes[laneId as keyof typeof model.lanes]) {
			pushError(errors, 'invalid-completion-gate-lane', `Completion gates reference unknown lane "${laneId}".`);
		}

		if (!Array.isArray(gates) || gates.length === 0) {
			pushError(errors, 'invalid-completion-gates', `Completion gates for lane "${laneId}" must be a non-empty array.`);
		}
	}

	return errors;
}

export function validateSpec(spec: OrchestrationSpec, model: OrchestrationModel): ValidationIssue[] {
	const errors: ValidationIssue[] = [];

	if (spec.version !== model.version) {
		pushError(errors, 'invalid-version', `Spec version ${spec.version} does not match model version ${model.version}.`);
	}

	if (!model.profiles[spec.profile]) {
		pushError(errors, 'invalid-profile', `Profile "${spec.profile}" is not defined by the orchestration model.`);
	}

	for (const classId of Object.keys(model.pathClasses) as PathClassId[]) {
		if (!(classId in spec.classes)) {
			pushError(errors, 'missing-class-mapping', `Spec is missing a class mapping for "${classId}".`);
			continue;
		}

		const include = spec.classes[classId].include;
		if (!Array.isArray(include)) {
			pushError(errors, 'invalid-class-mapping', `Class mapping "${classId}" must define an include array.`);
		}
	}

	for (const requiredClass of REQUIRED_CLASSES_BY_PROFILE[spec.profile]) {
		if (spec.classes[requiredClass].include.length === 0) {
			pushError(errors, 'empty-required-class-mapping', `Profile "${spec.profile}" requires a non-empty include mapping for "${requiredClass}".`);
		}
	}

	if (spec.overrides?.artifactMode && !model.artifactPolicy.modes[spec.overrides.artifactMode]) {
		pushError(errors, 'invalid-artifact-mode', `Artifact mode "${spec.overrides.artifactMode}" is not supported by the orchestration model.`);
	}

	for (const disabledFamily of spec.overrides?.disableLaneFamilies ?? []) {
		if (!model.laneFamilies[disabledFamily]) {
			pushError(errors, 'invalid-disabled-lane-family', `Disabled lane family "${disabledFamily}" is not defined by the orchestration model.`);
		}
	}

	for (const laneId of Object.keys(spec.overrides?.completionGates ?? {})) {
		if (!model.lanes[laneId as keyof typeof model.lanes]) {
			pushError(errors, 'invalid-override-completion-gate', `Override completion gates reference unknown lane "${laneId}".`);
		}
	}

	const enabledExtensions = new Set(spec.overrides?.frameworkExtensions?.enable ?? []);
	if (spec.profile === 'application-only' && enabledExtensions.size > 0) {
		pushError(errors, 'framework-extension-in-application-only', 'Application-only repos cannot enable framework-oriented extensions such as cellix-tdd.');
	}

	for (const extensionId of enabledExtensions) {
		const extension = model.frameworkExtensions[extensionId];
		if (!extension) {
			pushError(errors, 'unknown-framework-extension', `Unknown framework extension "${extensionId}" was enabled in the spec.`);
			continue;
		}

		if (!extension.allowedProfiles.includes(spec.profile)) {
			pushError(errors, 'framework-extension-profile-mismatch', `Framework extension "${extensionId}" is not valid for profile "${spec.profile}".`);
		}
	}

	return errors;
}

function validateRepoAssets(repoRoot: string, spec: OrchestrationSpec, model: OrchestrationModel): ValidationIssue[] {
	const errors: ValidationIssue[] = [];
	const activeLaneFamilies = new Set(resolveActiveLaneFamilies(spec, model));

	for (const skillId of BASE_REQUIRED_SKILLS) {
		if (!existsSync(join(repoRoot, '.agents/skills', skillId, 'SKILL.md'))) {
			pushError(errors, 'missing-skill', `Required orchestration skill "${skillId}" is missing.`, undefined, `.agents/skills/${skillId}/SKILL.md`);
		}
	}

	for (const agentId of BASE_REQUIRED_AGENTS) {
		if (!existsSync(join(repoRoot, '.github/agents', `${agentId}.agent.md`))) {
			pushError(errors, 'missing-agent', `Required orchestration agent "${agentId}" is missing.`, undefined, `.github/agents/${agentId}.agent.md`);
		}
	}

	if (activeLaneFamilies.has('reusable-framework')) {
		if (!existsSync(join(repoRoot, '.agents/skills', 'cellix-framework-surface-review', 'SKILL.md'))) {
			pushError(errors, 'missing-framework-review-skill', 'Reusable framework profiles require the cellix-framework-surface-review skill.');
		}

		if (!existsSync(join(repoRoot, '.github/agents', 'framework-surface-reviewer.agent.md'))) {
			pushError(errors, 'missing-framework-review-agent', 'Reusable framework profiles require the framework-surface-reviewer agent.');
		}

		if (!existsSync(join(repoRoot, '.agents/skills', 'cellix-tdd', 'SKILL.md'))) {
			pushError(errors, 'missing-cellix-tdd', 'Reusable framework profiles require cellix-tdd to be available as the framework-oriented extension.');
		}
	}

	const hookManifest = loadHookManifest(repoRoot);
	if (hookManifest.version !== model.version) {
		pushError(errors, 'hook-manifest-version-mismatch', `Hook manifest version ${hookManifest.version} does not match orchestration model version ${model.version}.`);
	}

	for (const [hookId, hook] of Object.entries(hookManifest.hooks)) {
		if (!existsSync(join(repoRoot, hook.script))) {
			pushError(errors, 'missing-hook-script', `Hook "${hookId}" references missing script "${hook.script}".`);
		}

		if (!hook.subcommand) {
			pushError(errors, 'invalid-hook-subcommand', `Hook "${hookId}" must declare a subcommand.`);
		}
	}

	return errors;
}

export function validateRepoConfiguration(repoRoot: string): ValidationReport {
	const model = loadOrchestrationModel(repoRoot);
	const spec = loadOrchestrationSpec(repoRoot);
	const errors = [...validateModel(model), ...validateSpec(spec, model), ...validateRepoAssets(repoRoot, spec, model)];

	return {
		ok: errors.length === 0,
		errors,
		warnings: [],
	};
}
