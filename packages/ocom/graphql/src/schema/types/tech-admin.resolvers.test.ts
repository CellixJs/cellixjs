import mongoose from 'mongoose';
import { describe, beforeEach, expect, it, vi } from 'vitest';
import {
	type FieldNode,
	type GraphQLObjectType,
	type GraphQLResolveInfo,
	type GraphQLSchema,
	Kind,
	type OperationDefinitionNode,
} from 'graphql';

import type { GraphContext } from '../context.ts';
import techAdminResolvers from './tech-admin.resolvers.ts';


type JwtOverride = {
	sub?: string;
};

type MockStaffUser = {
	role?: {
		permissions?: {
			techAdminPermissions?: {
				canViewDatabaseDocuments?: boolean;
				canManageTechAdmin?: boolean;
			};
		};
	};
};

type MockStaffUserService =
	GraphContext['applicationServices']['User']['StaffUser'] & {
		queryByExternalId: ReturnType<typeof vi.fn>;
	};

type TestGraphContext = Omit<GraphContext, 'applicationServices'> & {
	applicationServices: Omit<GraphContext['applicationServices'], 'User'> & {
		User: Omit<
			GraphContext['applicationServices']['User'],
			'StaffUser'
		> & {
			StaffUser: MockStaffUserService;
		};
	};
};

function makeMockInfo(fieldName: string): GraphQLResolveInfo {
	const mockFieldNode: FieldNode = {
		kind: Kind.FIELD,
		name: {
			kind: Kind.NAME,
			value: fieldName,
		},
	};

	return {
		fieldName,
		fieldNodes: [mockFieldNode],
		returnType: {} as GraphQLObjectType,
		parentType: {} as GraphQLObjectType,
		path: {
			key: fieldName,
			prev: undefined,
			typename: undefined,
		},
		schema: {} as GraphQLSchema,
		fragments: {},
		rootValue: {},
		operation: {} as OperationDefinitionNode,
		variableValues: {},
	} as unknown as GraphQLResolveInfo;
}

function makeMockGraphContext(
	options: {
		jwt?: JwtOverride | null;
		staffUser?: MockStaffUser;
	} = {},
): TestGraphContext {
	const { jwt = {}, staffUser } = options;

	return {
		applicationServices: {
			User: {
				StaffUser: {
					queryByExternalId: vi.fn().mockResolvedValue(staffUser),
				},
			},
			verifiedUser:
				jwt === null
					? undefined
					: {
							verifiedJwt: {
								sub: 'user-123',
								...jwt,
							},
						},
		},
	} as unknown as TestGraphContext;
}

const Query = {
	...(techAdminResolvers.Query ?? {}),
} as Record<string, (...args: unknown[]) => unknown>;

const callQuery = (
	name: string,
	context: GraphContext,
	args: object = {},
) =>
	Query[name]?.(
		{},
		args,
		context,
		makeMockInfo(name),
	) as Promise<unknown>;

let mockCollections: { name: string }[];
let mockDocuments: Record<string, unknown>[];

