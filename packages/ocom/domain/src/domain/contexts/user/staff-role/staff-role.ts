import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { RoleDeletedReassignEvent, type RoleDeletedReassignProps } from '../../../events/types/role-deleted-reassign.ts';
import type { Passport } from '../../passport.ts';
import type { UserVisa } from '../user.visa.ts';
import * as ValueObjects from './staff-role.value-objects.ts';
import { StaffRolePermissions, type StaffRolePermissionsEntityReference, type StaffRolePermissionsProps } from './staff-role-permissions.ts';

export interface StaffRoleProps extends DomainEntityProps {
	roleName: string;
	isDefault: boolean;
	enterpriseAppRole: string;
	readonly permissions: StaffRolePermissionsProps;
	readonly roleType: string | null;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface StaffRoleEntityReference extends Readonly<Omit<StaffRoleProps, 'permissions'>> {
	readonly permissions: StaffRolePermissionsEntityReference;
}


export class StaffRole<props extends StaffRoleProps> extends AggregateRoot<props, Passport> implements StaffRoleEntityReference {
	private isNew: boolean = false;
	private readonly visa: UserVisa;
	constructor(props: props, passport: Passport) {
		super(props, passport);
		this.visa = passport.user.forStaffRole(this);
	}

	public static getNewInstance<props extends StaffRoleProps>(newProps: props, passport: Passport, roleName: string, isDefault: boolean): StaffRole<props> {
		const role = new StaffRole(newProps, passport);
		role.isNew = true;
		role.roleName = roleName;
		role.isDefault = isDefault;
		role.isNew = false;
		return role;
	}

	/**
	 * Returns the canonical list of default staff role names known to the domain
	 */
	public static getDefaultRoleNames(): string[] {
		return ['Default.CaseManager', 'Default.ServiceLineOwner', 'Default.Finance', 'Default.TechAdmin'];
	}

	public static getNewDefaultCaseManagerInstance<props extends StaffRoleProps>(newProps: props, passport: Passport): StaffRole<props> {
		const role = new StaffRole(newProps, passport);
		role.isNew = true;
		role.roleName = 'Default Case Manager';
        role.enterpriseAppRole = ValueObjects.EnterpriseAppRoleNames.CaseManager;
		role.isDefault = true;
		role.permissions.communityPermissions.canManageCommunities = true;
		role.permissions.communityPermissions.canManageStaffRolesAndPermissions = true;
		role.permissions.financePermissions.canManageFinance = false;
		role.permissions.techAdminPermissions.canManageTechAdmin = false;
		role.permissions.userPermissions.canManageUsers = true;
		role.permissions.userPermissions.canAssignStaffRoles = true;
		role.permissions.userPermissions.canViewStaffUsers = true;
		role.permissions.staffRolePermissions.canViewRoles = true;
		role.isNew = false;
		return role;
	}

	public static getNewDefaultServiceLineOwnerInstance<props extends StaffRoleProps>(newProps: props, passport: Passport): StaffRole<props> {
		const role = new StaffRole(newProps, passport);
		role.isNew = true;
		role.roleName = 'Default Service Line Owner';
        role.enterpriseAppRole = ValueObjects.EnterpriseAppRoleNames.ServiceLineOwner;
		role.isDefault = true;
		role.permissions.communityPermissions.canManageCommunities = true;
		role.permissions.communityPermissions.canManageStaffRolesAndPermissions = true;
		role.permissions.financePermissions.canManageFinance = false;
		role.permissions.techAdminPermissions.canManageTechAdmin = false;
		role.permissions.userPermissions.canManageUsers = true;
		role.permissions.userPermissions.canAssignStaffRoles = true;
		role.permissions.userPermissions.canViewStaffUsers = true;
		role.permissions.staffRolePermissions.canViewRoles = true;
		role.isNew = false;
		return role;
	}

