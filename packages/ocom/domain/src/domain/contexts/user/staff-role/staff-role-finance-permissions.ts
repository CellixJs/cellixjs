import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { UserVisa } from '../user.visa.ts';

interface StaffRoleFinancePermissionsSpec {
	canManageFinance: boolean;
	canViewGLBatchSummaries: boolean;
	canViewFinanceConfigs: boolean;
	canCreateFinanceConfigs: boolean;
}

export interface StaffRoleFinancePermissionsProps extends StaffRoleFinancePermissionsSpec, ValueObjectProps {}
export interface StaffRoleFinancePermissionsEntityReference extends Readonly<StaffRoleFinancePermissionsProps> {}

export class StaffRoleFinancePermissions extends ValueObject<StaffRoleFinancePermissionsProps> implements StaffRoleFinancePermissionsEntityReference {
	private readonly visa: UserVisa;

	constructor(props: StaffRoleFinancePermissionsProps, visa: UserVisa) {
		super(props);
		this.visa = visa;
	}

	private validateVisa() {
		if (!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
			throw new PermissionError('Cannot set permission');
		}
	}

	get canManageFinance(): boolean {
		return this.props.canManageFinance;
	}
	set canManageFinance(value: boolean) {
		this.validateVisa();
		this.props.canManageFinance = value;
	}

	get canViewGLBatchSummaries(): boolean {
		return this.props.canViewGLBatchSummaries;
	}
	set canViewGLBatchSummaries(value: boolean) {
		this.validateVisa();
		this.props.canViewGLBatchSummaries = value;
	}

	get canViewFinanceConfigs(): boolean {
		return this.props.canViewFinanceConfigs;
	}
	set canViewFinanceConfigs(value: boolean) {
		this.validateVisa();
		this.props.canViewFinanceConfigs = value;
	}

	get canCreateFinanceConfigs(): boolean {
		return this.props.canCreateFinanceConfigs;
	}
	set canCreateFinanceConfigs(value: boolean) {
		this.validateVisa();
		this.props.canCreateFinanceConfigs = value;
	}
}
