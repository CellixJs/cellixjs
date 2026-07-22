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
	const staffUser: MockStaffUser = {
		id,
		role: roleId ? { id: roleId } : undefined,
		requestRoleAssignment: vi.fn((role) => {
			staffUser.role = { id: role.id };
		}),
	};
	return staffUser;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let service: StaffRoleDeletedReassignmentService;
	let mockDomainDataSource: DomainDataSource;
	let mockDefaultRole: StaffRole.StaffRoleEntityReference;
	let mockStaffRoleRepo: {
		getReplacementRoleForDeletion: MockedFunction<(deletedRoleId: string) => Promise<StaffRole.StaffRoleEntityReference>>;
	};
	let mockStaffUserRepo: {
		getAssignedToRoleBatch: MockedFunction<(roleId: string, limit: number) => Promise<MockStaffUser[]>>;
		save: MockedFunction<(staffUser: MockStaffUser) => Promise<MockStaffUser>>;
	};
	let assignedStaffUsers: MockStaffUser[];
	let capturedPassport: Passport | undefined;
	let thrownError: Error | null = null;
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
	let userTransactionCallCount: number;
	let queriedBatchSizes: number[];

	BeforeEachScenario(() => {
		thrownError = null;
		capturedPassport = undefined;
		assignedStaffUsers = [];
		userTransactionCallCount = 0;
		queriedBatchSizes = [];
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

		mockDefaultRole = {
			id: 'default-role-1',
			roleName: 'Default Case Manager',
			enterpriseAppRole: 'Staff.CaseManager',
			isDefault: true,
		} as unknown as StaffRole.StaffRoleEntityReference;

		mockStaffRoleRepo = {
			getReplacementRoleForDeletion: vi.fn(async () => mockDefaultRole),
		};
		mockStaffUserRepo = {
			getAssignedToRoleBatch: vi.fn((roleId: string, limit: number) => {
				const batch = assignedStaffUsers.filter((staffUser) => staffUser.role?.id === roleId).slice(0, limit);
				queriedBatchSizes.push(batch.length);
				return Promise.resolve(batch);
			}),
			save: vi.fn((staffUser: MockStaffUser) => Promise.resolve(staffUser)),
		};
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
							userTransactionCallCount += 1;
							capturedPassport = passport;
							const originalRoleIds = assignedStaffUsers.map((staffUser) => staffUser.role?.id);
							try {
								await fn(mockStaffUserRepo);
							} catch (error) {
								for (const [index, staffUser] of assignedStaffUsers.entries()) {
									const originalRoleId = originalRoleIds[index];
									staffUser.role = originalRoleId ? { id: originalRoleId } : undefined;
								}
								throw error;
							}
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
		And('valid staff role and staff user repositories', () => {
			// Created in BeforeEachScenario
		});
		And('deleted role "deleted-role-1" records default staff role "default-role-1" as its replacement', () => {
			// Created in BeforeEachScenario
		});
		And('reassignment is performed by staff user "actor-1"', () => {
			// The actor id is passed by each scenario.
		});
	});

	Scenario('Reassigning staff users assigned to the deleted role to the matching default role', ({ Given, When, Then, And }) => {
		Given('two staff users assigned to the deleted role "deleted-role-1"', () => {
			assignedStaffUsers = [makeMockStaffUser('staff-user-1', 'deleted-role-1'), makeMockStaffUser('staff-user-2', 'deleted-role-1')];
		});
		When('I call reassignStaffUsersToDefaultRole for role "deleted-role-1"', async () => {
			await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'actor-1', mockDomainDataSource);
		});
		Then('each assigned staff user should be reassigned to the default role "default-role-1"', () => {
			expect(mockStaffUserRepo.getAssignedToRoleBatch).toHaveBeenCalledWith('deleted-role-1', 10);
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

	Scenario('No staff users are assigned to the deleted role', ({ Given, When, Then }) => {
		Given('no staff users assigned to the deleted role "deleted-role-1"', () => {
			assignedStaffUsers = [];
		});
		When('I call reassignStaffUsersToDefaultRole for role "deleted-role-1"', async () => {
			await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'actor-1', mockDomainDataSource);
		});
		Then('no staff user should be saved', () => {
			expect(mockStaffUserRepo.save).not.toHaveBeenCalled();
			expect(mockStaffUserRepo.getAssignedToRoleBatch).toHaveBeenCalledTimes(1);
		});
	});

	Scenario('Reassigning staff users in bounded batches', ({ Given, When, Then }) => {
		Given('twelve staff users assigned to the deleted role "deleted-role-1"', () => {
			assignedStaffUsers = Array.from({ length: 12 }, (_, index) => makeMockStaffUser(`staff-user-${index + 1}`, 'deleted-role-1'));
		});
		When('I call reassignStaffUsersToDefaultRole for role "deleted-role-1"', async () => {
			await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'actor-1', mockDomainDataSource);
		});
		Then('all twelve staff users should be saved in batches of at most 10', () => {
			expect(mockStaffUserRepo.save).toHaveBeenCalledTimes(12);
			expect(mockStaffUserRepo.getAssignedToRoleBatch).toHaveBeenCalledTimes(3);
			expect(userTransactionCallCount).toBe(3);
			for (const call of mockStaffUserRepo.getAssignedToRoleBatch.mock.calls) {
				expect(call).toEqual(['deleted-role-1', 10]);
			}
		});
	});

	Scenario('Retrying after a later batch fails', ({ Given, And, When, Then }) => {
		Given('twelve staff users assigned to the deleted role "deleted-role-1"', () => {
			assignedStaffUsers = Array.from({ length: 12 }, (_, index) => makeMockStaffUser(`staff-user-${index + 1}`, 'deleted-role-1'));
		});
		And('the second reassignment batch fails', () => {
			mockStaffUserRepo.save.mockImplementation((staffUser: MockStaffUser) => {
				if (userTransactionCallCount === 2) {
					throw new Error('second batch failed');
				}
				return Promise.resolve(staffUser);
			});
		});
		When('I retry reassignStaffUsersToDefaultRole for role "deleted-role-1"', async () => {
			await expect(service.reassignStaffUsersToDefaultRole('deleted-role-1', 'actor-1', mockDomainDataSource)).rejects.toThrow('second batch failed');
			expect(assignedStaffUsers.filter((staffUser) => staffUser.role?.id === 'deleted-role-1')).toHaveLength(2);
			mockStaffUserRepo.save.mockImplementation((staffUser: MockStaffUser) => Promise.resolve(staffUser));
			await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'actor-1', mockDomainDataSource);
		});
		Then('the retry should resume with the two staff users that remain assigned', () => {
			expect(assignedStaffUsers.filter((staffUser) => staffUser.role?.id === 'deleted-role-1')).toHaveLength(0);
			expect(userTransactionCallCount).toBe(4);
			expect(queriedBatchSizes).toEqual([10, 2, 2, 0]);
		});
	});

	Scenario('Failing when the deleted role has no resolvable replacement', ({ Given, When, Then, And }) => {
		Given('no replacement staff role can be resolved for "deleted-role-1"', () => {
			assignedStaffUsers = [makeMockStaffUser('staff-user-1', 'deleted-role-1')];
			mockStaffRoleRepo.getReplacementRoleForDeletion.mockRejectedValue(new Error('Replacement StaffRole for deleted role deleted-role-1 not found'));
		});
		When('I try to call reassignStaffUsersToDefaultRole for role "deleted-role-1"', async () => {
			try {
				await service.reassignStaffUsersToDefaultRole('deleted-role-1', 'actor-1', mockDomainDataSource);
			} catch (error) {
				thrownError = error as Error;
			}
		});
		Then('the missing replacement role failure should be logged and rethrown', () => {
			expect(thrownError).not.toBeNull();
			expect(thrownError?.message).toContain('Replacement StaffRole');
			expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('deleted-role-1'), expect.any(Error));
		});
		And('no staff user should be saved', () => {
			expect(mockStaffUserRepo.save).not.toHaveBeenCalled();
		});
	});
});
