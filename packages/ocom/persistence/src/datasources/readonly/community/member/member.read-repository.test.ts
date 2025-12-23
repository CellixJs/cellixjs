import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';

import type { Domain } from '@ocom/domain';
import type { ModelsContext } from '../../../../index.ts';
import { MemberReadRepositoryImpl } from './member.read-repository.ts';
import { MemberDataSourceImpl } from './member.data.ts';
import { MemberConverter } from '../../../domain/community/member/member.domain-adapter.ts';
import type { Member } from '@ocom/data-sources-mongoose-models/member';

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
    ObjectId: vi.fn((id: string) => ({ toString: () => id, equals: vi.fn() })),
  },
}));

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/member.read-repository.feature')
);

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
      user: ['user-456']
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
      findById: vi.fn(async (id: string) => id === 'member-123' ? mockMemberDoc : null),
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
    vi.mocked(MemberDataSourceImpl).mockImplementation(() => mockDataSource as unknown as InstanceType<typeof MemberDataSourceImpl>);
    vi.mocked(MemberConverter).mockImplementation(() => mockConverter as unknown as MemberConverter);

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

  Scenario('Getting members by community ID', ({ When, Then }) => {
    When('I call getByCommunityId with "507f1f77bcf86cd799439011"', async () => {
      await repository.getByCommunityId('507f1f77bcf86cd799439011');
    });

    Then('I should receive an array of MemberEntityReference objects', () => {
      expect(mockDataSource.find).toHaveBeenCalledWith({ community: expect.any(Object) }, undefined);
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
        populateFields: ['role', 'role.community']
      });
      expect(mockConverter.toDomain).toHaveBeenCalledWith(mockMemberDoc, passport);
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
          expect.objectContaining({ $project: expect.any(Object) })
        ])
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
              canManageMembers: true
            }
          }
        }
      } as unknown as Member);
      mockConverter.toDomain.mockReturnValueOnce({
        id: 'admin-member',
        role: {
          permissions: {
            communityPermissions: {
              canManageMembers: true
            }
          }
        },
        passport
      });
    });

    When('I call isAdmin with "admin-member"', async () => {
      const result = await repository.isAdmin('admin-member');
      expect(result).toBe(true);
    });

    Then('I should receive a boolean indicating admin status', () => {
      expect(mockDataSource.findById).toHaveBeenCalledWith('admin-member', {
        populateFields: ['role', 'role.community']
      });
    });
  });
});