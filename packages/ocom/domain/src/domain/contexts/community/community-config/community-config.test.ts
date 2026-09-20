import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { expect, vi } from 'vitest';
import type { Passport } from '../../passport.ts';
import { CommunityConfig, type CommunityConfigProps } from './community-config.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/community-config.feature'));

function makePassport(isSystemAccount = true): Passport {
	return {
		community: {
			forCommunity: vi.fn(() => ({
				determineIf: (fn: (permissions: { isSystemAccount: boolean }) => boolean) => fn({ isSystemAccount }),
			})),
		},
	} as unknown as Passport;
}

function makeProps(): CommunityConfigProps {
	return {
		id: 'config-1',
		subscriptionTier: 'pro',
		subscription: {
			pricePerMember: 1000,
			currency: 'USD',
		},
		limits: {
			maxMembers: 50,
			maxAdmins: 2,
		},
		effectiveDate: new Date('2020-01-01T00:00:00Z'),
		createdAt: new Date('2020-01-01T00:00:00Z'),
		updatedAt: new Date('2020-01-01T00:00:00Z'),
		schemaVersion: '1.0.0',
	};
}

test.for(feature, ({ Scenario }) => {
	Scenario('Creating configuration for a subscription tier', ({ Given, When, Then, And }) => {
		let passport: Passport;
		let config: CommunityConfig<CommunityConfigProps>;

		Given('a system account passport', () => {
			passport = makePassport(true);
		});
		When('a new CommunityConfig is created for the "enterprise" tier at 2000 cents per member with limits of 200 members and 10 admins', () => {
			config = CommunityConfig.getNewInstance(makeProps(), 'enterprise', 2000, 'USD', 200, 10, new Date('2024-01-01T00:00:00Z'), passport);
		});
		Then('the subscription tier should be "enterprise"', () => {
			expect(config.subscriptionTier).toBe('enterprise');
		});
		And('the price per member should be 2000', () => {
			expect(config.subscription.pricePerMember).toBe(2000);
		});
		And('the member limit should be 200', () => {
			expect(config.limits.maxMembers).toBe(200);
		});
	});

	Scenario('Changing configuration without a system account', ({ Given, When, Then }) => {
		let config: CommunityConfig<CommunityConfigProps>;
		let caught: unknown;

		Given('a passport that is not a system account', () => {
			config = new CommunityConfig(makeProps(), makePassport(false));
		});
		When('the subscription tier is changed to "enterprise"', () => {
			try {
				config.subscriptionTier = 'enterprise';
			} catch (error) {
				caught = error;
			}
		});
		Then('a PermissionError should be thrown', () => {
			expect(caught).toBeInstanceOf(PermissionError);
		});
	});
});
