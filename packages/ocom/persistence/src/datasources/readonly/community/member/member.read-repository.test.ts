import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Member } from '@ocom/data-sources-mongoose-models/member';

import type { Domain } from '@ocom/domain';
import { describe, expect, it, vi } from 'vitest';
import type { ModelsContext } from '../../../../index.ts';
import { MemberConverter } from '../../../domain/community/member/member.domain-adapter.ts';
import { MemberDataSourceImpl } from './member.data.ts';
import { MemberReadRepositoryImpl } from './member.read-repository.ts';

// Mock the data source module

const test = { for: describeFeature };
vi.mock('./member.data.ts', () => ({
	MemberDataSourceImpl: vi.fn(),
}));

// Mock the converter module
vi.mock('../../../domain/community/member/member.domain-adapter.ts', () => ({
	MemberConverter: vi.fn(),
}));

// Mock MongooseSeedwork.ObjectId to handle invalid ObjectId strings
vi.mock('@cellix/mongoose-seedwork', () => ({
	MongooseSeedwork: {
		ObjectId: vi.fn(function MockObjectId(id: string) {
			return { toString: () => id, equals: vi.fn() };
		}),
	},
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/member.read-repository.feature'));

function makeMockModelsContext() {
	return {
		Community: {} as unknown,
		Member: {} as unknown,
		EndUser: {} as unknown,
	} as ModelsContext;
}

function makeMockPassport() {
	return {
		community: {
			forCommunity: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
	} as unknown as Domain.Passport;
}

function makeMockMemberDocument() {
	return {
		_id: 'member-123',
		community: '507f1f77bcf86cd799439011',
		accounts: {
			user: ['user-456'],
		},
		role: 'admin-role',
		createdAt: new Date(),
		updatedAt: new Date(),
		id: 'member-123',
	} as unknown as Member;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let models: ModelsContext;
	let passport: Domain.Passport;
	let repository: MemberReadRepositoryImpl;
	let mockMemberDoc: Member;
	let mockDataSource: {
		find: ReturnType<typeof vi.fn>;
		findById: ReturnType<typeof vi.fn>;
		findOne: ReturnType<typeof vi.fn>;
		aggregate: ReturnType<typeof vi.fn>;
	};
	let mockConverter: {
		toDomain: ReturnType<typeof vi.fn>;
	};

	BeforeEachScenario(() => {
		models = makeMockModelsContext();
		passport = makeMockPassport();
		mockMemberDoc = makeMockMemberDocument();

		// Mock the data source
		mockDataSource = {
			find: vi.fn(async () => [mockMemberDoc]),
			findById: vi.fn(async (id: string) => (id === 'member-123' ? mockMemberDoc : null)),
			findOne: vi.fn(async () => null),
			aggregate: vi.fn(async () => [mockMemberDoc]),
		};

		// Mock the converter
		mockConverter = {
			toDomain: vi.fn((doc, passport) => ({
				id: doc.id,
				community: doc.community,
				accounts: doc.accounts,
				role: doc.role,
				passport,
			})),
		};

		// Mock the constructors
		vi.mocked(MemberDataSourceImpl).mockImplementation(function MockMemberDataSourceImpl() {
			return mockDataSource as unknown as InstanceType<typeof MemberDataSourceImpl>;
		});
		vi.mocked(MemberConverter).mockImplementation(function MockMemberConverter() {
			return mockConverter as unknown as MemberConverter;
		});

		repository = new MemberReadRepositoryImpl(models, passport);
	});

	Scenario('Creating Member Read Repository', ({ When, Then, And }) => {
		When('I create a MemberReadRepositoryImpl with models and passport', () => {
			// Repository is already created in BeforeEachScenario
		});

		Then('I should receive a MemberReadRepository instance', () => {
			expect(repository).toBeDefined();
			expect(repository).toBeInstanceOf(MemberReadRepositoryImpl);
		});

		And('the repository should have all required methods', () => {
			expect(typeof repository.getByCommunityId).toBe('function');
			expect(typeof repository.getById).toBe('function');
			expect(typeof repository.getByIdWithRole).toBe('function');
			expect(typeof repository.getMembersForEndUserExternalId).toBe('function');
			expect(typeof repository.isAdmin).toBe('function');
		});
	});

	describe('MemberReadRepositoryImpl scoped property-owner lookup', () => {
		it('queries by both owner id and community while loading the owner role', async () => {
			const ownerDocument = makeMockMemberDocument();
			const dataSource = {
				find: vi.fn(),
				findById: vi.fn(),
				findOne: vi.fn().mockResolvedValue(ownerDocument),
				aggregate: vi.fn(),
			};
			const converter = {
				toDomain: vi.fn().mockReturnValue({ id: 'member-123', communityId: 'community-1' }),
			};
			vi.mocked(MemberDataSourceImpl).mockImplementation(function ScopedOwnerDataSource() {
				return dataSource as unknown as InstanceType<typeof MemberDataSourceImpl>;
			});
			vi.mocked(MemberConverter).mockImplementation(function ScopedOwnerConverter() {
				return converter as unknown as MemberConverter;
			});
			const passport = makeMockPassport();
			const repository = new MemberReadRepositoryImpl(makeMockModelsContext(), passport);

			await expect(repository.getByIdInCommunityWithRole('member-123', 'community-1')).resolves.toEqual({
				id: 'member-123',
				communityId: 'community-1',
			});

			expect(dataSource.findOne).toHaveBeenCalledWith(
				{
					_id: expect.objectContaining({ toString: expect.any(Function), equals: expect.any(Function) }),
					community: expect.objectContaining({ toString: expect.any(Function), equals: expect.any(Function) }),
				},
				{ populateFields: ['community', 'role', 'role.community'] },
			);
		});

		it('returns null from the scoped lookup for both a missing and a foreign owner', async () => {
			const dataSource = {
				find: vi.fn(),
				findById: vi.fn(),
				findOne: vi.fn().mockResolvedValue(null),
				aggregate: vi.fn(),
			};
			vi.mocked(MemberDataSourceImpl).mockImplementation(function MissingScopedOwnerDataSource() {
				return dataSource as unknown as InstanceType<typeof MemberDataSourceImpl>;
			});
			const repository = new MemberReadRepositoryImpl(makeMockModelsContext(), makeMockPassport());

			await expect(repository.getByIdInCommunityWithRole('foreign-or-missing', 'community-1')).resolves.toBeNull();
		});
	});

	describe('MemberReadRepositoryImpl verified current-member lookup', () => {
		it('resolves a member from the verified EndUser id and requested community rather than a member id hint', async () => {
			const memberDocument = makeMockMemberDocument();
			const dataSource = {
				find: vi.fn(),
				findById: vi.fn(),
				findOne: vi.fn().mockResolvedValue(memberDocument),
				aggregate: vi.fn(),
			};
			const converter = {
				toDomain: vi.fn().mockReturnValue({ id: 'member-123', community: { id: 'community-1' } }),
			};
			vi.mocked(MemberDataSourceImpl).mockImplementation(function CurrentMemberDataSource() {
				return dataSource as unknown as InstanceType<typeof MemberDataSourceImpl>;
			});
			vi.mocked(MemberConverter).mockImplementation(function CurrentMemberConverter() {
				return converter as unknown as MemberConverter;
			});
			const repository = new MemberReadRepositoryImpl(makeMockModelsContext(), makeMockPassport());

			await expect(repository.getByEndUserIdAndCommunityIdWithRole('end-user-1', 'community-1')).resolves.toEqual({
				id: 'member-123',
				community: { id: 'community-1' },
			});

			expect(dataSource.findOne).toHaveBeenCalledWith(
				{
					community: expect.objectContaining({ toString: expect.any(Function), equals: expect.any(Function) }),
					'accounts.user': expect.objectContaining({ toString: expect.any(Function), equals: expect.any(Function) }),
				},
				{ populateFields: ['community', 'role', 'role.community', 'accounts.user'] },
			);
		});
	});

	Scenario('Getting members by community ID', ({ When, Then }) => {
		When('I call getByCommunityId with "507f1f77bcf86cd799439011"', async () => {
			await repository.getByCommunityId('507f1f77bcf86cd799439011');
		});

		Then('I should receive an array of MemberEntityReference objects', () => {
			expect(mockDataSource.find).toHaveBeenCalledWith({ community: expect.objectContaining({ toString: expect.any(Function), equals: expect.any(Function) }) }, { populateFields: ['role', 'role.community'] });
			expect(mockConverter.toDomain).toHaveBeenCalledWith(mockMemberDoc, passport);
		});
	});

	Scenario('Getting members by community ID with custom populate fields', ({ When, Then }) => {
		When('I call getByCommunityId with "507f1f77bcf86cd799439011" and custom populateFields', async () => {
			await repository.getByCommunityId('507f1f77bcf86cd799439011', { populateFields: ['customField'] });
		});

		Then('I should receive members with merged populate fields', () => {
			expect(mockDataSource.find).toHaveBeenCalledWith(
				{ community: expect.objectContaining({ toString: expect.any(Function), equals: expect.any(Function) }) },
				{ populateFields: expect.arrayContaining(['role', 'role.community', 'customField']) },
			);
			expect(mockConverter.toDomain).toHaveBeenCalledWith(mockMemberDoc, passport);
		});
	});

	Scenario('Getting member by ID when exists', ({ Given, When, Then }) => {
		Given('a member exists with ID "member-123"', () => {
			// Mock is already set up in BeforeEachScenario
		});

		When('I call getById with "member-123"', async () => {
			await repository.getById('member-123');
		});

		Then('I should receive the MemberEntityReference object', () => {
			expect(mockDataSource.findById).toHaveBeenCalledWith('member-123', undefined);
			expect(mockConverter.toDomain).toHaveBeenCalledWith(mockMemberDoc, passport);
		});
	});

	Scenario('Getting member by ID when not exists', ({ Given, When, Then }) => {
		Given('no member exists with ID "non-existent-id"', () => {
			mockDataSource.findById.mockResolvedValueOnce(null);
		});

		When('I call getById with "non-existent-id"', async () => {
			const result = await repository.getById('non-existent-id');
			expect(result).toBeNull();
		});

		Then('I should receive null', () => {
			expect(mockDataSource.findById).toHaveBeenCalledWith('non-existent-id', undefined);
		});
	});

	Scenario('Getting member by ID with role', ({ Given, When, Then }) => {
		Given('a member exists with ID "member-123"', () => {
			// Mock is already set up in BeforeEachScenario
		});

		When('I call getByIdWithRole with "member-123"', async () => {
			await repository.getByIdWithRole('member-123');
		});

		Then('I should receive the MemberEntityReference object with role populated', () => {
			expect(mockDataSource.findById).toHaveBeenCalledWith('member-123', {
				populateFields: ['role', 'role.community'],
			});
			expect(mockConverter.toDomain).toHaveBeenCalledWith(mockMemberDoc, passport);
		});
	});

	Scenario('Getting member by ID with role when not exists', ({ Given, When, Then }) => {
		Given('no member exists with ID "non-existent-id"', () => {
			mockDataSource.findById.mockResolvedValueOnce(null);
		});

		When('I call getByIdWithRole with "non-existent-id"', async () => {
			const result = await repository.getByIdWithRole('non-existent-id');
			expect(result).toBeNull();
		});

		Then('I should receive null', () => {
			expect(mockDataSource.findById).toHaveBeenCalledWith('non-existent-id', {
				populateFields: ['role', 'role.community'],
			});
		});
	});

	Scenario('Getting members by IDs with role in one query', ({ Given, When, Then }) => {
		let result: unknown[];
		Given('a member exists with ID "member-123"', () => {
			// Mock is already set up in BeforeEachScenario
		});

		When('I call getByIdsWithRole with "member-123" and "member-456"', async () => {
			result = await repository.getByIdsWithRole(['member-123', 'member-456']);
		});

		Then('I should receive the matching members from a single find with role populated', () => {
			expect(mockDataSource.find).toHaveBeenCalledTimes(1);
			expect(mockDataSource.find).toHaveBeenCalledWith(
				{ _id: { $in: [expect.objectContaining({ toString: expect.any(Function) }), expect.objectContaining({ toString: expect.any(Function) })] } },
				{ populateFields: ['role', 'role.community'] },
			);
			expect(result).toHaveLength(1);
			expect(mockConverter.toDomain).toHaveBeenCalledWith(mockMemberDoc, passport);
		});
	});

	Scenario('Getting members by IDs with role when none requested', ({ When, Then }) => {
		let result: unknown[];
		When('I call getByIdsWithRole with no IDs', async () => {
			result = await repository.getByIdsWithRole([]);
		});

		Then('I should receive an empty array without querying', () => {
			expect(result).toEqual([]);
			expect(mockDataSource.find).not.toHaveBeenCalled();
		});
	});

	Scenario('Getting member by ID with community, role and user', ({ Given, When, Then }) => {
		Given('a member exists with ID "member-123"', () => {
			// Mock is already set up in BeforeEachScenario
		});

		When('I call getByIdWithCommunityAndRoleAndUser with "member-123"', async () => {
			await repository.getByIdWithCommunityAndRoleAndUser('member-123');
		});

		Then('I should receive the MemberEntityReference object with all fields populated', () => {
			expect(mockDataSource.findById).toHaveBeenCalledWith('member-123', {
				populateFields: ['community', 'role', 'role.community', 'accounts.user'],
			});
			expect(mockConverter.toDomain).toHaveBeenCalledWith(mockMemberDoc, passport);
		});
	});

	Scenario('Getting member by ID with community, role and user when not exists', ({ Given, When, Then }) => {
		Given('no member exists with ID "non-existent-id"', () => {
			mockDataSource.findById.mockResolvedValueOnce(null);
		});

		When('I call getByIdWithCommunityAndRoleAndUser with "non-existent-id"', async () => {
			const result = await repository.getByIdWithCommunityAndRoleAndUser('non-existent-id');
			expect(result).toBeNull();
		});

		Then('I should receive null', () => {
			expect(mockDataSource.findById).toHaveBeenCalledWith('non-existent-id', {
				populateFields: ['community', 'role', 'role.community', 'accounts.user'],
			});
		});
	});

	Scenario('Checking if member name exists in community', ({ Given, When, Then }) => {
		Given('a member with name "John Doe" exists in community "507f1f77bcf86cd799439011"', () => {
			mockDataSource.findOne.mockResolvedValueOnce(mockMemberDoc);
		});

		When('I call memberNameExistsInCommunity with "John Doe" and "507f1f77bcf86cd799439011"', async () => {
			const result = await repository.memberNameExistsInCommunity('John Doe', '507f1f77bcf86cd799439011');
			expect(result).toBe(true);
		});

		Then('I should receive true', () => {
			expect(mockDataSource.findOne).toHaveBeenCalledWith({
				community: expect.objectContaining({ toString: expect.any(Function), equals: expect.any(Function) }),
				memberName: 'John Doe',
			});
		});
	});

	Scenario('Checking if member name does not exist in community', ({ Given, When, Then }) => {
		Given('no member with name "Jane Smith" exists in community "507f1f77bcf86cd799439011"', () => {
			mockDataSource.findOne.mockResolvedValueOnce(null);
		});

		When('I call memberNameExistsInCommunity with "Jane Smith" and "507f1f77bcf86cd799439011"', async () => {
			const result = await repository.memberNameExistsInCommunity('Jane Smith', '507f1f77bcf86cd799439011');
			expect(result).toBe(false);
		});

		Then('I should receive false', () => {
			expect(mockDataSource.findOne).toHaveBeenCalledWith({
				community: expect.objectContaining({ toString: expect.any(Function), equals: expect.any(Function) }),
				memberName: 'Jane Smith',
			});
		});
	});

	Scenario('Getting members for end user external ID', ({ Given, When, Then }) => {
		Given('an end user exists with external ID "user-456"', () => {
			// Mock is already set up in BeforeEachScenario
		});

		When('I call getMembersForEndUserExternalId with "user-456"', async () => {
			await repository.getMembersForEndUserExternalId('user-456');
		});

		Then('I should receive an array of MemberEntityReference objects for that user', () => {
			expect(mockDataSource.aggregate).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({ $addFields: expect.any(Object) }),
					expect.objectContaining({ $lookup: expect.objectContaining({ from: 'users' }) }),
					expect.objectContaining({ $match: expect.any(Object) }),
					expect.objectContaining({ $project: expect.any(Object) }),
				]),
			);
			expect(mockConverter.toDomain).toHaveBeenCalledWith(mockMemberDoc, passport);
		});
	});

	Scenario('Checking if member is admin', ({ Given, When, Then }) => {
		Given('a member exists with ID "admin-member"', () => {
			mockDataSource.findById.mockResolvedValueOnce({
				...mockMemberDoc,
				role: {
					permissions: {
						communityPermissions: {
							canManageMembers: true,
						},
					},
				},
			} as unknown as Member);
			mockConverter.toDomain.mockReturnValueOnce({
				id: 'admin-member',
				role: {
					permissions: {
						communityPermissions: {
							canManageMembers: true,
						},
					},
				},
				passport,
			});
		});

		When('I call isAdmin with "admin-member"', async () => {
			const result = await repository.isAdmin('admin-member');
			expect(result).toBe(true);
		});

		Then('I should receive a boolean indicating admin status', () => {
			expect(mockDataSource.findById).toHaveBeenCalledWith('admin-member', {
				populateFields: ['role', 'role.community'],
			});
		});
	});

	Scenario('Checking if member is admin when not an admin', ({ Given, When, Then }) => {
		Given('a member exists with ID "non-admin-member" with no special permissions', () => {
			mockDataSource.findById.mockResolvedValueOnce({
				...mockMemberDoc,
				role: {
					permissions: {
						communityPermissions: {
							canManageMembers: false,
						},
					},
				},
			} as unknown as Member);
			mockConverter.toDomain.mockReturnValueOnce({
				id: 'non-admin-member',
				role: {
					permissions: {
						communityPermissions: {
							canManageMembers: false,
						},
					},
				},
				passport,
			});
		});

		When('I call isAdmin with "non-admin-member"', async () => {
			const result = await repository.isAdmin('non-admin-member');
			expect(result).toBe(false);
		});

		Then('I should receive false', () => {
			expect(mockDataSource.findById).toHaveBeenCalledWith('non-admin-member', {
				populateFields: ['role', 'role.community'],
			});
		});
	});

	Scenario('Checking if member is admin when member not found', ({ Given, When, Then }) => {
		Given('no member exists with ID "non-existent-member"', () => {
			mockDataSource.findById.mockResolvedValueOnce(null);
			mockConverter.toDomain.mockReturnValueOnce(null);
		});

		When('I call isAdmin with "non-existent-member"', async () => {
			const result = await repository.isAdmin('non-existent-member');
			expect(result).toBe(false);
		});

		Then('I should receive false', () => {
			expect(mockDataSource.findById).toHaveBeenCalledWith('non-existent-member', {
				populateFields: ['role', 'role.community'],
			});
		});
	});
});
