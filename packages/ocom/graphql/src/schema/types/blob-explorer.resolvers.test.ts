import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import { type FieldNode, type GraphQLObjectType, type GraphQLResolveInfo, type GraphQLSchema, Kind, type OperationDefinitionNode } from 'graphql';
import { expect, vi } from 'vitest';
import type { GraphContext } from '../context.ts';
import blobExplorerResolvers from './blob-explorer.resolvers.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/blob-explorer.resolvers.feature'));

// ─── Domain types ─────────────────────────────────────────────────────────────

type StaffUserEntity = Domain.Contexts.User.StaffUser.StaffUserEntityReference;

// ─── Mock factories ───────────────────────────────────────────────────────────

function createMockStaffUser(canViewBlobExplorer = false): StaffUserEntity {
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
		role: canViewBlobExplorer
			? ({
					id: 'mock-role-id',
					roleName: 'TechAdmin',
					permissions: {
						techAdminPermissions: {
							canViewBlobExplorer: true,
							canManageTechAdmin: true,
							canViewDatabaseExplorer: false,
							canViewQueueDashboard: false,
							canSendQueueMessages: false,
						},
					},
				} as unknown as Domain.Contexts.User.StaffRole.StaffRoleEntityReference)
			: ({
					id: 'mock-role-id',
					roleName: 'CaseManager',
					permissions: {
						techAdminPermissions: {
							canViewBlobExplorer: false,
							canManageTechAdmin: false,
							canViewDatabaseExplorer: false,
							canViewQueueDashboard: false,
							canSendQueueMessages: false,
						},
					},
				} as unknown as Domain.Contexts.User.StaffRole.StaffRoleEntityReference),
		createdAt: new Date(),
		updatedAt: new Date(),
		schemaVersion: '1.0',
		activityLog: [],
	} as unknown as StaffUserEntity;
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

type MockedBlobExplorerService = {
	listContainers: ReturnType<typeof vi.fn>;
	listBlobsHierarchy: ReturnType<typeof vi.fn>;
	getBlobDownloadAuthorization: ReturnType<typeof vi.fn>;
};

type MockedStaffUserService = GraphContext['applicationServices']['User']['StaffUser'] & {
	queryByExternalId: ReturnType<typeof vi.fn>;
};

type TestGraphContext = Omit<GraphContext, 'applicationServices'> & {
	applicationServices: Omit<GraphContext['applicationServices'], 'User' | 'TechAdmin'> & {
		User: Omit<GraphContext['applicationServices']['User'], 'StaffUser'> & {
			StaffUser: MockedStaffUserService;
		};
		TechAdmin: {
			BlobExplorer: MockedBlobExplorerService;
		};
	};
};

function makeMockGraphContext(options: { jwt?: JwtOverride | null; canViewBlobExplorer?: boolean; blobExplorerServices?: Partial<MockedBlobExplorerService> } = {}): TestGraphContext {
	const { jwt = {}, canViewBlobExplorer = false, blobExplorerServices = {} } = options;
	const mockStaffUser = createMockStaffUser(canViewBlobExplorer);
	return {
		applicationServices: {
			User: {
				StaffUser: {
					queryByExternalId: vi.fn().mockResolvedValue(mockStaffUser),
				} as unknown as MockedStaffUserService,
			} as unknown as TestGraphContext['applicationServices']['User'],
			TechAdmin: {
				BlobExplorer: {
					listContainers: vi.fn(),
					listBlobsHierarchy: vi.fn(),
					getBlobDownloadAuthorization: vi.fn(),
					...blobExplorerServices,
				},
			},
			verifiedUser:
				jwt === null
					? undefined
					: {
							verifiedJwt:
								jwt === null
									? undefined
									: {
											sub: 'default-user-sub',
											given_name: 'Jane',
											family_name: 'Smith',
											email: 'jane@example.com',
											roles: [],
											...jwt,
										},
						},
		} as unknown as TestGraphContext['applicationServices'],
	} as unknown as TestGraphContext;
}

// ─── Resolver references ──────────────────────────────────────────────────────

