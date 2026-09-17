import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { describe, expect, it, vi } from 'vitest';
import type { Passport } from '../../passport.ts';
import { CommunityConfig, type CommunityConfigProps } from './community-config.ts';

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

describe('CommunityConfig', () => {
	it('creates a new instance with pricing and limits', () => {
		const config = CommunityConfig.getNewInstance(makeProps(), 'enterprise', 2000, 'USD', 200, 10, new Date('2024-01-01T00:00:00Z'), makePassport(true));
		expect(config.subscriptionTier).toBe('enterprise');
		expect(config.subscription.pricePerMember).toBe(2000);
		expect(config.limits.maxMembers).toBe(200);
	});

	it('rejects writes without a system passport', () => {
		const config = new CommunityConfig(makeProps(), makePassport(false));
		expect(() => {
			config.subscriptionTier = 'enterprise';
		}).toThrow(PermissionError);
	});
});
