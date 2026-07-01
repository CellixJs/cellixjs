import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

export interface SerenitySuiteConventionsConfig {
	/** Source root containing the suite world, lifecycle hooks, and contexts. */
	suiteRoot: string;
	/** Require per-scenario cleanup and suite-level infrastructure shutdown. */
	requireManagedCleanup?: boolean;
}

async function exists(filePath: string): Promise<boolean> {
	try {
		await access(filePath);
		return true;
	} catch {
		return false;
	}
}

/**
 * Check the managed-world and Screenplay organization contract of a Serenity suite.
 *
 * @param config - Suite source root and cleanup policy. Context directories are discovered automatically.
 * @returns Every initialization or organization violation; an empty array means the suite complies.
 * @example
 * ```typescript
 * await checkSerenitySuiteConventions({ suiteRoot: 'src' });
 * ```
 */
export async function checkSerenitySuiteConventions(config: SerenitySuiteConventionsConfig): Promise<string[]> {
	if (!config.suiteRoot) {
		throw new Error('checkSerenitySuiteConventions requires suiteRoot to be set');
	}
	const violations: string[] = [];
	const worldPath = path.join(config.suiteRoot, 'world.ts');
	const lifecyclePath = path.join(config.suiteRoot, 'cucumber-lifecycle-hooks.ts');
	const loaderPath = path.join(config.suiteRoot, 'step-definitions', 'index.ts');
	const contextsRoot = path.join(config.suiteRoot, 'contexts');

	for (const requiredPath of [worldPath, lifecyclePath, loaderPath]) {
		if (!(await exists(requiredPath))) {
			violations.push(`[${requiredPath}] Required Serenity suite file must exist`);
		}
	}

	if (await exists(worldPath)) {
		const world = await readFile(worldPath, 'utf8');
		if (!/import\s+\{[^}]*registerManagedSerenityWorld[^}]*\}\s+from\s+['"]@cellix\/serenity-framework\/cucumber['"]/.test(world)) {
			violations.push(`[${worldPath}] Managed world must use registerManagedSerenityWorld from @cellix/serenity-framework/cucumber`);
		}
		if (!/import\s+\{[^}]*SerenityCast[^}]*\}\s+from\s+['"]@cellix\/serenity-framework\/serenity['"]/.test(world)) {
			violations.push(`[${worldPath}] Managed world must use SerenityCast from @cellix/serenity-framework/serenity`);
		}
		for (const required of ['registerManagedSerenityWorld', 'new SerenityCast', 'createCast:', 'useNotepad: true', 'registerLifecycleHooks()']) {
			if (!world.includes(required)) {
				violations.push(`[${worldPath}] Managed world must include ${required}`);
			}
		}
		if (!/export\s+const\s+\w+World\s*=/.test(world) || !/export\s+type\s+\w+World\s*=\s*InstanceType/.test(world)) {
			violations.push(`[${worldPath}] Managed world must export both its constructor and InstanceType`);
		}
	}

	if (await exists(lifecyclePath)) {
		const lifecycle = await readFile(lifecyclePath, 'utf8');
		if (!/import\s+\{[^}]*registerWorldLifecycleHooks[^}]*\}\s+from\s+['"]@cellix\/serenity-framework\/cucumber['"]/.test(lifecycle)) {
			violations.push(`[${lifecyclePath}] Lifecycle must use registerWorldLifecycleHooks from @cellix/serenity-framework/cucumber`);
		}
		if (!/import\s+\{[^}]*getTimeout[^}]*\}\s+from\s+['"]@cellix\/serenity-framework\/settings['"]/.test(lifecycle)) {
			violations.push(`[${lifecyclePath}] Lifecycle must use shared timeout settings`);
		}
		for (const required of ['registerWorldLifecycleHooks', "getTimeout('scenario')", 'world.init()']) {
			if (!lifecycle.includes(required)) {
				violations.push(`[${lifecyclePath}] Lifecycle hooks must include ${required}`);
			}
		}
		if (config.requireManagedCleanup && !lifecycle.includes('world.cleanup()')) {
			violations.push(`[${lifecyclePath}] Managed infrastructure suites must clean up the world after each scenario`);
		}
		if (config.requireManagedCleanup && !/afterAll:\s*\(\)\s*=>\s*infrastructure\.stopAll\(\)/.test(lifecycle)) {
			violations.push(`[${lifecyclePath}] Managed infrastructure suites must stop all infrastructure after the suite`);
		}
	}
	if (config.requireManagedCleanup) {
		await checkManagedInfrastructure(config.suiteRoot, violations);
	}

	const loader = (await exists(loaderPath)) ? await readFile(loaderPath, 'utf8') : '';
	const contexts = await discoverContexts(contextsRoot);
	if (contexts.length === 0) {
		violations.push(`[${contextsRoot}] Serenity suite must define at least one context directory`);
	}
	for (const context of contexts) {
		await checkContext(config.suiteRoot, context, loaderPath, loader, violations);
	}

	return violations;
}

