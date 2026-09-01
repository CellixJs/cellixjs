import type { ApiContextSpec } from '@ocom/context-spec';
import { Domain } from '@ocom/domain';
import { describe, expect, it, vi } from 'vitest';
import { buildApplicationServicesFactory } from './index.ts';

const endUser = { id: 'user-1' };
const memberOfCommunityA = {
	id: 'member-1',
	accounts: [{ user: { id: 'user-1' } }],
	community: { id: 'community-a' },
	role: { id: 'role-1' },
};
function buildContext(overrides?: { member?: unknown }) {
	const currentMemberLookup = vi.fn((_endUserId: string, communityId: string) => {
		if (overrides?.member !== undefined) {
			return overrides.member;
		}
		return communityId === 'community-a' ? memberOfCommunityA : null;
	});
	const hintedMemberLookup = vi.fn().mockResolvedValue(memberOfCommunityA);
	const readonlyDataSource = {
		User: {
			EndUser: { EndUserReadRepo: { getByExternalId: vi.fn().mockResolvedValue(endUser) } },
		},
		Community: {
			Member: {
				MemberReadRepo: {
					getByEndUserIdAndCommunityIdWithRole: currentMemberLookup,
					getByIdWithCommunityAndRoleAndUser: hintedMemberLookup,
				},
			},
			Community: { CommunityReadRepo: { getById: vi.fn().mockResolvedValue({ id: 'community-a' }) } },
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
	return { context, withPassport, currentMemberLookup, hintedMemberLookup };
}

describe('buildApplicationServicesFactory forRequest principal hints', () => {
	it('falls back to the guest passport when the verified user has no member in the requested community', async () => {
		const { context, withPassport, currentMemberLookup } = buildContext();
		const factory = buildApplicationServicesFactory(context);

		await expect(factory.forRequest('Bearer token', { memberId: 'member-1', communityId: 'community-b' })).resolves.toBeDefined();

		expect(currentMemberLookup).toHaveBeenCalledWith('user-1', 'community-b');
		expect(withPassport).toHaveBeenCalledTimes(1);
		expect(withPassport.mock.calls[0]?.[0]).toStrictEqual(Domain.PassportFactory.forGuest());
	});

	it('falls back to the guest passport when the verified current-member lookup does not return a member', async () => {
		const { context, withPassport } = buildContext({ member: null });
		const factory = buildApplicationServicesFactory(context);

		await expect(factory.forRequest('Bearer token', { memberId: 'member-2', communityId: 'community-a' })).resolves.toBeDefined();

		expect(withPassport.mock.calls[0]?.[0]).toStrictEqual(Domain.PassportFactory.forGuest());
	});

	it('fails closed without throwing when the verified current member has no populated role', async () => {
		const rolelessMember = Object.defineProperty(
			{
				...memberOfCommunityA,
				role: undefined,
			},
			'role',
			{
				get() {
					throw new Error('role is not populated');
				},
			},
		);
		const { context, withPassport } = buildContext({ member: rolelessMember });
		const factory = buildApplicationServicesFactory(context);

		await expect(factory.forRequest('******', { memberId: 'member-1', communityId: 'community-a' })).resolves.toBeDefined();

		expect(withPassport.mock.calls[0]?.[0]).toStrictEqual(Domain.PassportFactory.forGuest());
	});

	it('propagates an unexpected current-member role resolution failure', async () => {
		const unavailableRoleMember = Object.defineProperty(
			{
				...memberOfCommunityA,
				role: undefined,
			},
			'role',
			{
				get() {
					throw new Error('role service unavailable');
				},
			},
		);
		const { context } = buildContext({ member: unavailableRoleMember });
		const factory = buildApplicationServicesFactory(context);

		await expect(factory.forRequest('******', { memberId: 'member-1', communityId: 'community-a' })).rejects.toThrow('role service unavailable');
	});

	it('uses the verified-user and community lookup rather than the untrusted member-id hint', async () => {
		const { context, withPassport, currentMemberLookup, hintedMemberLookup } = buildContext();
		const factory = buildApplicationServicesFactory(context);

		await factory.forRequest('Bearer token', { memberId: 'member-1', communityId: 'community-a' });

		expect(currentMemberLookup).toHaveBeenCalledWith('user-1', 'community-a');
		expect(hintedMemberLookup).not.toHaveBeenCalled();
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
