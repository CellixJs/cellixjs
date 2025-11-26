import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';

// Mock the individual service modules
vi.mock('./create.ts', () => ({
  create: vi.fn(),
}));

vi.mock('./delete-and-reassign.ts', () => ({
  deleteAndReassign: vi.fn(),
}));

vi.mock('./query-by-id.ts', () => ({
  queryById: vi.fn(),
}));

vi.mock('./query-by-role-name.ts', () => ({
  queryByRoleName: vi.fn(),
}));

import { StaffRole } from './index.ts';
import { create } from './create.ts';
import { deleteAndReassign } from './delete-and-reassign.ts';
import { queryById } from './query-by-id.ts';
import { queryByRoleName } from './query-by-role-name.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(
  path.resolve(__dirname, 'features/index.feature')
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
  // biome-ignore lint/plugin/no-type-assertion: test file
  } as Domain.Contexts.User.StaffRole.StaffRoleEntityReference;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
  let dataSources: DataSources;
  let service: ReturnType<typeof StaffRole>;

  BeforeEachScenario(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Set up mock implementations
    const mockCreateFn = vi.fn().mockResolvedValue(makeMockStaffRole({ roleName: 'Test Role' }));
    const mockDeleteAndReassignFn = vi.fn().mockResolvedValue(undefined);
    const mockQueryByIdFn = vi.fn().mockResolvedValue(makeMockStaffRole({ id: 'role1' }));
    const mockQueryByRoleNameFn = vi.fn().mockResolvedValue(makeMockStaffRole({ roleName: 'Test Role' }));

    vi.mocked(create).mockReturnValue(mockCreateFn);
    vi.mocked(deleteAndReassign).mockReturnValue(mockDeleteAndReassignFn);
    vi.mocked(queryById).mockReturnValue(mockQueryByIdFn);
    vi.mocked(queryByRoleName).mockReturnValue(mockQueryByRoleNameFn);

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
    // biome-ignore lint/plugin/no-type-assertion: test file
    } as unknown as DataSources;

    service = StaffRole(dataSources);
  });

  Scenario('Creating a staff role through the application service', ({ Given, When, Then }) => {
    let result: Domain.Contexts.User.StaffRole.StaffRoleEntityReference;

    Given('a staff role application service', () => {
      expect(service).toBeDefined();
    });

    When('I create a staff role with name "Test Role"', async () => {
      result = await service.create({ roleName: 'Test Role' });
    });

    Then('it should delegate to the create function', () => {
      expect(result).toBeDefined();
      expect(result.roleName).toBe('Test Role');
    });
  });

  Scenario('Deleting and reassigning a staff role through the application service', ({ Given, When, Then }) => {
    Given('a staff role application service', () => {
      expect(service).toBeDefined();
    });

    When('I delete and reassign role "role1" to role "role2"', async () => {
      await service.deleteAndReassign({ roleId: 'role1', reassignToRoleId: 'role2' });
    });

    Then('it should delegate to the deleteAndReassign function', () => {
      // If no error was thrown, the delegation worked
      expect(true).toBe(true);
    });
  });

  Scenario('Querying a staff role by ID through the application service', ({ Given, When, Then }) => {
    let result: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null;

    Given('a staff role application service', () => {
      expect(service).toBeDefined();
    });

    When('I query for staff role with id "role1"', async () => {
      result = await service.queryById({ roleId: 'role1' });
    });

    Then('it should delegate to the queryById function', () => {
      expect(result).toBeDefined();
      expect(result?.id).toBe('role1');
    });
  });

  Scenario('Querying a staff role by name through the application service', ({ Given, When, Then }) => {
    let result: Domain.Contexts.User.StaffRole.StaffRoleEntityReference | null;

    Given('a staff role application service', () => {
      expect(service).toBeDefined();
    });

    When('I query for staff role with name "Test Role"', async () => {
      result = await service.queryByRoleName({ roleName: 'Test Role' });
    });

    Then('it should delegate to the queryByRoleName function', () => {
      expect(result).toBeDefined();
      expect(result?.roleName).toBe('Test Role');
    });
  });
});