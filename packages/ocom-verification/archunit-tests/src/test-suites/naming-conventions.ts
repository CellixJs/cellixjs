import { describe, expect, it } from 'vitest';
import { checkOComContainerGraphqlPairing } from '../checks/frontend-architecture.js';

export interface NamingConventionsConfig {
	uiSourcePath?: string;
}

export function describeNamingConventionTests(config?: NamingConventionsConfig): void {
	describe('OCom Naming Conventions', () => {
		it('container graphql files must have sibling container components', async () => {
			const violations = await checkOComContainerGraphqlPairing(config);
			expect(violations).toStrictEqual([]);
		}, 30000);
	});
}
