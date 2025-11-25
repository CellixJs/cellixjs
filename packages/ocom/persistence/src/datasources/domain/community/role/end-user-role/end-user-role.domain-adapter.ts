import { MongooseSeedwork } from '@cellix/mongoose-seedwork';

import type { DomainDataSource, Passport } from '@ocom/domain';
import { CommunityDomainAdapter } from '../../community/community.domain-adapter.ts';
import type { Community } from '@ocom/data-sources-mongoose-models/community';
import type { EndUserRole, EndUserRoleCommunityPermissions, EndUserRolePermissions, EndUserRolePropertyPermissions, EndUserRoleServicePermissions, EndUserRoleServiceTicketPermissions, EndUserRoleViolationTicketPermissions } from '@ocom/data-sources-mongoose-models/role/end-user-role';

export class EndUserRoleConverter extends MongooseSeedwork.MongoTypeConverter<
	EndUserRole,
	EndUserRoleDomainAdapter,
	Passport,
	Domain.Contexts.Community.Role.EndUserRole.EndUserRole<EndUserRoleDomainAdapter>
> {
	constructor() {
		super(
			EndUserRoleDomainAdapter,
            Domain.Contexts.Community.Role.EndUserRole.EndUserRole<EndUserRoleDomainAdapter>
		);
	}
}

export class EndUserRoleDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<EndUserRole>
	implements Domain.Contexts.Community.Role.EndUserRole.EndUserRoleProps
{
	// roleName
	get roleName(): string {
		return this.doc.roleName;
	}
	set roleName(roleName: string) {
		this.doc.roleName = roleName;
	}

	get community(): Domain.Contexts.Community.Community.CommunityProps {
		if (!this.doc.community) {
			throw new Error('community is not populated');
		}
		if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
			throw new Error('community is not populated or is not of the correct type');
		}
		return new CommunityDomainAdapter(this.doc.community as Community);
	}
    async loadCommunity(): Promise<Domain.Contexts.Community.Community.CommunityProps> {
        if (!this.doc.community) {
            throw new Error('community is not populated');
        }
        if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
            await this.doc.populate('community');
        }
        return new CommunityDomainAdapter(this.doc.community as Community);
    }
	set community(
		community: Domain.Contexts.Community.Community.CommunityEntityReference | Domain.Contexts.Community.Community.Community<CommunityDomainAdapter>,
	) {
		if (community instanceof Domain.Contexts.Community.Community.Community) {
			this.doc.set('community', community.props.doc);
			return;
		}
		if (!community?.id) {
			throw new Error('community reference is missing id');
		}
		this.doc.set('community', new MongooseSeedwork.ObjectId(community.id));
	}

	get isDefault(): boolean {
		return this.doc.isDefault;
	}
	set isDefault(value: boolean) {
		this.doc.isDefault = value;
	}

    get permissions(): Domain.Contexts.Community.Role.EndUserRole.EndUserRolePermissionsProps {
        if (!this.doc.permissions) {
            // ensure subdocument exists
            this.doc.set('permissions', {} as EndUserRolePermissions);
        }
        return new EndUserRolePermissionsDomainAdapter(
            this.doc.permissions as EndUserRolePermissions,
        );
	}

    get roleType(): string | undefined {
        return this.doc.roleType;
    }
}

// Permissions adapter tree
export class EndUserRolePermissionsDomainAdapter
	implements Domain.Contexts.Community.Role.EndUserRole.EndUserRolePermissionsProps
{
	public readonly props: EndUserRolePermissions;
	constructor(props: EndUserRolePermissions) {
		this.props = props;
	}

	get communityPermissions(): Domain.Contexts.Community.Role.EndUserRole.EndUserRoleCommunityPermissionsProps {
		if (!this.props.communityPermissions) {
			this.props.set('communityPermissions', {});
		}
		return new EndUserRoleCommunityPermissionsDomainAdapter(this.props.communityPermissions);
	}

	get propertyPermissions(): Domain.Contexts.Community.Role.EndUserRole.EndUserRolePropertyPermissionsProps {
		if (!this.props.propertyPermissions) {
            this.props.set('propertyPermissions', {});
		}
		return new EndUserRolePropertyPermissionsDomainAdapter(this.props.propertyPermissions);
	}

	get serviceTicketPermissions(): Domain.Contexts.Community.Role.EndUserRole.EndUserRoleServiceTicketPermissionsProps {
		if (!this.props.serviceTicketPermissions) {
            this.props.set('serviceTicketPermissions', {});
		}
		return new EndUserRoleServiceTicketPermissionsDomainAdapter(this.props.serviceTicketPermissions);
	}

	get servicePermissions(): Domain.Contexts.Community.Role.EndUserRole.EndUserRoleServicePermissionsProps {
		if (!this.props.servicePermissions) {
			this.props.set('servicePermissions', {});
		}
		return new EndUserRoleServicePermissionsDomainAdapter(this.props.servicePermissions);
	}

	get violationTicketPermissions(): Domain.Contexts.Community.Role.EndUserRole.EndUserRoleViolationTicketPermissionsProps {
		if (!this.props.violationTicketPermissions) {
			this.props.set('violationTicketPermissions', {});
		}
		return new EndUserRoleViolationTicketPermissionsDomainAdapter(this.props.violationTicketPermissions);
	}
}

