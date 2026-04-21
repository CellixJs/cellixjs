import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	activateMember,
	bulkActivateMembers,
	bulkDeactivateMembers,
	bulkRemoveMembers,
	createMemberAccount,
	deactivateMember,
	removeMember,
	removeMemberAccount,
	updateMemberProfile,
	updateMemberAccount,
	updateMemberRole,
} from './member-management.ts';

type DataSources = Parameters<typeof updateMemberRole>[0];

describe('member-management operations', () => {
	let dataSources: DataSources;
	let memberRepository: {
		getById: ReturnType<typeof vi.fn>;
		save: ReturnType<typeof vi.fn>;
	};
	let roleRepository: {
		getById: ReturnType<typeof vi.fn>;
	};
	let endUserReadRepository: {
		getById: ReturnType<typeof vi.fn>;
	};
	let memberReadRepository: {
		getByCommunityId: ReturnType<typeof vi.fn>;
	};

	beforeEach(() => {
		memberRepository = {
			getById: vi.fn(),
			save: vi.fn(),
		};
		roleRepository = {
			getById: vi.fn(),
		};
		endUserReadRepository = {
			getById: vi.fn(),
		};
		memberReadRepository = {
			getByCommunityId: vi.fn(),
		};

		dataSources = {
			domainDataSource: {
				Community: {
					Member: {
						MemberUnitOfWork: {
							withScopedTransaction: vi.fn(async (callback: (repo: typeof memberRepository) => Promise<void>) => callback(memberRepository)),
						},
					},
					Role: {
						EndUserRole: {
							EndUserRoleUnitOfWork: {
								withScopedTransaction: vi.fn(async (callback: (repo: typeof roleRepository) => Promise<void>) => callback(roleRepository)),
							},
						},
					},
				},
			},
			readonlyDataSource: {
				User: {
					EndUser: {
						EndUserReadRepo: endUserReadRepository,
					},
				},
				Community: {
					Member: {
						MemberReadRepo: memberReadRepository,
					},
				},
			},
		} as unknown as DataSources;
	});

	it('updates a member role when role belongs to member community', async () => {
		const role = { id: 'role-1', community: { id: 'community-1' } };
		const member = { communityId: 'community-1', role: null };
		const savedMember = { id: 'member-1' };
		memberRepository.getById.mockResolvedValue(member);
		roleRepository.getById.mockResolvedValue(role);
		memberRepository.save.mockResolvedValue(savedMember);

		const result = await updateMemberRole(dataSources)({ memberId: 'member-1', roleId: 'role-1' });

		expect(result).toBe(savedMember);
		expect(member.role).toBe(role);
	});

	it('throws when role is from a different community', async () => {
		memberRepository.getById.mockResolvedValue({ communityId: 'community-1' });
		roleRepository.getById.mockResolvedValue({ id: 'role-1', community: { id: 'community-2' } });

		await expect(updateMemberRole(dataSources)({ memberId: 'member-1', roleId: 'role-1' })).rejects.toThrow('Role does not belong to the same community as the member');
	});

	it('throws when role does not exist', async () => {
		memberRepository.getById.mockResolvedValue({ props: { communityId: 'community-1' } });
		roleRepository.getById.mockResolvedValue(undefined);

		await expect(updateMemberRole(dataSources)({ memberId: 'member-1', roleId: 'role-1' })).rejects.toThrow('Role not found');
	});

	it('activates and deactivates a member', async () => {
		const member = {
			requestActivateMember: vi.fn(),
			requestDeactivateMember: vi.fn(),
		};
		const saved = { id: 'member-1' };
		memberRepository.getById.mockResolvedValue(member);
		memberRepository.save.mockResolvedValue(saved);

		const activated = await activateMember(dataSources)({ memberId: 'member-1' });
		const deactivated = await deactivateMember(dataSources)({ memberId: 'member-1', reason: 'manual' });

		expect(activated).toBe(saved);
		expect(deactivated).toBe(saved);
		expect(member.requestActivateMember).toHaveBeenCalledTimes(1);
		expect(member.requestDeactivateMember).toHaveBeenCalledTimes(1);
	});

	it('throws when activate/deactivate save returns nothing', async () => {
		memberRepository.getById.mockResolvedValue({
			requestActivateMember: vi.fn(),
			requestDeactivateMember: vi.fn(),
		});
		memberRepository.save.mockResolvedValue(undefined);

		await expect(activateMember(dataSources)({ memberId: 'member-1' })).rejects.toThrow('Unable to activate member');
		await expect(deactivateMember(dataSources)({ memberId: 'member-1' })).rejects.toThrow('Unable to deactivate member');
	});

	it('removes a member through domain operation', async () => {
		const member = { requestRemoveMember: vi.fn() };
		memberRepository.getById.mockResolvedValue(member);
		memberRepository.save.mockResolvedValue({ id: 'member-1' });

		await removeMember(dataSources)({ memberId: 'member-1', reason: 'cleanup' });

		expect(member.requestRemoveMember).toHaveBeenCalledTimes(1);
		expect(memberRepository.save).toHaveBeenCalled();
	});

	it('bulk operations continue on per-member failures', async () => {
		const memberOk = {
			requestActivateMember: vi.fn(),
			requestDeactivateMember: vi.fn(),
			requestRemoveMember: vi.fn(),
		};
		memberRepository.getById.mockImplementation((memberId: string) => {
			if (memberId === 'bad') {
				throw new Error('boom');
			}
			return memberOk;
		});
		memberRepository.save.mockResolvedValue({ id: 'saved' });

		const activated = await bulkActivateMembers(dataSources)({ memberIds: ['ok', 'bad'] });
		const deactivated = await bulkDeactivateMembers(dataSources)({ memberIds: ['ok', 'bad'], reason: 'policy' });
		await expect(bulkRemoveMembers(dataSources)({ memberIds: ['ok', 'bad'], reason: 'policy' })).rejects.toThrow('bad');

		expect(activated).toHaveLength(1);
		expect(deactivated).toHaveLength(1);
	});

	it('creates and updates account user association and derives names from end user', async () => {
		const endUserOne = {
			id: 'end-user-1',
			displayName: 'Jane Doe',
			personalInformation: {
				identityDetails: {
					restOfName: 'Jane',
					lastName: 'Doe',
				},
			},
		};
		const endUserTwo = {
			id: 'end-user-2',
			displayName: 'John Smith',
			personalInformation: {
				identityDetails: {
					restOfName: 'John',
					lastName: 'Smith',
				},
			},
		};
		const newAccount = { firstName: '', lastName: '', user: null };
		const existingAccount = { id: 'account-1', firstName: 'Old', lastName: 'Name', user: { id: 'end-user-old' } };
		const member = {
			requestNewAccount: vi.fn(() => newAccount),
			accounts: [existingAccount],
			communityId: 'community-1',
		};
		memberRepository.getById.mockResolvedValue(member);
		endUserReadRepository.getById.mockImplementation((id: string) => (id === 'end-user-1' ? endUserOne : endUserTwo));
		memberReadRepository.getByCommunityId.mockResolvedValue([{ accounts: [{ user: { id: 'end-user-1' } }, { user: { id: 'end-user-2' } }] }]);
		memberRepository.save.mockResolvedValue({ id: 'member-1' });

		const created = await createMemberAccount(dataSources)({ memberId: 'member-1', endUserId: 'end-user-1' });
		const updated = await updateMemberAccount(dataSources)({
			memberId: 'member-1',
			accountId: 'account-1',
			endUserId: 'end-user-2',
		});

		expect(created.id).toBe('member-1');
		expect(updated.id).toBe('member-1');
		expect(newAccount.firstName).toBe('Jane');
		expect(newAccount.lastName).toBe('Doe');
		expect(newAccount.user).toBe(endUserOne);
		expect(existingAccount.firstName).toBe('John');
		expect(existingAccount.lastName).toBe('Smith');
		expect(existingAccount.user).toBe(endUserTwo);
	});

	it('throws when account update/remove target account is missing', async () => {
		memberRepository.getById.mockResolvedValue({
			accounts: [],
			communityId: 'community-1',
			requestRemoveAccount: vi.fn(),
		});
		endUserReadRepository.getById.mockResolvedValue({
			id: 'end-user-1',
			displayName: 'Sample User',
			personalInformation: {
				identityDetails: {
					restOfName: 'Sample',
					lastName: 'User',
				},
			},
		});
		memberReadRepository.getByCommunityId.mockResolvedValue([{ accounts: [{ user: { id: 'end-user-1' } }] }]);

		await expect(
			updateMemberAccount(dataSources)({
				memberId: 'member-1',
				accountId: 'missing',
				endUserId: 'end-user-1',
			}),
		).rejects.toThrow('Account missing not found for member member-1');

		await expect(removeMemberAccount(dataSources)({ memberId: 'member-1', accountId: 'missing' })).rejects.toThrow('Account missing not found for member member-1');
	});

	it('removes account and throws when save returns nothing', async () => {
		const account = { id: 'account-1', props: { id: 'account-1' } };
		const member = {
			accounts: [account],
			requestRemoveAccount: vi.fn(),
		};
		memberRepository.getById.mockResolvedValue(member);
		memberRepository.save.mockResolvedValueOnce({ id: 'member-1' }).mockResolvedValueOnce(undefined);

		const result = await removeMemberAccount(dataSources)({ memberId: 'member-1', accountId: 'account-1' });
		expect(result.id).toBe('member-1');
		expect(member.requestRemoveAccount).toHaveBeenCalledWith(account.props);

		await expect(removeMemberAccount(dataSources)({ memberId: 'member-1', accountId: 'account-1' })).rejects.toThrow('Unable to remove member account');
	});

	it('updates member profile fields', async () => {
		const member = {
			memberName: 'Old Name',
			profile: {
				name: '',
				email: '',
				bio: '',
				showProfile: false,
				showEmail: false,
				showInterests: false,
				showLocation: false,
				showProperties: false,
			},
		};
		memberRepository.getById.mockResolvedValue(member);
		memberRepository.save.mockResolvedValue({ id: 'member-1' });

		const result = await updateMemberProfile(dataSources)({
			memberId: 'member-1',
			profile: {
				name: 'Jane Doe',
				email: 'jane@example.com',
				bio: 'Hello',
				showProfile: true,
			},
		});

		expect(result.id).toBe('member-1');
		expect(member.profile.name).toBe('Jane Doe');
		expect(member.memberName).toBe('Jane Doe');
		expect(member.profile.email).toBe('jane@example.com');
		expect(member.profile.bio).toBe('Hello');
		expect(member.profile.showProfile).toBe(true);
	});

	it('throws when update member role save returns nothing', async () => {
		const role = { id: 'role-1', community: { id: 'community-1' } };
		const member = { communityId: 'community-1', role: null };
		memberRepository.getById.mockResolvedValue(member);
		roleRepository.getById.mockResolvedValue(role);
		memberRepository.save.mockResolvedValue(undefined);

		await expect(updateMemberRole(dataSources)({ memberId: 'member-1', roleId: 'role-1' })).rejects.toThrow('Unable to update member role');
	});

	it('throws when creating member account for missing end user', async () => {
		memberRepository.getById.mockResolvedValue({
			accounts: [],
			communityId: 'community-1',
			requestNewAccount: vi.fn(),
		});
		endUserReadRepository.getById.mockResolvedValue(undefined);

		await expect(createMemberAccount(dataSources)({ memberId: 'member-1', endUserId: 'missing-end-user' })).rejects.toThrow('End user missing-end-user not found');
	});

	it('throws when selected end user is not part of the member community', async () => {
		const endUser = {
			id: 'end-user-1',
			displayName: 'Jane Doe',
			personalInformation: {
				identityDetails: {
					restOfName: 'Jane',
					lastName: 'Doe',
				},
			},
		};
		memberRepository.getById.mockResolvedValue({
			accounts: [],
			communityId: 'community-1',
			requestNewAccount: vi.fn(),
		});
		endUserReadRepository.getById.mockResolvedValue(endUser);
		memberReadRepository.getByCommunityId.mockResolvedValue([{ accounts: [] }]);

		await expect(createMemberAccount(dataSources)({ memberId: 'member-1', endUserId: 'end-user-1' })).rejects.toThrow(
			'Selected user is not associated with this community. Invite the user first.',
		);
	});

	it('throws when selected end user is already associated with the member', async () => {
		const existingUser = {
			id: 'end-user-1',
			displayName: 'Jane Doe',
			personalInformation: {
				identityDetails: {
					restOfName: 'Jane',
					lastName: 'Doe',
				},
			},
		};
		memberRepository.getById.mockResolvedValue({
			accounts: [{ id: 'acc-1', user: { id: 'end-user-1' } }],
			communityId: 'community-1',
			requestNewAccount: vi.fn(),
		});
		endUserReadRepository.getById.mockResolvedValue(existingUser);
		memberReadRepository.getByCommunityId.mockResolvedValue([{ accounts: [{ user: { id: 'end-user-1' } }] }]);

		await expect(createMemberAccount(dataSources)({ memberId: 'member-1', endUserId: 'end-user-1' })).rejects.toThrow(
			'Selected user is already associated with this member',
		);
	});

	it('uses displayName when end user restOfName is empty during account update', async () => {
		const endUser = {
			id: 'end-user-2',
			displayName: 'Display Name',
			personalInformation: {
				identityDetails: {
					restOfName: '   ',
					lastName: '',
				},
			},
		};
		const account = { id: 'account-1', firstName: 'Old', lastName: 'Last', user: { id: 'end-user-old' } };
		memberRepository.getById.mockResolvedValue({
			accounts: [account],
			communityId: 'community-1',
		});
		endUserReadRepository.getById.mockResolvedValue(endUser);
		memberReadRepository.getByCommunityId.mockResolvedValue([{ accounts: [{ user: { id: 'end-user-2' } }] }]);
		memberRepository.save.mockResolvedValue({ id: 'member-1' });

		const updated = await updateMemberAccount(dataSources)({
			memberId: 'member-1',
			accountId: 'account-1',
			endUserId: 'end-user-2',
		});

		expect(updated.id).toBe('member-1');
		expect(account.firstName).toBe('Display Name');
		expect(account.lastName).toBe('Last');
	});

	it('throws when updating member account to a user already assigned to another account', async () => {
		memberRepository.getById.mockResolvedValue({
			accounts: [
				{ id: 'account-1', user: { id: 'end-user-1' }, firstName: 'A', lastName: 'A' },
				{ id: 'account-2', user: { id: 'end-user-2' }, firstName: 'B', lastName: 'B' },
			],
			communityId: 'community-1',
		});
		endUserReadRepository.getById.mockResolvedValue({
			id: 'end-user-2',
			displayName: 'End User Two',
			personalInformation: {
				identityDetails: {
					restOfName: 'End',
					lastName: 'User',
				},
			},
		});
		memberReadRepository.getByCommunityId.mockResolvedValue([{ accounts: [{ user: { id: 'end-user-2' } }] }]);

		await expect(
			updateMemberAccount(dataSources)({
				memberId: 'member-1',
				accountId: 'account-1',
				endUserId: 'end-user-2',
			}),
		).rejects.toThrow('Selected user is already associated with this member');
	});

	it('throws when update member profile save returns nothing', async () => {
		memberRepository.getById.mockResolvedValue({
			memberName: 'Old Name',
			profile: {
				name: '',
				email: '',
				bio: '',
				showProfile: false,
				showEmail: false,
				showInterests: false,
				showLocation: false,
				showProperties: false,
			},
		});
		memberRepository.save.mockResolvedValue(undefined);

		await expect(
			updateMemberProfile(dataSources)({
				memberId: 'member-1',
				profile: {
					name: 'New Name',
				},
			}),
		).rejects.toThrow('Unable to update member profile');
	});
});
