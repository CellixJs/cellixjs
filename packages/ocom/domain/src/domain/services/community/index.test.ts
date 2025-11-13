import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { Community } from './index.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
	path.resolve(__dirname, 'features/index.feature'),
);

test.for(feature, ({ Scenario }) => {
	let communityServices: typeof Community;

	Scenario(
		'Exporting CommunityProvisioningService',
		({ Given, When, Then, And }) => {
			Given('the community services index module', () => {
				// Module is already imported
			});

			When('I import the Community object', () => {
				communityServices = Community;
			});

			Then('it should contain a CommunityProvisioningService instance', () => {
				expect(communityServices.CommunityProvisioningService).toBeDefined();
				expect(typeof communityServices.CommunityProvisioningService).toBe(
					'object',
				);
			});

			And(
				'the CommunityProvisioningService should have a provisionMemberAndDefaultRole method',
				() => {
					expect(
						typeof communityServices.CommunityProvisioningService
							.provisionMemberAndDefaultRole,
					).toBe('function');
				},
			);
		},
	);
});
