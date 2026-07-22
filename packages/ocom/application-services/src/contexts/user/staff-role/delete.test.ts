import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { deleteStaffRole } from './delete.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/delete.feature'));

function makeMockStaffRole(deletionStatus: Domain.Contexts.User.StaffRole.StaffRoleDeletionStatus = 'active') {
	return {
		id: '507f1f77bcf86cd799439011',
		roleName: 'Test Role',
		enterpriseAppRole: 'Staff.CaseManager',
		isDefault: false,
		deletionStatus,
		requestDelete: vi.fn(),
		completeDelete: vi.fn(),
	} as unknown as Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let dataSources: DataSources;
	let deleteRole: (command: { roleId: string; actorStaffUserId: string }) => Promise<void>;
	let mockRoleRepo: {
		getByIdForDeletion: ReturnType<typeof vi.fn>;
		getDefaultRoleByEnterpriseAppRole: ReturnType<typeof vi.fn>;
		save: ReturnType<typeof vi.fn>;
	};
	let mockRole: ReturnType<typeof makeMockStaffRole>;
	let mockDefaultRole: Domain.Contexts.User.StaffRole.StaffRoleEntityReference;
	let thrownError: Error | null;
	let reassignmentSpy: ReturnType<typeof vi.spyOn>;

	BeforeEachScenario(() => {
		vi.restoreAllMocks();
		thrownError = null;
		mockRole = makeMockStaffRole();
		mockDefaultRole = {
			id: 'default-role-1',
			roleName: 'Default Case Manager',
			enterpriseAppRole: 'Staff.CaseManager',
			isDefault: true,
		} as unknown as Domain.Contexts.User.StaffRole.StaffRoleEntityReference;
		mockRoleRepo = {
			getByIdForDeletion: vi.fn(),
			getDefaultRoleByEnterpriseAppRole: vi.fn(async () => mockDefaultRole),
			save: vi.fn(async (role: unknown) => role),
		};
		reassignmentSpy = vi.spyOn(Domain.Services.User.StaffRoleDeletedReassignmentService, 'reassignStaffUsersToDefaultRole').mockResolvedValue(undefined);
		dataSources = {
			domainDataSource: {
				User: {
					StaffRole: {
						StaffRoleUnitOfWork: {
							withScopedTransaction: vi.fn(async (fn: (repo: typeof mockRoleRepo) => Promise<void>) => {
								await fn(mockRoleRepo);
							}),
						},
					},
				},
			},
		} as unknown as DataSources;

		deleteRole = deleteStaffRole(dataSources);
	});

	Scenario('Deleting a staff role successfully', ({ Given, When, Then }) => {
		Given('a staff role with id "507f1f77bcf86cd799439011" exists', () => {
			mockRoleRepo.getByIdForDeletion.mockResolvedValue(mockRole);
		});

		When('I delete role "507f1f77bcf86cd799439011"', async () => {
			await deleteRole({ roleId: '507f1f77bcf86cd799439011', actorStaffUserId: 'actor-1' });
		});

		Then('the role should be prepared for deletion, reassigned, and archived', () => {
			expect(mockRoleRepo.getByIdForDeletion).toHaveBeenCalledTimes(2);
			expect(mockRoleRepo.getDefaultRoleByEnterpriseAppRole).toHaveBeenCalledWith('Staff.CaseManager');
			expect(mockRole.requestDelete).toHaveBeenCalledWith(mockDefaultRole);
			expect(reassignmentSpy).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'actor-1', dataSources.domainDataSource);
			expect(mockRole.completeDelete).toHaveBeenCalledWith('actor-1');
			expect(mockRoleRepo.save).toHaveBeenCalledTimes(2);
		});
	});

	Scenario('Deleting a staff role that does not exist', ({ Given, When, Then }) => {
		Given('no staff role with id "507f1f77bcf86cd799439011" exists', () => {
			mockRoleRepo.getByIdForDeletion.mockRejectedValue(new Error('StaffRole with id 507f1f77bcf86cd799439011 not found'));
		});

		When('I try to delete role "507f1f77bcf86cd799439011"', async () => {
			try {
				await deleteRole({ roleId: '507f1f77bcf86cd799439011', actorStaffUserId: 'actor-1' });
			} catch (error) {
				thrownError = error as Error;
			}
		});

		Then('it should throw an error', () => {
			expect(thrownError).not.toBeNull();
			expect(thrownError?.message).toContain('not found');
			expect(reassignmentSpy).not.toHaveBeenCalled();
			expect(mockRoleRepo.save).not.toHaveBeenCalled();
		});
	});

	Scenario('Deleting a staff role the domain refuses to delete', ({ Given, When, Then }) => {
		Given('a staff role with id "507f1f77bcf86cd799439011" exists whose deletion is not permitted', () => {
			mockRole = makeMockStaffRole();
			(mockRole.requestDelete as ReturnType<typeof vi.fn>).mockImplementation(() => {
				throw new Error('You do not have permission to delete this role');
			});
			mockRoleRepo.getByIdForDeletion.mockResolvedValue(mockRole);
		});

		When('I try to delete role "507f1f77bcf86cd799439011"', async () => {
			try {
				await deleteRole({ roleId: '507f1f77bcf86cd799439011', actorStaffUserId: 'actor-1' });
			} catch (error) {
				thrownError = error as Error;
			}
		});

		Then('it should throw a permission error and not save the role', () => {
			expect(thrownError?.message).toContain('do not have permission');
			expect(reassignmentSpy).not.toHaveBeenCalled();
			expect(mockRoleRepo.save).not.toHaveBeenCalled();
		});
	});

	Scenario('No matching default role exists', ({ Given, And, When, Then }) => {
		Given('a staff role with id "507f1f77bcf86cd799439011" exists', () => {
			mockRoleRepo.getByIdForDeletion.mockResolvedValue(mockRole);
		});
		And('no matching default role exists', () => {
			mockRoleRepo.getDefaultRoleByEnterpriseAppRole.mockRejectedValue(new Error('Default StaffRole with enterpriseAppRole Staff.CaseManager not found'));
		});
		When('I try to delete role "507f1f77bcf86cd799439011"', async () => {
			try {
				await deleteRole({ roleId: '507f1f77bcf86cd799439011', actorStaffUserId: 'actor-1' });
			} catch (error) {
				thrownError = error as Error;
			}
		});
		Then('it should throw the missing default role error and leave the role active', () => {
			expect(thrownError?.message).toContain('Default StaffRole');
			expect(mockRole.requestDelete).not.toHaveBeenCalled();
			expect(mockRoleRepo.save).not.toHaveBeenCalled();
			expect(reassignmentSpy).not.toHaveBeenCalled();
		});
	});

	Scenario('Staff user reassignment fails', ({ Given, And, When, Then }) => {
		Given('a staff role with id "507f1f77bcf86cd799439011" exists', () => {
			mockRoleRepo.getByIdForDeletion.mockResolvedValue(mockRole);
		});
		And('staff user reassignment fails', () => {
			reassignmentSpy.mockRejectedValue(new Error('reassignment failed'));
		});
		When('I try to delete role "507f1f77bcf86cd799439011"', async () => {
			try {
				await deleteRole({ roleId: '507f1f77bcf86cd799439011', actorStaffUserId: 'actor-1' });
			} catch (error) {
				thrownError = error as Error;
			}
		});
		Then('it should throw the reassignment error and leave deletion pending for retry', () => {
			expect(thrownError?.message).toBe('reassignment failed');
			expect(mockRole.completeDelete).not.toHaveBeenCalled();
			expect(mockRoleRepo.save).toHaveBeenCalledTimes(1);
		});
	});

	Scenario('Retrying a completed staff role deletion', ({ Given, When, Then }) => {
		Given('staff role "507f1f77bcf86cd799439011" is already archived', () => {
			mockRole = makeMockStaffRole('deleted');
			mockRoleRepo.getByIdForDeletion.mockResolvedValue(mockRole);
		});
		When('I delete role "507f1f77bcf86cd799439011" again', async () => {
			await deleteRole({ roleId: '507f1f77bcf86cd799439011', actorStaffUserId: 'actor-1' });
		});
		Then('the completed deletion should succeed without another reassignment', () => {
			expect(mockRole.requestDelete).toHaveBeenCalledWith(undefined);
			expect(reassignmentSpy).not.toHaveBeenCalled();
			expect(mockRole.completeDelete).not.toHaveBeenCalled();
			expect(mockRoleRepo.save).not.toHaveBeenCalled();
		});
	});

	Scenario('Another request completes deletion first', ({ Given, When, Then }) => {
		let archivedRole: ReturnType<typeof makeMockStaffRole>;
		Given('staff role "507f1f77bcf86cd799439011" is archived after reassignment', () => {
			mockRole = makeMockStaffRole('deleting');
			archivedRole = makeMockStaffRole('deleted');
			mockRoleRepo.getByIdForDeletion.mockResolvedValueOnce(mockRole).mockResolvedValueOnce(archivedRole);
		});
		When('I delete role "507f1f77bcf86cd799439011"', async () => {
			await deleteRole({ roleId: '507f1f77bcf86cd799439011', actorStaffUserId: 'actor-1' });
		});
		Then('finalization should succeed without emitting another deletion', () => {
			expect(reassignmentSpy).toHaveBeenCalledTimes(1);
			expect(archivedRole.completeDelete).not.toHaveBeenCalled();
			expect(mockRoleRepo.save).toHaveBeenCalledTimes(1);
		});
	});
});
