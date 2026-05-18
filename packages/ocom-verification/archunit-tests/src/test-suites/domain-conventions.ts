import { describe, expect, it } from 'vitest';
import { checkOComDomainContextAuthorizationFiles } from '../checks/domain-conventions.js';

export interface DomainConventionTestsConfig {
	domainContextsGlob: string;
}

export function describeDomainConventionTests(config: DomainConventionTestsConfig): void {
	describe('OCom Domain Conventions', () => {
		it('contexts must define passport, domain-permissions, and visa files', async () => {
			const violations = await checkOComDomainContextAuthorizationFiles(config);
			expect(violations).toStrictEqual([]);
		}, 30000);
	});
}
