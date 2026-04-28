import { describe, expect, it } from 'vitest';
import { checkOComApplicationServicesFactoryExports } from '../checks/application-services-conventions.js';

export interface ApplicationServicesConventionTestsConfig {
	applicationServicesGlob: string;
	applicationServicesAllGlob: string;
}

export function describeApplicationServicesConventionTests(config: ApplicationServicesConventionTestsConfig): void {
	describe('OCom Application Services Conventions', () => {
		it('entity indexes must export a factory named after the entity folder', async () => {
			const violations = await checkOComApplicationServicesFactoryExports({
				applicationServicesGlob: config.applicationServicesGlob,
			});
			expect(violations).toStrictEqual([]);
		}, 30000);
	});
}
