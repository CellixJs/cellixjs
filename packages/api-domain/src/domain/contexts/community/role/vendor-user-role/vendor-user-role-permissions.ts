import { VendorUserRoleCommunityPermissions, type VendorUserRoleCommunityPermissionsEntityReference, type VendorUserRoleCommunityPermissionsProps } from './vendor-user-role-community-permissions.ts';
import type { CommunityVisa } from "../../community.visa.ts";
import { VendorUserRolePropertyPermissions, type VendorUserRolePropertyPermissionsEntityReference, type VendorUserRolePropertyPermissionsProps } from './vendor-user-role-property-permissions.ts';
import { VendorUserRoleServiceTicketPermissions, type VendorUserRoleServiceTicketPermissionsEntityReference, type VendorUserRoleServiceTicketPermissionsProps } from './vendor-user-role-service-ticket-permissions.ts';
import { VendorUserRoleServicePermissions, type VendorUserRoleServicePermissionsEntityReference, type VendorUserRoleServicePermissionsProps } from './vendor-user-role-service-permissions.ts';
import { VendorUserRoleViolationTicketPermissions, type VendorUserRoleViolationTicketPermissionsEntityReference, type VendorUserRoleViolationTicketPermissionsProps } from './vendor-user-role-violation-ticket-permissions.ts';
import { DomainSeedwork } from '@cellix/domain-seedwork';

export interface VendorUserRolePermissionsProps extends DomainSeedwork.ValueObjectProps {
  readonly communityPermissions: VendorUserRoleCommunityPermissionsProps;
  readonly propertyPermissions: VendorUserRolePropertyPermissionsProps;
  readonly serviceTicketPermissions: VendorUserRoleServiceTicketPermissionsProps;
  readonly servicePermissions: VendorUserRoleServicePermissionsProps;
  readonly violationTicketPermissions: VendorUserRoleViolationTicketPermissionsProps;
}

export interface VendorUserRolePermissionsEntityReference extends Readonly<Omit<VendorUserRolePermissionsProps, 
  'communityPermissions' | 'propertyPermissions' | 'serviceTicketPermissions' | 'servicePermissions' | 'violationTicketPermissions' >> {
  readonly communityPermissions: VendorUserRoleCommunityPermissionsEntityReference;
  readonly propertyPermissions: VendorUserRolePropertyPermissionsEntityReference;
  readonly serviceTicketPermissions: VendorUserRoleServiceTicketPermissionsEntityReference;
  readonly servicePermissions: VendorUserRoleServicePermissionsEntityReference;
  readonly violationTicketPermissions: VendorUserRoleViolationTicketPermissionsEntityReference;
}

export class VendorUserRolePermissions extends DomainSeedwork.ValueObject<VendorUserRolePermissionsProps> implements VendorUserRolePermissionsEntityReference {
  private readonly visa: CommunityVisa;
  constructor(props: VendorUserRolePermissionsProps,visa:CommunityVisa) { 
    super(props); 
    this.visa = visa;
  }

  get communityPermissions(): VendorUserRoleCommunityPermissions {
    return new VendorUserRoleCommunityPermissions(this.props.communityPermissions,this.visa);
  }
  get propertyPermissions(): VendorUserRolePropertyPermissions {
    return new VendorUserRolePropertyPermissions(this.props.propertyPermissions,this.visa);
  }
  get serviceTicketPermissions(): VendorUserRoleServiceTicketPermissions {
    return new VendorUserRoleServiceTicketPermissions(this.props.serviceTicketPermissions,this.visa);
  }
  get servicePermissions(): VendorUserRoleServicePermissions {
    return new VendorUserRoleServicePermissions(this.props.servicePermissions,this.visa);
  }
  get violationTicketPermissions(): VendorUserRoleViolationTicketPermissions {
    return new VendorUserRoleViolationTicketPermissions(this.props.violationTicketPermissions,this.visa);
  }
}