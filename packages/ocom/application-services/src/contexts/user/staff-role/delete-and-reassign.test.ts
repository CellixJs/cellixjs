import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { deleteAndReassign } from './delete-and-reassign.ts';
// Direct imports from domain package
import type { StaffRole, StaffRoleEntityReference, StaffRoleProps, StaffRoleRepository, StaffRoleUnitOfWork } from '@ocom/domain/contexts/staff-role';
import { StaffRole as StaffRoleClass } from '@ocom/domain/contexts/staff-role';


const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/delete-and-reassign.feature')
);

function makeMockStaffRole(overrides: Partial<StaffRoleEntityReference> = {}) {
  const baseRole = {
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
  };

  // Return a mock StaffRole object with the deleteAndReassignTo method
  return {
    ...baseRole,
    deleteAndReassignTo: vi.fn(),
  } as unknown as StaffRole<StaffRoleProps>;
}

function makeMockRepo(overrides: Partial<Domain.StaffRoleRepository<StaffRoleProps>> = {}) { 
  return {
    getById: vi.fn(),
    save: vi.fn(),
    ...overrides,
  } as unknown as StaffRoleRepository<StaffRoleProps>;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let dataSources: DataSources;
  let deleteAndReassignRole: (command: { roleId: string; reassignToRoleId: string }) => Promise<void>;

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

    deleteAndReassignRole = deleteAndReassign(dataSources);
  });

  Scenario('Deleting and reassigning a staff role successfully', ({ Given, When, Then }) => {
    Given('a staff role with id "507f1f77bcf86cd799439011" exists', () => {
      // Mock will be set up in When step
    });

    Given('a staff role with id "507f1f77bcf86cd799439012" exists', () => {
      // Mock will be set up in When step
    });

    When('I delete and reassign role "507f1f77bcf86cd799439011" to role "507f1f77bcf86cd799439012"', async () => {
      const roleToDelete = makeMockStaffRole({ id: '507f1f77bcf86cd799439011' });
      const roleToAssign = makeMockStaffRole({ id: '507f1f77bcf86cd799439012' });

      const mockRepo = makeMockRepo({
        getById: vi.fn()
          .mockResolvedValueOnce(roleToDelete)
          .mockResolvedValueOnce(roleToAssign),
        save: vi.fn().mockResolvedValue(roleToDelete),
      });

      vi.mocked(dataSources.domainDataSource.User.StaffRoleUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      await deleteAndReassignRole({ roleId: '507f1f77bcf86cd799439011', reassignToRoleId: '507f1f77bcf86cd799439012' });
    });

    Then('the operation should complete successfully', () => {
      // If no error was thrown, the test passes
      expect(true).toBe(true);
    });
  });

  Scenario('Deleting a staff role that does not exist', ({ Given, When, Then }) => {
    let error: Error;

    Given('no staff role with id "507f1f77bcf86cd799439011" exists', () => {
      // Mock will be set up in When step
    });

    When('I delete and reassign role "507f1f77bcf86cd799439011" to role "507f1f77bcf86cd799439012"', async () => {
      const mockRepo = makeMockRepo({
        getById: vi.fn().mockRejectedValue(new Error('Not found')),
      });

      vi.mocked(dataSources.domainDataSource.User.StaffRoleUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      try {
        await deleteAndReassignRole({ roleId: '507f1f77bcf86cd799439011', reassignToRoleId: '507f1f77bcf86cd799439012' });
      } catch (err) {
        error = err as Error;
      }
    });

    Then('it should throw an error', () => {
      expect(error).toBeDefined();
    });
  });

  Scenario('Reassigning to a staff role that does not exist', ({ Given, When, Then }) => {
    let error: Error;

    Given('a staff role with id "507f1f77bcf86cd799439011" exists', () => {
      // Mock will be set up in When step
    });

    Given('no staff role with id "507f1f77bcf86cd799439012" exists', () => {
      // Mock will be set up in When step
    });

    When('I delete and reassign role "507f1f77bcf86cd799439011" to role "507f1f77bcf86cd799439012"', async () => {
      const roleToDelete = makeMockStaffRole({ id: '507f1f77bcf86cd799439011' });

      const mockRepo = makeMockRepo({
        save: vi.fn().mockResolvedValue(roleToDelete),
        getById: vi.fn()
          .mockResolvedValueOnce(roleToDelete)
          .mockRejectedValueOnce(new Error('Not found')),
      });

      vi.mocked(dataSources.domainDataSource.User.StaffRoleUnitOfWork.withScopedTransaction).mockImplementation(async (callback) => {
        await callback(mockRepo);
      });

      try {
        await deleteAndReassignRole({ roleId: '507f1f77bcf86cd799439011', reassignToRoleId: '507f1f77bcf86cd799439012' });
      } catch (err) {
        error = err as Error;
      }
    });

    Then('it should throw an error', () => {
      expect(error).toBeDefined();
    });
  });
});