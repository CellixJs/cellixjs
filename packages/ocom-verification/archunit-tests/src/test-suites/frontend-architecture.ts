import { describe, expect, it } from 'vitest';
import { checkOComContainerPlacement } from '../checks/frontend-architecture.js';

export interface FrontendArchitectureTestsConfig {
	uiSourcePath: string;
	testName?: string;
	allowedContainerPaths?: string[];
}

export function describeFrontendArchitectureTests(config: FrontendArchitectureTestsConfig): void {
	describe(`OCom Frontend Architecture - ${config.testName || 'UI'}`, () => {
		it('container components must live inside components directories', async () => {
			const violations = await checkOComContainerPlacement({
				uiSourcePath: config.uiSourcePath,
				...(config.allowedContainerPaths ? { allowedContainerPaths: config.allowedContainerPaths } : {}),
			});
			expect(violations).toStrictEqual([]);
		}, 30000);
	});
}
