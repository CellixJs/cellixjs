import { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import { CommunityDomainAdapter } from '../../community/community.domain-adapter.ts';
import type { Community, CommunityEntityReference, CommunityProps } from '@ocom/domain/contexts/community';
import type { EndUserRole, EndUserRoleProps } from '@ocom/domain/contexts/end-user-role';
import type { Passport } from '@ocom/domain/contexts/passport';
// Runtime imports for class constructors
import { EndUserRole as EndUserRoleClass } from '@ocom/domain/contexts/end-user-role';
import { Community as CommunityClass } from '@ocom/domain/contexts/community';

export class EndUserRoleConverter extends MongooseSeedwork.MongoTypeConverter<
	Models.Role.EndUserRole,
	EndUserRoleDomainAdapter,
	Passport,
	EndUserRole<EndUserRoleDomainAdapter>
> {
	constructor() {
		super(
			EndUserRoleDomainAdapter,
            EndUserRoleClass<EndUserRoleDomainAdapter>
		);
	}
}

export class EndUserRoleDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<Models.Role.EndUserRole>
	implements EndUserRoleProps
{
	// roleName
	get roleName(): string {
		return this.doc.roleName;
	}
	set roleName(roleName: string) {
		this.doc.roleName = roleName;
	}

	get community(): CommunityProps {
		if (!this.doc.community) {
			throw new Error('community is not populated');
		}
		if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
			throw new Error('community is not populated or is not of the correct type');
		}
		return new CommunityDomainAdapter(this.doc.community as Models.Community);
	}
    async loadCommunity(): Promise<CommunityProps> {
        if (!this.doc.community) {
            throw new Error('community is not populated');
        }
        if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
            await this.doc.populate('community');
        }
        return new CommunityDomainAdapter(this.doc.community as Models.Community);
    }
	set community(
		community: CommunityEntityReference | Community<CommunityDomainAdapter>,
	) {
		if (community instanceof CommunityClass) {
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

    get permissions(): EndUserRole.EndUserRolePermissionsProps {
        if (!this.doc.permissions) {
            // ensure subdocument exists
            this.doc.set('permissions', {} as Models.Role.EndUserRolePermissions);
        }
        return new EndUserRolePermissionsDomainAdapter(
            this.doc.permissions as Models.Role.EndUserRolePermissions,
        );
	}

    get roleType(): string | undefined {
        return this.doc.roleType;
    }
}

// Permissions adapter tree
export class EndUserRolePermissionsDomainAdapter
	implements EndUserRole.EndUserRolePermissionsProps
{
	public readonly props: Models.Role.EndUserRolePermissions;
	constructor(props: Models.Role.EndUserRolePermissions) {
		this.props = props;
	}

	get communityPermissions(): EndUserRole.EndUserRoleCommunityPermissionsProps {
		if (!this.props.communityPermissions) {
			this.props.set('communityPermissions', {});
		}
		return new EndUserRoleCommunityPermissionsDomainAdapter(this.props.communityPermissions);
	}

	get propertyPermissions(): EndUserRole.EndUserRolePropertyPermissionsProps {
		if (!this.props.propertyPermissions) {
            this.props.set('propertyPermissions', {});
		}
		return new EndUserRolePropertyPermissionsDomainAdapter(this.props.propertyPermissions);
	}

	get serviceTicketPermissions(): EndUserRole.EndUserRoleServiceTicketPermissionsProps {
		if (!this.props.serviceTicketPermissions) {
            this.props.set('serviceTicketPermissions', {});
		}
		return new EndUserRoleServiceTicketPermissionsDomainAdapter(this.props.serviceTicketPermissions);
	}

	get servicePermissions(): EndUserRole.EndUserRoleServicePermissionsProps {
		if (!this.props.servicePermissions) {
			this.props.set('servicePermissions', {});
		}
		return new EndUserRoleServicePermissionsDomainAdapter(this.props.servicePermissions);
	}

	get violationTicketPermissions(): EndUserRole.EndUserRoleViolationTicketPermissionsProps {
		if (!this.props.violationTicketPermissions) {
			this.props.set('violationTicketPermissions', {});
		}
		return new EndUserRoleViolationTicketPermissionsDomainAdapter(this.props.violationTicketPermissions);
	}
}

export class EndUserRoleServicePermissionsDomainAdapter
	implements EndUserRole.EndUserRoleServicePermissionsProps
{
	public readonly props: Models.Role.EndUserRoleServicePermissions;
	constructor(props: Models.Role.EndUserRoleServicePermissions) {
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
	implements EndUserRole.EndUserRoleServiceTicketPermissionsProps
{
	public readonly props: Models.Role.EndUserRoleServiceTicketPermissions;
	constructor(props: Models.Role.EndUserRoleServiceTicketPermissions) {
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
	implements EndUserRole.EndUserRoleViolationTicketPermissionsProps
{
	public readonly props: Models.Role.EndUserRoleViolationTicketPermissions;
	constructor(props: Models.Role.EndUserRoleViolationTicketPermissions) {
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
	implements EndUserRole.EndUserRolePropertyPermissionsProps
{
	public readonly props: Models.Role.EndUserRolePropertyPermissions;
	constructor(props: Models.Role.EndUserRolePropertyPermissions) {
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
	implements EndUserRole.EndUserRoleCommunityPermissionsProps
{
	public readonly props: Models.Role.EndUserRoleCommunityPermissions;
	constructor(props: Models.Role.EndUserRoleCommunityPermissions) {
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

