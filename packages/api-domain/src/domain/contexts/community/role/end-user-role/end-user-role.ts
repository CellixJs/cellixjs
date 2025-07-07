import { EndUserRolePermissions, type EndUserRolePermissionsEntityReference, type EndUserRolePermissionsProps } from './end-user-role-permissions.ts';
import * as ValueObjects from './end-user-role.value-objects.ts';
import { Community, type CommunityProps, type CommunityEntityReference } from '../../community/community.ts';
import type { CommunityVisa } from '../../community.visa.ts';
import { RoleDeletedReassignEvent } from '../../../../events/types/role-deleted-reassign.ts';
import { DomainSeedwork } from '@cellix/domain-seedwork';
import type { Passport } from '../../../passport.ts';

export interface EndUserRoleProps extends DomainSeedwork.DomainEntityProps {
  roleName: string;
  get community(): CommunityProps;
  set community(CommunityEntityReference);
  isDefault: boolean;
  permissions: EndUserRolePermissionsProps;
  readonly roleType: string | undefined;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly schemaVersion: string;
}

export interface EndUserRoleEntityReference extends Readonly<Omit<EndUserRoleProps, 'community' | 'permissions'>> {
  get community(): CommunityEntityReference;
  get permissions(): EndUserRolePermissionsEntityReference;
}

export class EndUserRole<props extends EndUserRoleProps> extends DomainSeedwork.AggregateRoot<props, Passport> implements EndUserRoleEntityReference {
  //#region Fields
  private isNew: boolean = false;
  private readonly visa: CommunityVisa;
  //#endregion Fields

  //#region Constructors
  constructor(props: props, passport: Passport) {
    super(props, passport);
    this.visa = passport.community.forCommunity(this.community);
  }
  //#endregion Constructors

  //#region Methods
  public static getNewInstance<props extends EndUserRoleProps>(newProps: props, passport: Passport, roleName: string, isDefault: boolean, community: CommunityEntityReference): EndUserRole<props> {
    const role = new EndUserRole(newProps, passport);
    role.isNew = true;
    role.roleName = roleName;
    role.community = community;
    role.isDefault = isDefault;
    role.isNew = false;
    return role;
  }
  deleteAndReassignTo(roleRef: EndUserRoleEntityReference) {
    if (!this.isDeleted && !this.isDefault && !this.visa.determineIf((domainPermissions) => domainPermissions.canManageEndUserRolesAndPermissions)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to delete this role');
    }
    super.isDeleted = true;
    this.addIntegrationEvent(RoleDeletedReassignEvent, {
      deletedRoleId: this.props.id,
      newRoleId: roleRef.id
    });
  }
  //#endregion Methods

  //#region Properties
  get roleName() {
    return this.props.roleName;
  }
  set roleName(roleName: string) {
    if (!this.isNew && !this.visa.determineIf((domainPermissions) => domainPermissions.canManageEndUserRolesAndPermissions)) {
      throw new DomainSeedwork.PermissionError('Cannot set role name');
    }
    this.props.roleName = new ValueObjects.RoleName(roleName).valueOf();
  }

  get community(): CommunityEntityReference {
    return new Community(this.props.community, this.passport);
  }
  private set community(community: CommunityEntityReference) {
    if (!this.isNew && !this.visa.determineIf((domainPermissions) => domainPermissions.canManageEndUserRolesAndPermissions)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to update this role');
    }
    this.props.community = community;
  }
  get isDefault() {
    return this.props.isDefault;
  }
  set isDefault(isDefault: boolean) {
    if (!this.isNew && !this.visa.determineIf((domainPermissions) => domainPermissions.canManageEndUserRolesAndPermissions || domainPermissions.isSystemAccount)) {
      throw new DomainSeedwork.PermissionError('You do not have permission to update this role');
    }
    this.props.isDefault = isDefault;
  }
  get permissions() {
    return new EndUserRolePermissions(this.props.permissions, this.visa);
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
  //#endregion Properties
}
