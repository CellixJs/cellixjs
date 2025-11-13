import * as MongooseSeedwork from '@cellix/mongoose-seedwork';
import type { Models } from '@ocom/data-sources-mongoose-models';
import type { Passport } from '@ocom/domain';
import { CommunityDomainAdapter } from '../../community/community.domain-adapter.ts';

import { Community } from '@ocom/domain/contexts/community/community';
import { VendorUserRole, VendorUserRolePermissions } from '@ocom/domain/contexts/community/role/vendor-user-role';
export class VendorUserRoleConverter extends MongooseSeedwork.MongoTypeConverter<
	Models.Role.VendorUserRole,
	VendorUserRoleDomainAdapter,
	Passport,
	VendorUserRole<VendorUserRoleDomainAdapter>
> {
	constructor() {
		super(
			VendorUserRoleDomainAdapter,
            VendorUserRole<VendorUserRoleDomainAdapter>
		);
	}
}

export class VendorUserRoleDomainAdapter
	extends MongooseSeedwork.MongooseDomainAdapter<Models.Role.VendorUserRole>
	implements VendorUserRoleProps
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
		return new CommunityDomainAdapter(this.doc.community as Models.Community.Community);
	}
    async loadCommunity(): Promise<CommunityProps> {
        if (!this.doc.community) {
            throw new Error('community is not populated');
        }
        if (this.doc.community instanceof MongooseSeedwork.ObjectId) {
            await this.doc.populate('community');
        }
        return new CommunityDomainAdapter(this.doc.community as Models.Community.Community);
    }
	set community(
		community: CommunityEntityReference | Community<CommunityDomainAdapter>,
	) {
		if (community instanceof Community) {
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

    get permissions(): VendorUserRolePermissionsProps {
        if (!this.doc.permissions) {
            // ensure subdocument exists
            this.doc.set('permissions', {} as Models.Role.VendorUserRolePermissions);
        }
        return new VendorUserRolePermissionsDomainAdapter(
            this.doc.permissions as Models.Role.VendorUserRolePermissions,
        );
	}

    get roleType(): string | undefined {
        return this.doc.roleType;
    }
}

// Permissions adapter tree
export class VendorUserRolePermissionsDomainAdapter
	implements VendorUserRolePermissionsProps
{
	public readonly props: Models.Role.VendorUserRolePermissions;
	constructor(props: Models.Role.VendorUserRolePermissions) {
		this.props = props;
	}

	get communityPermissions(): VendorUserRoleCommunityPermissionsProps {
		if (!this.props.communityPermissions) {
			this.props.set('communityPermissions', {});
		}
		return new VendorUserRoleCommunityPermissionsDomainAdapter(this.props.communityPermissions);
	}

	get propertyPermissions(): VendorUserRolePropertyPermissionsProps {
		if (!this.props.propertyPermissions) {
            this.props.set('propertyPermissions', {});
		}
		return new VendorUserRolePropertyPermissionsDomainAdapter(this.props.propertyPermissions);
	}

	get serviceTicketPermissions(): VendorUserRoleServiceTicketPermissionsProps {
		if (!this.props.serviceTicketPermissions) {
            this.props.set('serviceTicketPermissions', {});
		}
		return new VendorUserRoleServiceTicketPermissionsDomainAdapter(this.props.serviceTicketPermissions);
	}

	get servicePermissions(): VendorUserRoleServicePermissionsProps {
		if (!this.props.servicePermissions) {
			this.props.set('servicePermissions', {});
		}
		return new VendorUserRoleServicePermissionsDomainAdapter(this.props.servicePermissions);
	}

	get violationTicketPermissions(): VendorUserRoleViolationTicketPermissionsProps {
		if (!this.props.violationTicketPermissions) {
			this.props.set('violationTicketPermissions', {});
		}
		return new VendorUserRoleViolationTicketPermissionsDomainAdapter(this.props.violationTicketPermissions);
	}
}

class VendorUserRoleServicePermissionsDomainAdapter
	implements VendorUserRoleServicePermissionsProps
{
	public readonly props: Models.Role.VendorUserRoleServicePermissions;
	constructor(props: Models.Role.VendorUserRoleServicePermissions) {
		this.props = props;
	}
	get canManageServices(): boolean {
		return this.props.canManageServices;
	}
	set canManageServices(value: boolean) {
		this.props.canManageServices = value;
	}
}

class VendorUserRoleServiceTicketPermissionsDomainAdapter
	implements VendorUserRoleServiceTicketPermissionsProps
{
	public readonly props: Models.Role.VendorUserRoleServiceTicketPermissions;
	constructor(props: Models.Role.VendorUserRoleServiceTicketPermissions) {
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

class VendorUserRoleViolationTicketPermissionsDomainAdapter
	implements VendorUserRoleViolationTicketPermissionsProps
{
	public readonly props: Models.Role.VendorUserRoleViolationTicketPermissions;
	constructor(props: Models.Role.VendorUserRoleViolationTicketPermissions) {
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

class VendorUserRolePropertyPermissionsDomainAdapter
	implements VendorUserRolePropertyPermissionsProps
{
	public readonly props: Models.Role.VendorUserRolePropertyPermissions;
	constructor(props: Models.Role.VendorUserRolePropertyPermissions) {
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

class VendorUserRoleCommunityPermissionsDomainAdapter
	implements VendorUserRoleCommunityPermissionsProps
{
	public readonly props: Models.Role.VendorUserRoleCommunityPermissions;
	constructor(props: Models.Role.VendorUserRoleCommunityPermissions) {
		this.props = props;
	}

	get canManageVendorUserRolesAndPermissions(): boolean {
		return this.props.canManageRolesAndPermissions;
	}
	set canManageVendorUserRolesAndPermissions(value: boolean) {
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