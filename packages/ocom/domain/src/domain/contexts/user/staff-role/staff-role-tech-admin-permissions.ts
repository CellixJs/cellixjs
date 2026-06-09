import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { UserVisa } from '../user.visa.ts';

interface StaffRoleTechAdminPermissionsSpec {
	canManageTechAdmin: boolean;
	canViewDatabaseExplorer: boolean;
	canViewBlobExplorer: boolean;
	canViewQueueDashboard: boolean;
	canSendQueueMessages: boolean;
}

export interface StaffRoleTechAdminPermissionsProps extends StaffRoleTechAdminPermissionsSpec, ValueObjectProps {}
export interface StaffRoleTechAdminPermissionsEntityReference extends Readonly<StaffRoleTechAdminPermissionsProps> {}

export class StaffRoleTechAdminPermissions extends ValueObject<StaffRoleTechAdminPermissionsProps> implements StaffRoleTechAdminPermissionsEntityReference {
	private readonly visa: UserVisa;

	constructor(props: StaffRoleTechAdminPermissionsProps, visa: UserVisa) {
		super(props);
		this.visa = visa;
	}

	private validateVisa() {
		if (!this.visa.determineIf((permissions) => permissions.canManageStaffRolesAndPermissions || permissions.isSystemAccount)) {
			throw new PermissionError('Cannot set permission');
		}
	}

	get canManageTechAdmin(): boolean {
		return this.props.canManageTechAdmin;
	}
	set canManageTechAdmin(value: boolean) {
		this.validateVisa();
		this.props.canManageTechAdmin = value;
	}

	get canViewDatabaseExplorer(): boolean {
		return this.props.canViewDatabaseExplorer;
	}
	set canViewDatabaseExplorer(value: boolean) {
		this.validateVisa();
		this.props.canViewDatabaseExplorer = value;
	}

	get canViewBlobExplorer(): boolean {
		return this.props.canViewBlobExplorer;
	}
	set canViewBlobExplorer(value: boolean) {
		this.validateVisa();
		this.props.canViewBlobExplorer = value;
	}

	get canViewQueueDashboard(): boolean {
		return this.props.canViewQueueDashboard;
	}
	set canViewQueueDashboard(value: boolean) {
		this.validateVisa();
		this.props.canViewQueueDashboard = value;
	}

	get canSendQueueMessages(): boolean {
		return this.props.canSendQueueMessages;
	}
	set canSendQueueMessages(value: boolean) {
		this.validateVisa();
		this.props.canSendQueueMessages = value;
	}
}
