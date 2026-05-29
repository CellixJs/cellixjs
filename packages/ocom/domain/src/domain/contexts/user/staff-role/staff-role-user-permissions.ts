import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { UserVisa } from '../user.visa.ts';

interface StaffRoleUserPermissionsSpec {
	canManageUsers: boolean;
	canAssignStaffRoles: boolean;
	canAssignStaffUserRoles: boolean;
	canViewStaffUsers: boolean;
}

export interface StaffRoleUserPermissionsProps extends StaffRoleUserPermissionsSpec, ValueObjectProps {}
export interface StaffRoleUserPermissionsEntityReference extends Readonly<StaffRoleUserPermissionsProps> {}

export class StaffRoleUserPermissions extends ValueObject<StaffRoleUserPermissionsProps> implements StaffRoleUserPermissionsEntityReference {
	private readonly visa: UserVisa;

	constructor(props: StaffRoleUserPermissionsProps, visa: UserVisa) {
		super(props);
		this.visa = visa;
	}

	private validateVisa() {
		if (!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
			throw new PermissionError('Cannot set permission');
		}
	}

	get canManageUsers(): boolean {
		return this.props.canManageUsers;
	}
	set canManageUsers(value: boolean) {
		this.validateVisa();
		this.props.canManageUsers = value;
	}

	get canAssignStaffUserRoles(): boolean {
		return this.props.canAssignStaffRoles ?? this.props.canAssignStaffUserRoles ?? false;
	}
	set canAssignStaffUserRoles(value: boolean) {
		this.validateVisa();
		this.props.canAssignStaffRoles = value;
		this.props.canAssignStaffUserRoles = value;
	}

	get canAssignStaffRoles(): boolean {
		return this.props.canAssignStaffRoles ?? this.props.canAssignStaffUserRoles ?? false;
	}
	set canAssignStaffRoles(value: boolean) {
		this.validateVisa();
		this.props.canAssignStaffRoles = value;
		this.props.canAssignStaffUserRoles = value;
	}

	get canViewStaffUsers(): boolean {
		return this.props.canViewStaffUsers ?? false;
	}
	set canViewStaffUsers(value: boolean) {
		this.validateVisa();
		this.props.canViewStaffUsers = value;
	}
}
