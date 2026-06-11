import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import { type FieldNode, type GraphQLObjectType, type GraphQLResolveInfo, type GraphQLSchema, Kind, type OperationDefinitionNode } from 'graphql';
import { expect, vi } from 'vitest';
import type { GraphContext } from '../context.ts';
import staffRoleResolvers from './staff-role.resolvers.ts';
import staffUserResolvers from './staff-user.resolvers.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-user.resolvers.feature'));

// ─── Domain types ─────────────────────────────────────────────────────────────

type StaffUserEntity = Domain.Contexts.User.StaffUser.StaffUserEntityReference;
type StaffRoleEntity = Domain.Contexts.User.StaffRole.StaffRoleEntityReference;

// ─── Mock factories ───────────────────────────────────────────────────────────

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

function createMockStaffRole(overrides: Partial<StaffRoleEntity> = {}): StaffRoleEntity {
	return {
		id: 'mock-role-id',
		roleName: 'Mock Role',
		enterpriseAppRole: 'Staff.CaseManager',
		isDefault: false,
		roleType: null,
		permissions: {},
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
		...overrides,
	} as unknown as StaffRoleEntity;
}

function makeMockInfo(fieldName: string): GraphQLResolveInfo {
	const mockFieldNode: FieldNode = { kind: Kind.FIELD, name: { kind: Kind.NAME, value: fieldName } };
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

type JwtOverride = {
	sub?: string;
	given_name?: string;
	family_name?: string;
	email?: string;
	roles?: string[];
};

type MockedStaffUserService = GraphContext['applicationServices']['User']['StaffUser'] & {
	createIfNotExists: ReturnType<typeof vi.fn>;
	list: ReturnType<typeof vi.fn>;
	assignRole: ReturnType<typeof vi.fn>;
	create: ReturnType<typeof vi.fn>;
	queryByExternalId: ReturnType<typeof vi.fn>;
};

type MockedStaffRoleService = GraphContext['applicationServices']['User']['StaffRole'] & {
	list: ReturnType<typeof vi.fn>;
	createDefaultRoles: ReturnType<typeof vi.fn>;
	queryById: ReturnType<typeof vi.fn>;
	create: ReturnType<typeof vi.fn>;
	update: ReturnType<typeof vi.fn>;
};

type TestGraphContext = Omit<GraphContext, 'applicationServices'> & {
	applicationServices: Omit<GraphContext['applicationServices'], 'User'> & {
		User: Omit<GraphContext['applicationServices']['User'], 'StaffUser' | 'StaffRole'> & {
			StaffUser: MockedStaffUserService;
			StaffRole: MockedStaffRoleService;
		};
	};
};

function makeMockGraphContext(options: {
	jwt?: JwtOverride | null;
	staffUserServices?: Partial<TestGraphContext['applicationServices']['User']['StaffUser']>;
	staffRoleServices?: Partial<TestGraphContext['applicationServices']['User']['StaffRole']>;
} = {}): TestGraphContext {
	const { jwt = {}, staffUserServices = {}, staffRoleServices = {} } = options;
	return {
		applicationServices: {
			User: {
				StaffUser: {
					createIfNotExists: vi.fn(),
					list: vi.fn(),
					assignRole: vi.fn(),
					create: vi.fn(),
					queryByExternalId: vi.fn(),
					...staffUserServices,
				},
				StaffRole: {
					list: vi.fn(),
					createDefaultRoles: vi.fn(),
					queryById: vi.fn(),
					create: vi.fn(),
					update: vi.fn(),
					...staffRoleServices,
				},
			},
			verifiedUser: jwt === null ? undefined : {
				verifiedJwt: jwt === null ? undefined : {
					sub: 'default-user-sub',
					given_name: 'Jane',
					family_name: 'Smith',
					email: 'jane@example.com',
					roles: [],
					...jwt,
				},
			},
		},
	} as unknown as TestGraphContext;
}

// ─── Resolver call helpers ────────────────────────────────────────────────────

const Query = {
	...(staffRoleResolvers.Query ?? {}),
	...(staffUserResolvers.Query ?? {}),
} as Record<string, (...args: unknown[]) => unknown>;
const Mutation = {
	...(staffRoleResolvers.Mutation ?? {}),
	...(staffUserResolvers.Mutation ?? {}),
} as Record<string, (...args: unknown[]) => unknown>;

const callQuery = (name: string, context: GraphContext, args: object = {}) =>
	// biome-ignore lint/style/noNonNullAssertion: test helper — key always exists
	Query[name]!({}, args, context, makeMockInfo(name)) as Promise<unknown>;

const callMutation = (name: string, context: GraphContext, args: object = {}) =>
	// biome-ignore lint/style/noNonNullAssertion: test helper — key always exists
	Mutation[name]!({}, args, context, makeMockInfo(name)) as Promise<unknown>;

// ─── Tests ────────────────────────────────────────────────────────────────────

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let context: TestGraphContext;
	let result: unknown;
	let thrownError: unknown;

	BeforeEachScenario(() => {
		context = makeMockGraphContext();
		result = undefined;
		thrownError = undefined;
		vi.clearAllMocks();
	});

	// ─── currentStaffUserAndCreateIfNotExists ─────────────────────────────────

	Scenario('Querying the current staff user and creating if not exists', ({ Given, When, Then, And }) => {
		const mockStaffUser = createMockStaffUser();

		Given('a user with a verifiedJwt in their context', () => {
			context = makeMockGraphContext();
		});

		When('the currentStaffUserAndCreateIfNotExists query is executed', async () => {
			vi.mocked(context.applicationServices.User.StaffUser.createIfNotExists).mockResolvedValue(mockStaffUser);
			result = await callQuery('currentStaffUserAndCreateIfNotExists', context);
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
			context = makeMockGraphContext({ jwt: { sub: 'roles-user-sub', given_name: 'Bob', family_name: 'Jones', email: 'bob@example.com', roles: aadRoles } });
		});

		When('the currentStaffUserAndCreateIfNotExists query is executed', async () => {
			vi.mocked(context.applicationServices.User.StaffUser.createIfNotExists).mockResolvedValue(mockStaffUser);
			result = await callQuery('currentStaffUserAndCreateIfNotExists', context);
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
			context = makeMockGraphContext({ jwt: null });
		});

		When('the currentStaffUserAndCreateIfNotExists query is executed', async () => {
			try {
				await callQuery('currentStaffUserAndCreateIfNotExists', context);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should throw an "Unauthorized" error', () => {
			expect(thrownError).toBeDefined();
			expect((thrownError as Error).message).toBe('Unauthorized');
		});
	});

	// ─── staffUsers ───────────────────────────────────────────────────────────

	Scenario('Listing staff users when authenticated', ({ Given, When, Then }) => {
		Given('a user with a verifiedJwt in their context', () => {
			context = makeMockGraphContext();
		});

		When('the staffUsers query is executed', async () => {
			const mockUsers = [createMockStaffUser()];
			vi.mocked(context.applicationServices.User.StaffUser.list).mockResolvedValue(mockUsers);
			result = await callQuery('staffUsers', context);
		});

		Then('it should return the list of staff users', () => {
			expect(Array.isArray(result)).toBe(true);
		});
	});

	Scenario('Listing staff users when unauthenticated', ({ Given, When, Then }) => {
		Given('a user without a verifiedJwt in their context', () => {
			context = makeMockGraphContext({ jwt: null });
		});

		When('the staffUsers query is executed', async () => {
			try {
				await callQuery('staffUsers', context);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should throw an "Unauthorized" error', () => {
			expect((thrownError as Error).message).toBe('Unauthorized');
		});
	});

	// ─── staffRoles ───────────────────────────────────────────────────────────

	Scenario('Listing staff roles when authenticated', ({ Given, When, Then, And }) => {
		const mockRoles = [createMockStaffRole()];

		Given('a user with a verifiedJwt in their context', () => {
			context = makeMockGraphContext();
		});

		When('the staffRoles query is executed', async () => {
			vi.mocked(context.applicationServices.User.StaffRole.createDefaultRoles).mockResolvedValue([]);
			vi.mocked(context.applicationServices.User.StaffRole.list).mockResolvedValue(mockRoles);
			result = await callQuery('staffRoles', context);
		});

		Then('it should call createDefaultRoles', () => {
			expect(context.applicationServices.User.StaffRole.createDefaultRoles).toHaveBeenCalled();
		});

		And('it should return the list of staff roles', () => {
			expect(result).toEqual(mockRoles);
		});
	});

	Scenario('Listing staff roles when unauthenticated', ({ Given, When, Then }) => {
		Given('a user without a verifiedJwt in their context', () => {
			context = makeMockGraphContext({ jwt: null });
		});

		When('the staffRoles query is executed', async () => {
			try {
				await callQuery('staffRoles', context);
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should throw an "Unauthorized" error', () => {
			expect((thrownError as Error).message).toBe('Unauthorized');
		});
	});

	// ─── staffRoleById ────────────────────────────────────────────────────────

	Scenario('Querying a staff role by id when authenticated', ({ Given, When, Then }) => {
		const mockRole = createMockStaffRole({ id: 'role-001' });

		Given('a user with a verifiedJwt in their context', () => {
			context = makeMockGraphContext();
		});

		When('the staffRoleById query is executed with id "role-001"', async () => {
			vi.mocked(context.applicationServices.User.StaffRole.queryById).mockResolvedValue(mockRole);
			result = await callQuery('staffRoleById', context, { id: 'role-001' });
		});

		Then('it should return the staff role with id "role-001"', () => {
			expect(result).toEqual(mockRole);
			expect(context.applicationServices.User.StaffRole.queryById).toHaveBeenCalledWith({ roleId: 'role-001' });
		});
	});

	Scenario('Querying a staff role by id when unauthenticated', ({ Given, When, Then }) => {
		Given('a user without a verifiedJwt in their context', () => {
			context = makeMockGraphContext({ jwt: null });
		});

		When('the staffRoleById query is executed with id "role-001"', async () => {
			try {
				await callQuery('staffRoleById', context, { id: 'role-001' });
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should throw an "Unauthorized" error', () => {
			expect((thrownError as Error).message).toBe('Unauthorized');
		});
	});

	// ─── staffUserById ────────────────────────────────────────────────────────

	Scenario('Querying a staff user by id when the user exists', ({ Given, When, Then }) => {
		const mockUser = createMockStaffUser({ id: 'user-001' });

		Given('a user with a verifiedJwt in their context', () => {
			context = makeMockGraphContext();
		});

		When('the staffUserById query is executed with id "user-001"', async () => {
			vi.mocked(context.applicationServices.User.StaffUser.list).mockResolvedValue([mockUser]);
			result = await callQuery('staffUserById', context, { id: 'user-001' });
		});

		Then('it should return the staff user with id "user-001"', () => {
			expect((result as StaffUserEntity)?.id).toBe('user-001');
		});
	});

	Scenario('Querying a staff user by id when the user does not exist', ({ Given, When, Then }) => {
		Given('a user with a verifiedJwt in their context', () => {
			context = makeMockGraphContext();
		});

		When('the staffUserById query is executed with id "user-missing"', async () => {
			vi.mocked(context.applicationServices.User.StaffUser.list).mockResolvedValue([createMockStaffUser({ id: 'user-001' })]);
			result = await callQuery('staffUserById', context, { id: 'user-missing' });
		});

		Then('it should return null', () => {
			expect(result).toBeNull();
		});
	});

	Scenario('Querying a staff user by id when unauthenticated', ({ Given, When, Then }) => {
		Given('a user without a verifiedJwt in their context', () => {
			context = makeMockGraphContext({ jwt: null });
		});

		When('the staffUserById query is executed with id "user-001"', async () => {
			try {
				await callQuery('staffUserById', context, { id: 'user-001' });
			} catch (e) {
				thrownError = e;
			}
		});

		Then('it should throw an "Unauthorized" error', () => {
			expect((thrownError as Error).message).toBe('Unauthorized');
		});
	});

	// ─── staffRoleCreate ──────────────────────────────────────────────────────

	Scenario('Creating a staff role as TechAdmin', ({ Given, When, Then }) => {
		Given('a user with a verifiedJwt that includes the TechAdmin role', () => {
			context = makeMockGraphContext({ jwt: { roles: ['Staff.TechAdmin'] } });
		});

		When('the staffRoleCreate mutation is executed with roleName "New Role" and enterpriseAppRole "Staff.CaseManager"', async () => {
			const mockRole = createMockStaffRole({ roleName: 'New Role', enterpriseAppRole: 'Staff.CaseManager' });
			vi.mocked(context.applicationServices.User.StaffRole.create).mockResolvedValue(mockRole);
			result = await callMutation('staffRoleCreate', context, { input: { roleName: 'New Role', enterpriseAppRole: 'Staff.CaseManager' } });
		});

		Then('it should return success with the created staff role', () => {
			expect((result as { status: { success: boolean } }).status.success).toBe(true);
			expect((result as { staffRole: StaffRoleEntity }).staffRole).toBeDefined();
		});
	});

	Scenario('Creating a staff role with an unauthorized enterpriseAppRole', ({ Given, When, Then }) => {
		Given('a user with a verifiedJwt that includes the CaseManager role', () => {
			context = makeMockGraphContext({ jwt: { roles: ['Staff.CaseManager'] } });
		});

		When('the staffRoleCreate mutation is executed with roleName "New Role" and enterpriseAppRole "Staff.TechAdmin"', async () => {
			result = await callMutation('staffRoleCreate', context, { input: { roleName: 'New Role', enterpriseAppRole: 'Staff.TechAdmin' } });
		});

		Then('it should return success with the updated staff role', () => {
			const res = result as { status: { success: boolean }; staffRole: StaffRoleEntity };
			expect(res.status.success).toBe(true);
			expect(res.staffRole).toBeDefined();
		});
	});

	Scenario('Creating a staff role when unauthenticated', ({ Given, When, Then }) => {
		Given('a user without a verifiedJwt in their context', () => {
			context = makeMockGraphContext({ jwt: null });
		});

		When('the staffRoleCreate mutation is executed with roleName "New Role" and enterpriseAppRole "Staff.CaseManager"', async () => {
			result = await callMutation('staffRoleCreate', context, { input: { roleName: 'New Role', enterpriseAppRole: 'Staff.CaseManager' } });
		});

		Then('it should return failure with message "Unauthorized"', () => {
			const { status } = result as { status: { success: boolean; errorMessage: string } };
			expect(status.success).toBe(false);
			expect(status.errorMessage).toBe('Unauthorized');
		});
	});

	Scenario('Creating a staff role when the service throws', ({ Given, When, Then }) => {
		Given('a user with a verifiedJwt that includes the TechAdmin role', () => {
			context = makeMockGraphContext({ jwt: { roles: ['Staff.TechAdmin'] } });
		});

		When('the staffRoleCreate mutation throws an error', async () => {
			vi.mocked(context.applicationServices.User.StaffRole.create).mockRejectedValue(new Error('DB failure'));
			result = await callMutation('staffRoleCreate', context, { input: { roleName: 'New Role', enterpriseAppRole: 'Staff.TechAdmin' } });
		});

		Then('it should return failure with the error message', () => {
			const { status } = result as { status: { success: boolean; errorMessage: string } };
			expect(status.success).toBe(false);
			expect(status.errorMessage).toBe('DB failure');
		});
	});

	// ─── staffRoleUpdate ──────────────────────────────────────────────────────

	Scenario('Updating a staff role as TechAdmin', ({ Given, When, Then }) => {
		Given('a user with a verifiedJwt that includes the TechAdmin role', () => {
			context = makeMockGraphContext({ jwt: { roles: ['Staff.TechAdmin'] } });
		});

		When('the staffRoleUpdate mutation is executed with id "role-001" and enterpriseAppRole "Staff.TechAdmin"', async () => {
			const mockRole = createMockStaffRole({ id: 'role-001', enterpriseAppRole: 'Staff.TechAdmin' });
			vi.mocked(context.applicationServices.User.StaffRole.update).mockResolvedValue(mockRole);
			result = await callMutation('staffRoleUpdate', context, { input: { id: 'role-001', roleName: 'Updated Role', enterpriseAppRole: 'Staff.TechAdmin' } });
		});

		Then('it should return success with the updated staff role', () => {
			const res = result as { status: { success: boolean }; staffRole: StaffRoleEntity };
			expect(res.status.success).toBe(true);
			expect(res.staffRole).toBeDefined();
		});
	});

	Scenario('Updating a staff role with an unauthorized enterpriseAppRole', ({ Given, When, Then }) => {
		Given('a user with a verifiedJwt that includes the CaseManager role', () => {
			context = makeMockGraphContext({ jwt: { roles: ['Staff.CaseManager'] } });
		});

		When('the staffRoleUpdate mutation is executed with id "role-001" and enterpriseAppRole "Staff.TechAdmin"', async () => {
			result = await callMutation('staffRoleUpdate', context, { input: { id: 'role-001', roleName: 'Updated', enterpriseAppRole: 'Staff.TechAdmin' } });
		});

		Then('it should return success with the updated staff user', () => {
			const res = result as { status: { success: boolean }; staffUser: StaffUserEntity };
			expect(res.status.success).toBe(true);
			expect(res.staffUser).toBeDefined();
		});
	});

	Scenario('Updating a staff role when unauthenticated', ({ Given, When, Then }) => {
		Given('a user without a verifiedJwt in their context', () => {
			context = makeMockGraphContext({ jwt: null });
		});

		When('the staffRoleUpdate mutation is executed with id "role-001" and enterpriseAppRole "Staff.TechAdmin"', async () => {
			result = await callMutation('staffRoleUpdate', context, { input: { id: 'role-001', roleName: 'Updated', enterpriseAppRole: 'Staff.TechAdmin' } });
		});

		Then('it should return failure with message "Unauthorized"', () => {
			const { status } = result as { status: { success: boolean; errorMessage: string } };
			expect(status.success).toBe(false);
			expect(status.errorMessage).toBe('Unauthorized');
		});
	});

	// ─── staffUserAssignRole ──────────────────────────────────────────────────

	Scenario('Assigning a role as TechAdmin bypasses role-type check', ({ Given, When, Then }) => {
		Given('a user with a verifiedJwt that includes the TechAdmin role', () => {
			context = makeMockGraphContext({ jwt: { roles: ['Staff.TechAdmin'] } });
		});

		When('the staffUserAssignRole mutation is executed with staffUserId "user-001" and roleId "role-001"', async () => {
			const mockUser = createMockStaffUser({ id: 'user-001' });
			vi.mocked(context.applicationServices.User.StaffUser.assignRole).mockResolvedValue(mockUser);
			result = await callMutation('staffUserAssignRole', context, { input: { staffUserId: 'user-001', roleId: 'role-001' } });
		});

		Then('it should return success with the updated staff user', () => {
			const res = result as { status: { success: boolean }; staffUser: StaffUserEntity };
			expect(res.status.success).toBe(true);
			expect(res.staffUser).toBeDefined();
		});
	});

	Scenario('Assigning an allowed role as non-TechAdmin', ({ Given, When, Then, And }) => {
		Given('a user with a verifiedJwt that includes the CaseManager role', () => {
			context = makeMockGraphContext({ jwt: { roles: ['Staff.CaseManager'] } });
		});

		And('the role "role-001" has enterpriseAppRole "Staff.CaseManager"', () => {
			const allowedRole = createMockStaffRole({ id: 'role-001', enterpriseAppRole: 'Staff.CaseManager' });
			vi.mocked(context.applicationServices.User.StaffRole.list).mockResolvedValue([allowedRole]);
		});

		When('the staffUserAssignRole mutation is executed with staffUserId "user-001" and roleId "role-001"', async () => {
			const mockUser = createMockStaffUser({ id: 'user-001' });
			vi.mocked(context.applicationServices.User.StaffUser.assignRole).mockResolvedValue(mockUser);
			result = await callMutation('staffUserAssignRole', context, { input: { staffUserId: 'user-001', roleId: 'role-001' } });
		});

		Then('it should return success with the updated staff user', () => {
			const res = result as { status: { success: boolean }; staffUser: StaffUserEntity };
			expect(res.status.success).toBe(true);
			expect(res.staffUser).toBeDefined();
		});
	});

	Scenario('Assigning a forbidden role as non-TechAdmin', ({ Given, When, Then, And }) => {
		Given('a user with a verifiedJwt that includes the CaseManager role', () => {
			context = makeMockGraphContext({ jwt: { roles: ['Staff.CaseManager'] } });
		});

		And('the role "role-001" has enterpriseAppRole "Staff.TechAdmin"', () => {
			const forbiddenRole = createMockStaffRole({ id: 'role-001', enterpriseAppRole: 'Staff.TechAdmin' });
			vi.mocked(context.applicationServices.User.StaffRole.list).mockResolvedValue([forbiddenRole]);
		});

		When('the staffUserAssignRole mutation is executed with staffUserId "user-001" and roleId "role-001"', async () => {
			result = await callMutation('staffUserAssignRole', context, { input: { staffUserId: 'user-001', roleId: 'role-001' } });
		});

		Then('it should return failure with a permission error message', () => {
			const { status } = result as { status: { success: boolean; errorMessage: string } };
			expect(status.success).toBe(false);
			expect(status.errorMessage).toContain('Staff.TechAdmin');
		});
	});

	Scenario('Assigning a role when unauthenticated', ({ Given, When, Then }) => {
		Given('a user without a verifiedJwt in their context', () => {
			context = makeMockGraphContext({ jwt: null });
		});

		When('the staffUserAssignRole mutation is executed with staffUserId "user-001" and roleId "role-001"', async () => {
			result = await callMutation('staffUserAssignRole', context, { input: { staffUserId: 'user-001', roleId: 'role-001' } });
		});

		Then('it should return failure with message "Unauthorized"', () => {
			const { status } = result as { status: { success: boolean; errorMessage: string } };
			expect(status.success).toBe(false);
			expect(status.errorMessage).toBe('Unauthorized');
		});
	});

});
