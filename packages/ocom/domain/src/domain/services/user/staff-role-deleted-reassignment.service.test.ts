import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, type MockedFunction, vi } from 'vitest';
import type { DomainDataSource } from '../../../index.ts';
import type { Passport } from '../../contexts/passport.ts';
import type * as StaffRole from '../../contexts/user/staff-role/index.ts';
import type * as StaffUser from '../../contexts/user/staff-user/index.ts';
import { StaffRoleDeletedReassignmentService } from './staff-role-deleted-reassignment.service.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-role-deleted-reassignment.service.feature'));

interface MockStaffUser {
	id: string;
}

function makeMockStaffUser(id: string): MockStaffUser {
	return {
		id,
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
		setRoleIfCurrent: MockedFunction<(command: StaffUser.SetStaffUserRoleIfCurrentCommand) => Promise<boolean>>;
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
			setRoleIfCurrent: vi.fn(async () => true),
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
			assignedStaffUsers = [makeMockStaffUser('staff-user-1'), makeMockStaffUser('staff-user-2')];
		});
		When('I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"', async () => {
			await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'Staff.CaseManager', 'actor-1', mockDomainDataSource);
		});
		Then('each assigned staff user should be conditionally reassigned to the default role "default-role-1"', () => {
			expect(mockStaffUserRepo.getAllAssignedToRole).toHaveBeenCalledWith('deleted-role-1');
			for (const staffUser of assignedStaffUsers) {
				expect(mockStaffUserRepo.setRoleIfCurrent).toHaveBeenCalledWith(
					expect.objectContaining({
						staffUserId: staffUser.id,
						expectedCurrentRoleId: 'deleted-role-1',
						replacementRoleId: 'default-role-1',
					}),
				);
			}
			expect(capturedPassport).toBeDefined();
		});
		And('each conditional update should record the initiating actor', () => {
			expect(mockStaffUserRepo.setRoleIfCurrent).toHaveBeenCalledTimes(2);
			for (const call of mockStaffUserRepo.setRoleIfCurrent.mock.calls) {
				expect(call[0]).toEqual(
					expect.objectContaining({
						activityType: 'ROLE_ASSIGNED',
						activityByStaffUserId: 'actor-1',
					}),
				);
			}
		});
	});

	Scenario('Reassignment does not overwrite a newer concurrent role assignment', ({ Given, When, Then }) => {
		Given('a candidate staff user whose role changes before the conditional update', () => {
			assignedStaffUsers = [makeMockStaffUser('staff-user-1')];
			mockStaffUserRepo.setRoleIfCurrent.mockResolvedValue(false);
		});
		When('I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"', async () => {
			await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'Staff.CaseManager', 'actor-1', mockDomainDataSource);
		});
		Then('the conditional update should be allowed to report no change', () => {
			expect(mockStaffUserRepo.setRoleIfCurrent).toHaveBeenCalledTimes(1);
			expect(mockStaffUserRepo.setRoleIfCurrent).toHaveResolvedWith(false);
		});
	});

	Scenario('No staff users are assigned to the deleted role', ({ Given, When, Then }) => {
		Given('no staff users assigned to the deleted role "deleted-role-1"', () => {
			assignedStaffUsers = [];
		});
		When('I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"', async () => {
			await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'Staff.CaseManager', 'actor-1', mockDomainDataSource);
		});
		Then('no conditional role update should be attempted', () => {
			expect(mockStaffUserRepo.setRoleIfCurrent).not.toHaveBeenCalled();
		});
	});

	Scenario("Failing when no default role matches the deleted role's enterpriseAppRole", ({ Given, When, Then, And }) => {
		Given('no default staff role exists for enterpriseAppRole "Staff.Unmatched"', () => {
			assignedStaffUsers = [makeMockStaffUser('staff-user-1')];
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
		And('no conditional role update should be attempted', () => {
			expect(mockStaffUserRepo.setRoleIfCurrent).not.toHaveBeenCalled();
		});
	});
});
