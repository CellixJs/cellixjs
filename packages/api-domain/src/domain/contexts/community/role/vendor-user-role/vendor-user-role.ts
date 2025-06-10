import { DomainSeedwork } from '@cellix/domain-seedwork';
import { VendorUserRolePermissions, type VendorUserRolePermissionsEntityReference, type VendorUserRolePermissionsProps } from './vendor-user-role-permissions.ts';
import * as ValueObjects from './vendor-user-role.value-objects.ts';
import { Community, type CommunityProps, type CommunityEntityReference } from '../../community/community.ts';
import type { CommunityVisa } from "../../community.visa.ts";
import { RoleDeletedReassignEvent } from '../../../../events/types/role-deleted-reassign.ts';
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

export interface VendorUserRoleEntityReference extends Readonly<Omit<VendorUserRoleProps, 'community' | 'setCommunityRef' | 'permissions'>> {
  get community(): Readonly<CommunityEntityReference>;
  get permissions(): Readonly<VendorUserRolePermissionsEntityReference>;
}

export class VendorUserRole<props extends VendorUserRoleProps> extends DomainSeedwork.AggregateRoot<props, Passport> implements VendorUserRoleEntityReference {
  private isNew: boolean = false;
  private readonly visa: CommunityVisa;

  constructor(props: props, passport: Passport) {
    super(props, passport)
    this.visa = this.passport.community.forCommunity(this.community);
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
    if (!this.isDeleted && !this.isDefault && !this.visa.determineIf((permissions) => permissions.canManageEndUserRolesAndPermissions)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to delete this role');
    }
    super.isDeleted = true;
    this.addIntegrationEvent(RoleDeletedReassignEvent, { deletedRoleId: this.props.id, newRoleId: roleRef.id });
  }


  get community(): CommunityEntityReference {
    return new Community(this.props.community, this.passport);
  }
  private set community(community: CommunityEntityReference) {
    if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageEndUserRolesAndPermissions)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to update this role');
    }
    this.props.community = community;
  }


  get isDefault() {
    return this.props.isDefault;
  }
  set isDefault(isDefault: boolean) {
    if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageEndUserRolesAndPermissions || permissions.isSystemAccount)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to update this role');
    }
    this.props.isDefault = isDefault;
  }

  get roleName() {
    return this.props.roleName;
  }
  set roleName(roleName: string) {
    if (!this.isNew && !this.visa.determineIf((permissions) => permissions.canManageEndUserRolesAndPermissions)) {
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