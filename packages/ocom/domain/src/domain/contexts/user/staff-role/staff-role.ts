import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import { StaffRoleDeletedEvent, type StaffRoleDeletedProps } from '../../../events/types/staff-role-deleted.ts';
import type { Passport } from '../../passport.ts';
import type { UserVisa } from '../user.visa.ts';
import * as ValueObjects from './staff-role.value-objects.ts';
import { StaffRolePermissions, type StaffRolePermissionsEntityReference, type StaffRolePermissionsProps } from './staff-role-permissions.ts';

export interface StaffRoleDeletion {
	readonly actorStaffUserId: string;
	readonly enterpriseAppRole: string;
	readonly deletedAt: Date;
}

export interface StaffRoleProps extends DomainEntityProps {
	roleName: string;
	isDefault: boolean;
	enterpriseAppRole: string;
	deletion?: StaffRoleDeletion | undefined;
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
	/**
	 * Logically deletes this staff role and raises a {@link StaffRoleDeletedEvent}
	 * so that staff users assigned to it can be reassigned to the matching
	 * default staff role. The tombstone remains durable so interrupted event
	 * processing can be retried after a host restart.
	 *
	 * Default staff roles can never be deleted; non-default roles require the
	 * `canRemoveRole` staff-role permission.
	 */
	public requestDelete(actorStaffUserId: string, actorStaffRoleId?: string): void {
		if (this.isDefault) {
			throw new PermissionError('You cannot delete a default staff role');
		}
		if (!this.visa.determineIf((permissions) => permissions.canRemoveRole || permissions.isSystemAccount)) {
			throw new PermissionError('You do not have permission to delete this role');
		}
		if (actorStaffRoleId === this.id) {
			throw new PermissionError('You cannot delete the role currently assigned to you');
		}
		if (!this.props.deletion) {
			const enterpriseAppRole = this.props.enterpriseAppRole;
			const deletedAt = new Date();
			this.props.deletion = {
				actorStaffUserId,
				enterpriseAppRole,
				deletedAt,
			};
			this.props.roleName = `Deleted ${this.id} ${deletedAt.getTime()}`;
			this.props.enterpriseAppRole = enterpriseAppRole;
		}
		this.raiseDeletedEvent();
	}

	public retryDelete(): void {
		if (!this.visa.determineIf((permissions) => permissions.isSystemAccount)) {
			throw new PermissionError('Only the system account can retry staff role deletion');
		}
		if (!this.props.deletion) {
			throw new Error(`Staff role ${this.id} is not deleted`);
		}
		this.raiseDeletedEvent();
	}

	private raiseDeletedEvent(): void {
		const deletion = this.props.deletion;
		if (!deletion) {
			throw new Error(`Staff role ${this.id} is not deleted`);
		}
		this.addIntegrationEvent<StaffRoleDeletedProps, StaffRoleDeletedEvent>(StaffRoleDeletedEvent, {
			deletedRoleId: this.props.id,
			enterpriseAppRole: deletion.enterpriseAppRole,
			actorStaffUserId: deletion.actorStaffUserId,
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
	get deletion() {
		return this.props.deletion;
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