async function checkManagedInfrastructure(suiteRoot: string, violations: string[]): Promise<void> {
	const infrastructurePath = path.join(suiteRoot, 'infrastructure.ts');
	if (!(await exists(infrastructurePath))) {
		violations.push(`[${infrastructurePath}] Managed Serenity suites must define their infrastructure`);
		return;
	}

	const infrastructure = await readFile(infrastructurePath, 'utf8');
	const frameworkImport = infrastructure.match(/import\s+\{\s*(E2EInfrastructure|ApiInfrastructure)\s*\}\s+from\s+['"]@cellix\/serenity-framework\/infrastructure\/(e2e|api)['"]/);
	const infrastructureKind = frameworkImport?.[1];
	if (!infrastructureKind) {
		violations.push(`[${infrastructurePath}] Managed infrastructure must use a Cellix Serenity infrastructure builder`);
		return;
	}
	if (!new RegExp(`export\\s+const\\s+infrastructure\\s*=\\s*${infrastructureKind}\\.create\\s*\\(`).test(infrastructure)) {
		violations.push(`[${infrastructurePath}] Managed infrastructure must export a created ${infrastructureKind}`);
	}
	if (!/\.addServer\s*\(/.test(infrastructure)) {
		violations.push(`[${infrastructurePath}] Managed infrastructure must register at least one server`);
	}
	if (infrastructureKind === 'E2EInfrastructure' && !/\.addUiPortal\s*\(/.test(infrastructure)) {
		violations.push(`[${infrastructurePath}] E2E infrastructure must register at least one UI portal`);
	}
	if (!/\.finalize\s*\(\s*\)/.test(infrastructure)) {
		violations.push(`[${infrastructurePath}] Managed infrastructure registration must be finalized`);
	}
}

async function discoverContexts(contextsRoot: string): Promise<string[]> {
	try {
		const entries = await readdir(contextsRoot, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isDirectory())
			.map((entry) => entry.name)
			.sort();
	} catch {
		return [];
	}
}

async function checkContext(suiteRoot: string, context: string, loaderPath: string, loader: string, violations: string[]): Promise<void> {
	const contextRoot = path.join(suiteRoot, 'contexts', context);
	const contextIndex = path.join(contextRoot, 'step-definitions', 'index.ts');
	if (!loader.includes(`../contexts/${context}/step-definitions/index.ts`)) {
		violations.push(`[${loaderPath}] Central loader must import the ${context} context step-definition index`);
	}
	if (!(await exists(contextIndex))) {
		violations.push(`[${contextIndex}] Context step-definition index must exist`);
		return;
	}

	const stepDirectory = path.dirname(contextIndex);
	const stepFiles = (await readdir(stepDirectory)).filter((name) => /\.steps\.tsx?$/.test(name));
	if (stepFiles.length === 0) {
		violations.push(`[${stepDirectory}] Context must contain at least one *.steps.ts or *.steps.tsx file`);
	}

	const indexContent = await readFile(contextIndex, 'utf8');
	for (const stepFile of stepFiles) {
		if (!indexContent.includes(`./${stepFile}`)) {
			violations.push(`[${contextIndex}] Context index must import ${stepFile}`);
		}
		const stepPath = path.join(stepDirectory, stepFile);
		const stepContent = await readFile(stepPath, 'utf8');
		if (!/from\s+['"]@cucumber\/cucumber['"]/.test(stepContent)) {
			violations.push(`[${stepPath}] Step definitions must use Cucumber`);
		}
		const abstractionImports = [...stepContent.matchAll(/from\s+['"]\.\.\/(tasks|questions)\/([^'"]+)['"]/g)];
		if (abstractionImports.length === 0 || !/\.(attemptsTo|answer)\s*\(/.test(stepContent)) {
			violations.push(`[${stepPath}] Step definitions must delegate behavior to a task, interaction, or question`);
		}
		for (const match of abstractionImports) {
			const relativeFile = match[2];
			if (!relativeFile) continue;
			const abstractionPath = path.join(contextRoot, match[1] as string, relativeFile);
			if (!(await exists(abstractionPath))) {
				violations.push(`[${abstractionPath}] Imported Screenplay abstraction must exist`);
				continue;
			}
			const abstraction = await readFile(abstractionPath, 'utf8');
			if (!/from\s+['"]@serenity-js\/core['"]/.test(abstraction) || !/\b(Task|Interaction|Question)\b/.test(abstraction)) {
				violations.push(`[${abstractionPath}] Context tasks and questions must implement a Serenity Screenplay abstraction`);
			}
		}
	}
}
