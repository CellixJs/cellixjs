import * as DomainSeedwork from '@cellix/domain-seedwork/domain-seedwork';
import {
	VendorUserRolePermissions,
	type VendorUserRolePermissionsEntityReference,
	type VendorUserRolePermissionsProps,
} from './vendor-user-role-permissions.ts';
import * as ValueObjects from './vendor-user-role.value-objects.ts';
import {
	Community,
	type CommunityProps,
	type CommunityEntityReference,
} from '../../community/community.ts';
import type { CommunityVisa } from '../../community.visa.ts';
import { RoleDeletedReassignEvent, type RoleDeletedReassignProps } from '../../../../events/types/role-deleted-reassign.ts';
import type { Passport } from '../../../passport.ts';

export interface VendorUserRoleProps extends DomainSeedwork.DomainEntityProps {
	roleName: string;
	get community(): CommunityProps;
	set community(community: CommunityEntityReference);
	isDefault: boolean;
	permissions: VendorUserRolePermissionsProps;
	readonly roleType: string | undefined;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface VendorUserRoleEntityReference
	extends Readonly<
		Omit<VendorUserRoleProps, 'community' | 'setCommunityRef' | 'permissions'>
	> {
	get community(): Readonly<CommunityEntityReference>;
	get permissions(): Readonly<VendorUserRolePermissionsEntityReference>;
}

export class VendorUserRole<props extends VendorUserRoleProps>
	extends DomainSeedwork.AggregateRoot<props, Passport>
	implements VendorUserRoleEntityReference
{
	private isNew: boolean = false;
	private _visa?: CommunityVisa;

	private get visa(): CommunityVisa {
		if (!this._visa) {
			if (!this.props.community) {
				throw new Error(
					'Community must be set before computing a visa for VendorUserRole',
				);
			}
			this._visa = this.passport.community.forCommunity(this.community);
		}
		return this._visa;
	}

	public static getNewInstance<props extends VendorUserRoleProps>(
		newProps: props,
		passport: Passport,
		roleName: string,
		isDefault: boolean,
		community: CommunityEntityReference,
	): VendorUserRole<props> {
		const role = new VendorUserRole(newProps, passport);
		role.isNew = true;
		role.roleName = roleName;
		role.community = community;
		role.isDefault = isDefault;
		role.isNew = false;
		return role;
	}

	public deleteAndReassignTo(roleRef: VendorUserRoleEntityReference) {
        if (this.isDefault) {
            throw new DomainSeedwork.PermissionError(
                'You cannot delete a default vendor user role',
            );
        }
        if (
            !this.isDeleted &&
            !this.visa.determineIf(
                (permissions) => permissions.canManageVendorUserRolesAndPermissions,
            )
        ) {
            throw new DomainSeedwork.PermissionError(
                'You do not have permission to delete this role',
            );
        }
		super.isDeleted = true;
		this.addIntegrationEvent<RoleDeletedReassignProps, RoleDeletedReassignEvent>(RoleDeletedReassignEvent, {
			deletedRoleId: this.props.id,
			newRoleId: roleRef.id,
		});
	}

	get community(): CommunityEntityReference {
		return new Community(this.props.community, this.passport);
	}
	private set community(community: CommunityEntityReference) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(domainPermissions) =>
					domainPermissions.canManageVendorUserRolesAndPermissions,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to update this role',
			);
		}
		this.props.community = community;
	}

	get isDefault() {
		return this.props.isDefault;
	}
	set isDefault(isDefault: boolean) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) =>
					permissions.canManageVendorUserRolesAndPermissions ||
					permissions.isSystemAccount,
			)
		) {
			throw new DomainSeedwork.PermissionError(
				'You do not have permission to update this role',
			);
		}
		this.props.isDefault = isDefault;
	}

	get roleName() {
		return this.props.roleName;
	}
	set roleName(roleName: string) {
		if (
			!this.isNew &&
			!this.visa.determineIf(
				(permissions) => permissions.canManageVendorUserRolesAndPermissions,
			)
		) {
			throw new DomainSeedwork.PermissionError('Cannot set role name');
		}
		this.props.roleName = new ValueObjects.RoleName(roleName).valueOf();
	}

	get permissions() {
		return new VendorUserRolePermissions(this.props.permissions, this.visa);
	}
	get roleType() {
		return this.props.roleType;
	}
	get createdAt() {
		return this.props.createdAt;
	}
	get updatedAt() {
		return this.props.updatedAt;
	}
	get schemaVersion() {
		return this.props.schemaVersion;
	}
}


//#region Exports
export { VendorUserRole, type VendorUserRoleEntityReference, type VendorUserRoleProps } from './vendor-user-role.ts';
export { VendorUserRoleCommunityPermissions, type VendorUserRoleCommunityPermissionsEntityReference, type VendorUserRoleCommunityPermissionsProps } from './vendor-user-role-community-permissions.ts';
export { VendorUserRolePermissions, type VendorUserRolePermissionsEntityReference, type VendorUserRolePermissionsProps } from './vendor-user-role-permissions.ts';
export { VendorUserRolePropertyPermissions, type VendorUserRolePropertyPermissionsEntityReference, type VendorUserRolePropertyPermissionsProps } from './vendor-user-role-property-permissions.ts';
export { VendorUserRoleServicePermissions, type VendorUserRoleServicePermissionsEntityReference, type VendorUserRoleServicePermissionsProps } from './vendor-user-role-service-permissions.ts';
export { VendorUserRoleServiceTicketPermissions, type VendorUserRoleServiceTicketPermissionsEntityReference, type VendorUserRoleServiceTicketPermissionsProps } from './vendor-user-role-service-ticket-permissions.ts';
export { VendorUserRoleViolationTicketPermissions, type VendorUserRoleViolationTicketPermissionsEntityReference, type VendorUserRoleViolationTicketPermissionsProps } from './vendor-user-role-violation-ticket-permissions.ts';
export type { VendorUserRoleRepository } from './vendor-user-role.repository.ts';
export type { VendorUserRoleUnitOfWork } from './vendor-user-role.uow.ts';
//#endregion Exports