	public static getNewDefaultFinanceInstance<props extends StaffRoleProps>(newProps: props, passport: Passport): StaffRole<props> {
		const role = new StaffRole(newProps, passport);
		role.isNew = true;
		role.roleName = 'Default Finance';
        role.enterpriseAppRole = ValueObjects.EnterpriseAppRoleNames.Finance;
		role.isDefault = true;
		role.permissions.communityPermissions.canManageCommunities = false;
		role.permissions.communityPermissions.canManageStaffRolesAndPermissions = true;
		role.permissions.financePermissions.canManageFinance = true;
		role.permissions.techAdminPermissions.canManageTechAdmin = false;
		role.permissions.userPermissions.canManageUsers = true;
		role.permissions.userPermissions.canAssignStaffRoles = true;
		role.permissions.userPermissions.canViewStaffUsers = true;
		role.permissions.staffRolePermissions.canViewRoles = true;
		role.permissions.staffRolePermissions.canAddRole = true;
		role.permissions.staffRolePermissions.canEditRole = true;
		role.permissions.staffRolePermissions.canRemoveRole = true;
		role.isNew = false;
		return role;
	}

	public static getNewDefaultTechAdminInstance<props extends StaffRoleProps>(newProps: props, passport: Passport): StaffRole<props> {
		const role = new StaffRole(newProps, passport);
		role.isNew = true;
		role.roleName = 'Default Tech Admin';
        role.enterpriseAppRole = ValueObjects.EnterpriseAppRoleNames.TechAdmin;
		role.isDefault = true;
		// Tech Admins are implicit managers of all areas
		role.permissions.communityPermissions.canManageCommunities = true;
		// Tech Admins should also be able to manage staff roles & permissions by default
		role.permissions.communityPermissions.canManageStaffRolesAndPermissions = true;
		role.permissions.financePermissions.canManageFinance = true;
		role.permissions.techAdminPermissions.canManageTechAdmin = true;
		role.permissions.userPermissions.canManageUsers = true;
		role.permissions.userPermissions.canAssignStaffRoles = true;
		role.permissions.userPermissions.canViewStaffUsers = true;
		role.permissions.staffRolePermissions.canViewRoles = true;
		role.permissions.staffRolePermissions.canAddRole = true;
		role.permissions.staffRolePermissions.canEditRole = true;
		role.permissions.staffRolePermissions.canRemoveRole = true;
		role.isNew = false;
		return role;
	}
	public deleteAndReassignTo(roleRef: StaffRoleEntityReference) {
		if (this.isDefault) {
			throw new PermissionError('You cannot delete a default staff role');
		}
		if (!this.isDeleted && !this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions)) {
			throw new PermissionError('You do not have permission to delete this role');
		}
		super.isDeleted = true;
		this.addIntegrationEvent<RoleDeletedReassignProps, RoleDeletedReassignEvent>(RoleDeletedReassignEvent, {
			deletedRoleId: this.props.id,
			newRoleId: roleRef.id,
		});
	}

	get roleName() {
		return this.props.roleName;
	}
	set roleName(roleName: string) {
		if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
			throw new PermissionError('Cannot set role name');
		}
		const normalizedRoleName = new ValueObjects.RoleName(roleName).valueOf();
		this.props.roleName = normalizedRoleName.charAt(0).toUpperCase() + normalizedRoleName.slice(1);
	}

    get enterpriseAppRole() {
        return this.props.enterpriseAppRole;
    }

    set enterpriseAppRole(enterpriseAppRole: string) {
        if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
            throw new PermissionError('Cannot set enterprise app role');
        }
    this.props.enterpriseAppRole = new ValueObjects.EnterpriseAppRole(enterpriseAppRole).valueOf();
    }

	get isDefault() {
		return this.props.isDefault;
	}
	set isDefault(isDefault: boolean) {
		if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
			throw new PermissionError('You do not have permission to update this role');
		}
		this.props.isDefault = isDefault;
	}
	get permissions(): StaffRolePermissions {
		return new StaffRolePermissions(this.props.permissions, this.visa);
	}
	get roleType() {
		return this.props.roleType;
	}
	get createdAt() {
		return this.props.createdAt;
	}
	get updatedAt() {
		return this.props.updatedAt;
	}
	get schemaVersion() {
		return this.props.schemaVersion;
	}
}
