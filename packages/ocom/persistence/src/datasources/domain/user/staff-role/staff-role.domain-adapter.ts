import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

import { Domain } from '@ocom/domain';
import type { StaffRole, StaffRoleCommunityPermissions, StaffRolePermissions, StaffRolePropertyPermissions, StaffRoleServicePermissions, StaffRoleServiceTicketPermissions, StaffRoleViolationTicketPermissions } from '@ocom/data-sources-mongoose-models/role/staff-role';

export class StaffRoleConverter extends MongooseSeedwork.MongoTypeConverter<
	StaffRole,
	StaffRoleDomainAdapter,
	Domain.Passport,
	Domain.Contexts.User.StaffRole.StaffRole<StaffRoleDomainAdapter>
> {
	constructor() {
		super(StaffRoleDomainAdapter, Domain.Contexts.User.StaffRole.StaffRole);
	}
}

export class StaffRoleDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<StaffRole>
	implements Domain.Contexts.User.StaffRole.StaffRoleProps
{
	get roleName(): string {
		return this.doc.roleName;
	}

	set roleName(roleName: string) {
		this.doc.roleName = roleName;
	}

	get isDefault(): boolean {
		return this.doc.isDefault;
	}

	set isDefault(isDefault: boolean) {
		this.doc.isDefault = isDefault;
	}

	get permissions(): Domain.Contexts.User.StaffRole.StaffRolePermissionsProps {
		if (!this.doc.permissions) {
			this.doc.set('permissions', {});
		}
		return new StaffRolePermissionsAdapter(
			this.doc.permissions as StaffRolePermissions,
		);
	}

	get roleType(): string | null {
		return this.doc.roleType ?? null;
	}
}

export class StaffRolePermissionsAdapter
	implements Domain.Contexts.User.StaffRole.StaffRolePermissionsProps
{
	private readonly doc: StaffRolePermissions;

	constructor(permissions: StaffRolePermissions) {
		this.doc = permissions;
	}

	get communityPermissions(): Domain.Contexts.User.StaffRole.StaffRoleCommunityPermissionsProps {
		if (!this.doc.communityPermissions) {
			this.doc.communityPermissions = {
				canManageStaffRolesAndPermissions: false,
				canManageAllCommunities: false,
				canDeleteCommunities: false,
				canChangeCommunityOwner: false,
				canReIndexSearchCollections: false,
			};
		}
		return new StaffRoleCommunityPermissionsAdapter(
			this.doc.communityPermissions,
		);
	}

	get propertyPermissions(): Domain.Contexts.User.StaffRole.StaffRolePropertyPermissionsProps {
		if (!this.doc.propertyPermissions) {
			this.doc.propertyPermissions = {
                canEditOwnProperty: false,
                canManageProperties: false
            };
		}
		return new StaffRolePropertyPermissionsAdapter(
			this.doc.propertyPermissions,
		);
	}

	get servicePermissions(): Domain.Contexts.User.StaffRole.StaffRoleServicePermissionsProps {
		if (!this.doc.servicePermissions) {
			this.doc.servicePermissions = {
                canManageServices: false
            };
		}
		return new StaffRoleServicePermissionsAdapter(
			this.doc.servicePermissions,
		);
	}

	get serviceTicketPermissions(): Domain.Contexts.User.StaffRole.StaffRoleServiceTicketPermissionsProps {
		if (!this.doc.serviceTicketPermissions) {
			this.doc.serviceTicketPermissions = {
                canCreateTickets: false,
                canManageTickets: false,
                canAssignTickets: false,
                canWorkOnTickets: false,
            };
		}
		return new StaffRoleServiceTicketPermissionsAdapter(
			this.doc.serviceTicketPermissions,
		);
	}

	get violationTicketPermissions(): Domain.Contexts.User.StaffRole.StaffRoleViolationTicketPermissionsProps {
		if (!this.doc.violationTicketPermissions) {
			this.doc.violationTicketPermissions = {
                canCreateTickets: false,
                canManageTickets: false,
                canAssignTickets: false,
                canWorkOnTickets: false,
            };
		}
		return new StaffRoleViolationTicketPermissionsAdapter(
			this.doc.violationTicketPermissions,
		);
	}
}

