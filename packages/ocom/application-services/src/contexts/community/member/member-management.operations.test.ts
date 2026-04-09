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

	beforeEach(() => {
		memberRepository = {
			getById: vi.fn(),
			save: vi.fn(),
		};
		roleRepository = {
			getById: vi.fn(),
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
		} as unknown as DataSources;
	});

	it('updates a member role when role belongs to member community', async () => {
		const role = { id: 'role-1', community: { id: 'community-1' } };
		const member = { props: { communityId: 'community-1' }, role: null };
		const savedMember = { id: 'member-1' };
		memberRepository.getById.mockResolvedValueOnce(member).mockResolvedValueOnce(member);
		roleRepository.getById.mockResolvedValue(role);
		memberRepository.save.mockResolvedValue(savedMember);

		const result = await updateMemberRole(dataSources)({ memberId: 'member-1', roleId: 'role-1' });

		expect(result).toBe(savedMember);
		expect(member.role).toBe(role);
	});

	it('throws when role is from a different community', async () => {
		memberRepository.getById.mockResolvedValue({ props: { communityId: 'community-1' } });
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
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
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
		await bulkRemoveMembers(dataSources)({ memberIds: ['ok', 'bad'], reason: 'policy' });

		expect(activated).toHaveLength(1);
		expect(deactivated).toHaveLength(1);
		expect(consoleErrorSpy).toHaveBeenCalled();
		consoleErrorSpy.mockRestore();
	});

	it('creates and updates account fields, including optional lastName', async () => {
		const newAccount = { firstName: '', lastName: '' };
		const existingAccount = { id: 'account-1', firstName: 'Old', lastName: 'Name' };
		const member = {
			requestNewAccount: vi.fn(() => newAccount),
			accounts: [existingAccount],
		};
		memberRepository.getById.mockResolvedValue(member);
		memberRepository.save.mockResolvedValue({ id: 'member-1' });

		const created = await createMemberAccount(dataSources)({ memberId: 'member-1', firstName: 'Jane' });
		const updated = await updateMemberAccount(dataSources)({
			memberId: 'member-1',
			accountId: 'account-1',
			firstName: 'John',
			lastName: 'Smith',
		});

		expect(created.id).toBe('member-1');
		expect(updated.id).toBe('member-1');
		expect(newAccount.firstName).toBe('Jane');
		expect(existingAccount.firstName).toBe('John');
		expect(existingAccount.lastName).toBe('Smith');
	});

	it('throws when account update/remove target account is missing', async () => {
		memberRepository.getById.mockResolvedValue({
			accounts: [],
			requestRemoveAccount: vi.fn(),
		});

		await expect(
			updateMemberAccount(dataSources)({
				memberId: 'member-1',
				accountId: 'missing',
				firstName: 'A',
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
});