export class EndUserRoleServicePermissionsDomainAdapter
	implements Domain.Contexts.Community.Role.EndUserRole.EndUserRoleServicePermissionsProps
{
	public readonly props: EndUserRoleServicePermissions;
	constructor(props: EndUserRoleServicePermissions) {
		this.props = props;
	}
	get canManageServices(): boolean {
		return this.props.canManageServices;
	}
	set canManageServices(value: boolean) {
		this.props.canManageServices = value;
	}
}

export class EndUserRoleServiceTicketPermissionsDomainAdapter
	implements Domain.Contexts.Community.Role.EndUserRole.EndUserRoleServiceTicketPermissionsProps
{
	public readonly props: EndUserRoleServiceTicketPermissions;
	constructor(props: EndUserRoleServiceTicketPermissions) {
		this.props = props;
	}
	get canCreateTickets(): boolean {
		return this.props.canCreateTickets;
	}
	set canCreateTickets(value: boolean) {
		this.props.canCreateTickets = value;
	}
	get canManageTickets(): boolean {
		return this.props.canManageTickets;
	}
	set canManageTickets(value: boolean) {
		this.props.canManageTickets = value;
	}
	get canAssignTickets(): boolean {
		return this.props.canAssignTickets;
	}
	set canAssignTickets(value: boolean) {
		this.props.canAssignTickets = value;
	}
	get canWorkOnTickets(): boolean {
		return this.props.canWorkOnTickets;
	}
	set canWorkOnTickets(value: boolean) {
		this.props.canWorkOnTickets = value;
	}
}

export class EndUserRoleViolationTicketPermissionsDomainAdapter
	implements Domain.Contexts.Community.Role.EndUserRole.EndUserRoleViolationTicketPermissionsProps
{
	public readonly props: EndUserRoleViolationTicketPermissions;
	constructor(props: EndUserRoleViolationTicketPermissions) {
		this.props = props;
	}
	get canCreateTickets(): boolean {
		return this.props.canCreateTickets;
	}
	set canCreateTickets(value: boolean) {
		this.props.canCreateTickets = value;
	}
	get canManageTickets(): boolean {
		return this.props.canManageTickets;
	}
	set canManageTickets(value: boolean) {
		this.props.canManageTickets = value;
	}
	get canAssignTickets(): boolean {
		return this.props.canAssignTickets;
	}
	set canAssignTickets(value: boolean) {
		this.props.canAssignTickets = value;
	}
	get canWorkOnTickets(): boolean {
		return this.props.canWorkOnTickets;
	}
	set canWorkOnTickets(value: boolean) {
		this.props.canWorkOnTickets = value;
	}
}

export class EndUserRolePropertyPermissionsDomainAdapter
	implements Domain.Contexts.Community.Role.EndUserRole.EndUserRolePropertyPermissionsProps
{
	public readonly props: EndUserRolePropertyPermissions;
	constructor(props: EndUserRolePropertyPermissions) {
		this.props = props;
	}
	get canManageProperties(): boolean {
		return this.props.canManageProperties;
	}
	set canManageProperties(value: boolean) {
		this.props.canManageProperties = value;
	}
	get canEditOwnProperty(): boolean {
		return this.props.canEditOwnProperty;
	}
	set canEditOwnProperty(value: boolean) {
		this.props.canEditOwnProperty = value;
	}
}

export class EndUserRoleCommunityPermissionsDomainAdapter
	implements Domain.Contexts.Community.Role.EndUserRole.EndUserRoleCommunityPermissionsProps
{
	public readonly props: EndUserRoleCommunityPermissions;
	constructor(props: EndUserRoleCommunityPermissions) {
		this.props = props;
	}

	get canManageEndUserRolesAndPermissions(): boolean {
		return this.props.canManageRolesAndPermissions;
	}
	set canManageEndUserRolesAndPermissions(value: boolean) {
		this.props.canManageRolesAndPermissions = value;
	}

	get canManageCommunitySettings(): boolean {
		return this.props.canManageCommunitySettings;
	}
	set canManageCommunitySettings(value: boolean) {
		this.props.canManageCommunitySettings = value;
	}

	get canManageSiteContent(): boolean {
		return this.props.canManageSiteContent;
	}
	set canManageSiteContent(value: boolean) {
		this.props.canManageSiteContent = value;
	}

	get canManageMembers(): boolean {
		return this.props.canManageMembers;
	}
	set canManageMembers(value: boolean) {
		this.props.canManageMembers = value;
	}

	get canEditOwnMemberProfile(): boolean {
		return this.props.canEditOwnMemberProfile;
	}
	set canEditOwnMemberProfile(value: boolean) {
		this.props.canEditOwnMemberProfile = value;
	}

	get canEditOwnMemberAccounts(): boolean {
		return this.props.canEditOwnMemberAccounts;
	}
	set canEditOwnMemberAccounts(value: boolean) {
		this.props.canEditOwnMemberAccounts = value;
	}
}

