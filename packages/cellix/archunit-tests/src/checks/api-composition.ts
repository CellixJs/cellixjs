import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { callbackContainsCall, callbackReturnsObject, callPositions, findImportedBinding, parseTypeScript } from './typescript-source.js';

export interface ApiCompositionConfig {
	/** Path to the API composition root, normally `src/index.ts`. */
	apiIndexPath: string;
}

const requiredStages = ['initializeInfrastructureServices', 'setContext', 'initializeApplicationServices', 'registerAzureFunction', 'startUp'] as const;

/**
 * Check that an API entry point composes every Cellix runtime layer in startup order.
 *
 * @param config - Location of the consumer's API composition entrypoint.
 * @returns Every composition violation; an empty array means the entrypoint complies.
 * @example
 * ```typescript
 * await checkApiComposition({ apiIndexPath: 'src/index.ts' });
 * ```
 */
export async function checkApiComposition(config: ApiCompositionConfig): Promise<string[]> {
	if (!config.apiIndexPath) {
		throw new Error('checkApiComposition requires apiIndexPath to be set');
	}

	let content: string;
	try {
		content = await readFile(config.apiIndexPath, 'utf8');
	} catch {
		return [`[${config.apiIndexPath}] API composition root must exist`];
	}

	const violations: string[] = [];
	const source = parseTypeScript(config.apiIndexPath, content);
	const cellixBinding = findImportedBinding(source, 'Cellix');
	if (!cellixBinding) {
		violations.push(`[${config.apiIndexPath}] API composition root must import Cellix`);
	}

	const syntaxPositions = callPositions(source, requiredStages);
	const positions = requiredStages.map((stage) => ({ stage, position: syntaxPositions.get(stage) ?? -1 }));
	for (const { stage, position } of positions) {
		if (position < 0) {
			violations.push(`[${config.apiIndexPath}] API composition root must call ${stage}${stage === 'registerAzureFunction' ? '* for at least one handler' : ''}`);
		}
	}

	const presentPositions = positions.filter(({ position }) => position >= 0);
	for (let index = 1; index < presentPositions.length; index += 1) {
		const previous = presentPositions[index - 1];
		const current = presentPositions[index];
		if (previous && current && current.position < previous.position) {
			violations.push(`[${config.apiIndexPath}] ${current.stage} must be composed after ${previous.stage}`);
		}
	}

	if (!callbackContainsCall(source, 'initializeInfrastructureServices', 'registerInfrastructureService')) {
		violations.push(`[${config.apiIndexPath}] initializeInfrastructureServices must register at least one infrastructure service`);
	}
	if (!callbackReturnsObject(source, 'setContext')) {
		violations.push(`[${config.apiIndexPath}] setContext must build and return the runtime context`);
	}

	await checkCellixInfrastructureLifecycle(config.apiIndexPath, cellixBinding?.moduleName, violations);

	return violations;
}

async function checkCellixInfrastructureLifecycle(apiIndexPath: string, importPath: string | undefined, violations: string[]): Promise<void> {
	if (!importPath) {
		return;
	}
	if (!importPath.startsWith('.')) return;

	const cellixPath = path.resolve(path.dirname(apiIndexPath), importPath);
	let cellix: string;
	try {
		cellix = await readFile(cellixPath, 'utf8');
	} catch {
		violations.push(`[${cellixPath}] Cellix infrastructure lifecycle implementation must exist`);
		return;
	}

	const appStartPosition = cellix.indexOf('app.hook.appStart');
	const serviceStartupPosition = cellix.indexOf('startAllServicesWithTracing', appStartPosition);
	const contextCreationPosition = cellix.indexOf('contextCreatorInternal', appStartPosition);
	if (appStartPosition < 0 || serviceStartupPosition < 0) {
		violations.push(`[${cellixPath}] Cellix must initialize registered infrastructure services during appStart`);
		return;
	}
	if (contextCreationPosition < 0) {
		violations.push(`[${cellixPath}] Cellix appStart must create the runtime context after infrastructure initialization`);
	} else if (serviceStartupPosition > contextCreationPosition) {
		violations.push(`[${cellixPath}] Cellix must initialize infrastructure services before creating the runtime context`);
	}
}
