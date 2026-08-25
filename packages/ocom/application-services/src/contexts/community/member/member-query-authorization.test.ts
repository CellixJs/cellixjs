import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queryByCommunityId } from './query-by-community-id.ts';
import { queryByIdWithRole } from './query-by-id-with-role.ts';

type DataSources = Parameters<typeof queryByCommunityId>[0];

describe('member query authorization', () => {
	let canManageMembers: boolean;
	let isSystemAccount: boolean;
	let managedCommunityId: string;
	let forCommunity: ReturnType<typeof vi.fn>;
	let memberReadRepo: {
		getByCommunityId: ReturnType<typeof vi.fn>;
		getByIdWithRole: ReturnType<typeof vi.fn>;
	};
	let dataSources: DataSources;

	beforeEach(() => {
		canManageMembers = true;
		isSystemAccount = false;
		managedCommunityId = 'community-1';
		forCommunity = vi.fn((community: { id: string }) => ({
			determineIf: (predicate: (permissions: { canManageMembers: boolean; isSystemAccount: boolean }) => boolean) => community.id === managedCommunityId && predicate({ canManageMembers, isSystemAccount }),
		}));
		memberReadRepo = {
			getByCommunityId: vi.fn(),
			getByIdWithRole: vi.fn(),
		};
		dataSources = {
			passport: {
				community: {
					forCommunity,
				},
			},
			readonlyDataSource: {
				Community: {
					Member: {
						MemberReadRepo: memberReadRepo,
					},
				},
			},
		} as unknown as DataSources;
	});

	it('authorizes a community read before repository access, including empty communities', async () => {
		canManageMembers = false;
		memberReadRepo.getByCommunityId.mockResolvedValue([]);

		await expect(queryByCommunityId(dataSources)({ communityId: 'community-1' })).rejects.toThrow('Unauthorized');
		expect(memberReadRepo.getByCommunityId).not.toHaveBeenCalled();
		expect(forCommunity).toHaveBeenCalledWith({ id: 'community-1' });
	});

	it('returns community members for a manager and preserves the requested fields', async () => {
		memberReadRepo.getByCommunityId.mockResolvedValue([{ id: 'member-1', communityId: 'community-1' }]);

		await expect(queryByCommunityId(dataSources)({ communityId: 'community-1', fields: ['memberName'] })).resolves.toEqual([{ id: 'member-1', communityId: 'community-1' }]);
		expect(memberReadRepo.getByCommunityId).toHaveBeenCalledWith('community-1', { fields: ['memberName'] });
	});

	it('allows a system passport to read an empty community', async () => {
		canManageMembers = false;
		isSystemAccount = true;
		memberReadRepo.getByCommunityId.mockResolvedValue([]);

		await expect(queryByCommunityId(dataSources)({ communityId: 'community-1' })).resolves.toEqual([]);
	});

	it('authorizes a by-id role read against the returned member community', async () => {
		memberReadRepo.getByIdWithRole.mockResolvedValue({ id: 'member-1', communityId: 'community-1', role: { id: 'role-1' } });

		await expect(queryByIdWithRole(dataSources)({ id: 'member-1' })).resolves.toMatchObject({ id: 'member-1', role: { id: 'role-1' } });
		expect(forCommunity).toHaveBeenCalledWith({ id: 'community-1' });
	});

	it.each([
		['a guest or member without member-management permission', 'community-1', false],
		['a manager acting in another community', 'community-2', true],
	] as const)('rejects %s from reading another member role', async (_description, targetCommunityId, permission) => {
		canManageMembers = permission;
		memberReadRepo.getByIdWithRole.mockResolvedValue({ id: 'member-2', communityId: targetCommunityId, role: { id: 'role-2' } });

		await expect(queryByIdWithRole(dataSources)({ id: 'member-2' })).rejects.toThrow('Unauthorized');
	});

	it('returns null without consulting a visa when the member is missing', async () => {
		memberReadRepo.getByIdWithRole.mockResolvedValue(null);

		await expect(queryByIdWithRole(dataSources)({ id: 'missing' })).resolves.toBeNull();
		expect(forCommunity).not.toHaveBeenCalled();
	});
});
