import * as path from 'node:path';
import { fileExists, getImmediateDirectories, resolveSearchRoot } from '../utils/source-files.js';

export function checkOComDomainContextAuthorizationFiles(config: { domainContextsGlob: string }): string[] {
	const violations: string[] = [];
	const contextsRoot = resolveSearchRoot(config.domainContextsGlob);

	for (const contextDirectory of getImmediateDirectories(contextsRoot)) {
		if (!fileExists(path.join(contextDirectory, 'index.ts'))) {
			continue;
		}

		const contextName = path.basename(contextDirectory);
		const requiredFiles = [`${contextName}.passport.ts`, `${contextName}.domain-permissions.ts`, `${contextName}.visa.ts`];

		for (const requiredFile of requiredFiles) {
			if (!fileExists(path.join(contextDirectory, requiredFile))) {
				violations.push(`[${contextDirectory}] Context must define ${requiredFile}`);
			}
		}
	}

	return violations;
}
