import { getFilesMatching, getRelativeSegmentsAfter, readFile } from '../utils/source-files.js';

export function checkOComApplicationServicesFactoryExports(config: { applicationServicesGlob: string }): string[] {
	const violations: string[] = [];

	for (const filePath of getFilesMatching(config.applicationServicesGlob, 'index.ts')) {
		const segments = getRelativeSegmentsAfter(filePath, '/contexts/');
		if (segments.length !== 3) {
			continue;
		}

		const content = readFile(filePath);
		const interfaceMatch = content.match(/export\s+interface\s+(\w+)ApplicationService\b/);
		if (!interfaceMatch) {
			continue;
		}

		const expectedFactoryName = interfaceMatch[1];
		const exportPattern = new RegExp(`export\\s+const\\s+${expectedFactoryName}\\s*=\\s*\\(`);
		if (!exportPattern.test(content)) {
			violations.push(`[${filePath}] Entity application-service index must export const ${expectedFactoryName}`);
		}
	}

	return violations;
}
