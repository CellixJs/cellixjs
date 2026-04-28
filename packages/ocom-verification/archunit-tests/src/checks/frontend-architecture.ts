import { fileExists, getAllFiles, resolveSearchRoot, toPosixPath } from '../utils/source-files.js';

export function checkOComContainerPlacement(config: { uiSourcePath: string; allowedContainerPaths?: string[] }): string[] {
	const violations: string[] = [];
	const sourceRoot = resolveSearchRoot(config.uiSourcePath);
	const allowedContainerPaths = new Set(config.allowedContainerPaths ?? []);

	for (const filePath of getAllFiles(sourceRoot)) {
		const normalizedPath = toPosixPath(filePath);
		if (!normalizedPath.endsWith('.container.tsx')) {
			continue;
		}
		const relativePath = normalizedPath.slice(toPosixPath(sourceRoot).length + 1);
		if (allowedContainerPaths.has(relativePath)) {
			continue;
		}

		if (!normalizedPath.includes('/components/')) {
			violations.push(`[${filePath}] Container component must live in a components/ directory`);
		}
	}

	return violations;
}

export function checkOComContainerGraphqlPairing(config: { uiSourcePath?: string } = {}): string[] {
	const violations: string[] = [];
	const sourceRoot = resolveSearchRoot(config.uiSourcePath ?? './src');

	for (const filePath of getAllFiles(sourceRoot)) {
		if (!filePath.endsWith('.container.graphql')) {
			continue;
		}

		const componentPath = filePath.replace(/\.container\.graphql$/, '.container.tsx');
		if (!fileExists(componentPath)) {
			violations.push(`[${filePath}] Container GraphQL document must have a sibling .container.tsx component`);
		}
	}

	return violations;
}
