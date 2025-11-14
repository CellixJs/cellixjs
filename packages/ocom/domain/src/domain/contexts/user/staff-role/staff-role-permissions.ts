import type { ValueObject, ValueObjectProps } from '@cellix/domain-seedwork/value-object';
import {
	StaffRoleCommunityPermissions,
	type StaffRoleCommunityPermissionsEntityReference,
	type StaffRoleCommunityPermissionsProps,
} from './staff-role-community-permissions.ts';
import {
	StaffRolePropertyPermissions,
	type StaffRolePropertyPermissionsEntityReference,
	type StaffRolePropertyPermissionsProps,
} from './staff-role-property-permissions.ts';
import {
	StaffRoleServiceTicketPermissions,
	type StaffRoleServiceTicketPermissionsEntityReference,
	type StaffRoleServiceTicketPermissionsProps,
} from './staff-role-service-ticket-permissions.ts';
import {
	StaffRoleServicePermissions,
	type StaffRoleServicePermissionsEntityReference,
	type StaffRoleServicePermissionsProps,
} from './staff-role-service-permissions.ts';
import {
	StaffRoleViolationTicketPermissions,
	type StaffRoleViolationTicketPermissionsEntityReference,
	type StaffRoleViolationTicketPermissionsProps,
} from './staff-role-violation-ticket-permissions.ts';
import type { UserVisa } from '../user.visa.ts';

export interface StaffRolePermissionsProps
	extends ValueObjectProps {
	readonly communityPermissions: StaffRoleCommunityPermissionsProps;
	readonly propertyPermissions: StaffRolePropertyPermissionsProps;
	readonly serviceTicketPermissions: StaffRoleServiceTicketPermissionsProps;
	readonly servicePermissions: StaffRoleServicePermissionsProps;
	readonly violationTicketPermissions: StaffRoleViolationTicketPermissionsProps;
}

export interface StaffRolePermissionsEntityReference
	extends Readonly<
		Omit<
			StaffRolePermissionsProps,
			| 'communityPermissions'
			| 'propertyPermissions'
			| 'serviceTicketPermissions'
			| 'servicePermissions'
			| 'violationTicketPermissions'
		>
	> {
	readonly communityPermissions: StaffRoleCommunityPermissionsEntityReference;
	readonly propertyPermissions: StaffRolePropertyPermissionsEntityReference;
	readonly serviceTicketPermissions: StaffRoleServiceTicketPermissionsEntityReference;
	readonly servicePermissions: StaffRoleServicePermissionsEntityReference;
	readonly violationTicketPermissions: StaffRoleViolationTicketPermissionsEntityReference;
}

export class StaffRolePermissions
	extends ValueObject<StaffRolePermissionsProps>
	implements StaffRolePermissionsEntityReference
{
	private visa: UserVisa;

	constructor(props: StaffRolePermissionsProps, visa: UserVisa) {
		super(props);
		this.visa = visa;
	}

	get communityPermissions(): StaffRoleCommunityPermissions {
		return new StaffRoleCommunityPermissions(
			this.props.communityPermissions,
			this.visa,
		);
	}
	get propertyPermissions(): StaffRolePropertyPermissions {
		return new StaffRolePropertyPermissions(
			this.props.propertyPermissions,
			this.visa,
		);
	}
	get serviceTicketPermissions(): StaffRoleServiceTicketPermissions {
		return new StaffRoleServiceTicketPermissions(
			this.props.serviceTicketPermissions,
			this.visa,
		);
	}
	get servicePermissions(): StaffRoleServicePermissions {
		return new StaffRoleServicePermissions(
			this.props.servicePermissions,
			this.visa,
		);
	}
	get violationTicketPermissions(): StaffRoleViolationTicketPermissions {
		return new StaffRoleViolationTicketPermissions(
			this.props.violationTicketPermissions,
			this.visa,
		);
	}
}
