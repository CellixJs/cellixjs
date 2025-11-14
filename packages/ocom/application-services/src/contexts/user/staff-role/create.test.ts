import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { create, type StaffRoleCreateCommandPermissions } from './create.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/create.feature')
);

function makeMockStaffRole(overrides: Partial<Domain.StaffRole.StaffRoleEntityReference> = {}) {
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
  } as Domain.StaffRole.StaffRoleEntityReference;
}

function makeMockRepo(overrides: Partial<Domain.StaffRole.StaffRoleRepository<Domain.StaffRole.StaffRoleProps>> = {}) { 
  return {
    getByRoleName: vi.fn(),
    getNewInstance: vi.fn(),
    save: vi.fn(),
    ...overrides,
  } as unknown as Domain.StaffRole.StaffRoleRepository<Domain.StaffRole.StaffRoleProps>;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let dataSources: DataSources;
  let createStaffRole: (command: { roleName: string; isDefault?: boolean; permissions?: StaffRoleCreateCommandPermissions }) => Promise<Domain.StaffRole.StaffRoleEntityReference>;

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

    createStaffRole = create(dataSources);
  });

  Scenario('Creating a staff role successfully', ({ Given, When, Then }) => {
    let result: Domain.StaffRole.StaffRoleEntityReference;

    Given('a staff role with name "Test Role" does not exist', () => {
      // Mock will be set up in When step
    });

    When('I create a staff role with name "Test Role", isDefault false, and no permissions', async () => {
      const mockRepo = makeMockRepo({
        getByRoleName: vi.fn().mockRejectedValue(new Error('Not found')),
        getNewInstance: vi.fn().mockResolvedValue(makeMockStaffRole({ roleName: 'Test Role', isDefault: false })),
        save: vi.fn().mockResolvedValue(makeMockStaffRole({ roleName: 'Test Role', isDefault: false })),
      });

      vi.mocked(dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      result = await createStaffRole({ roleName: 'Test Role', isDefault: false });
    });

    Then('it should return a staff role entity reference with name "Test Role" and isDefault false', () => {
      expect(result).toBeDefined();
      expect(result.roleName).toBe('Test Role');
      expect(result.isDefault).toBe(false);
    });
  });

  Scenario('Creating a staff role with permissions', ({ Given, When, Then }) => {
    let result: Domain.StaffRole.StaffRoleEntityReference;

    Given('a staff role with name "Admin Role" does not exist', () => {
      // Mock will be set up in When step
    });

    When('I create a staff role with name "Admin Role", isDefault true, and permissions', async () => {
      const mockRepo = makeMockRepo({
        getByRoleName: vi.fn().mockRejectedValue(new Error('Not found')),
        getNewInstance: vi.fn().mockResolvedValue(makeMockStaffRole({ roleName: 'Admin Role', isDefault: true })),
        save: vi.fn().mockResolvedValue(makeMockStaffRole({ roleName: 'Admin Role', isDefault: true })),
      });

      vi.mocked(dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      result = await createStaffRole({
        roleName: 'Admin Role',
        isDefault: true,
        permissions: {
          community: {
            canManageStaffRolesAndPermissions: true,
            canManageAllCommunities: true,
            canDeleteCommunities: false,
            canChangeCommunityOwner: false,
            canReIndexSearchCollections: true,
          },
        },
      });
    });

    Then('it should return a staff role entity reference with name "Admin Role" and isDefault true', () => {
      expect(result).toBeDefined();
      expect(result.roleName).toBe('Admin Role');
      expect(result.isDefault).toBe(true);
    });
  });

  Scenario('Creating a staff role with duplicate name', ({ Given, When, Then }) => {
    let error: Error;

    Given('a staff role with name "Test Role" already exists', () => {
      // Mock will be set up in When step
    });

    When('I create a staff role with name "Test Role", isDefault false, and no permissions', async () => {
      const mockRepo = makeMockRepo({
        getByRoleName: vi.fn().mockResolvedValue(makeMockStaffRole({ roleName: 'Test Role' })),
      });

      vi.mocked(dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      try {
        await createStaffRole({ roleName: 'Test Role', isDefault: false });
      } catch (err) {
        error = err as Error;
      }
    });

    Then('it should throw an error "Staff role with name Test Role already exists"', () => {
      expect(error).toBeDefined();
      expect(error.message).toBe('Staff role with name Test Role already exists');
    });
  });

  Scenario('Creating a staff role when save fails', ({ Given, When, Then }) => {
    let error: Error;

    Given('a staff role with name "Test Role" does not exist', () => {
      // Mock will be set up in When step
    });

    When('I create a staff role but save fails', async () => {
      const mockRepo = makeMockRepo({
        getByRoleName: vi.fn().mockRejectedValue(new Error('Not found')),
        getNewInstance: vi.fn().mockResolvedValue(makeMockStaffRole({ roleName: 'Test Role', isDefault: false })),
        save: vi.fn().mockResolvedValue(undefined), // Simulate save failure
      });

      vi.mocked(dataSources.domainDataSource.User.StaffRole.StaffRoleUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      try {
        await createStaffRole({ roleName: 'Test Role', isDefault: false });
      } catch (err) {
        error = err as Error;
      }
    });

    Then('it should throw an error "Unable to create staff role"', () => {
      expect(error).toBeDefined();
      expect(error.message).toBe('Unable to create staff role');
    });
  });
});