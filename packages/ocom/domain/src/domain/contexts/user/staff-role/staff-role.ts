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
	readonly permissions: StaffRolePermissionsProps;
	readonly roleType: string | null;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface StaffRoleEntityReference extends Readonly<Omit<StaffRoleProps, 'permissions'>> {
	readonly permissions: StaffRolePermissionsEntityReference;
}

type DefaultRoleSpec = Readonly<{
	roleName: string;
	apply: (staffRole: StaffRole<StaffRoleProps>) => void;
}>;

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
		return StaffRole.getDefaultRoleSpecs().map((spec) => spec.roleName);
	}

	public static getDefaultRoleSpecs(): DefaultRoleSpec[] {
		return [
			{ roleName: 'Staff.CaseManager', apply: StaffRole.applyCaseManagerDefaultSpec },
			{ roleName: 'Staff.ServiceLineOwner', apply: StaffRole.applyServiceLineOwnerDefaultSpec },
			{ roleName: 'Staff.Finance', apply: StaffRole.applyFinanceDefaultSpec },
			{ roleName: 'Staff.TechAdmin', apply: StaffRole.applyTechAdminDefaultSpec },
		];
	}

	public static applyCaseManagerDefaultSpec(staffRole: StaffRole<StaffRoleProps>): void {
		staffRole.permissions.communityPermissions.canManageCommunities = true;
		staffRole.permissions.financePermissions.canManageFinance = false;
		staffRole.permissions.techAdminPermissions.canManageTechAdmin = false;
		staffRole.permissions.userPermissions.canManageUsers = true;
		staffRole.isDefault = true;
	}

	public static applyServiceLineOwnerDefaultSpec(staffRole: StaffRole<StaffRoleProps>): void {
		staffRole.permissions.communityPermissions.canManageCommunities = true;
		staffRole.permissions.financePermissions.canManageFinance = false;
		staffRole.permissions.techAdminPermissions.canManageTechAdmin = false;
		staffRole.permissions.userPermissions.canManageUsers = true;
		staffRole.isDefault = true;
	}

	public static applyFinanceDefaultSpec(staffRole: StaffRole<StaffRoleProps>): void {
		staffRole.permissions.communityPermissions.canManageCommunities = false;
		staffRole.permissions.financePermissions.canManageFinance = true;
		staffRole.permissions.techAdminPermissions.canManageTechAdmin = false;
		staffRole.permissions.userPermissions.canManageUsers = false;
		staffRole.isDefault = true;
	}

	public static applyTechAdminDefaultSpec(staffRole: StaffRole<StaffRoleProps>): void {
		staffRole.permissions.communityPermissions.canManageCommunities = false;
		staffRole.permissions.financePermissions.canManageFinance = false;
		staffRole.permissions.techAdminPermissions.canManageTechAdmin = true;
		staffRole.permissions.userPermissions.canManageUsers = false;
		staffRole.isDefault = true;
	}

	/**
	 * Applies the domain-defined default permissions for a given default role name onto the provided StaffRole instance.
	 * This keeps the default-spec knowledge inside the domain layer and avoids leaking permission shapes to the application layer.
	 */
	public static applyDefaultSpec(staffRole: StaffRole<StaffRoleProps>, roleName: string): void {
		// Do not unmark defaults here. applyDefaultSpec should only mark canonical defaults as default and
		// set permission shapes directly on the underlying props to avoid visa-guarded setters during bootstrapping.

		// When bootstrapping defaults, mutate the aggregate directly. We intentionally avoid clearing isDefault here.

		switch (roleName) {
			case 'Staff.CaseManager':
				StaffRole.applyCaseManagerDefaultSpec(staffRole);
				break;
			case 'Staff.ServiceLineOwner':
				StaffRole.applyServiceLineOwnerDefaultSpec(staffRole);
				break;
			case 'Staff.Finance':
				StaffRole.applyFinanceDefaultSpec(staffRole);
				break;
			case 'Staff.TechAdmin':
				StaffRole.applyTechAdminDefaultSpec(staffRole);
				break;
			default:
				// Unknown default spec: do nothing
				break;
		}
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
		this.props.roleName = new ValueObjects.RoleName(roleName).valueOf();
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
