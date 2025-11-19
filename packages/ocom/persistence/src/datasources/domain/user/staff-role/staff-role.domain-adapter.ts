import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { StaffRole, StaffRoleProps } from '@ocom/domain/contexts/staff-role';
import { StaffRole as StaffRoleClass } from '@ocom/domain/contexts/staff-role';
import type { Passport } from '@ocom/domain/contexts/passport';

export class StaffRoleConverter extends MongooseSeedwork.MongoTypeConverter<
	Models.Role.StaffRole,
	StaffRoleDomainAdapter,
	Passport,
	StaffRole<StaffRoleDomainAdapter>
> {
	constructor() {
		super(StaffRoleDomainAdapter, StaffRoleClass);
	}
}

export class StaffRoleDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<Models.Role.StaffRole>
	implements StaffRoleProps
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

	get permissions(): StaffRole.StaffRolePermissionsProps {
		if (!this.doc.permissions) {
			this.doc.set('permissions', {});
		}
		return new StaffRolePermissionsAdapter(
			this.doc.permissions as Models.Role.StaffRolePermissions,
		);
	}

	get roleType(): string | null {
		return this.doc.roleType ?? null;
	}
}

export class StaffRolePermissionsAdapter
	implements StaffRole.StaffRolePermissionsProps
{
	private readonly doc: Models.Role.StaffRolePermissions;

	constructor(permissions: Models.Role.StaffRolePermissions) {
		this.doc = permissions;
	}

	get communityPermissions(): StaffRole.StaffRoleCommunityPermissionsProps {
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

	get propertyPermissions(): StaffRole.StaffRolePropertyPermissionsProps {
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

	get servicePermissions(): StaffRole.StaffRoleServicePermissionsProps {
		if (!this.doc.servicePermissions) {
			this.doc.servicePermissions = {
                canManageServices: false
            };
		}
		return new StaffRoleServicePermissionsAdapter(
			this.doc.servicePermissions,
		);
	}

	get serviceTicketPermissions(): StaffRole.StaffRoleServiceTicketPermissionsProps {
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

	get violationTicketPermissions(): StaffRole.StaffRoleViolationTicketPermissionsProps {
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
	implements StaffRole.StaffRoleCommunityPermissionsProps
{
	public readonly doc: Models.Role.StaffRoleCommunityPermissions;

	constructor(permissions: Models.Role.StaffRoleCommunityPermissions) {
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
	implements StaffRole.StaffRolePropertyPermissionsProps
{
	public readonly doc: Models.Role.StaffRolePropertyPermissions;

	constructor(permissions: Models.Role.StaffRolePropertyPermissions) {
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
	implements StaffRole.StaffRoleServicePermissionsProps
{
	private readonly doc: Models.Role.StaffRoleServicePermissions;

	constructor(permissions: Models.Role.StaffRoleServicePermissions) {
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
	implements StaffRole.StaffRoleServiceTicketPermissionsProps
{
	private readonly doc: Models.Role.StaffRoleServiceTicketPermissions;

	constructor(permissions: Models.Role.StaffRoleServiceTicketPermissions) {
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
	implements StaffRole.StaffRoleViolationTicketPermissionsProps
{
	private readonly doc: Models.Role.StaffRoleViolationTicketPermissions;

	constructor(permissions: Models.Role.StaffRoleViolationTicketPermissions) {
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

