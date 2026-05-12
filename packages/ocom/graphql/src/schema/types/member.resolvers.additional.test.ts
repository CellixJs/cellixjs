import { describe, expect, it, vi } from 'vitest';
import type { GraphContext } from '../context.ts';
import memberResolvers from './member.resolvers.ts';

function createContext(): GraphContext {
	return {
		applicationServices: {
			Community: {
				Community: {
					queryById: vi.fn(),
				},
				Member: {
					queryById: vi.fn(),
					queryByCommunityId: vi.fn(),
					queryByEndUserExternalId: vi.fn(),
					createMember: vi.fn(),
					activateMember: vi.fn(),
					deactivateMember: vi.fn(),
					removeMember: vi.fn(),
					bulkActivateMembers: vi.fn(),
					bulkDeactivateMembers: vi.fn(),
					bulkRemoveMembers: vi.fn(),
					inviteMember: vi.fn(),
					bulkInviteMembers: vi.fn(),
					updateMemberRole: vi.fn(),
					createMemberAccount: vi.fn(),
					updateMemberAccount: vi.fn(),
					removeMemberAccount: vi.fn(),
					updateMemberProfile: vi.fn(),
				},
			},
			User: {
				EndUser: {
					queryById: vi.fn(),
				},
			},
			verifiedUser: {
				verifiedJwt: { sub: 'user-sub-1' },
				hints: {
					communityId: 'community-1',
				},
			},
		},
	} as unknown as GraphContext;
}

function setVerifiedUser(context: GraphContext, verifiedUser: unknown): void {
	(context.applicationServices as unknown as { verifiedUser?: unknown }).verifiedUser = verifiedUser;
}

