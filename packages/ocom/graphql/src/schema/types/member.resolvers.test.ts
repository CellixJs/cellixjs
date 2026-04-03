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
					listByCommunityId: vi.fn(),
					getById: vi.fn(),
					create: vi.fn(),
					update: vi.fn(),
					addAccount: vi.fn(),
					editAccount: vi.fn(),
					removeAccount: vi.fn(),
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
	let memberResult: unknown;
	let mutationResult: unknown;

	BeforeEachScenario(() => {
		context = makeMockGraphContext();
		member = createMockMember();
		communityResult = null;
		booleanResult = null;
		membersResult = null;
		memberResult = null;
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
		const resolvedMembers = [createMockMember({ id: 'member-99', communityId: 'community-abc' })];
		const domainMembers = resolvedMembers as unknown as MemberReference[];

		Given('a signed in user with subject "user-sub-456"', () => {
			if (context.applicationServices.verifiedUser?.verifiedJwt) {
				context.applicationServices.verifiedUser.verifiedJwt.sub = 'user-sub-456';
			}
		});

		And('the member service can return members for community "community-abc"', () => {
			vi.mocked(context.applicationServices.Community.Member.listByCommunityId).mockResolvedValue(domainMembers);
		});

		When('the membersByCommunityId query is executed with communityId "community-abc"', async () => {
			membersResult = await (memberResolvers.Query?.membersByCommunityId as unknown as (parent: unknown, args: { communityId: string }, graphContext: GraphContext, info: unknown) => Promise<MemberReference[]>)(
				null,
				{ communityId: 'community-abc' },
				context,
				{},
			);
		});

		Then('it should call Community.Member.listByCommunityId with communityId "community-abc"', () => {
			expect(context.applicationServices.Community.Member.listByCommunityId).toHaveBeenCalledWith({
				communityId: 'community-abc',
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

		When('the membersByCommunityId query is executed with communityId "community-abc"', async () => {
			await expect(
				(memberResolvers.Query?.membersByCommunityId as unknown as (parent: unknown, args: { communityId: string }, graphContext: GraphContext, info: unknown) => Promise<MemberReference[]>)(
					null,
					{ communityId: 'community-abc' },
					context,
					{},
				),
			).rejects.toThrow('Unauthorized');
		});

		Then('it should throw an "Unauthorized" error', () => {
			// Assertion performed in When step
		});
	});

	Scenario('Getting a member by ID', ({ Given, And, When, Then }) => {
		const resolvedMember = createMockMember({ id: 'member-777' });
		const domainMember = resolvedMember as unknown as MemberReference;

		Given('a signed in user with subject "user-sub-789"', () => {
			if (context.applicationServices.verifiedUser?.verifiedJwt) {
				context.applicationServices.verifiedUser.verifiedJwt.sub = 'user-sub-789';
			}
		});

		And('the member service can return a member for id "member-777"', () => {
			vi.mocked(context.applicationServices.Community.Member.getById).mockResolvedValue(domainMember);
		});

		When('the member query is executed with id "member-777"', async () => {
			memberResult = await (memberResolvers.Query?.member as unknown as (parent: unknown, args: { id: string }, graphContext: GraphContext, info: unknown) => Promise<MemberReference | null>)(
				null,
				{ id: 'member-777' },
				context,
				{},
			);
		});

		Then('it should call Community.Member.getById with id "member-777"', () => {
			expect(context.applicationServices.Community.Member.getById).toHaveBeenCalledWith({
				id: 'member-777',
			});
		});

		And('it should return the member', () => {
			expect(memberResult as MemberEntity).toEqual(resolvedMember);
		});
	});

	Scenario('Getting a member by ID without authentication', ({ Given, When, Then }) => {
		Given('a user without a verified JWT', () => {
			if (context.applicationServices.verifiedUser) {
				context.applicationServices.verifiedUser.verifiedJwt = undefined;
			}
		});

		When('the member query is executed with id "member-777"', async () => {
			await expect(
				(memberResolvers.Query?.member as unknown as (parent: unknown, args: { id: string }, graphContext: GraphContext, info: unknown) => Promise<MemberReference | null>)(null, { id: 'member-777' }, context, {}),
			).rejects.toThrow('Unauthorized');
		});

		Then('it should throw an "Unauthorized" error', () => {
			// Assertion performed in When step
		});
	});

	Scenario('Creating a member', ({ Given, And, When, Then }) => {
		const createdMember = createMockMember({ id: 'member-new', communityId: 'community-create' });
		const domainMember = createdMember as unknown as MemberReference;

		Given('a signed in user with subject "user-sub-create"', () => {
			if (context.applicationServices.verifiedUser?.verifiedJwt) {
				context.applicationServices.verifiedUser.verifiedJwt.sub = 'user-sub-create';
			}
		});

		And('the member service can create a member', () => {
			vi.mocked(context.applicationServices.Community.Member.create).mockResolvedValue(domainMember);
		});

		When('the memberCreate mutation is executed with memberName "New Member" and communityId "community-create"', async () => {
			mutationResult = await (memberResolvers.Mutation?.memberCreate as unknown as (parent: unknown, args: { input: { memberName: string; communityId: string } }, graphContext: GraphContext) => Promise<unknown>)(
				null,
				{ input: { memberName: 'New Member', communityId: 'community-create' } },
				context,
			);
		});

		Then('it should call Community.Member.create with memberName "New Member" and communityId "community-create"', () => {
			expect(context.applicationServices.Community.Member.create).toHaveBeenCalledWith({
				memberName: 'New Member',
				communityId: 'community-create',
			});
		});

		And('it should return a successful mutation result with the created member', () => {
			expect(mutationResult).toEqual({ status: { success: true }, member: createdMember });
		});
	});

	Scenario('Creating a member without authentication', ({ Given, When, Then }) => {
		Given('a user without a verified JWT', () => {
			if (context.applicationServices.verifiedUser) {
				context.applicationServices.verifiedUser.verifiedJwt = undefined;
			}
		});

		When('the memberCreate mutation is executed with memberName "New Member" and communityId "community-create"', async () => {
			await expect(
				(memberResolvers.Mutation?.memberCreate as unknown as (parent: unknown, args: { input: { memberName: string; communityId: string } }, graphContext: GraphContext) => Promise<unknown>)(
					null,
					{ input: { memberName: 'New Member', communityId: 'community-create' } },
					context,
				),
			).rejects.toThrow('Unauthorized');
		});

		Then('it should throw an "Unauthorized" error', () => {
			// Assertion performed in When step
		});
	});

	Scenario('Updating a member', ({ Given, And, When, Then }) => {
		const updatedMember = createMockMember({ id: 'member-upd' });
		const domainMember = updatedMember as unknown as MemberReference;

		Given('a signed in user with subject "user-sub-update"', () => {
			if (context.applicationServices.verifiedUser?.verifiedJwt) {
				context.applicationServices.verifiedUser.verifiedJwt.sub = 'user-sub-update';
			}
		});

		And('the member service can update a member', () => {
			vi.mocked(context.applicationServices.Community.Member.update).mockResolvedValue(domainMember);
		});

		When('the memberUpdate mutation is executed with id "member-upd" and memberName "Updated Name"', async () => {
			mutationResult = await (memberResolvers.Mutation?.memberUpdate as unknown as (parent: unknown, args: { input: { id: string; memberName: string } }, graphContext: GraphContext) => Promise<unknown>)(
				null,
				{ input: { id: 'member-upd', memberName: 'Updated Name' } },
				context,
			);
		});

		Then('it should call Community.Member.update with id "member-upd" and memberName "Updated Name"', () => {
			expect(context.applicationServices.Community.Member.update).toHaveBeenCalledWith({
				id: 'member-upd',
				memberName: 'Updated Name',
			});
		});

		And('it should return a successful mutation result with the updated member', () => {
			expect(mutationResult).toEqual({ status: { success: true }, member: updatedMember });
		});
	});

	Scenario('Updating a member without authentication', ({ Given, When, Then }) => {
		Given('a user without a verified JWT', () => {
			if (context.applicationServices.verifiedUser) {
				context.applicationServices.verifiedUser.verifiedJwt = undefined;
			}
		});

		When('the memberUpdate mutation is executed with id "member-upd" and memberName "Updated Name"', async () => {
			await expect(
				(memberResolvers.Mutation?.memberUpdate as unknown as (parent: unknown, args: { input: { id: string; memberName: string } }, graphContext: GraphContext) => Promise<unknown>)(
					null,
					{ input: { id: 'member-upd', memberName: 'Updated Name' } },
					context,
				),
			).rejects.toThrow('Unauthorized');
		});

		Then('it should throw an "Unauthorized" error', () => {
			// Assertion performed in When step
		});
	});
});