// biome-ignore lint/style/noNonNullAssertion: test helper — key always exists
const Query = blobExplorerResolvers.Query!;

const callQuery = (name: string, context: GraphContext, args: object = {}) =>
	// biome-ignore lint/style/noNonNullAssertion: test helper — key always exists
	Query[name as keyof typeof Query]!({}, args, context, makeMockInfo(name)) as Promise<unknown>;

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

	// ─── blobExplorerListContainers ───────────────────────────────────────────

	Scenario('Listing containers when authenticated with canViewBlobExplorer permission', ({ Given, When, Then }) => {
		Given('a staff user with a verifiedJwt and canViewBlobExplorer permission', () => {
			context = makeMockGraphContext({
				canViewBlobExplorer: true,
				blobExplorerServices: {
					listContainers: vi.fn().mockResolvedValue({ containers: [{ name: 'test-container', url: 'https://example.com/test-container' }] }),
				},
			});
		});

		When('the blobExplorerListContainers query is executed', async () => {
			result = await callQuery('blobExplorerListContainers', context as unknown as GraphContext);
		});

		Then('it should return the list of containers', () => {
			const res = result as { containers: { name: string }[] };
			expect(res.containers).toBeDefined();
			expect(res.containers.length).toBeGreaterThan(0);
		});
	});

	Scenario('Listing containers when unauthenticated', ({ Given, When, Then }) => {
		Given('a user without a verifiedJwt in their context', () => {
			context = makeMockGraphContext({ jwt: null });
		});

		When('the blobExplorerListContainers query is executed', async () => {
			try {
				result = await callQuery('blobExplorerListContainers', context as unknown as GraphContext);
			} catch (error) {
				thrownError = error;
			}
		});

		Then('it should throw an "Unauthorized" error', () => {
			expect(thrownError).toBeInstanceOf(Error);
			expect((thrownError as Error).message).toBe('Unauthorized');
		});
	});

	Scenario('Listing containers when missing canViewBlobExplorer permission', ({ Given, When, Then }) => {
		Given('a staff user with a verifiedJwt but without canViewBlobExplorer permission', () => {
			context = makeMockGraphContext({ canViewBlobExplorer: false });
		});

		When('the blobExplorerListContainers query is executed', async () => {
			try {
				result = await callQuery('blobExplorerListContainers', context as unknown as GraphContext);
			} catch (error) {
				thrownError = error;
			}
		});

		Then('it should throw an "Unauthorized" error', () => {
			expect(thrownError).toBeInstanceOf(Error);
			expect((thrownError as Error).message).toBe('Unauthorized');
		});
	});

	// ─── blobExplorerListBlobs ────────────────────────────────────────────────

	Scenario('Listing blobs when authenticated with canViewBlobExplorer permission', ({ Given, When, Then }) => {
		Given('a staff user with a verifiedJwt and canViewBlobExplorer permission', () => {
			context = makeMockGraphContext({
				canViewBlobExplorer: true,
				blobExplorerServices: {
					listBlobsHierarchy: vi.fn().mockResolvedValue({
						items: [{ name: 'file.txt', contentType: 'text/plain', contentLength: 100 }],
						prefixes: ['folder/'],
						continuationToken: undefined,
					}),
				},
			});
		});

		When('the blobExplorerListBlobs query is executed with containerName "my-container"', async () => {
			result = await callQuery('blobExplorerListBlobs', context as unknown as GraphContext, { input: { containerName: 'my-container' } });
		});

		Then('it should return the hierarchy page with items and prefixes', () => {
			const res = result as { items: unknown[]; prefixes: string[] };
			expect(res.items).toBeDefined();
			expect(res.prefixes).toBeDefined();
		});
	});

	Scenario('Listing blobs when unauthenticated', ({ Given, When, Then }) => {
		Given('a user without a verifiedJwt in their context', () => {
			context = makeMockGraphContext({ jwt: null });
		});

		When('the blobExplorerListBlobs query is executed with containerName "my-container"', async () => {
			try {
				result = await callQuery('blobExplorerListBlobs', context as unknown as GraphContext, { input: { containerName: 'my-container' } });
			} catch (error) {
				thrownError = error;
			}
		});

		Then('it should throw an "Unauthorized" error', () => {
			expect(thrownError).toBeInstanceOf(Error);
			expect((thrownError as Error).message).toBe('Unauthorized');
		});
	});

	Scenario('Listing blobs when missing canViewBlobExplorer permission', ({ Given, When, Then }) => {
		Given('a staff user with a verifiedJwt but without canViewBlobExplorer permission', () => {
			context = makeMockGraphContext({ canViewBlobExplorer: false });
		});

		When('the blobExplorerListBlobs query is executed with containerName "my-container"', async () => {
			try {
				result = await callQuery('blobExplorerListBlobs', context as unknown as GraphContext, { input: { containerName: 'my-container' } });
			} catch (error) {
				thrownError = error;
			}
		});

		Then('it should throw an "Unauthorized" error', () => {
			expect(thrownError).toBeInstanceOf(Error);
			expect((thrownError as Error).message).toBe('Unauthorized');
		});
	});

	// ─── blobExplorerGetDownloadAuthorization ─────────────────────────────────

	Scenario('Getting download authorization when authenticated with canViewBlobExplorer permission', ({ Given, When, Then }) => {
		Given('a staff user with a verifiedJwt and canViewBlobExplorer permission', () => {
			context = makeMockGraphContext({
				canViewBlobExplorer: true,
				blobExplorerServices: {
					getBlobDownloadAuthorization: vi.fn().mockResolvedValue({
						url: 'https://example.com/my-container/file.txt',
						authorizationHeader: 'SharedKey devstoreaccount1:abc123',
						headers: { 'Content-Type': 'text/plain', 'Content-Length': '100' },
					}),
				},
			});
		});

		When('the blobExplorerGetDownloadAuthorization query is executed with containerName "my-container" and blobName "file.txt"', async () => {
			result = await callQuery('blobExplorerGetDownloadAuthorization', context as unknown as GraphContext, {
				input: { containerName: 'my-container', blobName: 'file.txt', contentLength: 100, contentType: 'text/plain' },
			});
		});

		Then('it should return the download authorization result', () => {
			const res = result as { url: string; authorizationHeader: string; headers: Record<string, string> };
			expect(res.url).toBeDefined();
			expect(res.authorizationHeader).toBeDefined();
			expect(res.headers).toBeDefined();
		});
	});

	Scenario('Getting download authorization when unauthenticated', ({ Given, When, Then }) => {
		Given('a user without a verifiedJwt in their context', () => {
			context = makeMockGraphContext({ jwt: null });
		});

		When('the blobExplorerGetDownloadAuthorization query is executed with containerName "my-container" and blobName "file.txt"', async () => {
			try {
				result = await callQuery('blobExplorerGetDownloadAuthorization', context as unknown as GraphContext, {
					input: { containerName: 'my-container', blobName: 'file.txt', contentLength: 100, contentType: 'text/plain' },
				});
			} catch (error) {
				thrownError = error;
			}
		});

		Then('it should throw an "Unauthorized" error', () => {
			expect(thrownError).toBeInstanceOf(Error);
			expect((thrownError as Error).message).toBe('Unauthorized');
		});
	});

	Scenario('Getting download authorization when missing canViewBlobExplorer permission', ({ Given, When, Then }) => {
		Given('a staff user with a verifiedJwt but without canViewBlobExplorer permission', () => {
			context = makeMockGraphContext({ canViewBlobExplorer: false });
		});

		When('the blobExplorerGetDownloadAuthorization query is executed with containerName "my-container" and blobName "file.txt"', async () => {
			try {
				result = await callQuery('blobExplorerGetDownloadAuthorization', context as unknown as GraphContext, {
					input: { containerName: 'my-container', blobName: 'file.txt', contentLength: 100, contentType: 'text/plain' },
				});
			} catch (error) {
				thrownError = error;
			}
		});

		Then('it should throw an "Unauthorized" error', () => {
			expect(thrownError).toBeInstanceOf(Error);
			expect((thrownError as Error).message).toBe('Unauthorized');
		});
	});
});
