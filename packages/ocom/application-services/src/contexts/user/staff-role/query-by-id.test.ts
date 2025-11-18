import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { DataSources } from '@ocom/persistence';
import { queryById } from './query-by-id.ts';
// Direct imports from domain package
import type * as StaffRole from '@ocom/domain/contexts/staff-role';
import { StaffRole as StaffRoleClass } from '@ocom/domain/contexts/staff-role';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/query-by-id.feature')
);

function makeMockStaffRole(overrides: Partial<StaffRole.StaffRoleEntityReference> = {}) {
  return {
    id: '507f1f77bcf86cd799439011',
    roleName: 'Test Role',
    isDefault: false,
    permissions: {
      communityPermissions: {
        canManageStaffRolesAndPermissions: false,
        canManageAllCommunities: false,
        canDeleteCommunities: false,
        canChangeCommunityOwner: false,
        canReIndexSearchCollections: false,
      },
    },
    roleType: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    schemaVersion: '1.0',
    ...overrides,
  } as StaffRole.StaffRoleEntityReference;
}

function makeMockRepo(overrides: Partial<Domain.StaffRole.StaffRoleRepository<StaffRole.StaffRoleProps>> = {}) { 
  return {
    getById: vi.fn(),
    ...overrides,
  } as unknown as StaffRole.StaffRoleRepository<StaffRole.StaffRoleProps>;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let dataSources: DataSources;
  let queryStaffRoleById: (command: { roleId: string }) => Promise<StaffRole.StaffRoleEntityReference | null>;

  BeforeEachScenario(() => {
    dataSources = {
      domainDataSource: {
        User: {
          StaffRole: {
            StaffRoleUnitOfWork: {
              withScopedTransaction: vi.fn(),
            },
          },
        },
      },
    } as unknown as DataSources;

    queryStaffRoleById = queryById(dataSources);
  });

  Scenario('Querying a staff role by ID successfully', ({ Given, When, Then }) => {
    let result: StaffRole.StaffRoleEntityReference | null;

    Given('a staff role with id "507f1f77bcf86cd799439011" exists', () => {
      // Mock will be set up in When step
    });

    When('I query for staff role with id "507f1f77bcf86cd799439011"', async () => {
      const mockRole = makeMockStaffRole({ id: '507f1f77bcf86cd799439011' });

      const mockRepo = makeMockRepo({
        getById: vi.fn().mockResolvedValue(mockRole),
      });

      vi.mocked(dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      result = await queryStaffRoleById({ roleId: '507f1f77bcf86cd799439011' });
    });

    Then('it should return the staff role entity reference', () => {
      expect(result).toBeDefined();
      expect(result?.id).toBe('507f1f77bcf86cd799439011');
    });
  });

  Scenario('Querying a staff role by ID that does not exist', ({ Given, When, Then }) => {
    let result: StaffRole.StaffRoleEntityReference | null;

    Given('no staff role with id "507f1f77bcf86cd799439011" exists', () => {
      // Mock will be set up in When step
    });

    When('I query for staff role with id "507f1f77bcf86cd799439011"', async () => {
      const mockRepo = makeMockRepo({
        getById: vi.fn().mockRejectedValue(new Error('Not found')),
      });

      vi.mocked(dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      result = await queryStaffRoleById({ roleId: '507f1f77bcf86cd799439011' });
    });

    Then('it should return null', () => {
      expect(result).toBeNull();
    });
  });

  Scenario('Querying a staff role by ID when repository throws an error', ({ Given, When, Then }) => {
    let error: Error;

    Given('the repository will throw a database error', () => {
      // Mock will be set up in When step
    });

    When('I query for staff role with id "507f1f77bcf86cd799439011"', async () => {
      const mockRepo = makeMockRepo({
        getById: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      });

      vi.mocked(dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      try {
        await queryStaffRoleById({ roleId: '507f1f77bcf86cd799439011' });
      } catch (err) {
        error = err as Error;
      }
    });

    Then('it should throw an error', () => {
      expect(error).toBeDefined();
      expect(error.message).toBe('Database connection failed');
    });
  });
});