let countDocumentsMock: ReturnType<typeof vi.fn>;
let skipMock: ReturnType<typeof vi.fn>;
let limitMock: ReturnType<typeof vi.fn>;
let toArrayMock: ReturnType<typeof vi.fn>;
let findMock: ReturnType<typeof vi.fn>;
let collectionMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
	vi.restoreAllMocks();

	mockCollections = [
		{ name: 'users' },
		{ name: 'roles' },
		{ name: 'system.profile' },
	];

	mockDocuments = [];

	countDocumentsMock = vi.fn().mockResolvedValue(0);

	toArrayMock = vi.fn().mockResolvedValue(mockDocuments);

	limitMock = vi.fn().mockReturnValue({
		toArray: toArrayMock,
	});

	skipMock = vi.fn().mockReturnValue({
		limit: limitMock,
	});

	findMock = vi.fn().mockReturnValue({
		skip: skipMock,
	});

	collectionMock = vi.fn().mockReturnValue({
		countDocuments: countDocumentsMock,
		find: findMock,
	});

	vi.spyOn(mongoose, 'connection', 'get').mockReturnValue({
		db: {
			listCollections: vi.fn().mockReturnValue({
				toArray: vi.fn().mockResolvedValue(mockCollections),
			}),
			collection: collectionMock,
		},
	} as never);
});
describe('techAdminDatabaseCollections', () => {
	let context: TestGraphContext;

	beforeEach(() => {
		context = makeMockGraphContext();
	});

	it('throws Unauthorized when JWT is missing', async () => {
		context = makeMockGraphContext({
			jwt: null,
		});

		await expect(
			callQuery('techAdminDatabaseCollections', context),
		).rejects.toThrow('Unauthorized');
	});

	it('throws Unauthorized when user cannot view or manage Tech Admin', async () => {
		context = makeMockGraphContext({
			staffUser: {
				role: {
					permissions: {
						techAdminPermissions: {
							canViewDatabaseDocuments: false,
							canManageTechAdmin: false,
						},
					},
				},
			},
		});

		await expect(
			callQuery('techAdminDatabaseCollections', context),
		).rejects.toThrow('Unauthorized');

		expect(
			context.applicationServices.User.StaffUser.queryByExternalId,
		).toHaveBeenCalledWith({
			externalId: 'user-123',
		});
	});

	it('allows users with canViewDatabaseDocuments permission', async () => {
		context = makeMockGraphContext({
			staffUser: {
				role: {
					permissions: {
						techAdminPermissions: {
							canViewDatabaseDocuments: true,
							canManageTechAdmin: false,
						},
					},
				},
			},
		});

		const result = await callQuery(
			'techAdminDatabaseCollections',
			context,
		);

		expect(result).toEqual([
			'roles',
			'users',
		]);
	});

	it('allows users with canManageTechAdmin permission', async () => {
		context = makeMockGraphContext({
			staffUser: {
				role: {
					permissions: {
						techAdminPermissions: {
							canViewDatabaseDocuments: false,
							canManageTechAdmin: true,
						},
					},
				},
			},
		});

		const result = await callQuery(
			'techAdminDatabaseCollections',
			context,
		);

		expect(result).toEqual([
			'roles',
			'users',
		]);
	});

	it('filters out system collections', async () => {
		mockCollections = [
			{ name: 'users' },
			{ name: 'roles' },
			{ name: 'system.profile' },
			{ name: 'system.indexes' },
			{ name: 'orders' },
		];

		vi.spyOn(mongoose, 'connection', 'get').mockReturnValue({
			db: {
				listCollections: vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue(mockCollections),
				}),
				collection: collectionMock,
			},
		} as never);

		context = makeMockGraphContext({
			staffUser: {
				role: {
					permissions: {
						techAdminPermissions: {
							canViewDatabaseDocuments: true,
						},
					},
				},
			},
		});

		const result = await callQuery(
			'techAdminDatabaseCollections',
			context,
		);

		expect(result).toEqual([
			'orders',
			'roles',
			'users',
		]);

		expect(result).not.toContain('system.profile');
		expect(result).not.toContain('system.indexes');
	});

	it('returns collections sorted alphabetically', async () => {
		mockCollections = [
			{ name: 'zebra' },
			{ name: 'apple' },
			{ name: 'Monkey' },
			{ name: 'banana' },
		];

		vi.spyOn(mongoose, 'connection', 'get').mockReturnValue({
			db: {
				listCollections: vi.fn().mockReturnValue({
					toArray: vi.fn().mockResolvedValue(mockCollections),
				}),
				collection: collectionMock,
			},
		} as never);

		context = makeMockGraphContext({
			staffUser: {
				role: {
					permissions: {
						techAdminPermissions: {
							canViewDatabaseDocuments: true,
						},
					},
				},
			},
		});

		const result = await callQuery(
			'techAdminDatabaseCollections',
			context,
		);

		expect(result).toEqual([
			'apple',
			'banana',
			'Monkey',
			'zebra',
		]);
	});

	it('throws when database connection is unavailable', async () => {
		vi.spyOn(mongoose, 'connection', 'get').mockReturnValue({
			db: undefined,
		} as never);

		context = makeMockGraphContext({
			staffUser: {
				role: {
					permissions: {
						techAdminPermissions: {
							canViewDatabaseDocuments: true,
						},
					},
				},
			},
		});

		await expect(
			callQuery('techAdminDatabaseCollections', context),
		).rejects.toThrow(
			'Database connection is not available',
		);
	});

	it('calls queryByExternalId with JWT subject', async () => {
		context = makeMockGraphContext({
			jwt: {
				sub: 'external-user-id',
			},
			staffUser: {
				role: {
					permissions: {
						techAdminPermissions: {
							canViewDatabaseDocuments: true,
						},
					},
				},
			},
		});

		await callQuery(
			'techAdminDatabaseCollections',
			context,
		);

		expect(
			context.applicationServices.User.StaffUser.queryByExternalId,
		).toHaveBeenCalledTimes(1);

		expect(
			context.applicationServices.User.StaffUser.queryByExternalId,
		).toHaveBeenCalledWith({
			externalId: 'external-user-id',
		});
	});
    it('throws Unauthorized when JWT is missing', async () => {
	context = makeMockGraphContext({
		jwt: null,
	});

	await expect(
		callQuery('techAdminDatabaseDocuments', context, {
			collection: 'users',
		}),
	).rejects.toThrow('Unauthorized');
});
it('throws Unauthorized when user lacks permissions', async () => {
	context = makeMockGraphContext({
		staffUser: {},
	});

	await expect(
		callQuery('techAdminDatabaseDocuments', context, {
			collection: 'users',
		}),
	).rejects.toThrow('Unauthorized');
});
it('throws for invalid collection name', async () => {
	context = makeMockGraphContext({
		staffUser: {
			role: {
				permissions: {
					techAdminPermissions: {
						canViewDatabaseDocuments: true,
					},
				},
			},
		},
	});

	await expect(
		callQuery('techAdminDatabaseDocuments', context, {
			collection: '../users',
		}),
	).rejects.toThrow('Invalid collection name');
});
it('throws when collection does not exist', async () => {
	context = makeMockGraphContext({
		staffUser: {
			role: {
				permissions: {
					techAdminPermissions: {
						canViewDatabaseDocuments: true,
					},
				},
			},
		},
	});

	await expect(
		callQuery('techAdminDatabaseDocuments', context, {
			collection: 'unknown',
		}),
	).rejects.toThrow('Collection not found or not allowed');
});
it('throws for invalid filter JSON', async () => {
	context = makeMockGraphContext({
		staffUser: {
			role: {
				permissions: {
					techAdminPermissions: {
						canViewDatabaseDocuments: true,
					},
				},
			},
		},
	});

	await expect(
		callQuery('techAdminDatabaseDocuments', context, {
			collection: 'users',
			filter: '{invalid}',
		}),
	).rejects.toThrow('Invalid filter JSON');
});
it('rejects $where operator', async () => {
	context = makeMockGraphContext({
		staffUser: {
			role: {
				permissions: {
					techAdminPermissions: {
						canViewDatabaseDocuments: true,
					},
				},
			},
		},
	});

	await expect(
		callQuery('techAdminDatabaseDocuments', context, {
			collection: 'users',
			filter: JSON.stringify({
				$where: 'this.age > 18',
			}),
		}),
	).rejects.toThrow('Operator $where is not allowed in filter');
});
it('rejects unknown operators', async () => {
	context = makeMockGraphContext({
		staffUser: {
			role: {
				permissions: {
					techAdminPermissions: {
						canViewDatabaseDocuments: true,
					},
				},
			},
		},
	});

	await expect(
		callQuery('techAdminDatabaseDocuments', context, {
			collection: 'users',
			filter: JSON.stringify({
				name: {
					$foo: 'abc',
				},
			}),
		}),
	).rejects.toThrow('Unknown operator: $foo');
});
it('caps pageSize at 100', async () => {
	context = makeMockGraphContext({
		staffUser: {
			role: {
				permissions: {
					techAdminPermissions: {
						canViewDatabaseDocuments: true,
					},
				},
			},
		},
	});

	await callQuery('techAdminDatabaseDocuments', context, {
		collection: 'users',
		page: 1,
		pageSize: 500,
	});

	expect(limitMock).toHaveBeenCalledWith(100);
});
it('uses page 1 when page is less than 1', async () => {
	context = makeMockGraphContext({
		staffUser: {
			role: {
				permissions: {
					techAdminPermissions: {
						canViewDatabaseDocuments: true,
					},
				},
			},
		},
	});

	await callQuery('techAdminDatabaseDocuments', context, {
		collection: 'users',
		page: -5,
		pageSize: 20,
	});

	expect(skipMock).toHaveBeenCalledWith(0);
});
it('calculates skip correctly', async () => {
	context = makeMockGraphContext({
		staffUser: {
			role: {
				permissions: {
					techAdminPermissions: {
						canViewDatabaseDocuments: true,
					},
				},
			},
		},
	});

	await callQuery('techAdminDatabaseDocuments', context, {
		collection: 'users',
		page: 3,
		pageSize: 10,
	});

	expect(skipMock).toHaveBeenCalledWith(20);
});
it('passes parsed filter to countDocuments', async () => {
	context = makeMockGraphContext({
		staffUser: {
			role: {
				permissions: {
					techAdminPermissions: {
						canViewDatabaseDocuments: true,
					},
				},
			},
		},
	});

	const filter = {
		name: 'John',
	};

	await callQuery('techAdminDatabaseDocuments', context, {
		collection: 'users',
		filter: JSON.stringify(filter),
	});

	expect(countDocumentsMock).toHaveBeenCalledWith(filter);
});
it('passes parsed filter to find', async () => {
	context = makeMockGraphContext({
		staffUser: {
			role: {
				permissions: {
					techAdminPermissions: {
						canViewDatabaseDocuments: true,
					},
				},
			},
		},
	});

	const filter = {
		email: 'abc@test.com',
	};

	await callQuery('techAdminDatabaseDocuments', context, {
		collection: 'users',
		filter: JSON.stringify(filter),
	});

	expect(findMock).toHaveBeenCalledWith(filter);
});
it('returns totalCount', async () => {
	countDocumentsMock.mockResolvedValue(45);

	context = makeMockGraphContext({
		staffUser: {
			role: {
				permissions: {
					techAdminPermissions: {
						canViewDatabaseDocuments: true,
					},
				},
			},
		},
	});

	const result = await callQuery(
		'techAdminDatabaseDocuments',
		context,
		{
			collection: 'users',
		},
	);

	expect(result).toMatchObject({
		totalCount: 45,
	});
});
it('returns empty documents when none found', async () => {
	mockDocuments = [];
	toArrayMock.mockResolvedValue(mockDocuments);

	context = makeMockGraphContext({
		staffUser: {
			role: {
				permissions: {
					techAdminPermissions: {
						canViewDatabaseDocuments: true,
					},
				},
			},
		},
	});

	const result = await callQuery(
		'techAdminDatabaseDocuments',
		context,
		{
			collection: 'users',
		},
	);

	expect(result).toEqual({
		documents: [],
		totalCount: 0,
	});
});
});
