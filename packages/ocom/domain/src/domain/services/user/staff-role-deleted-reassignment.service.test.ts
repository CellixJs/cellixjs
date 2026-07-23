import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, type MockedFunction, vi } from 'vitest';
import type { DomainDataSource } from '../../../index.ts';
import type { Passport } from '../../contexts/passport.ts';
import type * as StaffRole from '../../contexts/user/staff-role/index.ts';
import { StaffRoleDeletedReassignmentService } from './staff-role-deleted-reassignment.service.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-role-deleted-reassignment.service.feature'));

interface MockStaffUser {
	id: string;
	role: { id: string } | undefined;
	requestRoleAssignment: MockedFunction<(role: StaffRole.StaffRoleEntityReference, description: string, activityByStaffUserId: string) => void>;
}

function makeMockStaffUser(id: string, roleId: string | undefined): MockStaffUser {
	return {
		id,
		role: roleId ? { id: roleId } : undefined,
		requestRoleAssignment: vi.fn(),
	};
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let service: StaffRoleDeletedReassignmentService;
	let mockDomainDataSource: DomainDataSource;
	let mockDefaultRole: StaffRole.StaffRoleEntityReference;
	let mockStaffRoleRepo: {
		getDefaultRoleByEnterpriseAppRole: MockedFunction<(enterpriseAppRole: string) => Promise<StaffRole.StaffRoleEntityReference>>;
	};
	let mockStaffUserRepo: {
		getAllAssignedToRole: MockedFunction<(roleId: string) => Promise<MockStaffUser[]>>;
		save: MockedFunction<(staffUser: MockStaffUser) => Promise<MockStaffUser>>;
	};
	let assignedStaffUsers: MockStaffUser[];
	let capturedPassport: Passport | undefined;
	let thrownError: Error | null = null;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	BeforeEachScenario(() => {
		thrownError = null;
		capturedPassport = undefined;
		assignedStaffUsers = [];
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		mockDefaultRole = {
			id: 'default-role-1',
			roleName: 'Default Case Manager',
			enterpriseAppRole: 'Staff.CaseManager',
			isDefault: true,
		} as unknown as StaffRole.StaffRoleEntityReference;

		mockStaffRoleRepo = {
			getDefaultRoleByEnterpriseAppRole: vi.fn(),
		};
		mockStaffUserRepo = {
			getAllAssignedToRole: vi.fn(async () => assignedStaffUsers),
			save: vi.fn(async (staffUser: MockStaffUser) => staffUser),
		};
		mockStaffRoleRepo.getDefaultRoleByEnterpriseAppRole.mockImplementation((enterpriseAppRole: string) => {
			if (enterpriseAppRole === mockDefaultRole.enterpriseAppRole) {
				return Promise.resolve(mockDefaultRole);
			}
			return Promise.reject(new Error(`StaffRole with enterpriseAppRole ${enterpriseAppRole} not found`));
		});

		mockDomainDataSource = {
			User: {
				StaffRole: {
					StaffRoleUnitOfWork: {
						withTransaction: vi.fn(),
						withScopedTransaction: vi.fn(async (fn: (repo: typeof mockStaffRoleRepo) => Promise<void>) => {
							await fn(mockStaffRoleRepo);
						}),
					},
				},
				StaffUser: {
					StaffUserUnitOfWork: {
						withTransaction: vi.fn(async (passport: Passport, fn: (repo: typeof mockStaffUserRepo) => Promise<void>) => {
							capturedPassport = passport;
							await fn(mockStaffUserRepo);
						}),
						withScopedTransaction: vi.fn(),
					},
				},
			},
		} as unknown as DomainDataSource;

		service = new StaffRoleDeletedReassignmentService();
	});

	Background(({ Given, And }) => {
		Given('a StaffRoleDeletedReassignmentService instance', () => {
			// Created in BeforeEachScenario
		});
		And('a valid domainDataSource with staff role and staff user repositories', () => {
			// Created in BeforeEachScenario
		});
		And('a default staff role with id "default-role-1" and enterpriseAppRole "Staff.CaseManager"', () => {
			// Created in BeforeEachScenario
		});
	});

	Scenario('Reassigning staff users assigned to the deleted role to the matching default role', ({ Given, When, Then, And }) => {
		Given('two staff users assigned to the deleted role "deleted-role-1"', () => {
			assignedStaffUsers = [makeMockStaffUser('staff-user-1', 'deleted-role-1'), makeMockStaffUser('staff-user-2', 'deleted-role-1')];
		});
		When('I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"', async () => {
			await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'Staff.CaseManager', 'actor-1', mockDomainDataSource);
		});
		Then('each assigned staff user should be reassigned to the default role "default-role-1"', () => {
			expect(mockStaffUserRepo.getAllAssignedToRole).toHaveBeenCalledWith('deleted-role-1');
			for (const staffUser of assignedStaffUsers) {
				expect(staffUser.requestRoleAssignment).toHaveBeenCalledTimes(1);
				expect(staffUser.requestRoleAssignment).toHaveBeenCalledWith(mockDefaultRole, expect.stringContaining('Default Case Manager'), 'actor-1');
			}
			expect(capturedPassport).toBeDefined();
		});
		And('each reassigned staff user should be saved', () => {
			expect(mockStaffUserRepo.save).toHaveBeenCalledTimes(2);
			expect(mockStaffUserRepo.save).toHaveBeenCalledWith(assignedStaffUsers[0]);
			expect(mockStaffUserRepo.save).toHaveBeenCalledWith(assignedStaffUsers[1]);
		});
	});

	Scenario('Reassignment is idempotent for staff users already assigned to the default role', ({ Given, When, Then, And }) => {
		Given('a staff user already assigned to the default role "default-role-1"', () => {
			assignedStaffUsers = [makeMockStaffUser('staff-user-1', 'default-role-1')];
		});
		When('I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"', async () => {
			await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'Staff.CaseManager', 'actor-1', mockDomainDataSource);
		});
		Then('that staff user should not be reassigned again', () => {
			expect(assignedStaffUsers[0]?.requestRoleAssignment).not.toHaveBeenCalled();
		});
		And('no staff user should be saved', () => {
			expect(mockStaffUserRepo.save).not.toHaveBeenCalled();
		});
	});

	Scenario('No staff users are assigned to the deleted role', ({ Given, When, Then }) => {
		Given('no staff users assigned to the deleted role "deleted-role-1"', () => {
			assignedStaffUsers = [];
		});
		When('I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"', async () => {
			await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'Staff.CaseManager', 'actor-1', mockDomainDataSource);
		});
		Then('no staff user should be saved', () => {
			expect(mockStaffUserRepo.save).not.toHaveBeenCalled();
		});
	});

	Scenario("Failing when no default role matches the deleted role's enterpriseAppRole", ({ Given, When, Then, And }) => {
		Given('no default staff role exists for enterpriseAppRole "Staff.Unmatched"', () => {
			assignedStaffUsers = [makeMockStaffUser('staff-user-1', 'deleted-role-1')];
		});
		When('I try to call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.Unmatched"', async () => {
			try {
				await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'Staff.Unmatched', 'actor-1', mockDomainDataSource);
			} catch (error) {
				thrownError = error as Error;
			}
		});
		Then('the missing default role failure should be logged and rethrown', () => {
			expect(thrownError).not.toBeNull();
			expect(thrownError?.message).toContain('Staff.Unmatched');
			expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Staff.Unmatched'), expect.any(Error));
		});
		And('no staff user should be saved', () => {
			expect(mockStaffUserRepo.save).not.toHaveBeenCalled();
		});
	});
});
