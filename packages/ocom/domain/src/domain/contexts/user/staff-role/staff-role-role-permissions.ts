import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { UserVisa } from '../user.visa.ts';

interface StaffRoleRolePermissionsSpec {
	canViewRoles: boolean;
	canAddRole: boolean;
	canEditRole: boolean;
	canRemoveRole: boolean;
}

export interface StaffRoleRolePermissionsProps extends StaffRoleRolePermissionsSpec, ValueObjectProps {}
export interface StaffRoleRolePermissionsEntityReference extends Readonly<StaffRoleRolePermissionsProps> {}

export class StaffRoleRolePermissions extends ValueObject<StaffRoleRolePermissionsProps> implements StaffRoleRolePermissionsEntityReference {
	private readonly visa: UserVisa;

	constructor(props: StaffRoleRolePermissionsProps, visa: UserVisa) {
		super(props);
		this.visa = visa;
	}

	private validateVisa() {
		if (!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
			throw new PermissionError('Cannot set permission');
		}
	}

	get canViewRoles(): boolean {
		return this.props.canViewRoles ?? false;
	}
	set canViewRoles(value: boolean) {
		this.validateVisa();
		this.props.canViewRoles = value;
	}

	get canAddRole(): boolean {
		return this.props.canAddRole ?? false;
	}
	set canAddRole(value: boolean) {
		this.validateVisa();
		this.props.canAddRole = value;
	}

	get canEditRole(): boolean {
		return this.props.canEditRole ?? false;
	}
	set canEditRole(value: boolean) {
		this.validateVisa();
		this.props.canEditRole = value;
	}

	get canRemoveRole(): boolean {
		return this.props.canRemoveRole ?? false;
	}
	set canRemoveRole(value: boolean) {
		this.validateVisa();
		this.props.canRemoveRole = value;
	}
}