export class StaffRoleCommunityPermissionsAdapter
	implements Domain.Contexts.User.StaffRole.StaffRoleCommunityPermissionsProps
{
	public readonly doc: StaffRoleCommunityPermissions;

	constructor(permissions: StaffRoleCommunityPermissions) {
		this.doc = permissions;
	}

	private ensureValue(value: boolean | undefined): boolean {
		return value ?? false;
	}

	get id(): string | undefined {
		return this.doc.id?.toString();
	}

	get canManageStaffRolesAndPermissions(): boolean {
		return this.ensureValue(
			this.doc.canManageStaffRolesAndPermissions,
		);
	}
	set canManageStaffRolesAndPermissions(value: boolean) {
		this.doc.canManageStaffRolesAndPermissions = value;
	}

	get canManageAllCommunities(): boolean {
		return this.ensureValue(this.doc.canManageAllCommunities);
	}
	set canManageAllCommunities(value: boolean) {
		this.doc.canManageAllCommunities = value;
	}

	get canDeleteCommunities(): boolean {
		return this.ensureValue(this.doc.canDeleteCommunities);
	}
	set canDeleteCommunities(value: boolean) {
		this.doc.canDeleteCommunities = value;
	}

	get canChangeCommunityOwner(): boolean {
		return this.ensureValue(this.doc.canChangeCommunityOwner);
	}
	set canChangeCommunityOwner(value: boolean) {
		this.doc.canChangeCommunityOwner = value;
	}

	get canReIndexSearchCollections(): boolean {
		return this.ensureValue(this.doc.canReIndexSearchCollections);
	}
	set canReIndexSearchCollections(value: boolean) {
		this.doc.canReIndexSearchCollections = value;
	}
}

export class StaffRolePropertyPermissionsAdapter
	implements Domain.Contexts.User.StaffRole.StaffRolePropertyPermissionsProps
{
	public readonly doc: StaffRolePropertyPermissions;

	constructor(permissions: StaffRolePropertyPermissions) {
		this.doc = permissions;
	}

	get id(): string | undefined {
		return this.doc.id?.toString();
	}

    get canManageProperties(): boolean {
        return this.doc.canManageProperties;
    }
    set canManageProperties(value: boolean) {
        this.doc.canManageProperties = value;
    }

    get canEditOwnProperty(): boolean {
        return this.doc.canEditOwnProperty;
    }
    set canEditOwnProperty(value: boolean) {
        this.doc.canEditOwnProperty = value;
    }
}

export class StaffRoleServicePermissionsAdapter
	implements Domain.Contexts.User.StaffRole.StaffRoleServicePermissionsProps
{
	private readonly doc: StaffRoleServicePermissions;

	constructor(permissions: StaffRoleServicePermissions) {
		this.doc = permissions;
	}

	get id(): string | undefined {
		return this.doc.id?.toString();
	}

    get canManageServices(): boolean {
        return this.doc.canManageServices;
    }
}

export class StaffRoleServiceTicketPermissionsAdapter
	implements Domain.Contexts.User.StaffRole.StaffRoleServiceTicketPermissionsProps
{
	private readonly doc: StaffRoleServiceTicketPermissions;

	constructor(permissions: StaffRoleServiceTicketPermissions) {
		this.doc = permissions;
	}

	get id(): string | undefined {
		return this.doc.id?.toString();
	}

    get canCreateTickets(): boolean {
        return this.doc.canCreateTickets;
    }

    get canManageTickets(): boolean {
        return this.doc.canManageTickets;
    }

    get canAssignTickets(): boolean {
        return this.doc.canAssignTickets;
    }

    get canWorkOnTickets(): boolean {
        return this.doc.canWorkOnTickets;
    }
}

export class StaffRoleViolationTicketPermissionsAdapter
	implements Domain.Contexts.User.StaffRole.StaffRoleViolationTicketPermissionsProps
{
	private readonly doc: StaffRoleViolationTicketPermissions;

	constructor(permissions: StaffRoleViolationTicketPermissions) {
		this.doc = permissions;
	}

	get id(): string | undefined {
		return this.doc.id?.toString();
	}

    get canAssignTickets(): boolean {
        return this.doc.canAssignTickets;
    }
    set canAssignTickets(value: boolean) {
        this.doc.canAssignTickets = value;
    }
    get canCreateTickets(): boolean {
        return this.doc.canCreateTickets;
    }
    set canCreateTickets(value: boolean) {
        this.doc.canCreateTickets = value;
    }

    get canManageTickets(): boolean {
        return this.doc.canManageTickets;
    }
    set canManageTickets(value: boolean) {
        this.doc.canManageTickets = value;
    }

    get canWorkOnTickets(): boolean {
        return this.doc.canWorkOnTickets;
    }
    set canWorkOnTickets(value: boolean) {
        this.doc.canWorkOnTickets = value;
    }

}

