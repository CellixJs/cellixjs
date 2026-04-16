import { isAbsolute, relative, sep } from 'node:path';
import { loadOrchestrationModel, loadOrchestrationSpec } from './orchestration-loader.ts';
import { resolveActiveLaneFamilies } from './orchestration-validator.ts';
import type { ClassMapping, LaneId, LaneSuggestionReport, OrchestrationModel, OrchestrationSpec, PathClassId } from './types.ts';

function normalizePath(filePath: string): string {
	return filePath.split(sep).join('/').replace(/^\.\//, '');
}

function escapeRegex(value: string): string {
	return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&');
}

function globToRegExp(pattern: string): RegExp {
	let expression = escapeRegex(normalizePath(pattern));
	expression = expression.replace(/\*\*/g, '::DOUBLE_STAR::');
	expression = expression.replace(/\*/g, '[^/]*');
	expression = expression.replace(/::DOUBLE_STAR::/g, '.*');
	return new RegExp(`^${expression}$`);
}

function matchesMapping(path: string, mapping: ClassMapping): boolean {
	const normalizedPath = normalizePath(path);
	const candidatePaths = normalizedPath.endsWith('/') ? [normalizedPath] : [normalizedPath, `${normalizedPath}/`];
	const included = mapping.include.some((pattern) => {
		const expression = globToRegExp(pattern);
		return candidatePaths.some((candidatePath) => expression.test(candidatePath));
	});
	if (!included) {
		return false;
	}

	if (
		mapping.exclude?.some((pattern) => {
			const expression = globToRegExp(pattern);
			return candidatePaths.some((candidatePath) => expression.test(candidatePath));
		})
	) {
		return false;
	}

	return true;
}

function resolveMatchedClasses(spec: OrchestrationSpec, changedPaths: string[]): PathClassId[] {
	const matchedClasses = new Set<PathClassId>();

	for (const changedPath of changedPaths) {
		for (const classId of Object.keys(spec.classes) as PathClassId[]) {
			if (matchesMapping(changedPath, spec.classes[classId])) {
				matchedClasses.add(classId);
			}
		}
	}

	return [...matchedClasses];
}

function resolveCandidateLanes(spec: OrchestrationSpec, model: OrchestrationModel, matchedClasses: PathClassId[]): LaneId[] {
	const activeFamilies = new Set(resolveActiveLaneFamilies(spec, model));

	return (Object.keys(model.lanes) as LaneId[]).filter((laneId) => {
		const lane = model.lanes[laneId];
		return activeFamilies.has(lane.family) && lane.entryClasses.some((entryClass) => matchedClasses.includes(entryClass));
	});
}

function hasCandidate(candidates: LaneId[], laneId: LaneId): boolean {
	return candidates.includes(laneId);
}

function suggestLaneFromCandidates(matchedClasses: PathClassId[], candidates: LaneId[]): { suggestedLane?: LaneId; confidence: LaneSuggestionReport['confidence']; reasons: string[] } {
	if (matchedClasses.length === 0) {
		return {
			confidence: 'low',
			reasons: ['No changed paths matched the repo class mappings, so lane selection still needs manual classification.'],
		};
	}

	if (candidates.length === 0) {
		return {
			confidence: 'low',
			reasons: ['Changed paths matched repo classes, but every matching lane family is disabled or unavailable in the active profile.'],
		};
	}

	if (matchedClasses.includes('applicationPackages') && !matchedClasses.includes('reusableFramework') && hasCandidate(candidates, 'application-feature-delivery')) {
		return {
			suggestedLane: 'application-feature-delivery',
			confidence: 'high',
			reasons: ['Changed paths map to application packages and do not require reusable-framework routing by default.'],
		};
	}

	if (matchedClasses.includes('docs') && !matchedClasses.includes('reusableFramework') && !matchedClasses.includes('applicationPackages') && hasCandidate(candidates, 'docs-architecture-planning')) {
		return {
			suggestedLane: 'docs-architecture-planning',
			confidence: 'high',
			reasons: ['Changed paths are documentation-only, so the docs and architecture planning lane is the default fit.'],
		};
	}

	if (matchedClasses.length === 1 && matchedClasses[0] === 'tooling' && hasCandidate(candidates, 'tooling-workflow')) {
		return {
			suggestedLane: 'tooling-workflow',
			confidence: 'high',
			reasons: ['Changed paths are tooling-only, so the tooling workflow lane is the default fit.'],
		};
	}

	if (matchedClasses.length === 1 && matchedClasses[0] === 'reusableFramework') {
		return {
			confidence: 'medium',
			reasons: [
				'Changed paths are in reusable framework code, but changed paths alone cannot distinguish internal work from public-surface contract work.',
				'Choose between reusable-framework-public-surface and reusable-framework-internal based on whether consumer-visible behavior or exports are changing.',
			],
		};
	}

	if (matchedClasses.includes('reusableFramework') && matchedClasses.includes('applicationPackages')) {
		return {
			confidence: 'low',
			reasons: ['Changed paths span both reusable framework and application packages.', 'Split phases or escalate instead of blending lane families into one implementation pass.'],
		};
	}

	return {
		confidence: 'medium',
		reasons: ['Changed paths narrow the likely lanes, but a human still needs to confirm the primary lane from task intent.'],
	};
}

export function suggestLaneForChangedPaths(repoRoot: string, changedPaths: string[], options?: { specPath?: string }): LaneSuggestionReport {
	const normalizedPaths = changedPaths.map((path) => normalizePath(isAbsolute(path) ? relative(repoRoot, path) : path));
	const spec = loadOrchestrationSpec(repoRoot, options?.specPath);
	const model = loadOrchestrationModel(repoRoot);
	const matchedClasses = resolveMatchedClasses(spec, normalizedPaths);
	const candidateLanes = resolveCandidateLanes(spec, model, matchedClasses);
	const suggestion = suggestLaneFromCandidates(matchedClasses, candidateLanes);

	return {
		paths: normalizedPaths,
		matchedClasses,
		candidateLanes,
		suggestedLane: suggestion.suggestedLane,
		confidence: suggestion.confidence,
		reasons: suggestion.reasons,
	};
}
