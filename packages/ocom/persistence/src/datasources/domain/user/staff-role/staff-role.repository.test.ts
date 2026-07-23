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
	let updateOne: ReturnType<typeof vi.fn>;

	BeforeEachScenario(() => {
		staffRoleDoc = makeStaffRoleDoc();
		converter = new StaffRoleConverter();
		passport = makeMockPassport();

		// Mock the Mongoose model as a constructor function with static methods
		const ModelMock = function (this: StaffRole) {
			Object.assign(this, makeStaffRoleDoc());
		};
		updateOne = vi.fn(() => ({
			exec: vi.fn().mockResolvedValue({ upsertedCount: 1 }),
		}));
		Object.assign(ModelMock, {
			findById: vi.fn((id: string) => ({
				exec: vi.fn(() => (id === staffRoleDoc._id ? staffRoleDoc : null)),
			})),
			findOne: vi.fn((query: { roleName?: string; enterpriseAppRole?: string; isDefault?: boolean }) => ({
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
			updateOne,
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

	Scenario('Restoring a deleted staff role', ({ Given, When, Then, And }) => {
		let capturedRole: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
		Given('a captured staff role aggregate that was physically deleted', () => {
			capturedRole = converter.toDomain(staffRoleDoc, passport);
		});
		When('I restore the deleted staff role', async () => {
			await repo.restoreDeleted(capturedRole);
		});
		Then('the original role document should be inserted only when absent', () => {
			expect(updateOne).toHaveBeenCalledWith(
				{ _id: staffRoleDoc._id },
				expect.objectContaining({
					$setOnInsert: expect.not.objectContaining({ _id: expect.anything() }),
				}),
				expect.objectContaining({
					upsert: true,
					session,
					timestamps: false,
					setDefaultsOnInsert: false,
				}),
			);
		});
		And('the original id, enterprise app role, permissions, and timestamps should be preserved', () => {
			const update = updateOne.mock.calls[0]?.[1] as { $setOnInsert: Record<string, unknown> };
			expect(update.$setOnInsert).toMatchObject({
				roleName: staffRoleDoc.roleName,
				enterpriseAppRole: staffRoleDoc.enterpriseAppRole,
				permissions: staffRoleDoc.permissions,
				createdAt: staffRoleDoc.createdAt,
				updatedAt: staffRoleDoc.updatedAt,
			});
		});
	});

	Scenario('Restoring an already restored staff role is idempotent', ({ Given, When, Then }) => {
		let capturedRole: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
		Given('a captured staff role aggregate that was physically deleted', () => {
			capturedRole = converter.toDomain(staffRoleDoc, passport);
		});
		When('I restore the deleted staff role twice', async () => {
			await repo.restoreDeleted(capturedRole);
			await repo.restoreDeleted(capturedRole);
		});
		Then('both restore attempts should use insert-if-absent semantics', () => {
			expect(updateOne).toHaveBeenCalledTimes(2);
			for (const call of updateOne.mock.calls) {
				expect(call[1]).toEqual(expect.objectContaining({ $setOnInsert: expect.any(Object) }));
				expect(call[2]).toEqual(expect.objectContaining({ upsert: true }));
			}
		});
	});
});
