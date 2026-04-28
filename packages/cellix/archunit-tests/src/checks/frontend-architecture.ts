import * as fs from 'node:fs';
import * as path from 'node:path';
import { getAllFiles, isKebabCase } from '../utils/frontend-helpers.js';

export interface FrontendArchitectureConfig {
	uiSourcePath: string;
	requiredTopLevelDirectories?: string[];
	requiredComponentDirectories?: string[];
	allowedLegacyDirectories?: string[];
}

export async function checkFrontendArchitecture(config: FrontendArchitectureConfig): Promise<string[]> {
	if (!config.uiSourcePath) {
		throw new Error('checkFrontendArchitecture requires uiSourcePath to be set');
	}

	const violations: string[] = [];
	const resolvedPath = path.resolve(process.cwd(), config.uiSourcePath);
	const requiredTopLevelDirectories = config.requiredTopLevelDirectories ?? ['components', 'config'];
	const requiredComponentDirectories = config.requiredComponentDirectories ?? ['pages', 'shared'];
	const allowedLegacyDirectories = config.allowedLegacyDirectories ?? [];

	for (const directory of requiredTopLevelDirectories) {
		if (!fs.existsSync(path.join(resolvedPath, directory))) {
			violations.push(`Missing required directory: ${directory}`);
		}
	}
	for (const directory of requiredComponentDirectories) {
		if (!fs.existsSync(path.join(resolvedPath, 'components', directory))) {
			violations.push(`components/${directory} directory is required`);
		}
	}
	if (!allowedLegacyDirectories.includes('pages') && fs.existsSync(path.join(resolvedPath, 'pages'))) {
		violations.push('Legacy pages directory is not allowed; use components/pages');
	}
	if (!allowedLegacyDirectories.includes('components/layouts') && fs.existsSync(path.join(resolvedPath, 'components', 'layouts'))) {
		violations.push('Legacy components/layouts directory is not allowed');
	}

	const allFiles = await getAllFiles(`${config.uiSourcePath}/**/*.tsx`);

	const allDirNames = new Set<string>();
	for (const file of allFiles) {
		const dir = path.dirname(file);
		const parts = dir.split(path.sep);
		for (const part of parts) {
			if (part && !part.startsWith('.') && part !== 'node_modules' && part !== 'coverage' && part !== 'build') {
				allDirNames.add(part);
			}
		}
	}

	for (const dir of allDirNames) {
		if (!isKebabCase(dir)) {
			violations.push(`Directory '${dir}' must use kebab-case naming`);
		}
	}

	const containerFiles = allFiles.filter((f) => f.endsWith('.container.tsx'));
	for (const file of containerFiles) {
		const fileName = path.basename(file, '.container.tsx');
		if (!isKebabCase(fileName)) {
			violations.push(`Container file '${fileName}' must use kebab-case`);
		}
	}

	const storyFiles = allFiles.filter((f) => f.endsWith('.stories.tsx'));
	for (const file of storyFiles) {
		let fileName = path.basename(file, '.stories.tsx');
		if (fileName.endsWith('.container')) {
			fileName = fileName.replace('.container', '');
		}
		if (!isKebabCase(fileName)) {
			violations.push(`Story file '${path.basename(file)}' must use kebab-case`);
		}
	}

	return violations;
}
