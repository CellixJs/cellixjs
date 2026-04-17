import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { HookManifest, OrchestrationModel, OrchestrationSpec, RuntimeSession, SessionArtifactPaths } from './types.ts';
import { parseYamlLite } from './yaml-lite.ts';

function readJsonFile<T>(filePath: string): T {
	return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

export function getOrchestrationModelPath(repoRoot: string): string {
	return join(repoRoot, '.agents/orchestration/model/orchestration-model.v1.json');
}

export function getOrchestrationSpecPath(repoRoot: string, specPath?: string): string {
	return specPath ? join(repoRoot, specPath) : join(repoRoot, 'orchestration.spec.yaml');
}

export function getHookManifestPath(repoRoot: string): string {
	return join(repoRoot, '.agents/orchestration/hooks/hook-manifest.json');
}

export function getSessionFilePath(repoRoot: string, sessionId: string): string {
	return join(repoRoot, '.agents-work/orchestration/sessions', `${sessionId}.json`);
}

export function getSessionArtifactsDirectoryPath(repoRoot: string, sessionId: string): string {
	return join(repoRoot, '.agents-work/orchestration/sessions', sessionId);
}

export function getSessionPhaseDirectoryPath(repoRoot: string, sessionId: string, phase: 'implementation' | 'review'): string {
	return join(getSessionArtifactsDirectoryPath(repoRoot, sessionId), phase);
}

export function buildSessionArtifactPaths(repoRoot: string, sessionId: string): SessionArtifactPaths {
	const artifactsDirectory = getSessionArtifactsDirectoryPath(repoRoot, sessionId);
	return {
		intake: join(artifactsDirectory, 'intake.md'),
		plan: join(artifactsDirectory, 'plan.md'),
		finalSummary: join(artifactsDirectory, 'final-summary.md'),
	};
}

export function ensureSessionArtifactsDirectory(repoRoot: string, sessionId: string): void {
	mkdirSync(getSessionArtifactsDirectoryPath(repoRoot, sessionId), { recursive: true });
}

export function getSessionArtifactStatus(repoRoot: string, sessionId: string): Record<keyof SessionArtifactPaths, { path: string; exists: boolean }> {
	const artifactPaths = buildSessionArtifactPaths(repoRoot, sessionId);

	return {
		intake: {
			path: artifactPaths.intake,
			exists: existsSync(artifactPaths.intake),
		},
		plan: {
			path: artifactPaths.plan,
			exists: existsSync(artifactPaths.plan),
		},
		finalSummary: {
			path: artifactPaths.finalSummary,
			exists: existsSync(artifactPaths.finalSummary),
		},
	};
}

export function loadOrchestrationModel(repoRoot: string): OrchestrationModel {
	return readJsonFile<OrchestrationModel>(getOrchestrationModelPath(repoRoot));
}

export function loadHookManifest(repoRoot: string): HookManifest {
	return readJsonFile<HookManifest>(getHookManifestPath(repoRoot));
}

function assertArrayOfStrings(value: unknown, fallback: string[] = []): string[] {
	if (Array.isArray(value)) {
		return value.map((entry) => String(entry));
	}
	return fallback;
}

function toClassMapping(value: unknown): { include: string[]; exclude?: string[] } {
	const mapping = (value ?? {}) as Record<string, unknown>;
	return {
		include: assertArrayOfStrings(mapping.include),
		exclude: mapping.exclude ? assertArrayOfStrings(mapping.exclude) : undefined,
	};
}

export function loadOrchestrationSpec(repoRoot: string, specPath?: string): OrchestrationSpec {
	const rawValue = parseYamlLite(readFileSync(getOrchestrationSpecPath(repoRoot, specPath), 'utf8')) as Record<string, unknown>;
	const classes = (rawValue.classes ?? {}) as Record<string, unknown>;
	const overrides = (rawValue.overrides ?? {}) as Record<string, unknown>;
	const frameworkExtensions = (overrides.frameworkExtensions ?? {}) as Record<string, unknown>;

	return {
		version: Number(rawValue.version),
		profile: String(rawValue.profile) as OrchestrationSpec['profile'],
		classes: {
			reusableFramework: toClassMapping(classes.reusableFramework),
			applicationPackages: toClassMapping(classes.applicationPackages),
			tooling: toClassMapping(classes.tooling),
			docs: toClassMapping(classes.docs),
		},
		overrides:
			Object.keys(overrides).length === 0
				? undefined
				: {
						artifactMode: overrides.artifactMode ? (String(overrides.artifactMode) as OrchestrationSpec['overrides']['artifactMode']) : undefined,
						disableLaneFamilies: overrides.disableLaneFamilies ? (assertArrayOfStrings(overrides.disableLaneFamilies) as OrchestrationSpec['overrides']['disableLaneFamilies']) : undefined,
						completionGates: overrides.completionGates ? (overrides.completionGates as OrchestrationSpec['overrides']['completionGates']) : undefined,
						frameworkExtensions:
							Object.keys(frameworkExtensions).length === 0
								? undefined
								: {
										enable: frameworkExtensions.enable ? assertArrayOfStrings(frameworkExtensions.enable) : undefined,
										disable: frameworkExtensions.disable ? assertArrayOfStrings(frameworkExtensions.disable) : undefined,
									},
					},
	};
}

function normalizeSession(repoRoot: string, sessionId: string, session: RuntimeSession): RuntimeSession {
	return {
		...session,
		changedPaths: Array.isArray(session.changedPaths) ? session.changedPaths.map((entry) => String(entry)) : [],
		artifactPaths: session.artifactPaths ?? buildSessionArtifactPaths(repoRoot, session.sessionId || sessionId),
	};
}

export function loadSession(repoRoot: string, sessionId: string): RuntimeSession | undefined {
	try {
		return normalizeSession(repoRoot, sessionId, readJsonFile<RuntimeSession>(getSessionFilePath(repoRoot, sessionId)));
	} catch {
		return undefined;
	}
}

export function saveSession(repoRoot: string, session: RuntimeSession): void {
	const sessionPath = getSessionFilePath(repoRoot, session.sessionId);
	mkdirSync(dirname(sessionPath), { recursive: true });
	ensureSessionArtifactsDirectory(repoRoot, session.sessionId);
	writeFileSync(sessionPath, `${JSON.stringify(session, null, 2)}\n`, 'utf8');
}
