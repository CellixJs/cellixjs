import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { DomainDataSource } from '../../../index.ts';
import { type Passport, PassportFactory } from '../../contexts/passport.ts';
import { StaffRole, type StaffRoleProps } from '../../contexts/user/staff-role/index.ts';
import { StaffRoleDeletedEvent } from '../../events/types/staff-role-deleted.ts';
import { StaffRoleDeletionRecoveryService } from './staff-role-deletion-recovery.service.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-role-deletion-recovery.service.feature'));

function makeMockDeletedRole(id: string) {
	return {
		id,
		retryDelete: vi.fn(),
	} as unknown as StaffRole<StaffRoleProps>;
}

function makePersistedDeletedRole(id: string, passport: Passport) {
	return new StaffRole(
		{
			id,
			roleName: `Deleted ${id}`,
			isDefault: false,
			enterpriseAppRole: 'Staff.CaseManager',
			deletion: {
				actorStaffUserId: 'actor-1',
				enterpriseAppRole: 'Staff.CaseManager',
				deletedAt: new Date('2026-07-23T12:00:00.000Z'),
			},
			permissions: {} as StaffRoleProps['permissions'],
			roleType: 'staff-user-role',
			createdAt: new Date('2026-07-23T11:00:00.000Z'),
			updatedAt: new Date('2026-07-23T12:00:00.000Z'),
			schemaVersion: '1.0.0',
		},
		passport,
	);
}

test.for(feature, ({ Scenario, BeforeEachScenario }) => {
	let service: StaffRoleDeletionRecoveryService;
	let deletedRoles: StaffRole<StaffRoleProps>[];
	let persistedDeletedRoleIds: string[];
	let savedRoles: StaffRole<StaffRoleProps>[];
	let capturedPassport: Passport | undefined;
	let domainDataSource: DomainDataSource;
	let result: number | undefined;
	let thrownError: unknown;
	let transactionError: Error | undefined;
	let forSystemSpy: ReturnType<typeof vi.spyOn>;

	BeforeEachScenario(() => {
		vi.restoreAllMocks();
		service = new StaffRoleDeletionRecoveryService();
		deletedRoles = [];
		persistedDeletedRoleIds = [];
		savedRoles = [];
		capturedPassport = undefined;
		result = undefined;
		thrownError = undefined;
		transactionError = undefined;
		forSystemSpy = vi.spyOn(PassportFactory, 'forSystem');

		const repository = {
			getDeletedRoles: vi.fn(() => Promise.resolve(deletedRoles)),
			save: vi.fn((role: StaffRole<StaffRoleProps>) => {
				savedRoles.push(role);
				return Promise.resolve(role);
			}),
		};
		domainDataSource = {
			User: {
				StaffRole: {
					StaffRoleUnitOfWork: {
						withTransaction: vi.fn(async (passport: Passport, callback: (repo: typeof repository) => Promise<void>) => {
							capturedPassport = passport;
							if (persistedDeletedRoleIds.length > 0) {
								deletedRoles = persistedDeletedRoleIds.map((id) => makePersistedDeletedRole(id, passport));
							}
							await callback(repository);
							if (transactionError) {
								throw transactionError;
							}
						}),
						withScopedTransaction: vi.fn(),
					},
				},
			},
		} as unknown as DomainDataSource;
	});

	Scenario('Retrying persisted deleted staff roles', ({ Given, When, Then, And }) => {
		Given('two staff role tombstones are persisted', () => {
			persistedDeletedRoleIds = ['role-1', 'role-2'];
		});
		When('I retry deleted staff role events', async () => {
			result = await service.retryDeletedStaffRoles(domainDataSource);
		});
		Then('each tombstone should re-raise its deletion event under a system passport', () => {
			expect(capturedPassport).toBeDefined();
			expect(forSystemSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					isSystemAccount: true,
				}),
			);
			for (const role of deletedRoles) {
				const events = role.getIntegrationEvents();
				expect(events).toHaveLength(1);
				expect(events[0]).toBeInstanceOf(StaffRoleDeletedEvent);
			}
			expect(savedRoles).toEqual(deletedRoles);
		});
		And('the number of retried roles should be returned', () => {
			expect(result).toBe(2);
		});
	});

	Scenario('No deleted staff roles require recovery', ({ Given, When, Then, And }) => {
		Given('no staff role tombstones are persisted', () => {
			deletedRoles = [];
		});
		When('I retry deleted staff role events', async () => {
			result = await service.retryDeletedStaffRoles(domainDataSource);
		});
		Then('no staff role should be saved for event dispatch', () => {
			expect(savedRoles).toEqual([]);
		});
		And('zero retried roles should be returned', () => {
			expect(result).toBe(0);
		});
	});

	Scenario('Surfacing a recovery event processing failure', ({ Given, When, Then }) => {
		const recoveryError = new Error('reassignment failed');
		Given('a deleted staff role event fails during recovery', () => {
			deletedRoles = [makeMockDeletedRole('role-1')];
			transactionError = recoveryError;
		});
		When('I try to retry deleted staff role events', async () => {
			try {
				await service.retryDeletedStaffRoles(domainDataSource);
			} catch (error) {
				thrownError = error;
			}
		});
		Then('the recovery processing failure should be rethrown', () => {
			expect(thrownError).toBe(recoveryError);
		});
	});
});
