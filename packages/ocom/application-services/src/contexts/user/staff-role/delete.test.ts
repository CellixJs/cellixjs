import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { Domain } from '@ocom/domain';
import type { DataSources } from '@ocom/persistence';
import { expect, vi } from 'vitest';
import { deleteStaffRole } from './delete.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/delete.feature'));

function makeMockStaffRole() {
	return {
		id: '507f1f77bcf86cd799439011',
		roleName: 'Test Role',
		isDefault: false,
		requestDelete: vi.fn(),
	} as unknown as Domain.Contexts.User.StaffRole.StaffRole<Domain.Contexts.User.StaffRole.StaffRoleProps>;
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let dataSources: DataSources;
	let deleteRole: (command: { roleId: string; actorStaffUserId: string; actorStaffRoleId?: string }) => Promise<void>;
	let mockRepo: {
		getById: ReturnType<typeof vi.fn>;
		save: ReturnType<typeof vi.fn>;
	};
	let mockUnitOfWork: {
		withScopedTransaction: ReturnType<typeof vi.fn>;
	};
	let mockRole: ReturnType<typeof makeMockStaffRole>;
	let thrownError: Error | null;

	BeforeEachScenario(() => {
		thrownError = null;
		mockRole = makeMockStaffRole();
		mockRepo = {
			getById: vi.fn(),
			save: vi.fn(async (role: unknown) => role),
		};
		mockUnitOfWork = {
			withScopedTransaction: vi.fn(async (fn: (repo: typeof mockRepo) => Promise<void>) => {
				await fn(mockRepo);
			}),
		};
		dataSources = {
			domainDataSource: {
				User: {
					StaffRole: {
						StaffRoleUnitOfWork: mockUnitOfWork,
					},
				},
			},
		} as unknown as DataSources;

		deleteRole = deleteStaffRole(dataSources);
	});

	Scenario('Deleting a staff role successfully', ({ Given, When, Then }) => {
		Given('a staff role with id "507f1f77bcf86cd799439011" exists', () => {
			mockRepo.getById.mockResolvedValue(mockRole);
		});

		When('I delete role "507f1f77bcf86cd799439011"', async () => {
			await deleteRole({ roleId: '507f1f77bcf86cd799439011', actorStaffUserId: 'actor-1', actorStaffRoleId: 'actor-role-1' });
		});

		Then('the role should be marked for deletion and saved', () => {
			expect(mockRepo.getById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
			expect(mockRole.requestDelete).toHaveBeenCalledWith('actor-1', 'actor-role-1');
			expect(mockRepo.save).toHaveBeenCalledWith(mockRole);
		});
	});

	Scenario('Retaining a durable tombstone when reassignment processing fails', ({ Given, And, When, Then }) => {
		let postCommitError: MongooseSeedwork.PostCommitEventError;
		Given('a staff role with id "507f1f77bcf86cd799439011" exists', () => {
			mockRepo.getById.mockResolvedValue(mockRole);
		});
		And('its deletion commits but the StaffRoleDeletedEvent handler fails', () => {
			const event = new Domain.Events.StaffRoleDeletedEvent('507f1f77bcf86cd799439011');
			event.payload = {
				deletedRoleId: '507f1f77bcf86cd799439011',
				enterpriseAppRole: 'Staff.CaseManager',
				actorStaffUserId: 'actor-1',
			};
			postCommitError = new MongooseSeedwork.PostCommitEventError(event, new Error('reassignment failed'));
			mockUnitOfWork.withScopedTransaction.mockImplementationOnce(async (fn: (repo: typeof mockRepo) => Promise<void>) => {
				await fn(mockRepo);
				throw postCommitError;
			});
		});
		When('I try to delete role "507f1f77bcf86cd799439011"', async () => {
			try {
				await deleteRole({ roleId: '507f1f77bcf86cd799439011', actorStaffUserId: 'actor-1' });
			} catch (error) {
				thrownError = error as Error;
			}
		});
		Then('the deletion tombstone should remain saved for recovery', () => {
			expect(mockRepo.save).toHaveBeenCalledWith(mockRole);
		});
		And('the post-commit processing failure should be rethrown', () => {
			expect(thrownError).toBe(postCommitError);
		});
	});

	Scenario('Deleting a staff role that does not exist', ({ Given, When, Then }) => {
		Given('no staff role with id "507f1f77bcf86cd799439011" exists', () => {
			mockRepo.getById.mockRejectedValue(new Error('StaffRole with id 507f1f77bcf86cd799439011 not found'));
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
			expect(mockRepo.save).not.toHaveBeenCalled();
		});
	});

	Scenario('Deleting a staff role the domain refuses to delete', ({ Given, When, Then }) => {
		Given('a staff role with id "507f1f77bcf86cd799439011" exists whose deletion is not permitted', () => {
			mockRole = makeMockStaffRole();
			(mockRole.requestDelete as ReturnType<typeof vi.fn>).mockImplementation(() => {
				throw new Error('You do not have permission to delete this role');
			});
			mockRepo.getById.mockResolvedValue(mockRole);
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
			expect(mockRepo.save).not.toHaveBeenCalled();
		});
	});
});