describe('member resolvers additional coverage', () => {
	it('returns Member.role and handles thrown parent.role access', () => {
		const roleResolver = memberResolvers.Member?.role as (parent: unknown, args: unknown, context: GraphContext, info: unknown) => unknown;
		const role = roleResolver({ role: { id: 'role-1' } }, {}, createContext(), {});
		expect(role).toEqual({ id: 'role-1' });

		const throwingParent = Object.defineProperty({}, 'role', {
			get() {
				throw new Error('bad access');
			},
		});
		const fallback = roleResolver(throwingParent, {}, createContext(), {});
		expect(fallback).toBeNull();
	});

	it('resolves MemberAccount.user null and found paths', async () => {
		const context = createContext();
		const resolver = memberResolvers.MemberAccount?.user as (parent: unknown, args: unknown, context: GraphContext, info: unknown) => Promise<unknown>;

		await expect(resolver({ user: null }, {}, context, {})).resolves.toBeNull();
		vi.mocked(context.applicationServices.User.EndUser.queryById).mockResolvedValue({ id: 'end-user-1' } as never);
		await expect(resolver({ user: { id: 'end-user-1' } }, {}, context, {})).resolves.toEqual({ id: 'end-user-1' });
	});

	it('handles Query.member and Query.membersByCommunityId auth and success', async () => {
		const context = createContext();
		const memberResolver = memberResolvers.Query?.member as (parent: unknown, args: { id: string }, context: GraphContext, info: unknown) => Promise<unknown>;
		const membersByCommunityResolver = memberResolvers.Query?.membersByCommunityId as (parent: unknown, args: { communityId: string }, context: GraphContext, info: unknown) => Promise<unknown>;

		vi.mocked(context.applicationServices.Community.Member.queryById).mockResolvedValue({ id: 'member-1' } as never);
		vi.mocked(context.applicationServices.Community.Member.queryByCommunityId).mockResolvedValue([{ id: 'member-1' }] as never);
		await expect(memberResolver(null, { id: 'member-1' }, context, {})).resolves.toEqual({ id: 'member-1' });
		await expect(membersByCommunityResolver(null, { communityId: 'community-1' }, context, {})).resolves.toEqual([{ id: 'member-1' }]);

		setVerifiedUser(context, undefined);
		await expect(memberResolver(null, { id: 'member-1' }, context, {})).rejects.toThrow('Unauthorized');
		await expect(membersByCommunityResolver(null, { communityId: 'community-1' }, context, {})).rejects.toThrow('Unauthorized');
	});

	it('returns not found error for MemberInvitation.invitedBy', async () => {
		const context = createContext();
		const resolver = memberResolvers.MemberInvitation?.invitedBy as (parent: { invitedBy: { id: string } }, args: unknown, context: GraphContext, info: unknown) => Promise<unknown>;
		vi.mocked(context.applicationServices.User.EndUser.queryById).mockResolvedValue(undefined as never);
		await expect(resolver({ invitedBy: { id: 'missing' } }, {}, context, {})).rejects.toThrow('Invited by user not found');
	});

	it('handles memberCreate auth, missing community, success and error', async () => {
		const resolver = memberResolvers.Mutation?.memberCreate as (parent: unknown, args: { input: { memberName: string } }, context: GraphContext, info: unknown) => Promise<unknown>;
		const context = createContext();

		setVerifiedUser(context, undefined);
		await expect(resolver(null, { input: { memberName: 'M1' } }, context, {})).resolves.toMatchObject({ status: { success: false, errorMessage: 'Unauthorized' } });

		setVerifiedUser(context, { verifiedJwt: { sub: 'user-sub-1' }, hints: { communityId: '' } });
		await expect(resolver(null, { input: { memberName: 'M1' } }, context, {})).resolves.toMatchObject({
			status: { success: false, errorMessage: 'No current community found' },
		});

		setVerifiedUser(context, { verifiedJwt: { sub: 'user-sub-1' }, hints: { communityId: 'community-1' } });
		vi.mocked(context.applicationServices.Community.Member.createMember).mockResolvedValue({ id: 'member-1' } as never);
		await expect(resolver(null, { input: { memberName: 'M1' } }, context, {})).resolves.toMatchObject({ status: { success: true }, member: { id: 'member-1' } });

		vi.mocked(context.applicationServices.Community.Member.createMember).mockRejectedValue(new Error('create failed'));
		await expect(resolver(null, { input: { memberName: 'M1' } }, context, {})).resolves.toMatchObject({ status: { success: false, errorMessage: 'create failed' } });
	});

	it('handles activate/deactivate/remove member mutation branches', async () => {
		const activateResolver = memberResolvers.Mutation?.activateMember as (parent: unknown, args: { input: { memberId: string } }, context: GraphContext, info: unknown) => Promise<unknown>;
		const deactivateResolver = memberResolvers.Mutation?.deactivateMember as (parent: unknown, args: { input: { memberId: string; reason?: string } }, context: GraphContext, info: unknown) => Promise<unknown>;
		const removeResolver = memberResolvers.Mutation?.removeMember as (parent: unknown, args: { input: { memberId: string; reason?: string } }, context: GraphContext, info: unknown) => Promise<unknown>;
		const context = createContext();

		vi.mocked(context.applicationServices.Community.Member.activateMember).mockResolvedValue({ id: 'member-1' } as never);
		await expect(activateResolver(null, { input: { memberId: 'member-1' } }, context, {})).resolves.toMatchObject({ status: { success: true }, member: { id: 'member-1' } });
		vi.mocked(context.applicationServices.Community.Member.activateMember).mockRejectedValue('x');
		await expect(activateResolver(null, { input: { memberId: 'member-1' } }, context, {})).resolves.toMatchObject({ status: { success: false, errorMessage: 'Unknown error' } });

		vi.mocked(context.applicationServices.Community.Member.deactivateMember).mockResolvedValue({ id: 'member-1' } as never);
		await expect(deactivateResolver(null, { input: { memberId: 'member-1', reason: 'R' } }, context, {})).resolves.toMatchObject({ status: { success: true }, member: { id: 'member-1' } });
		expect(context.applicationServices.Community.Member.deactivateMember).toHaveBeenCalledWith({ memberId: 'member-1', reason: 'R' });

		vi.mocked(context.applicationServices.Community.Member.removeMember).mockResolvedValue(undefined as never);
		await expect(removeResolver(null, { input: { memberId: 'member-1', reason: 'R' } }, context, {})).resolves.toMatchObject({ status: { success: true }, member: null });

		setVerifiedUser(context, undefined);
		await expect(activateResolver(null, { input: { memberId: 'member-1' } }, context, {})).resolves.toMatchObject({ status: { success: false, errorMessage: 'Unauthorized' } });
		await expect(deactivateResolver(null, { input: { memberId: 'member-1' } }, context, {})).resolves.toMatchObject({ status: { success: false, errorMessage: 'Unauthorized' } });
		await expect(removeResolver(null, { input: { memberId: 'member-1' } }, context, {})).resolves.toMatchObject({ status: { success: false, errorMessage: 'Unauthorized' } });
	});

	it('handles bulk activate/deactivate/remove members branches', async () => {
		const context = createContext();
		const bulkActivate = memberResolvers.Mutation?.bulkActivateMembers as (parent: unknown, args: { input: { memberIds: readonly string[]; communityId: string } }, context: GraphContext, info: unknown) => Promise<unknown>;
		const bulkDeactivate = memberResolvers.Mutation?.bulkDeactivateMembers as (
			parent: unknown,
			args: { input: { memberIds: readonly string[]; communityId: string; reason?: string } },
			context: GraphContext,
			info: unknown,
		) => Promise<unknown>;
		const bulkRemove = memberResolvers.Mutation?.bulkRemoveMembers as (
			parent: unknown,
			args: { input: { memberIds: readonly string[]; communityId: string; reason?: string } },
			context: GraphContext,
			info: unknown,
		) => Promise<unknown>;

		vi.mocked(context.applicationServices.Community.Member.bulkActivateMembers).mockResolvedValue([{ id: 'm1' }] as never);
		vi.mocked(context.applicationServices.Community.Member.bulkDeactivateMembers).mockResolvedValue([{ id: 'm1' }] as never);
		vi.mocked(context.applicationServices.Community.Member.bulkRemoveMembers).mockResolvedValue(undefined as never);
		vi.mocked(context.applicationServices.Community.Member.queryByEndUserExternalId).mockResolvedValue([{ id: 'self', communityId: 'community-1' }] as never);

		await expect(bulkActivate(null, { input: { memberIds: ['self', 'm1'], communityId: 'community-1' } }, context, {})).resolves.toMatchObject({ status: { success: true }, successCount: 1, failedCount: 1 });
		expect(context.applicationServices.Community.Member.bulkActivateMembers).toHaveBeenCalledWith({ memberIds: ['m1'] });
		await expect(bulkDeactivate(null, { input: { memberIds: ['m1', 'm2'], communityId: 'community-1', reason: 'policy' } }, context, {})).resolves.toMatchObject({ status: { success: true }, successCount: 1, failedCount: 1 });
		expect(context.applicationServices.Community.Member.bulkDeactivateMembers).toHaveBeenCalledWith({ memberIds: ['m1', 'm2'], reason: 'policy' });
		await expect(bulkRemove(null, { input: { memberIds: ['m1', 'm2'], communityId: 'community-1', reason: 'policy' } }, context, {})).resolves.toMatchObject({
			status: { success: true },
			members: [],
			successCount: 2,
			failedCount: 0,
		});

		vi.mocked(context.applicationServices.Community.Member.bulkRemoveMembers).mockRejectedValue(new Error('bulk remove failed'));
		await expect(bulkRemove(null, { input: { memberIds: ['m1'], communityId: 'community-1' } }, context, {})).resolves.toMatchObject({ status: { success: false, errorMessage: 'bulk remove failed' } });

		await expect(bulkActivate(null, { input: { memberIds: ['self'], communityId: 'community-1' } }, context, {})).resolves.toMatchObject({
			status: { success: false, errorMessage: 'No eligible members to activate.' },
			members: [],
			successCount: 0,
			failedCount: 1,
		});
	});

	it('handles invite and bulk invite branches and invitation mapping', async () => {
		const context = createContext();
		const invite = memberResolvers.Mutation?.inviteMember as (
			parent: unknown,
			args: { input: { communityId: string; email: string; message?: string; expiresInDays?: number } },
			context: GraphContext,
			info: unknown,
		) => Promise<unknown>;
		const bulkInvite = memberResolvers.Mutation?.bulkInviteMembers as (
			parent: unknown,
			args: { input: { communityId: string; invitations: Array<{ email: string; message?: string }>; expiresInDays?: number } },
			context: GraphContext,
			info: unknown,
		) => Promise<unknown>;

		vi.mocked(context.applicationServices.Community.Member.inviteMember).mockResolvedValue({
			id: 'inv-1',
			email: 'a@example.com',
			message: 'hello',
			status: 'PENDING',
			expiresAt: new Date(),
			communityId: 'community-1',
			createdAt: new Date(),
			updatedAt: new Date(),
			invitedBy: { id: 'user-1' },
			acceptedBy: undefined,
		} as never);
		await expect(invite(null, { input: { communityId: 'community-1', email: 'a@example.com', message: 'hello', expiresInDays: 10 } }, context, {})).resolves.toMatchObject({
			status: { success: true },
			invitation: { email: 'a@example.com', acceptedBy: null },
		});

		setVerifiedUser(context, undefined);
		await expect(invite(null, { input: { communityId: 'community-1', email: 'a@example.com' } }, context, {})).resolves.toMatchObject({ status: { success: false, errorMessage: 'Unauthorized' } });
		setVerifiedUser(context, { verifiedJwt: { sub: 'user-sub-1' }, hints: { communityId: 'community-1' } });

		vi.mocked(context.applicationServices.Community.Member.bulkInviteMembers).mockResolvedValue([
			{
				id: 'inv-1',
				email: 'a@example.com',
				message: '',
				status: 'PENDING',
				expiresAt: new Date(),
				communityId: 'community-1',
				createdAt: new Date(),
				updatedAt: new Date(),
				invitedBy: { id: 'user-1' },
				acceptedBy: undefined,
			},
		] as never);
		await expect(bulkInvite(null, { input: { communityId: 'community-1', invitations: [{ email: 'a@example.com', message: 'msg' }, { email: 'b@example.com' }] } }, context, {})).resolves.toMatchObject({
			status: { success: true },
			successCount: 1,
			failedCount: 1,
		});

		setVerifiedUser(context, undefined);
		await expect(bulkInvite(null, { input: { communityId: 'community-1', invitations: [{ email: 'a@example.com' }, { email: 'b@example.com' }] } }, context, {})).resolves.toMatchObject({
			status: { success: false, errorMessage: 'Unauthorized' },
			successCount: 0,
			failedCount: 2,
		});
	});

	it('covers member role and account mutation branches', async () => {
		const context = createContext();
		const memberRoleUpdate = memberResolvers.Mutation?.memberRoleUpdate as (parent: unknown, args: { input: { memberId: string; roleId: string; reason?: string } }, context: GraphContext) => Promise<unknown>;
		const createAccount = memberResolvers.Mutation?.memberCreateAccount as (parent: unknown, args: { input: { memberId: string; endUserId: string } }, context: GraphContext) => Promise<unknown>;
		const updateAccount = memberResolvers.Mutation?.memberUpdateAccount as (parent: unknown, args: { input: { memberId: string; accountId: string; endUserId: string } }, context: GraphContext) => Promise<unknown>;
		const removeAccount = memberResolvers.Mutation?.memberRemoveAccount as (parent: unknown, args: { input: { memberId: string; accountId: string } }, context: GraphContext) => Promise<unknown>;

		vi.mocked(context.applicationServices.Community.Member.updateMemberRole).mockResolvedValue({ id: 'member-1' } as never);
		await expect(memberRoleUpdate(null, { input: { memberId: 'member-1', roleId: 'role-1', reason: 'r' } }, context)).resolves.toMatchObject({
			status: { success: true },
			member: { id: 'member-1' },
		});
		vi.mocked(context.applicationServices.Community.Member.updateMemberRole).mockRejectedValue(new Error('role fail'));
		await expect(memberRoleUpdate(null, { input: { memberId: 'member-1', roleId: 'role-1' } }, context)).resolves.toMatchObject({ status: { success: false, errorMessage: 'role fail' } });

		vi.mocked(context.applicationServices.Community.Member.createMemberAccount).mockResolvedValue({ id: 'member-1' } as never);
		vi.mocked(context.applicationServices.Community.Member.updateMemberAccount).mockResolvedValue({ id: 'member-1' } as never);
		vi.mocked(context.applicationServices.Community.Member.removeMemberAccount).mockResolvedValue({ id: 'member-1' } as never);

		await expect(createAccount(null, { input: { memberId: 'member-1', endUserId: 'end-user-1' } }, context)).resolves.toMatchObject({ status: { success: true } });
		expect(context.applicationServices.Community.Member.createMemberAccount).toHaveBeenCalledWith({ memberId: 'member-1', endUserId: 'end-user-1' });

		await expect(updateAccount(null, { input: { memberId: 'member-1', accountId: 'acc-1', endUserId: 'end-user-2' } }, context)).resolves.toMatchObject({ status: { success: true } });
		expect(context.applicationServices.Community.Member.updateMemberAccount).toHaveBeenCalledWith({ memberId: 'member-1', accountId: 'acc-1', endUserId: 'end-user-2' });

		await expect(removeAccount(null, { input: { memberId: 'member-1', accountId: 'acc-1' } }, context)).resolves.toMatchObject({ status: { success: true } });

		setVerifiedUser(context, undefined);
		await expect(memberRoleUpdate(null, { input: { memberId: 'member-1', roleId: 'role-1' } }, context)).resolves.toMatchObject({ status: { success: false, errorMessage: 'Unauthorized' } });
		await expect(createAccount(null, { input: { memberId: 'member-1', endUserId: 'end-user-1' } }, context)).resolves.toMatchObject({ status: { success: false, errorMessage: 'Unauthorized' } });
		await expect(updateAccount(null, { input: { memberId: 'member-1', accountId: 'acc-1', endUserId: 'end-user-2' } }, context)).resolves.toMatchObject({ status: { success: false, errorMessage: 'Unauthorized' } });
		await expect(removeAccount(null, { input: { memberId: 'member-1', accountId: 'acc-1' } }, context)).resolves.toMatchObject({ status: { success: false, errorMessage: 'Unauthorized' } });
	});

	it('covers member update profile mutation branches', async () => {
		const context = createContext();
		const memberUpdateProfile = memberResolvers.Mutation?.memberUpdateProfile as (
			parent: unknown,
			args: { input: { memberId: string; profile: { name?: string; showProfile?: boolean } } },
			context: GraphContext,
		) => Promise<unknown>;

		vi.mocked(context.applicationServices.Community.Member.updateMemberProfile).mockResolvedValue({ id: 'member-1' } as never);
		await expect(memberUpdateProfile(null, { input: { memberId: 'member-1', profile: { name: 'Updated Name', showProfile: true } } }, context)).resolves.toMatchObject({
			status: { success: true },
			member: { id: 'member-1' },
		});
		expect(context.applicationServices.Community.Member.updateMemberProfile).toHaveBeenCalledWith({
			memberId: 'member-1',
			profile: { name: 'Updated Name', showProfile: true },
		});

		vi.mocked(context.applicationServices.Community.Member.updateMemberProfile).mockRejectedValue(new Error('profile fail'));
		await expect(memberUpdateProfile(null, { input: { memberId: 'member-1', profile: { name: 'Updated Name' } } }, context)).resolves.toMatchObject({
			status: { success: false, errorMessage: 'profile fail' },
			member: null,
		});

		setVerifiedUser(context, undefined);
		await expect(memberUpdateProfile(null, { input: { memberId: 'member-1', profile: {} } }, context)).resolves.toMatchObject({
			status: { success: false, errorMessage: 'Unauthorized' },
			member: null,
		});
	});

	it('maps optional fields for deactivate/remove and bulk invite command payloads', async () => {
		const context = createContext();
		const deactivateResolver = memberResolvers.Mutation?.deactivateMember as (parent: unknown, args: { input: { memberId: string; reason?: string } }, context: GraphContext, info: unknown) => Promise<unknown>;
		const removeResolver = memberResolvers.Mutation?.removeMember as (parent: unknown, args: { input: { memberId: string; reason?: string } }, context: GraphContext, info: unknown) => Promise<unknown>;
		const bulkInviteResolver = memberResolvers.Mutation?.bulkInviteMembers as (
			parent: unknown,
			args: { input: { communityId: string; invitations: Array<{ email: string; message?: string }>; expiresInDays?: number } },
			context: GraphContext,
			info: unknown,
		) => Promise<unknown>;

		vi.mocked(context.applicationServices.Community.Member.deactivateMember).mockResolvedValue({ id: 'member-1' } as never);
		vi.mocked(context.applicationServices.Community.Member.removeMember).mockResolvedValue(undefined as never);
		vi.mocked(context.applicationServices.Community.Member.bulkInviteMembers).mockResolvedValue([] as never);

		await deactivateResolver(null, { input: { memberId: 'member-1' } }, context, {});
		expect(context.applicationServices.Community.Member.deactivateMember).toHaveBeenCalledWith({ memberId: 'member-1' });

		await removeResolver(null, { input: { memberId: 'member-1' } }, context, {});
		expect(context.applicationServices.Community.Member.removeMember).toHaveBeenCalledWith({ memberId: 'member-1' });

		await bulkInviteResolver(
			null,
			{
				input: {
					communityId: 'community-1',
					invitations: [{ email: 'a@example.com', message: null as unknown as string }, { email: 'b@example.com' }],
					expiresInDays: 12,
				},
			},
			context,
			{},
		);
		expect(context.applicationServices.Community.Member.bulkInviteMembers).toHaveBeenCalledWith({
			communityId: 'community-1',
			invitations: [{ email: 'a@example.com' }, { email: 'b@example.com' }],
			expiresInDays: 12,
			invitedByExternalId: 'user-sub-1',
		});
	});

	it('returns fallback non-Error messages in resolver catch blocks', async () => {
		const context = createContext();
		const deactivateResolver = memberResolvers.Mutation?.deactivateMember as (parent: unknown, args: { input: { memberId: string } }, context: GraphContext, info: unknown) => Promise<unknown>;
		const removeResolver = memberResolvers.Mutation?.removeMember as (parent: unknown, args: { input: { memberId: string } }, context: GraphContext, info: unknown) => Promise<unknown>;
		const bulkInviteResolver = memberResolvers.Mutation?.bulkInviteMembers as (
			parent: unknown,
			args: { input: { communityId: string; invitations: Array<{ email: string }> } },
			context: GraphContext,
			info: unknown,
		) => Promise<unknown>;
		const roleUpdateResolver = memberResolvers.Mutation?.memberRoleUpdate as (parent: unknown, args: { input: { memberId: string; roleId: string } }, context: GraphContext) => Promise<unknown>;

		vi.mocked(context.applicationServices.Community.Member.deactivateMember).mockRejectedValue('bad');
		vi.mocked(context.applicationServices.Community.Member.removeMember).mockRejectedValue('bad');
		vi.mocked(context.applicationServices.Community.Member.bulkInviteMembers).mockRejectedValue('bad');
		vi.mocked(context.applicationServices.Community.Member.updateMemberRole).mockRejectedValue('bad');

		await expect(deactivateResolver(null, { input: { memberId: 'member-1' } }, context, {})).resolves.toMatchObject({
			status: { success: false, errorMessage: 'Unknown error' },
		});
		await expect(removeResolver(null, { input: { memberId: 'member-1' } }, context, {})).resolves.toMatchObject({
			status: { success: false, errorMessage: 'Unknown error' },
		});
		await expect(
			bulkInviteResolver(
				null,
				{
					input: {
						communityId: 'community-1',
						invitations: [{ email: 'a@example.com' }],
					},
				},
				context,
				{},
			),
		).resolves.toMatchObject({
			status: { success: false, errorMessage: 'Unknown error' },
			invitations: [],
			successCount: 0,
			failedCount: 1,
		});
		await expect(roleUpdateResolver(null, { input: { memberId: 'member-1', roleId: 'role-1' } }, context)).resolves.toMatchObject({
			status: { success: false, errorMessage: 'Failed to update member role' },
			member: null,
		});
	});
});
