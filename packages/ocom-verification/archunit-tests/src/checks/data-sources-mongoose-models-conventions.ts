import * as path from 'node:path';
import { getFilesMatching, readFile, toPascalCase } from '../utils/source-files.js';

export function checkOComModelExportNaming(config: { modelsGlob: string }): string[] {
	const violations: string[] = [];

	for (const filePath of getFilesMatching(config.modelsGlob, '.model.ts')) {
		const fileName = path.basename(filePath, '.model.ts');
		const modelName = toPascalCase(fileName);
		const content = readFile(filePath);

		const expectedExports = [`${modelName}ModelFactory`, `${modelName}ModelType`, `${modelName}ModelName`];

		for (const expectedExport of expectedExports) {
			if (!content.includes(expectedExport)) {
				violations.push(`[${filePath}] Model file must export ${expectedExport} to match ${fileName}.model.ts`);
			}
		}
	}

	return violations;
}
