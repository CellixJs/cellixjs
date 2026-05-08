import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import { type FieldNode, type GraphQLObjectType, type GraphQLResolveInfo, type GraphQLSchema, Kind, type OperationDefinitionNode } from 'graphql';
import { expect, vi } from 'vitest';
import type { GraphContext } from '../context.ts';
import staffUserResolvers from './staff-user.resolvers.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-user.resolvers.feature'));

type StaffUserEntity = Domain.Contexts.User.StaffUser.StaffUserEntityReference;

function createMockStaffUser(overrides: Partial<StaffUserEntity> = {}): StaffUserEntity {
	return {
		id: 'mock-staff-user-id',
		externalId: 'mock-external-id',
		firstName: 'Jane',
		lastName: 'Smith',
		displayName: 'Jane Smith',
		email: 'jane@example.com',
		accessBlocked: false,
		tags: [],
		userType: 'staff',
		role: undefined,
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
		...overrides,
	} as unknown as StaffUserEntity;
}

function makeMockInfo(fieldName: string): GraphQLResolveInfo {
	const mockFieldNode: FieldNode = {
		kind: Kind.FIELD,
		name: { kind: Kind.NAME, value: fieldName },
	};
	return {
		fieldName,
		fieldNodes: [mockFieldNode],
		returnType: {} as GraphQLObjectType,
		parentType: {} as GraphQLObjectType,
		path: { key: fieldName, prev: undefined, typename: undefined },
		schema: {} as GraphQLSchema,
		fragments: {},
		rootValue: {},
		operation: {} as OperationDefinitionNode,
		variableValues: {},
	} as unknown as GraphQLResolveInfo;
}

function makeMockGraphContext(overrides: Partial<GraphContext> = {}): GraphContext {
	return {
		applicationServices: {
			User: {
				StaffUser: {
					createIfNotExists: vi.fn(),
					queryByExternalId: vi.fn(),
				},
			},
			verifiedUser: {
				verifiedJwt: {
					sub: 'default-user-sub',
					given_name: 'Jane',
					family_name: 'Smith',
					email: 'jane@example.com',
					roles: [],
				},
			},
			...overrides.applicationServices,
		},
		...overrides,
	} as unknown as GraphContext;
}

type QueryResolver = (
	parent: object,
	args: Record<string, never>,
	context: GraphContext,
	info: GraphQLResolveInfo,
) => Promise<StaffUserEntity>;

const callCurrentStaffUserQuery = (context: GraphContext) =>
	(staffUserResolvers.Query?.currentStaffUserAndCreateIfNotExists as unknown as QueryResolver)(
		{},
		{},
		context,
		makeMockInfo('currentStaffUserAndCreateIfNotExists'),
	);

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let context: GraphContext;
	let result: StaffUserEntity | null;

	BeforeEachScenario(() => {
		context = makeMockGraphContext();
		vi.clearAllMocks();
		result = null;
	});

	Scenario('Querying the current staff user and creating if not exists', ({ Given, When, Then, And }) => {
		const mockStaffUser = createMockStaffUser();

		Given('a user with a verifiedJwt in their context', () => {
			// Already set up in BeforeEachScenario with default jwt
		});

		When('the currentStaffUserAndCreateIfNotExists query is executed', async () => {
			vi.mocked(context.applicationServices.User.StaffUser.createIfNotExists).mockResolvedValue(mockStaffUser);
			result = await callCurrentStaffUserQuery(context);
		});

		Then('it should call User.StaffUser.createIfNotExists with the JWT claims', () => {
			expect(context.applicationServices.User.StaffUser.createIfNotExists).toHaveBeenCalledWith({
				externalId: 'default-user-sub',
				firstName: 'Jane',
				lastName: 'Smith',
				email: 'jane@example.com',
				aadRoles: [],
			});
		});

		And('it should return the corresponding StaffUser entity', () => {
			expect(result).toEqual(mockStaffUser);
		});
	});

	Scenario('Querying the current staff user with AAD roles', ({ Given, When, Then, And }) => {
		const mockStaffUser = createMockStaffUser();
		const aadRoles = ['Staff.CaseManager', 'Staff.Finance'];

		Given('a user with a verifiedJwt that includes AAD roles in their context', () => {
			context = makeMockGraphContext({
				applicationServices: {
					User: {
						StaffUser: {
							createIfNotExists: vi.fn(),
							queryByExternalId: vi.fn(),
						},
					},
					verifiedUser: {
						verifiedJwt: {
							sub: 'roles-user-sub',
							given_name: 'Bob',
							family_name: 'Jones',
							email: 'bob@example.com',
							roles: aadRoles,
						},
					},
				} as unknown as GraphContext['applicationServices'],
			});
		});

		When('the currentStaffUserAndCreateIfNotExists query is executed', async () => {
			vi.mocked(context.applicationServices.User.StaffUser.createIfNotExists).mockResolvedValue(mockStaffUser);
			result = await callCurrentStaffUserQuery(context);
		});

		Then('it should call User.StaffUser.createIfNotExists with the AAD roles', () => {
			expect(context.applicationServices.User.StaffUser.createIfNotExists).toHaveBeenCalledWith({
				externalId: 'roles-user-sub',
				firstName: 'Bob',
				lastName: 'Jones',
				email: 'bob@example.com',
				aadRoles,
			});
		});

		And('it should return the corresponding StaffUser entity', () => {
			expect(result).toEqual(mockStaffUser);
		});
	});

	Scenario('Querying the current staff user with no JWT', ({ Given, When, Then }) => {
		Given('a user without a verifiedJwt in their context', () => {
			if (context.applicationServices.verifiedUser) {
				context.applicationServices.verifiedUser.verifiedJwt = undefined;
			}
		});

		When('the currentStaffUserAndCreateIfNotExists query is executed', async () => {
			await expect(callCurrentStaffUserQuery(context)).rejects.toThrow('Unauthorized');
		});

		Then('it should throw an "Unauthorized" error', () => {
			// Already asserted in When
		});
	});
});
