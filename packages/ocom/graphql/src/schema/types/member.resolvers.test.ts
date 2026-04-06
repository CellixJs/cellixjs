import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Domain } from '@ocom/domain';
import type { GraphContext } from '../context.ts';
import memberResolvers from './member.resolvers.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/member.resolvers.feature'));

type CommunityEntity = { id: string; name: string };
type MemberEntity = { id: string; communityId: string };
type CommunityReference = Domain.Contexts.Community.Community.CommunityEntityReference;
type MemberReference = Domain.Contexts.Community.Member.MemberEntityReference;
type MutationResult = { status: { success: boolean; errorMessage?: string }; member?: MemberReference };

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
					queryByCommunityId: vi.fn(),
					addMember: vi.fn(),
					removeMember: vi.fn(),
					updateMemberRole: vi.fn(),
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

type MemberAddInput = { communityId: string; memberName: string; firstName: string; lastName?: string; userExternalId: string };
type MemberRemoveInput = { memberId: string };
type MemberRoleUpdateInput = { memberId: string; roleId: string };

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let context: GraphContext;
	let member: MemberEntity;
	let communityResult: unknown;
	let booleanResult: boolean | null;
	let membersResult: unknown;
	let mutationResult: MutationResult | null;

	BeforeEachScenario(() => {
		context = makeMockGraphContext();
		member = createMockMember();
		communityResult = null;
		booleanResult = null;
		membersResult = null;
		mutationResult = null;
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

	Scenario('Querying members by community ID', ({ Given, And, When, Then }) => {
		const resolvedMembers = [createMockMember({ id: 'member-10', communityId: 'community-456' })];
		const domainMembers = resolvedMembers as unknown as MemberReference[];

		Given('a signed in user with subject "user-sub-123"', () => {
			if (context.applicationServices.verifiedUser?.verifiedJwt) {
				context.applicationServices.verifiedUser.verifiedJwt.sub = 'user-sub-123';
			}
		});

		And('the member service can return members for community "community-456"', () => {
			vi.mocked(context.applicationServices.Community.Member.queryByCommunityId).mockResolvedValue(domainMembers);
		});

		When('the membersByCommunityId query is executed with communityId "community-456"', async () => {
			membersResult = await (memberResolvers.Query?.membersByCommunityId as unknown as (parent: unknown, args: { communityId: string }, graphContext: GraphContext, info: unknown) => Promise<MemberReference[]>)(
				null,
				{ communityId: 'community-456' },
				context,
				{},
			);
		});

		Then('it should call Community.Member.queryByCommunityId with the communityId', () => {
			expect(context.applicationServices.Community.Member.queryByCommunityId).toHaveBeenCalledWith({
				communityId: 'community-456',
			});
		});

		And('it should return the list of members for that community', () => {
			expect(membersResult as MemberEntity[]).toEqual(resolvedMembers);
		});
	});

	Scenario('Querying members by community ID without authentication', ({ Given, When, Then }) => {
		Given('a user without a verified JWT', () => {
			if (context.applicationServices.verifiedUser) {
				context.applicationServices.verifiedUser.verifiedJwt = undefined;
			}
		});

		When('the membersByCommunityId query is executed with communityId "community-456"', async () => {
			await expect(
				(memberResolvers.Query?.membersByCommunityId as unknown as (parent: unknown, args: { communityId: string }, graphContext: GraphContext, info: unknown) => Promise<MemberReference[]>)(
					null,
					{ communityId: 'community-456' },
					context,
					{},
				),
			).rejects.toThrow('Unauthorized');
		});

		Then('it should throw an "Unauthorized" error', () => {
			// Assertion performed in When step
		});
	});

	Scenario('Adding a member to a community', ({ Given, And, When, Then }) => {
		const newMember = createMockMember({ id: 'new-member-1' });
		const domainMember = newMember as unknown as MemberReference;

		Given('a signed in user with subject "admin-sub-456"', () => {
			if (context.applicationServices.verifiedUser?.verifiedJwt) {
				context.applicationServices.verifiedUser.verifiedJwt.sub = 'admin-sub-456';
			}
		});

		And('the member add service returns a new member', () => {
			vi.mocked(context.applicationServices.Community.Member.addMember).mockResolvedValue(domainMember);
		});

		When('the memberAdd mutation is executed', async () => {
			const input: MemberAddInput = { communityId: 'community-123', memberName: 'Jane Doe', firstName: 'Jane', lastName: 'Doe', userExternalId: 'user-ext-1' };
			mutationResult = await (memberResolvers.Mutation?.memberAdd as unknown as (parent: unknown, args: { input: MemberAddInput }, graphContext: GraphContext, info: unknown) => Promise<MutationResult>)(
				null,
				{ input },
				context,
				{},
			);
		});

		Then('it should return a MemberMutationResult with success true and the new member', () => {
			expect(mutationResult?.status.success).toBe(true);
			expect(mutationResult?.member).toEqual(newMember);
		});
	});

	Scenario('Adding a member to a community fails', ({ Given, And, When, Then }) => {
		Given('a signed in user with subject "admin-sub-456"', () => {
			if (context.applicationServices.verifiedUser?.verifiedJwt) {
				context.applicationServices.verifiedUser.verifiedJwt.sub = 'admin-sub-456';
			}
		});

		And('the member add service throws an error "Cannot add member"', () => {
			vi.mocked(context.applicationServices.Community.Member.addMember).mockRejectedValue(new Error('Cannot add member'));
		});

		When('the memberAdd mutation is executed', async () => {
			const input: MemberAddInput = { communityId: 'community-123', memberName: 'Jane Doe', firstName: 'Jane', lastName: 'Doe', userExternalId: 'user-ext-1' };
			mutationResult = await (memberResolvers.Mutation?.memberAdd as unknown as (parent: unknown, args: { input: MemberAddInput }, graphContext: GraphContext, info: unknown) => Promise<MutationResult>)(
				null,
				{ input },
				context,
				{},
			);
		});

		Then('it should return a MemberMutationResult with success false and the error message', () => {
			expect(mutationResult?.status.success).toBe(false);
			expect(mutationResult?.status.errorMessage).toBe('Cannot add member');
		});
	});

	Scenario('Removing a member from a community', ({ Given, And, When, Then }) => {
		const removedMember = createMockMember({ id: 'member-to-remove' });
		const domainMember = removedMember as unknown as MemberReference;

		Given('a signed in user with subject "admin-sub-456"', () => {
			if (context.applicationServices.verifiedUser?.verifiedJwt) {
				context.applicationServices.verifiedUser.verifiedJwt.sub = 'admin-sub-456';
			}
		});

		And('the member remove service returns the removed member', () => {
			vi.mocked(context.applicationServices.Community.Member.removeMember).mockResolvedValue(domainMember);
		});

		When('the memberRemove mutation is executed', async () => {
			const input: MemberRemoveInput = { memberId: 'member-to-remove' };
			mutationResult = await (memberResolvers.Mutation?.memberRemove as unknown as (parent: unknown, args: { input: MemberRemoveInput }, graphContext: GraphContext, info: unknown) => Promise<MutationResult>)(
				null,
				{ input },
				context,
				{},
			);
		});

		Then('it should return a MemberMutationResult with success true', () => {
			expect(mutationResult?.status.success).toBe(true);
		});
	});

	Scenario('Removing a member from a community fails', ({ Given, And, When, Then }) => {
		Given('a signed in user with subject "admin-sub-456"', () => {
			if (context.applicationServices.verifiedUser?.verifiedJwt) {
				context.applicationServices.verifiedUser.verifiedJwt.sub = 'admin-sub-456';
			}
		});

		And('the member remove service throws an error "Cannot remove member"', () => {
			vi.mocked(context.applicationServices.Community.Member.removeMember).mockRejectedValue(new Error('Cannot remove member'));
		});

		When('the memberRemove mutation is executed', async () => {
			const input: MemberRemoveInput = { memberId: 'member-to-remove' };
			mutationResult = await (memberResolvers.Mutation?.memberRemove as unknown as (parent: unknown, args: { input: MemberRemoveInput }, graphContext: GraphContext, info: unknown) => Promise<MutationResult>)(
				null,
				{ input },
				context,
				{},
			);
		});

		Then('it should return a MemberMutationResult with success false and the error message', () => {
			expect(mutationResult?.status.success).toBe(false);
			expect(mutationResult?.status.errorMessage).toBe('Cannot remove member');
		});
	});

	Scenario("Updating a member's role", ({ Given, And, When, Then }) => {
		const updatedMember = createMockMember({ id: 'member-to-update' });
		const domainMember = updatedMember as unknown as MemberReference;

		Given('a signed in user with subject "admin-sub-456"', () => {
			if (context.applicationServices.verifiedUser?.verifiedJwt) {
				context.applicationServices.verifiedUser.verifiedJwt.sub = 'admin-sub-456';
			}
		});

		And('the member role update service returns the updated member', () => {
			vi.mocked(context.applicationServices.Community.Member.updateMemberRole).mockResolvedValue(domainMember);
		});

		When('the memberRoleUpdate mutation is executed', async () => {
			const input: MemberRoleUpdateInput = { memberId: 'member-to-update', roleId: 'role-123' };
			mutationResult = await (memberResolvers.Mutation?.memberRoleUpdate as unknown as (parent: unknown, args: { input: MemberRoleUpdateInput }, graphContext: GraphContext, info: unknown) => Promise<MutationResult>)(
				null,
				{ input },
				context,
				{},
			);
		});

		Then('it should return a MemberMutationResult with success true', () => {
			expect(mutationResult?.status.success).toBe(true);
		});
	});

	Scenario('Adding a member without authentication', ({ Given, When, Then }) => {
		Given('a user without a verified JWT', () => {
			if (context.applicationServices.verifiedUser) {
				context.applicationServices.verifiedUser.verifiedJwt = undefined;
			}
		});

		When('the memberAdd mutation is executed unauthenticated', async () => {
			const input: MemberAddInput = { communityId: 'community-123', memberName: 'Jane', firstName: 'Jane', userExternalId: 'user-ext-1' };
			mutationResult = await (memberResolvers.Mutation?.memberAdd as unknown as (parent: unknown, args: { input: MemberAddInput }, graphContext: GraphContext, info: unknown) => Promise<MutationResult>)(
				null,
				{ input },
				context,
				{},
			);
		});

		Then('it should return a MemberMutationResult with success false and the error message', () => {
			expect(mutationResult?.status.success).toBe(false);
			expect(mutationResult?.status.errorMessage).toBe('Unauthorized');
		});
	});
});

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

	Scenario('Querying members by community ID', ({ Given, And, When, Then }) => {
		const resolvedMembers = [createMockMember({ id: 'member-10', communityId: 'community-456' })];
		const domainMembers = resolvedMembers as unknown as MemberReference[];

		Given('a signed in user with subject "user-sub-123"', () => {
			if (context.applicationServices.verifiedUser?.verifiedJwt) {
				context.applicationServices.verifiedUser.verifiedJwt.sub = 'user-sub-123';
			}
		});

		And('the member service can return members for community "community-456"', () => {
			vi.mocked(context.applicationServices.Community.Member.queryByCommunityId).mockResolvedValue(domainMembers);
		});

		When('the membersByCommunityId query is executed with communityId "community-456"', async () => {
			membersResult = await (memberResolvers.Query?.membersByCommunityId as unknown as (parent: unknown, args: { communityId: string }, graphContext: GraphContext, info: unknown) => Promise<MemberReference[]>)(
				null,
				{ communityId: 'community-456' },
				context,
				{},
			);
		});

		Then('it should call Community.Member.queryByCommunityId with the communityId', () => {
			expect(context.applicationServices.Community.Member.queryByCommunityId).toHaveBeenCalledWith({
				communityId: 'community-456',
			});
		});

		And('it should return the list of members for that community', () => {
			expect(membersResult as MemberEntity[]).toEqual(resolvedMembers);
		});
	});

	Scenario('Querying members by community ID without authentication', ({ Given, When, Then }) => {
		Given('a user without a verified JWT', () => {
			if (context.applicationServices.verifiedUser) {
				context.applicationServices.verifiedUser.verifiedJwt = undefined;
			}
		});

		When('the membersByCommunityId query is executed with communityId "community-456"', async () => {
			await expect(
				(memberResolvers.Query?.membersByCommunityId as unknown as (parent: unknown, args: { communityId: string }, graphContext: GraphContext, info: unknown) => Promise<MemberReference[]>)(
					null,
					{ communityId: 'community-456' },
					context,
					{},
				),
			).rejects.toThrow('Unauthorized');
		});

		Then('it should throw an "Unauthorized" error', () => {
			// Assertion performed in When step
		});
	});
});
