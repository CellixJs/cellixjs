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
		markReassignmentCompleted: MockedFunction<(roleId: string, completedAt: Date) => Promise<void>>;
	};
	let mockStaffUserRepo: {
		getAssignedUserIdsToRoleBatch: MockedFunction<(roleId: string, limit: number) => Promise<string[]>>;
		setRoleIfCurrent: MockedFunction<(command: StaffUser.SetStaffUserRoleIfCurrentCommand) => Promise<boolean>>;
	};
	let assignedStaffUsers: MockStaffUser[];
	let staffUserWithTransaction: ReturnType<typeof vi.fn>;
	let runStaffUserTransaction: (passport: Passport, fn: (repo: typeof mockStaffUserRepo) => Promise<void>) => Promise<void>;
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
			markReassignmentCompleted: vi.fn(async () => undefined),
		};
		mockStaffUserRepo = {
			getAssignedUserIdsToRoleBatch: vi.fn((_roleId, limit) => Promise.resolve(assignedStaffUsers.slice(0, limit).map(({ id }) => id))),
			setRoleIfCurrent: vi.fn((command) => {
				assignedStaffUsers = assignedStaffUsers.filter(({ id }) => id !== command.staffUserId);
				return Promise.resolve(true);
			}),
		};
		runStaffUserTransaction = async (passport, fn) => {
			capturedPassport = passport;
			await fn(mockStaffUserRepo);
		};
		staffUserWithTransaction = vi.fn(runStaffUserTransaction);
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
						withTransaction: vi.fn(async (passport: Passport, fn: (repo: typeof mockStaffRoleRepo) => Promise<void>) => {
							capturedPassport = passport;
							await fn(mockStaffRoleRepo);
						}),
						withScopedTransaction: vi.fn(async (fn: (repo: typeof mockStaffRoleRepo) => Promise<void>) => {
							await fn(mockStaffRoleRepo);
						}),
					},
				},
				StaffUser: {
					StaffUserUnitOfWork: {
						withTransaction: staffUserWithTransaction,
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
			expect(mockStaffUserRepo.getAssignedUserIdsToRoleBatch).toHaveBeenCalledWith('deleted-role-1', 10);
			for (const staffUserId of ['staff-user-1', 'staff-user-2']) {
				expect(mockStaffUserRepo.setRoleIfCurrent).toHaveBeenCalledWith(
					expect.objectContaining({
						staffUserId,
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
		And('the deleted role reassignment should be marked complete', () => {
			expect(mockStaffRoleRepo.markReassignmentCompleted).toHaveBeenCalledWith('deleted-role-1', expect.any(Date));
		});
	});

	Scenario('Reassignment does not overwrite a newer concurrent role assignment', ({ Given, When, Then }) => {
		Given('a candidate staff user whose role changes before the conditional update', () => {
			assignedStaffUsers = [makeMockStaffUser('staff-user-1')];
			mockStaffUserRepo.setRoleIfCurrent.mockImplementation((command) => {
				assignedStaffUsers = assignedStaffUsers.filter(({ id }) => id !== command.staffUserId);
				return Promise.resolve(false);
			});
		});
		When('I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"', async () => {
			await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'Staff.CaseManager', 'actor-1', mockDomainDataSource);
		});
		Then('the conditional update should be allowed to report no change', () => {
			expect(mockStaffUserRepo.setRoleIfCurrent).toHaveBeenCalledTimes(1);
			expect(mockStaffUserRepo.setRoleIfCurrent).toHaveResolvedWith(false);
		});
	});

	Scenario('Reassigning a large role in committed batches', ({ Given, When, Then, And }) => {
		Given('twenty-five staff users assigned to the deleted role "deleted-role-1"', () => {
			assignedStaffUsers = Array.from({ length: 25 }, (_, index) => makeMockStaffUser(`staff-user-${index + 1}`));
		});
		When('I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"', async () => {
			await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'Staff.CaseManager', 'actor-1', mockDomainDataSource);
		});
		Then('the staff users should be reassigned in three bounded transactions', () => {
			expect(staffUserWithTransaction).toHaveBeenCalledTimes(3);
			expect(mockStaffUserRepo.getAssignedUserIdsToRoleBatch).toHaveBeenCalledTimes(3);
			expect(mockStaffUserRepo.getAssignedUserIdsToRoleBatch).toHaveBeenCalledWith('deleted-role-1', 10);
		});
		And('all twenty-five conditional role updates should be attempted', () => {
			expect(mockStaffUserRepo.setRoleIfCurrent).toHaveBeenCalledTimes(25);
			expect(assignedStaffUsers).toEqual([]);
		});
		And('the deleted role reassignment should be marked complete', () => {
			expect(mockStaffRoleRepo.markReassignmentCompleted).toHaveBeenCalledWith('deleted-role-1', expect.any(Date));
		});
	});

	Scenario('A later batch failure preserves earlier reassignment progress', ({ Given, And, When, Then }) => {
		const batchError = new Error('batch failed');
		Given('fifteen staff users assigned to the deleted role "deleted-role-1"', () => {
			assignedStaffUsers = Array.from({ length: 15 }, (_, index) => makeMockStaffUser(`staff-user-${index + 1}`));
		});
		And('the second reassignment batch will fail', () => {
			staffUserWithTransaction.mockImplementationOnce(runStaffUserTransaction).mockRejectedValueOnce(batchError);
		});
		When('I try to call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"', async () => {
			try {
				await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'Staff.CaseManager', 'actor-1', mockDomainDataSource);
			} catch (error) {
				thrownError = error as Error;
			}
		});
		Then('ten conditional role updates should have completed before the failure', () => {
			expect(mockStaffUserRepo.setRoleIfCurrent).toHaveBeenCalledTimes(10);
		});
		And('five staff users should remain for recovery', () => {
			expect(assignedStaffUsers).toHaveLength(5);
		});
		And('the deleted role reassignment should not be marked complete', () => {
			expect(mockStaffRoleRepo.markReassignmentCompleted).not.toHaveBeenCalled();
		});
		And('the batch failure should be rethrown', () => {
			expect(thrownError).toBe(batchError);
		});
	});

	Scenario('No staff users are assigned to the deleted role', ({ Given, When, Then, And }) => {
		Given('no staff users assigned to the deleted role "deleted-role-1"', () => {
			assignedStaffUsers = [];
		});
		When('I call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"', async () => {
			await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'Staff.CaseManager', 'actor-1', mockDomainDataSource);
		});
		Then('no conditional role update should be attempted', () => {
			expect(mockStaffUserRepo.setRoleIfCurrent).not.toHaveBeenCalled();
		});
		And('the deleted role reassignment should be marked complete', () => {
			expect(mockStaffRoleRepo.markReassignmentCompleted).toHaveBeenCalledWith('deleted-role-1', expect.any(Date));
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
		And('the deleted role reassignment should not be marked complete', () => {
			expect(mockStaffRoleRepo.markReassignmentCompleted).not.toHaveBeenCalled();
		});
	});

	Scenario('Surfacing a reassignment completion marker failure', ({ Given, And, When, Then }) => {
		const markerError = new Error('marker write failed');
		Given('no staff users assigned to the deleted role "deleted-role-1"', () => {
			assignedStaffUsers = [];
		});
		And('marking the deleted role reassignment complete will fail', () => {
			mockStaffRoleRepo.markReassignmentCompleted.mockRejectedValue(markerError);
		});
		When('I try to call reassignStaffUsersToDefaultRole for role "deleted-role-1" with enterpriseAppRole "Staff.CaseManager"', async () => {
			try {
				await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'Staff.CaseManager', 'actor-1', mockDomainDataSource);
			} catch (error) {
				thrownError = error as Error;
			}
		});
		Then('the completion marker failure should be rethrown', () => {
			expect(thrownError).toBe(markerError);
		});
	});
});
