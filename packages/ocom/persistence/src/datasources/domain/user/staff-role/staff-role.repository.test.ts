import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { EventBus } from '@cellix/domain-seedwork/event-bus';
import type { StaffRole, StaffRoleModelType } from '@ocom/data-sources-mongoose-models/role/staff-role';
import { Domain } from '@ocom/domain';
import type { ClientSession } from 'mongoose';
import { expect, vi } from 'vitest';
import { StaffRoleConverter, type StaffRoleDomainAdapter } from './staff-role.domain-adapter.ts';
import { StaffRoleRepository } from './staff-role.repository.ts';

const test = { for: describeFeature };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const feature = await loadFeature(path.resolve(__dirname, 'features/staff-role.repository.feature'));

function makeStaffRoleDoc(overrides: Partial<StaffRole> = {}) {
	const createdAt = new Date('2024-01-01T00:00:00.000Z');
	const updatedAt = new Date('2024-02-01T00:00:00.000Z');
	const base = {
		_id: 'role-1',
		roleName: 'Manager',
		enterpriseAppRole: 'Staff.CaseManager',
		isDefault: false,
		roleType: 'staff',
		schemaVersion: '1.0.0',
		createdAt,
		updatedAt,
		permissions: {
			communityPermissions: {
				canManageStaffRolesAndPermissions: false,
				canManageAllCommunities: false,
				canDeleteCommunities: false,
				canChangeCommunityOwner: false,
				canReIndexSearchCollections: false,
			},
			propertyPermissions: {
				canManageProperties: false,
				canEditOwnProperty: false,
			},
			servicePermissions: {
				canManageServices: false,
			},
			serviceTicketPermissions: {
				canCreateTickets: false,
				canManageTickets: false,
				canAssignTickets: false,
				canWorkOnTickets: false,
			},
			violationTicketPermissions: {
				canCreateTickets: false,
				canManageTickets: false,
				canAssignTickets: false,
				canWorkOnTickets: false,
			},
		},
		set(key: keyof StaffRole, value: unknown) {
			(this as StaffRole)[key] = value as never;
		},
		toObject() {
			return {
				_id: this._id,
				roleName: this.roleName,
				enterpriseAppRole: this.enterpriseAppRole,
				isDefault: this.isDefault,
				roleType: this.roleType,
				schemaVersion: this.schemaVersion,
				createdAt: this.createdAt,
				updatedAt: this.updatedAt,
				permissions: this.permissions,
				deletion: this.deletion,
			};
		},
		...overrides,
	} as StaffRole;
	return vi.mocked(base);
}

function makeMockPassport() {
	return {
		user: {
			forStaffRole: vi.fn(() => ({
				determineIf: vi.fn(() => true),
			})),
		},
	} as unknown as Domain.Passport;
}

