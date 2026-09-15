import type { Domain } from '@ocom/domain';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ModelsContext } from '../../../../index.ts';
import { CommunityConfigDataSourceImpl } from './community-config.data.ts';
import { CommunityConfigReadRepositoryImpl } from './community-config.read-repository.ts';

vi.mock('./community-config.data.ts', () => ({
	CommunityConfigDataSourceImpl: vi.fn(),
}));

function makePassport() {
	return {
		community: {
			forCommunity: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
	} as unknown as Domain.Passport;
}

describe('CommunityConfigReadRepositoryImpl', () => {
	let repository: CommunityConfigReadRepositoryImpl;
	let mockDataSource: {
		findById: ReturnType<typeof vi.fn>;
		aggregate: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		mockDataSource = {
			findById: vi.fn(),
			aggregate: vi.fn(),
		};
		vi.mocked(CommunityConfigDataSourceImpl).mockImplementation(function MockCommunityConfigDataSourceImpl() {
			return mockDataSource as unknown as InstanceType<typeof CommunityConfigDataSourceImpl>;
		});
		repository = new CommunityConfigReadRepositoryImpl({ CommunityConfig: {} } as ModelsContext, makePassport());
	});

	it('selects the latest effective config and ignores future dates', async () => {
		mockDataSource.aggregate.mockResolvedValue([
			{
				_id: 'cfg-current',
				id: 'cfg-current',
				subscriptionTier: 'pro',
				subscription: { pricePerMember: 1500, currency: 'USD' },
				limits: { maxMembers: 50, maxAdmins: 2 },
				effectiveDate: new Date('2024-06-01T00:00:00.000Z'),
				schemaVersion: '1.0.0',
				createdAt: new Date(),
				updatedAt: new Date(),
			},
		]);

		const asOf = new Date('2026-01-01T00:00:00.000Z');
		const result = await repository.getLatestEffective('pro', asOf);

		expect(mockDataSource.aggregate).toHaveBeenCalledWith([
			{
				$match: {
					subscriptionTier: 'pro',
					effectiveDate: { $lte: asOf },
				},
			},
			{ $sort: { effectiveDate: -1 } },
			{ $limit: 1 },
		]);
		expect(result?.subscription.pricePerMember).toBe(1500);
	});

	it('returns null when no effective config exists', async () => {
		mockDataSource.aggregate.mockResolvedValue([]);
		const result = await repository.getLatestEffective('enterprise');
		expect(result).toBeNull();
	});
});
