import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { UserVisa } from '../user.visa.ts';

interface StaffRoleSectionPermissionsSpec {
	canManageCommunities: boolean;
	canManageUser: boolean;
	canManageFinance: boolean;
	canManageTechAdmin: boolean;
}

export interface StaffRoleSectionPermissionsProps extends StaffRoleSectionPermissionsSpec, ValueObjectProps {}
export interface StaffRoleSectionPermissionsEntityReference extends Readonly<StaffRoleSectionPermissionsProps> {}

export class StaffRoleSectionPermissions extends ValueObject<StaffRoleSectionPermissionsProps> implements StaffRoleSectionPermissionsEntityReference {
	private readonly visa: UserVisa;

	constructor(props: StaffRoleSectionPermissionsProps, visa: UserVisa) {
		super(props);
		this.visa = visa;
	}

	private validateVisa() {
		if (!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
			throw new PermissionError('Cannot set permission');
		}
	}

	get canManageCommunities(): boolean {
		return this.props.canManageCommunities;
	}
	set canManageCommunities(value: boolean) {
		this.validateVisa();
		this.props.canManageCommunities = value;
	}

	get canManageUser(): boolean {
		return this.props.canManageUser;
	}
	set canManageUser(value: boolean) {
		this.validateVisa();
		this.props.canManageUser = value;
	}

	get canManageFinance(): boolean {
		return this.props.canManageFinance;
	}
	set canManageFinance(value: boolean) {
		this.validateVisa();
		this.props.canManageFinance = value;
	}

	get canManageTechAdmin(): boolean {
		return this.props.canManageTechAdmin;
	}
	set canManageTechAdmin(value: boolean) {
		this.validateVisa();
		this.props.canManageTechAdmin = value;
	}
}
