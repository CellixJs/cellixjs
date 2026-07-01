import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { containsCall, containsIfThrow, containsJsxTag, localImportName, parseTypeScript } from './typescript-source.js';

export interface UiAppCompositionConfig {
	/** Directory containing `main.tsx` and `App.tsx`. */
	appRoot: string;
	/** Provider component names that must wrap the application bootstrap. */
	requiredProviders?: string[];
}

async function readSource(filePath: string, violations: string[]): Promise<string | undefined> {
	try {
		return await readFile(filePath, 'utf8');
	} catch {
		violations.push(`[${filePath}] Required UI composition file must exist`);
		return undefined;
	}
}

/**
 * Check that a Cellix browser app validates its mount point and composes its configured providers and routes.
 *
 * @param config - Source root and provider names required by the consumer application.
 * @returns Every bootstrap violation; an empty array means the UI composition complies.
 * @example
 * ```typescript
 * await checkUiAppComposition({ appRoot: 'src', requiredProviders: ['BrowserRouter'] });
 * ```
 */
export async function checkUiAppComposition(config: UiAppCompositionConfig): Promise<string[]> {
	if (!config.appRoot) {
		throw new Error('checkUiAppComposition requires appRoot to be set');
	}

	const violations: string[] = [];
	const mainPath = path.join(config.appRoot, 'main.tsx');
	const appPath = path.join(config.appRoot, 'App.tsx');
	const main = await readSource(mainPath, violations);
	const app = await readSource(appPath, violations);

	if (main) {
		const source = parseTypeScript(mainPath, main);
		if (!containsCall(source, 'createRoot')) {
			violations.push(`[${mainPath}] UI bootstrap must create a React root`);
		}
		if (!/getElementById\s*\(\s*['"]root['"]\s*\)/.test(main)) {
			violations.push(`[${mainPath}] UI bootstrap must resolve the #root mount element`);
		}
		if (!containsIfThrow(source)) {
			violations.push(`[${mainPath}] UI bootstrap must guard against a missing root element`);
		}
		if (!containsJsxTag(source, 'React.StrictMode')) {
			violations.push(`[${mainPath}] UI bootstrap must enable React.StrictMode`);
		}
		if (!containsJsxTag(source, 'App')) {
			violations.push(`[${mainPath}] UI bootstrap must render App`);
		}
		for (const provider of config.requiredProviders ?? []) {
			if (!containsJsxTag(source, provider)) {
				violations.push(`[${mainPath}] UI bootstrap must compose ${provider}`);
			}
		}
	}

	if (app) {
		const source = parseTypeScript(appPath, app);
		const routes = localImportName(source, 'react-router-dom', 'Routes');
		const route = localImportName(source, 'react-router-dom', 'Route');
		if (!routes || !route || !containsJsxTag(source, routes) || !containsJsxTag(source, route)) {
			violations.push(`[${appPath}] App must compose routes with React Router Routes and Route`);
		}
	}

	return violations;
}