test.for(feature, ({ Scenario, Background, BeforeEachScenario }) => {
	let repo: StaffRoleRepository;
	let converter: StaffRoleConverter;
	let passport: Domain.Passport;
	let staffRoleDoc: StaffRole;
	let eventBus: EventBus;
	let session: ClientSession;
	let capturedFindByIdSession: ClientSession | undefined;
	let capturedFindSession: ClientSession | undefined;
	let findOneAndUpdateMock: ReturnType<typeof vi.fn>;

	BeforeEachScenario(() => {
		staffRoleDoc = makeStaffRoleDoc();
		converter = new StaffRoleConverter();
		passport = makeMockPassport();

		// Mock the Mongoose model as a constructor function with static methods
		const ModelMock = function (this: StaffRole) {
			Object.assign(this, makeStaffRoleDoc());
		};
		capturedFindByIdSession = undefined;
		capturedFindSession = undefined;
		findOneAndUpdateMock = vi.fn(() => ({
			exec: vi.fn(async () => staffRoleDoc),
		}));
		Object.assign(ModelMock, {
			findById: vi.fn((id: string) => ({
				session: vi.fn((receivedSession: ClientSession) => {
					capturedFindByIdSession = receivedSession;
					return {
						exec: vi.fn(() => (id === staffRoleDoc._id ? staffRoleDoc : null)),
					};
				}),
			})),
			findOne: vi.fn((query: { roleName?: string; enterpriseAppRole?: string; isDefault?: boolean; 'deletion.deletedAt'?: { $exists: boolean } }) => ({
				session: vi.fn((_receivedSession: ClientSession) => ({
					exec: vi.fn(() => {
						if (query.roleName !== undefined) {
							return query.roleName === staffRoleDoc.roleName ? staffRoleDoc : null;
						}
						if (query.enterpriseAppRole !== undefined) {
							return query.enterpriseAppRole === staffRoleDoc.enterpriseAppRole && query.isDefault === staffRoleDoc.isDefault ? staffRoleDoc : null;
						}
						if (query.enterpriseAppRole && query.isDefault === true) {
							return query.enterpriseAppRole === staffRoleDoc.enterpriseAppRole && staffRoleDoc.isDefault ? staffRoleDoc : null;
						}
						return null;
					}),
				})),
			})),
			find: vi.fn((query: { 'deletion.deletedAt'?: { $exists: boolean } }) => ({
				session: vi.fn((receivedSession: ClientSession) => {
					capturedFindSession = receivedSession;
					return {
						exec: vi.fn(() => (query['deletion.deletedAt']?.$exists === Boolean(staffRoleDoc.deletion) ? [staffRoleDoc] : [])),
					};
				}),
			})),
			findOneAndUpdate: findOneAndUpdateMock,
			prototype: {},
		});

		eventBus = { publish: vi.fn() } as unknown as EventBus;
		session = { startTransaction: vi.fn(), endSession: vi.fn() } as unknown as ClientSession;

		repo = new StaffRoleRepository(passport, ModelMock as unknown as StaffRoleModelType, converter, eventBus, session);
	});

	Background(({ Given, And }) => {
		Given('a StaffRoleRepository instance with a working Mongoose model, type converter, and passport', () => {
			// Already set up in BeforeEachScenario
		});
		And('a valid Mongoose StaffRole document with id "role-1", roleName "Manager", isDefault false, and roleType "staff"', () => {
			staffRoleDoc = makeStaffRoleDoc();
		});
	});

	Scenario('Getting a staff role by id', ({ When, Then, And }) => {
		let result: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
		When('I call getById with "role-1"', async () => {
			result = await repo.getById('role-1');
		});
		Then('I should receive a StaffRole domain object', () => {
			expect(result).toBeInstanceOf(Domain.Contexts.User.StaffRole.StaffRole);
		});
		And('the lookup should use the repository transaction session', () => {
			expect(capturedFindByIdSession).toBe(session);
		});
		And('the domain object\'s roleName should be "Manager"', () => {
			expect(result.roleName).toBe('Manager');
		});
		And("the domain object's isDefault should be false", () => {
			expect(result.isDefault).toBe(false);
		});
		And('the domain object\'s roleType should be "staff"', () => {
			expect(result.roleType).toBe('staff');
		});
	});

	Scenario('Getting a staff role by id that does not exist', ({ When, Then }) => {
		let getById: () => Promise<unknown>;
		When('I call getById with "nonexistent-id"', () => {
			getById = async () => await repo.getById('nonexistent-id');
		});
		Then('an error should be thrown indicating "StaffRole with id nonexistent-id not found"', async () => {
			await expect(getById).rejects.toThrow();
			await expect(getById).rejects.toThrow(/StaffRole with id nonexistent-id not found/);
		});
	});

	Scenario('Getting a staff role by roleName', ({ When, Then, And }) => {
		let result: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
		When('I call getByRoleName with "Manager"', async () => {
			result = await repo.getByRoleName('Manager');
		});
		Then('I should receive a StaffRole domain object', () => {
			expect(result).toBeInstanceOf(Domain.Contexts.User.StaffRole.StaffRole);
		});
		And('the domain object\'s roleName should be "Manager"', () => {
			expect(result.roleName).toBe('Manager');
		});
		And("the domain object's isDefault should be false", () => {
			expect(result.isDefault).toBe(false);
		});
		And('the domain object\'s roleType should be "staff"', () => {
			expect(result.roleType).toBe('staff');
		});
	});

	Scenario('Getting a staff role by roleName that does not exist', ({ When, Then }) => {
		let getByRoleName: () => Promise<unknown>;
		When('I call getByRoleName with "nonexistent-role"', () => {
			getByRoleName = async () => await repo.getByRoleName('nonexistent-role');
		});
		Then('an error should be thrown indicating "StaffRole with roleName nonexistent-role not found"', async () => {
			await expect(getByRoleName).rejects.toThrow();
			await expect(getByRoleName).rejects.toThrow(/StaffRole with roleName nonexistent-role not found/);
		});
	});

	Scenario('Getting a default staff role by enterpriseAppRole', ({ Given, When, Then, And }) => {
		let result: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
		Given('a valid default Mongoose StaffRole document with enterpriseAppRole "Staff.CaseManager"', () => {
			staffRoleDoc = makeStaffRoleDoc({
				isDefault: true,
				enterpriseAppRole: 'Staff.CaseManager',
			});
		});
		When('I call getDefaultRoleByEnterpriseAppRole with "Staff.CaseManager"', async () => {
			result = await repo.getDefaultRoleByEnterpriseAppRole('Staff.CaseManager');
		});
		Then('I should receive a StaffRole domain object', () => {
			expect(result).toBeInstanceOf(Domain.Contexts.User.StaffRole.StaffRole);
		});
		And("the domain object's isDefault should be true", () => {
			expect(result.isDefault).toBe(true);
		});
	});

	Scenario('Getting a default staff role by enterpriseAppRole that does not exist', ({ When, Then }) => {
		let getDefaultRoleByEnterpriseAppRole: () => Promise<unknown>;
		When('I call getDefaultRoleByEnterpriseAppRole with "Staff.UnknownRole"', () => {
			getDefaultRoleByEnterpriseAppRole = async () => await repo.getDefaultRoleByEnterpriseAppRole('Staff.UnknownRole');
		});
		Then('an error should be thrown indicating "Default StaffRole with enterpriseAppRole Staff.UnknownRole not found"', async () => {
			await expect(getDefaultRoleByEnterpriseAppRole).rejects.toThrow();
			await expect(getDefaultRoleByEnterpriseAppRole).rejects.toThrow(/Default StaffRole with enterpriseAppRole Staff.UnknownRole not found/);
		});
	});

	Scenario('Creating a new staff role instance', ({ When, Then, And }) => {
		let result: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
		When('I call getNewInstance with name "Supervisor"', async () => {
			result = await repo.getNewInstance('Supervisor');
		});
		Then('I should receive a new StaffRole domain object', () => {
			expect(result).toBeInstanceOf(Domain.Contexts.User.StaffRole.StaffRole);
		});
		And('the domain object\'s roleName should be "Supervisor"', () => {
			expect(result.roleName).toBe('Supervisor');
		});
		And("the domain object's isDefault should be false", () => {
			expect(result.isDefault).toBe(false);
		});
		And('the domain object\'s roleType should be "staff"', () => {
			expect(result.roleType).toBe('staff');
		});
	});

	Scenario('Getting logically deleted staff roles for recovery', ({ Given, When, Then, And }) => {
		let result: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>[];
		Given('a StaffRole document has a durable deletion tombstone', () => {
			staffRoleDoc = makeStaffRoleDoc({
				deletion: {
					actorStaffUserId: 'actor-1',
					enterpriseAppRole: 'Staff.CaseManager',
					deletedAt: new Date('2026-07-23T12:00:00.000Z'),
				},
			});
		});
		When('I get deleted staff roles', async () => {
			result = await repo.getDeletedRoles();
		});
		Then('the deleted staff role should be returned', () => {
			expect(result).toHaveLength(1);
			expect(result[0]?.id).toBe('role-1');
			expect(result[0]?.deletion?.actorStaffUserId).toBe('actor-1');
		});
		And('the recovery lookup should use the repository transaction session', () => {
			expect(capturedFindSession).toBe(session);
		});
	});

	Scenario('Marking deleted role reassignment complete', ({ Given, When, Then, And }) => {
		const completedAt = new Date('2026-07-23T12:05:00.000Z');
		Given('a StaffRole document has a durable deletion tombstone', () => {
			staffRoleDoc = makeStaffRoleDoc({
				deletion: {
					actorStaffUserId: 'actor-1',
					enterpriseAppRole: 'Staff.CaseManager',
					deletedAt: new Date('2026-07-23T12:00:00.000Z'),
				},
			});
		});
		When('I mark role "role-1" reassignment complete', async () => {
			await repo.markReassignmentCompleted('role-1', completedAt);
		});
		Then('the tombstone completion timestamp should be updated atomically', () => {
			expect(findOneAndUpdateMock).toHaveBeenCalledWith(
				{
					_id: 'role-1',
					'deletion.deletedAt': { $exists: true },
				},
				{
					$set: {
						'deletion.reassignmentCompletedAt': completedAt,
					},
				},
				expect.objectContaining({
					runValidators: true,
				}),
			);
		});
		And('the completion update should use the repository transaction session', () => {
			expect(findOneAndUpdateMock.mock.calls[0]?.[2]).toEqual(expect.objectContaining({ session }));
		});
	});
});
