import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import type { CommunityVisa } from '../../community.visa.ts';
import {
	EndUserRoleCommunityPermissions,
	type EndUserRoleCommunityPermissionsEntityReference,
	type EndUserRoleCommunityPermissionsProps,
} from './end-user-role-community-permissions.ts';
import {
	EndUserRolePropertyPermissions,
	type EndUserRolePropertyPermissionsEntityReference,
	type EndUserRolePropertyPermissionsProps,
} from './end-user-role-property-permissions.ts';
import {
	EndUserRoleServicePermissions,
	type EndUserRoleServicePermissionsEntityReference,
	type EndUserRoleServicePermissionsProps,
} from './end-user-role-service-permissions.ts';
import {
	EndUserRoleServiceTicketPermissions,
	type EndUserRoleServiceTicketPermissionsEntityReference,
	type EndUserRoleServiceTicketPermissionsProps,
} from './end-user-role-service-ticket-permissions.ts';
import {
	EndUserRoleViolationTicketPermissions,
	type EndUserRoleViolationTicketPermissionsEntityReference,
	type EndUserRoleViolationTicketPermissionsProps,
} from './end-user-role-violation-ticket-permissions.ts';

export interface EndUserRolePermissionsProps
	extends DomainSeedwork.ValueObjectProps {
	readonly communityPermissions: EndUserRoleCommunityPermissionsProps;
	readonly propertyPermissions: EndUserRolePropertyPermissionsProps;
	readonly serviceTicketPermissions: EndUserRoleServiceTicketPermissionsProps;
	readonly servicePermissions: EndUserRoleServicePermissionsProps;
	readonly violationTicketPermissions: EndUserRoleViolationTicketPermissionsProps;
}

export interface EndUserRolePermissionsEntityReference
	extends Readonly<
		Omit<
			EndUserRolePermissionsProps,
			| 'communityPermissions'
			| 'propertyPermissions'
			| 'serviceTicketPermissions'
			| 'servicePermissions'
			| 'violationTicketPermissions'
		>
	> {
	readonly communityPermissions: EndUserRoleCommunityPermissionsEntityReference;
	readonly propertyPermissions: EndUserRolePropertyPermissionsEntityReference;
	readonly serviceTicketPermissions: EndUserRoleServiceTicketPermissionsEntityReference;
	readonly servicePermissions: EndUserRoleServicePermissionsEntityReference;
	readonly violationTicketPermissions: EndUserRoleViolationTicketPermissionsEntityReference;
}

export class EndUserRolePermissions
	extends DomainSeedwork.ValueObject<EndUserRolePermissionsProps>
	implements EndUserRolePermissionsEntityReference
{
	private readonly visa: CommunityVisa;
	constructor(props: EndUserRolePermissionsProps, visa: CommunityVisa) {
		super(props);
		this.visa = visa;
	}

	public setDefaultAdminPermissions(): void {
		if (
			!this.visa.determineIf(
				(permissions) => permissions.canManageEndUserRolesAndPermissions,
			)
		) {
			throw new Error('Cannot set default admin permissions');
		}
		this.communityPermissions.canManageEndUserRolesAndPermissions = true;
		this.communityPermissions.canManageCommunitySettings = true;
		this.communityPermissions.canManageMembers = true;
		this.communityPermissions.canManageSiteContent = true;
		this.communityPermissions.canEditOwnMemberAccounts = true;
		this.communityPermissions.canEditOwnMemberProfile = true;
		this.propertyPermissions.canManageProperties = true;
		this.propertyPermissions.canEditOwnProperty = true;
		this.servicePermissions.canManageServices = true;
		this.serviceTicketPermissions.canAssignTickets = true;
		this.serviceTicketPermissions.canCreateTickets = true;
		this.serviceTicketPermissions.canManageTickets = true;
		this.serviceTicketPermissions.canWorkOnTickets = true;
		this.violationTicketPermissions.canAssignTickets = true;
		this.violationTicketPermissions.canCreateTickets = true;
		this.violationTicketPermissions.canManageTickets = true;
		this.violationTicketPermissions.canWorkOnTickets = true;
	}

	get communityPermissions(): EndUserRoleCommunityPermissions {
		return new EndUserRoleCommunityPermissions(
			this.props.communityPermissions,
			this.visa,
		);
	}
	get propertyPermissions(): EndUserRolePropertyPermissions {
		return new EndUserRolePropertyPermissions(
			this.props.propertyPermissions,
			this.visa,
		);
	}
	get serviceTicketPermissions(): EndUserRoleServiceTicketPermissions {
		return new EndUserRoleServiceTicketPermissions(
			this.props.serviceTicketPermissions,
			this.visa,
		);
	}
	get servicePermissions(): EndUserRoleServicePermissions {
		return new EndUserRoleServicePermissions(
			this.props.servicePermissions,
			this.visa,
		);
	}
	get violationTicketPermissions(): EndUserRoleViolationTicketPermissions {
		return new EndUserRoleViolationTicketPermissions(
			this.props.violationTicketPermissions,
			this.visa,
		);
	}
}
