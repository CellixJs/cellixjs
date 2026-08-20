import type { ApiContextSpec } from '@ocom/context-spec';
import { Domain } from '@ocom/domain';
import { describe, expect, it, vi } from 'vitest';
import { buildApplicationServicesFactory } from './index.ts';

const endUser = { id: 'user-1' };
const memberOfCommunityA = {
	id: 'member-1',
	accounts: [{ user: { id: 'user-1' } }],
	community: { id: 'community-a' },
};
const foreignMember = {
	id: 'member-2',
	accounts: [{ user: { id: 'someone-else' } }],
	community: { id: 'community-a' },
};

function buildContext(overrides?: { member?: unknown; community?: unknown }) {
	const readonlyDataSource = {
		User: {
			EndUser: { EndUserReadRepo: { getByExternalId: vi.fn().mockResolvedValue(endUser) } },
		},
		Community: {
			Member: { MemberReadRepo: { getByIdWithCommunityAndRoleAndUser: vi.fn().mockResolvedValue(overrides?.member ?? memberOfCommunityA) } },
			Community: { CommunityReadRepo: { getById: vi.fn().mockResolvedValue(overrides?.community ?? { id: 'community-a' }) } },
		},
	};
	const withPassport = vi.fn().mockReturnValue({});
	const context = {
		tokenValidationService: {
			verifyJwt: vi.fn().mockResolvedValue({
				verifiedJwt: { given_name: 'A', family_name: 'B', email: 'a@b.co', sub: 'ext-1' },
				openIdConfigKey: 'AccountPortal',
			}),
		},
		dataSourcesFactory: {
			withSystemPassport: () => ({ readonlyDataSource }),
			withPassport,
		},
		blobStorageService: {},
		queueStorageService: {},
	} as unknown as ApiContextSpec;
	return { context, withPassport };
}

describe('buildApplicationServicesFactory forRequest principal hints', () => {
	it('falls back to the guest passport when the member does not belong to the hinted community', async () => {
		const { context, withPassport } = buildContext({ community: { id: 'community-b' } });
		const factory = buildApplicationServicesFactory(context);

		await expect(factory.forRequest('Bearer token', { memberId: 'member-1', communityId: 'community-b' })).resolves.toBeDefined();

		expect(withPassport).toHaveBeenCalledTimes(1);
		expect(withPassport.mock.calls[0]?.[0]).toStrictEqual(Domain.PassportFactory.forGuest());
	});

	it('falls back to the guest passport when the hinted member belongs to another user', async () => {
		const { context, withPassport } = buildContext({ member: foreignMember });
		const factory = buildApplicationServicesFactory(context);

		await expect(factory.forRequest('Bearer token', { memberId: 'member-2', communityId: 'community-a' })).resolves.toBeDefined();

		expect(withPassport.mock.calls[0]?.[0]).toStrictEqual(Domain.PassportFactory.forGuest());
	});

	it('builds a member passport when the hinted member and community match', async () => {
		const { context, withPassport } = buildContext();
		const factory = buildApplicationServicesFactory(context);

		await factory.forRequest('Bearer token', { memberId: 'member-1', communityId: 'community-a' });

		expect(withPassport.mock.calls[0]?.[0]).not.toStrictEqual(Domain.PassportFactory.forGuest());
	});

	it('propagates unexpected passport construction failures instead of falling back to guest', async () => {
		const { context } = buildContext();
		const forMember = vi.spyOn(Domain.PassportFactory, 'forMember').mockImplementation(() => {
			throw new Error('unexpected forMember failure');
		});
		try {
			const factory = buildApplicationServicesFactory(context);

			await expect(factory.forRequest('Bearer token', { memberId: 'member-1', communityId: 'community-a' })).rejects.toThrow('unexpected forMember failure');
		} finally {
			forMember.mockRestore();
		}
	});
});
