import type { ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import { ValueObject } from '@cellix/domain-seedwork/value-object';
import type { UserVisa } from '../user.visa.ts';
import { StaffRoleCommunityPermissions, type StaffRoleCommunityPermissionsEntityReference, type StaffRoleCommunityPermissionsProps } from './staff-role-community-permissions.ts';
import { StaffRoleFinancePermissions, type StaffRoleFinancePermissionsEntityReference, type StaffRoleFinancePermissionsProps } from './staff-role-finance-permissions.ts';
import { StaffRolePropertyPermissions, type StaffRolePropertyPermissionsEntityReference, type StaffRolePropertyPermissionsProps } from './staff-role-property-permissions.ts';
import { StaffRoleServicePermissions, type StaffRoleServicePermissionsEntityReference, type StaffRoleServicePermissionsProps } from './staff-role-service-permissions.ts';
import { StaffRoleServiceTicketPermissions, type StaffRoleServiceTicketPermissionsEntityReference, type StaffRoleServiceTicketPermissionsProps } from './staff-role-service-ticket-permissions.ts';
import { StaffRoleTechAdminPermissions, type StaffRoleTechAdminPermissionsEntityReference, type StaffRoleTechAdminPermissionsProps } from './staff-role-tech-admin-permissions.ts';
import { StaffRoleUserPermissions, type StaffRoleUserPermissionsEntityReference, type StaffRoleUserPermissionsProps } from './staff-role-user-permissions.ts';
import { StaffRoleViolationTicketPermissions, type StaffRoleViolationTicketPermissionsEntityReference, type StaffRoleViolationTicketPermissionsProps } from './staff-role-violation-ticket-permissions.ts';

export interface StaffRolePermissionsProps extends ValueObjectProps {
	readonly communityPermissions: StaffRoleCommunityPermissionsProps;
	readonly propertyPermissions: StaffRolePropertyPermissionsProps;
	readonly serviceTicketPermissions: StaffRoleServiceTicketPermissionsProps;
	readonly servicePermissions: StaffRoleServicePermissionsProps;
	readonly violationTicketPermissions: StaffRoleViolationTicketPermissionsProps;
	readonly financePermissions: StaffRoleFinancePermissionsProps;
	readonly techAdminPermissions: StaffRoleTechAdminPermissionsProps;
	readonly userPermissions: StaffRoleUserPermissionsProps;
}

export interface StaffRolePermissionsEntityReference
	extends Readonly<
		Omit<
			StaffRolePermissionsProps,
			'communityPermissions' | 'propertyPermissions' | 'serviceTicketPermissions' | 'servicePermissions' | 'violationTicketPermissions' | 'financePermissions' | 'techAdminPermissions' | 'userPermissions'
		>
	> {
	readonly communityPermissions: StaffRoleCommunityPermissionsEntityReference;
	readonly propertyPermissions: StaffRolePropertyPermissionsEntityReference;
	readonly serviceTicketPermissions: StaffRoleServiceTicketPermissionsEntityReference;
	readonly servicePermissions: StaffRoleServicePermissionsEntityReference;
	readonly violationTicketPermissions: StaffRoleViolationTicketPermissionsEntityReference;
	readonly financePermissions: StaffRoleFinancePermissionsEntityReference;
	readonly techAdminPermissions: StaffRoleTechAdminPermissionsEntityReference;
	readonly userPermissions: StaffRoleUserPermissionsEntityReference;
}

export class StaffRolePermissions extends ValueObject<StaffRolePermissionsProps> implements StaffRolePermissionsEntityReference {
	private visa: UserVisa;

	constructor(props: StaffRolePermissionsProps, visa: UserVisa) {
		super(props);
		this.visa = visa;
	}

	get communityPermissions(): StaffRoleCommunityPermissions {
		return new StaffRoleCommunityPermissions(this.props.communityPermissions, this.visa);
	}
	get propertyPermissions(): StaffRolePropertyPermissions {
		return new StaffRolePropertyPermissions(this.props.propertyPermissions, this.visa);
	}
	get serviceTicketPermissions(): StaffRoleServiceTicketPermissions {
		return new StaffRoleServiceTicketPermissions(this.props.serviceTicketPermissions, this.visa);
	}
	get servicePermissions(): StaffRoleServicePermissions {
		return new StaffRoleServicePermissions(this.props.servicePermissions, this.visa);
	}
	get violationTicketPermissions(): StaffRoleViolationTicketPermissions {
		return new StaffRoleViolationTicketPermissions(this.props.violationTicketPermissions, this.visa);
	}
	get financePermissions(): StaffRoleFinancePermissions {
		return new StaffRoleFinancePermissions(this.props.financePermissions, this.visa);
	}
	get techAdminPermissions(): StaffRoleTechAdminPermissions {
		return new StaffRoleTechAdminPermissions(this.props.techAdminPermissions, this.visa);
	}
	get userPermissions(): StaffRoleUserPermissions {
		return new StaffRoleUserPermissions(this.props.userPermissions, this.visa);
	}
}
