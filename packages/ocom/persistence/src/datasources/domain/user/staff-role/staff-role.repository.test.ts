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
	const base = {
		_id: 'role-1',
		roleName: 'Manager',
		enterpriseAppRole: 'Staff.CaseManager',
		isDefault: false,
		deletionStatus: 'active',
		roleType: 'staff',
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
	let replacementRoleDoc: StaffRole;
	let eventBus: EventBus;
	let session: ClientSession;
	let findByIdMock: ReturnType<typeof vi.fn>;
	let findOneMock: ReturnType<typeof vi.fn>;

	BeforeEachScenario(() => {
		staffRoleDoc = makeStaffRoleDoc();
		replacementRoleDoc = makeStaffRoleDoc({
			_id: 'default-role-1',
			id: 'default-role-1',
			roleName: 'Default Case Manager',
			isDefault: true,
		} as unknown as Partial<StaffRole>);
		converter = new StaffRoleConverter();
		passport = makeMockPassport();

		// Mock the Mongoose model as a constructor function with static methods
		const ModelMock = function (this: StaffRole) {
			Object.assign(this, makeStaffRoleDoc());
		};
		findByIdMock = vi.fn((id: string) => {
			const query = {
				session: vi.fn(),
				select: vi.fn(),
				exec: vi.fn(() => (id === staffRoleDoc._id ? staffRoleDoc : null)),
			};
			query.session.mockReturnValue(query);
			query.select.mockReturnValue(query);
			return query;
		});
		findOneMock = vi.fn((queryFilter: { _id?: unknown; roleName?: string; enterpriseAppRole?: string; isDefault?: boolean; deletionStatus?: { $in?: string[]; $ne?: string; $nin?: string[] } }) => {
			const query = {
				session: vi.fn(),
				exec: vi.fn(() => {
					const filterId = queryFilter._id === undefined || queryFilter._id === null ? undefined : String(queryFilter._id);
					const candidate = filterId === String(replacementRoleDoc._id) ? replacementRoleDoc : staffRoleDoc;
					const deletionStatus = candidate.deletionStatus ?? 'active';
					if (queryFilter.deletionStatus?.$in && !queryFilter.deletionStatus.$in.includes(deletionStatus)) {
						return null;
					}
					if (queryFilter.deletionStatus?.$ne === deletionStatus || queryFilter.deletionStatus?.$nin?.includes(deletionStatus)) {
						return null;
					}
					if (queryFilter._id !== undefined) {
						if (filterId !== String(candidate._id)) {
							return null;
						}
						if (queryFilter.isDefault !== undefined && queryFilter.isDefault !== candidate.isDefault) {
							return null;
						}
						return candidate;
					}
					if (queryFilter.roleName !== undefined) {
						return queryFilter.roleName === staffRoleDoc.roleName ? staffRoleDoc : null;
					}
					if (queryFilter.enterpriseAppRole !== undefined) {
						return queryFilter.enterpriseAppRole === staffRoleDoc.enterpriseAppRole && queryFilter.isDefault === staffRoleDoc.isDefault ? staffRoleDoc : null;
					}
					return null;
				}),
			};
			query.session.mockReturnValue(query);
			return query;
		});
		Object.assign(ModelMock, {
			findById: findByIdMock,
			findOne: findOneMock,
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

	Scenario('Getting an archived staff role for deletion retry', ({ Given, When, Then }) => {
		let result: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
		Given('the staff role is archived', () => {
			staffRoleDoc.deletionStatus = 'deleted';
		});
		When('I call getByIdForDeletion with "role-1"', async () => {
			result = await repo.getByIdForDeletion('role-1');
		});
		Then('I should receive the archived StaffRole domain object', () => {
			expect(result.deletionStatus).toBe('deleted');
			expect(findByIdMock).toHaveBeenCalledWith('role-1');
		});
	});

	Scenario('Getting an active staff role for assignment', ({ When, Then, And }) => {
		let result: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
		When('I call getByIdForAssignment with "role-1"', async () => {
			result = await repo.getByIdForAssignment('role-1');
		});
		Then('I should receive a StaffRole domain object', () => {
			expect(result).toBeInstanceOf(Domain.Contexts.User.StaffRole.StaffRole);
		});
		And('only an active staff role should be queried in the current session', () => {
			expect(findOneMock).toHaveBeenCalledWith({
				_id: 'role-1',
				deletionStatus: { $nin: ['deleting', 'deleted'] },
			});
		});
	});

	Scenario('Rejecting a staff role pending deletion for assignment', ({ Given, When, Then }) => {
		let getByIdForAssignment: () => Promise<unknown>;
		Given('the staff role is pending deletion', () => {
			staffRoleDoc.deletionStatus = 'deleting';
		});
		When('I call getByIdForAssignment with "role-1"', () => {
			getByIdForAssignment = async () => await repo.getByIdForAssignment('role-1');
		});
		Then('an error should be thrown indicating "StaffRole with id role-1 not found"', async () => {
			await expect(getByIdForAssignment).rejects.toThrow('StaffRole with id role-1 not found');
		});
	});

	Scenario('Getting a staff role deletion status', ({ Given, When, Then }) => {
		let deletionStatus: Domain.Contexts.User.StaffRole.StaffRoleDeletionStatus;
		Given('the staff role is archived', () => {
			staffRoleDoc.deletionStatus = 'deleted';
		});
		When('I call getDeletionStatus with "role-1"', async () => {
			deletionStatus = await repo.getDeletionStatus('role-1');
		});
		Then('the deletion status should be "deleted"', () => {
			expect(deletionStatus).toBe('deleted');
			expect(findByIdMock).toHaveBeenCalledWith('role-1');
		});
	});

	Scenario('Resolving the replacement role recorded for deletion', ({ Given, When, Then, And }) => {
		let result: Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>;
		Given('the staff role is pending deletion with replacement role "default-role-1"', () => {
			staffRoleDoc.deletionStatus = 'deleting';
			staffRoleDoc.replacementRole = 'default-role-1' as unknown as StaffRole['replacementRole'];
		});
		When('I call getReplacementRoleForDeletion with "role-1"', async () => {
			result = await repo.getReplacementRoleForDeletion('role-1');
		});
		Then('I should receive the default replacement StaffRole domain object', () => {
			expect(result.id).toBe('default-role-1');
			expect(result.isDefault).toBe(true);
		});
		And('the recorded replacement role id should be queried', () => {
			expect(findOneMock).toHaveBeenNthCalledWith(1, {
				_id: 'role-1',
				deletionStatus: { $in: ['deleting', 'deleted'] },
			});
			expect(findOneMock).toHaveBeenNthCalledWith(2, {
				_id: 'default-role-1',
				isDefault: true,
				deletionStatus: { $nin: ['deleting', 'deleted'] },
			});
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
});
