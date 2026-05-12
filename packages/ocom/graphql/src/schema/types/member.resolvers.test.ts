import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import { expect, vi } from 'vitest';
import type { GraphContext } from '../context.ts';
import memberResolvers from './member.resolvers.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/member.resolvers.feature'));

type CommunityEntity = { id: string; name: string };
type MemberEntity = { id: string; communityId: string };
type CommunityReference = Domain.Contexts.Community.Community.CommunityEntityReference;
type MemberReference = Domain.Contexts.Community.Member.MemberEntityReference;

function createMockCommunity(overrides: Partial<CommunityEntity> = {}): CommunityEntity {
	return {
		id: 'community-123',
		name: 'Mock Community',
		...overrides,
	};
}

function createMockMember(overrides: Partial<MemberEntity> = {}): MemberEntity {
	return {
		id: 'member-1',
		communityId: 'community-123',
		...overrides,
	};
}

function makeMockGraphContext(overrides: Partial<GraphContext> = {}): GraphContext {
	const context: GraphContext = {
		applicationServices: {
			Community: {
				Community: {
					queryById: vi.fn(),
				},
				Member: {
					determineIfAdmin: vi.fn(),
					queryByEndUserExternalId: vi.fn(),
					inviteMember: vi.fn(),
					bulkInviteMembers: vi.fn(),
				},
			},
			User: {
				EndUser: {
					queryById: vi.fn(),
				},
			},
			verifiedUser: {
				verifiedJwt: {
					sub: 'default-user-sub',
				},
			},
			...overrides.applicationServices,
		},
		...overrides,
	} as GraphContext;

	return context;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let context: GraphContext;
	let member: MemberEntity;
	let communityResult: unknown;
	let booleanResult: boolean | null;
	let membersResult: unknown;

	BeforeEachScenario(() => {
		context = makeMockGraphContext();
		member = createMockMember();
		communityResult = null;
		booleanResult = null;
		membersResult = null;
		vi.clearAllMocks();
	});

	Scenario('Resolving the community for a member', ({ Given, And, When, Then }) => {
		const resolvedCommunity = createMockCommunity();
		const domainCommunity = resolvedCommunity as unknown as CommunityReference;

		Given('a member with communityId "community-123"', () => {
			member = createMockMember({ communityId: 'community-123' });
		});

		And('the community service can return that community', () => {
			vi.mocked(context.applicationServices.Community.Community.queryById).mockResolvedValue(domainCommunity);
		});

		When('the Member.community resolver is executed', async () => {
			communityResult = await (memberResolvers.Member?.community as unknown as (parent: MemberEntity, args: Record<string, never>, graphContext: GraphContext, info: unknown) => Promise<CommunityReference | null>)(
				member,
				{},
				context,
				{},
			);
		});

		Then("it should call Community.Community.queryById with the member's communityId", () => {
			expect(context.applicationServices.Community.Community.queryById).toHaveBeenCalledWith({
				id: 'community-123',
			});
		});

		And('it should return the resolved community', () => {
			expect(communityResult as CommunityEntity).toEqual(resolvedCommunity);
		});
	});

	Scenario('Checking if a member is an administrator', ({ Given, And, When, Then }) => {
		Given('a member with id "member-1"', () => {
			member = createMockMember({ id: 'member-1' });
		});

		And('the member service indicates the member is an admin', () => {
			vi.mocked(context.applicationServices.Community.Member.determineIfAdmin).mockResolvedValue(true);
		});

		When('the Member.isAdmin resolver is executed', async () => {
			booleanResult = await (memberResolvers.Member?.isAdmin as unknown as (parent: MemberEntity, args: Record<string, never>, graphContext: GraphContext, info: unknown) => Promise<boolean>)(member, {}, context, {});
		});

		Then("it should call Community.Member.determineIfAdmin with the member's id", () => {
			expect(context.applicationServices.Community.Member.determineIfAdmin).toHaveBeenCalledWith({
				memberId: 'member-1',
			});
		});

		And('it should return true', () => {
			expect(booleanResult).toBe(true);
		});
	});

	Scenario('Querying members for the current end user', ({ Given, And, When, Then }) => {
		const resolvedMembers = [createMockMember({ id: 'member-42' })];
		const domainMembers = resolvedMembers as unknown as MemberReference[];

		Given('a signed in user with subject "user-sub-123"', () => {
			if (context.applicationServices.verifiedUser?.verifiedJwt) {
				context.applicationServices.verifiedUser.verifiedJwt.sub = 'user-sub-123';
			}
		});

		And('the member service can return members for that subject', () => {
			vi.mocked(context.applicationServices.Community.Member.queryByEndUserExternalId).mockResolvedValue(domainMembers);
		});

		When('the membersForCurrentEndUser query is executed', async () => {
			membersResult = await (memberResolvers.Query?.membersForCurrentEndUser as unknown as (parent: unknown, args: Record<string, never>, graphContext: GraphContext, info: unknown) => Promise<MemberReference[]>)(
				null,
				{},
				context,
				{},
			);
		});

		Then('it should call Community.Member.queryByEndUserExternalId with the subject', () => {
			expect(context.applicationServices.Community.Member.queryByEndUserExternalId).toHaveBeenCalledWith({
				externalId: 'user-sub-123',
			});
		});

		And('it should return the list of members', () => {
			expect(membersResult as MemberEntity[]).toEqual(resolvedMembers);
		});
	});

	Scenario('Querying members for the current end user without authentication', ({ Given, When, Then }) => {
		Given('a user without a verified JWT', () => {
			if (context.applicationServices.verifiedUser) {
				context.applicationServices.verifiedUser.verifiedJwt = undefined;
			}
		});

		When('the membersForCurrentEndUser query is executed', async () => {
			await expect(
				(memberResolvers.Query?.membersForCurrentEndUser as unknown as (parent: unknown, args: Record<string, never>, graphContext: GraphContext, info: unknown) => Promise<MemberReference[]>)(null, {}, context, {}),
			).rejects.toThrow('Unauthorized');
		});

		Then('it should throw an "Unauthorized" error', () => {
			// Assertion performed in When step
		});
	});

	Scenario('Inviting a member successfully', ({ Given, And, When, Then }) => {
		type InviteMemberResult = { status: { success: boolean; errorMessage?: string }; invitation?: { email: string } };
		let inviteResult: InviteMemberResult;
		const mockInvitation = {
			id: 'inv-1',
			email: 'test@example.com',
			message: '',
			status: 'PENDING',
			expiresAt: new Date(),
			communityId: 'community-123',
			createdAt: new Date(),
			updatedAt: new Date(),
			invitedBy: { id: 'user-sub-123' },
			acceptedBy: null,
		};

		Given('a signed in user with subject "user-sub-123"', () => {
			/* empty */
		});

		And('the member invitation service can create an invitation', () => {
			vi.mocked(context.applicationServices.Community.Member.inviteMember).mockResolvedValue(mockInvitation as never);
		});

		When('the inviteMember mutation is executed with communityId "community-123" and email "test@example.com"', async () => {
			inviteResult = await (memberResolvers.Mutation?.inviteMember as unknown as (parent: unknown, args: unknown, ctx: GraphContext, info: unknown) => Promise<InviteMemberResult>)(
				null,
				{ input: { communityId: 'community-123', email: 'test@example.com' } },
				context,
				{},
			);
		});

		Then('it should return a status with success true', () => {
			expect(inviteResult.status.success).toBe(true);
		});

		And('it should return the invitation with email "test@example.com"', () => {
			expect(inviteResult.invitation?.email).toBe('test@example.com');
		});
	});

	Scenario('Inviting a member without authentication', ({ Given, When, Then, And }) => {
		type InviteMemberResult = { status: { success: boolean; errorMessage?: string } };
		let inviteResult: InviteMemberResult;

		Given('a user without a verified JWT', () => {
			if (context.applicationServices.verifiedUser) {
				context.applicationServices.verifiedUser.verifiedJwt = undefined;
			}
		});

		When('the inviteMember mutation is executed with communityId "community-123" and email "test@example.com"', async () => {
			inviteResult = await (memberResolvers.Mutation?.inviteMember as unknown as (parent: unknown, args: unknown, ctx: GraphContext, info: unknown) => Promise<InviteMemberResult>)(
				null,
				{ input: { communityId: 'community-123', email: 'test@example.com' } },
				context,
				{},
			);
		});

		Then('it should return a status with success false', () => {
			expect(inviteResult.status.success).toBe(false);
		});

		And('the error message should be "Unauthorized"', () => {
			expect(inviteResult.status.errorMessage).toBe('Unauthorized');
		});
	});

	Scenario('Bulk inviting members successfully', ({ Given, And, When, Then }) => {
		type BulkResult = { status: { success: boolean; errorMessage?: string }; invitations?: { email: string }[]; invitationsCount?: number };
		let bulkResult: BulkResult;
		const mockInvitations = [
			{ id: 'inv-1', email: 'a@example.com', message: '', status: 'PENDING', expiresAt: new Date(), communityId: 'community-123', createdAt: new Date(), updatedAt: new Date(), invitedBy: { id: 'user-sub-123' }, acceptedBy: null },
			{ id: 'inv-2', email: 'b@example.com', message: '', status: 'PENDING', expiresAt: new Date(), communityId: 'community-123', createdAt: new Date(), updatedAt: new Date(), invitedBy: { id: 'user-sub-123' }, acceptedBy: null },
		];

		Given('a signed in user with subject "user-sub-123"', () => {
			/* empty */
		});

		And('the member bulk invitation service can create invitations', () => {
			vi.mocked(context.applicationServices.Community.Member.bulkInviteMembers).mockResolvedValue(mockInvitations as never);
		});

		When('the bulkInviteMembers mutation is executed with communityId "community-123" and emails "a@example.com" and "b@example.com"', async () => {
			bulkResult = await (memberResolvers.Mutation?.bulkInviteMembers as unknown as (parent: unknown, args: unknown, ctx: GraphContext, info: unknown) => Promise<BulkResult>)(
				null,
				{ input: { communityId: 'community-123', invitations: [{ email: 'a@example.com' }, { email: 'b@example.com' }] } },
				context,
				{},
			);
		});

		Then('it should return a status with success true', () => {
			expect(bulkResult.status.success).toBe(true);
		});

		And('it should return 2 invitations', () => {
			expect(bulkResult.invitations).toHaveLength(2);
		});
	});

	Scenario('Bulk inviting members without authentication', ({ Given, When, Then, And }) => {
		type BulkResult = { status: { success: boolean; errorMessage?: string } };
		let bulkResult: BulkResult;

		Given('a user without a verified JWT', () => {
			if (context.applicationServices.verifiedUser) {
				context.applicationServices.verifiedUser.verifiedJwt = undefined;
			}
		});

		When('the bulkInviteMembers mutation is executed with communityId "community-123" and emails "a@example.com" and "b@example.com"', async () => {
			bulkResult = await (memberResolvers.Mutation?.bulkInviteMembers as unknown as (parent: unknown, args: unknown, ctx: GraphContext, info: unknown) => Promise<BulkResult>)(
				null,
				{ input: { communityId: 'community-123', invitations: [{ email: 'a@example.com' }, { email: 'b@example.com' }] } },
				context,
				{},
			);
		});

		Then('it should return a status with success false', () => {
			expect(bulkResult.status.success).toBe(false);
		});

		And('the error message should be "Unauthorized"', () => {
			expect(bulkResult.status.errorMessage).toBe('Unauthorized');
		});
	});

	Scenario('MemberInvitation invitedBy resolver returns end user', ({ Given, And, When, Then }) => {
		type EndUserResult = { id: string };
		let resolvedEndUser: EndUserResult | null;
		const mockEndUser = { id: 'user-id-1' };
		const mockParent = { invitedBy: { id: 'user-id-1' } };

		Given('a member invitation with invitedBy id "user-id-1"', () => {
			/* empty */
		});

		And('the end user service can return a user for that id', () => {
			vi.mocked(context.applicationServices.User.EndUser.queryById).mockResolvedValue(mockEndUser as never);
		});

		When('the MemberInvitation.invitedBy resolver is executed', async () => {
			resolvedEndUser = await (memberResolvers.MemberInvitation?.invitedBy as unknown as (parent: typeof mockParent, args: unknown, ctx: GraphContext, info: unknown) => Promise<EndUserResult>)(mockParent, {}, context, {});
		});

		Then('it should call User.EndUser.queryById with "user-id-1"', () => {
			expect(vi.mocked(context.applicationServices.User.EndUser.queryById)).toHaveBeenCalledWith({ id: 'user-id-1' });
		});

		And('it should return the resolved end user', () => {
			expect(resolvedEndUser?.id).toBe('user-id-1');
		});
	});

	Scenario('MemberInvitation acceptedBy resolver when present', ({ Given, And, When, Then }) => {
		type EndUserResult = { id: string };
		let resolvedEndUser: EndUserResult | null;
		const mockEndUser = { id: 'user-id-2' };
		const mockParent = { acceptedBy: { id: 'user-id-2' } };

		Given('a member invitation with acceptedBy id "user-id-2"', () => {
			/* empty */
		});

		And('the end user service can return a user for that id', () => {
			vi.mocked(context.applicationServices.User.EndUser.queryById).mockResolvedValue(mockEndUser as never);
		});

		When('the MemberInvitation.acceptedBy resolver is executed', async () => {
			resolvedEndUser = await (memberResolvers.MemberInvitation?.acceptedBy as unknown as (parent: typeof mockParent, args: unknown, ctx: GraphContext, info: unknown) => Promise<EndUserResult | null>)(mockParent, {}, context, {});
		});

		Then('it should call User.EndUser.queryById with "user-id-2"', () => {
			expect(vi.mocked(context.applicationServices.User.EndUser.queryById)).toHaveBeenCalledWith({ id: 'user-id-2' });
		});

		And('it should return the resolved end user', () => {
			expect(resolvedEndUser?.id).toBe('user-id-2');
		});
	});

	Scenario('MemberInvitation acceptedBy resolver when absent', ({ Given, When, Then }) => {
		let resolvedResult: unknown;
		const mockParent = { acceptedBy: undefined };

		Given('a member invitation with no acceptedBy set', () => {
			/* empty */
		});

		When('the MemberInvitation.acceptedBy resolver is executed', async () => {
			resolvedResult = await (memberResolvers.MemberInvitation?.acceptedBy as unknown as (parent: typeof mockParent, args: unknown, ctx: GraphContext, info: unknown) => Promise<null>)(mockParent, {}, context, {});
		});

		Then('it should return null', () => {
			expect(resolvedResult).toBeNull();
		});
	});
});
