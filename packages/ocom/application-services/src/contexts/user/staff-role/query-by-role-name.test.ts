import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { queryByRoleName } from './query-by-role-name.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/query-by-role-name.feature')
);

function makeMockStaffRole(overrides: Partial<Domain.Contexts.User.StaffRole.StaffRoleEntityReference> = {}) {
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
  } as Domain.Contexts.User.StaffRole.StaffRoleEntityReference;
}

function makeMockRepo(overrides: Partial<Domain.Contexts.User.StaffRole.StaffRoleRepository<Domain.Contexts.User.StaffRole.StaffRoleProps>> = {}) { 
  return {
    getByRoleName: vi.fn(),
    ...overrides,
  } as unknown as Domain.Contexts.User.StaffRole.StaffRoleRepository<Domain.Contexts.User.StaffRole.StaffRoleProps>;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let dataSources: DataSources;
  let queryStaffRoleByName: (command: { roleName: string }) => Promise<Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null>;

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

    queryStaffRoleByName = queryByRoleName(dataSources);
  });

  Scenario('Querying a staff role by role name successfully', ({ Given, When, Then }) => {
    let result: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null;

    Given('a staff role with name "Test Role" exists', () => {
      // Mock will be set up in When step
    });

    When('I query for staff role with name "Test Role"', async () => {
      const mockRole = makeMockStaffRole({ roleName: 'Test Role' });

      const mockRepo = makeMockRepo({
        getByRoleName: vi.fn().mockResolvedValue(mockRole),
      });

      vi.mocked(dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      result = await queryStaffRoleByName({ roleName: 'Test Role' });
    });

    Then('it should return the staff role entity reference', () => {
      expect(result).toBeDefined();
      expect(result?.roleName).toBe('Test Role');
    });
  });

  Scenario('Querying a staff role by role name that does not exist', ({ Given, When, Then }) => {
    let result: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null;

    Given('no staff role with name "Test Role" exists', () => {
      // Mock will be set up in When step
    });

    When('I query for staff role with name "Test Role"', async () => {
      const mockRepo = makeMockRepo({
        getByRoleName: vi.fn().mockRejectedValue(new Error('Not found')),
      });

      vi.mocked(dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      result = await queryStaffRoleByName({ roleName: 'Test Role' });
    });

    Then('it should return null', () => {
      expect(result).toBeNull();
    });
  });

  Scenario('Querying a staff role by role name when repository throws an error', ({ Given, When, Then }) => {
    let error: Error;

    Given('the repository will throw a database error', () => {
      // Mock will be set up in When step
    });

    When('I query for staff role with name "Test Role"', async () => {
      const mockRepo = makeMockRepo({
        getByRoleName: vi.fn().mockRejectedValue(new Error('Database connection failed')),
      });

      vi.mocked(dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      try {
        await queryStaffRoleByName({ roleName: 'Test Role' });
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