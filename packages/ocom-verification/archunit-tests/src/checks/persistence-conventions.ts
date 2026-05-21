import { getFilesMatching, getRelativeSegmentsAfter, readFile } from '../utils/source-files.js';

export function checkOComPersistenceFactoryExports(config: { persistenceDomainGlob: string; persistenceReadonlyGlob: string }): string[] {
	const violations: string[] = [];

	for (const filePath of getFilesMatching(config.persistenceDomainGlob, 'index.ts')) {
		const segments = getRelativeSegmentsAfter(filePath, '/datasources/domain/');
		if (segments.length !== 3) {
			continue;
		}

		const content = readFile(filePath);
		if (!content.includes('export const')) {
			continue;
		}
		const unitOfWorkMatch = content.match(/get(\w+)UnitOfWork/);
		if (!unitOfWorkMatch) {
			continue;
		}

		const expectedFactoryName = `${unitOfWorkMatch[1]}Persistence`;
		const exportPattern = new RegExp(`export\\s+const\\s+${expectedFactoryName}\\s*=\\s*\\(`);
		if (!exportPattern.test(content)) {
			violations.push(`[${filePath}] Domain persistence index must export const ${expectedFactoryName}`);
		}
	}

	for (const filePath of getFilesMatching(config.persistenceReadonlyGlob, 'index.ts')) {
		const segments = getRelativeSegmentsAfter(filePath, '/datasources/readonly/');
		if (segments.length !== 3) {
			continue;
		}

		const content = readFile(filePath);
		if (!content.includes('export const')) {
			continue;
		}
		const readRepositoryMatch = content.match(/get(\w+)ReadRepository/);
		if (!readRepositoryMatch) {
			continue;
		}

		const expectedFactoryName = `${readRepositoryMatch[1]}ReadRepositoryImpl`;
		const exportPattern = new RegExp(`export\\s+const\\s+${expectedFactoryName}\\s*=\\s*\\(`);
		if (!exportPattern.test(content)) {
			violations.push(`[${filePath}] Readonly persistence index must export const ${expectedFactoryName}`);
		}
	}

	return violations;
}
