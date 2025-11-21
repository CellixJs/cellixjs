import type { MongooseSeedwork } from '@cellix/mongoose-seedwork';
import { CommunityModelFactory } from './models/community/community.model.ts';
import { MemberModelFactory } from './models/member/member.model.ts';
import { EndUserModelFactory } from './models/user/end-user.model.ts';
import { StaffUserModelFactory } from './models/user/staff-user.model.ts';
import { VendorUserModelFactory } from './models/user/vendor-user.model.ts';
import { UserModelFactory } from './models/user/user.model.ts';
import { EndUserRoleModelFactory } from './models/role/end-user-role.model.ts';
import { RoleModelFactory } from './models/role/role.model.ts';
import { StaffRoleModelFactory } from './models/role/staff-role.model.ts';
import { VendorUserRoleModelFactory } from './models/role/vendor-user-role.model.ts';
import { ServiceTicketModelFactory } from './models/case/service-ticket.model.ts';
import { TicketModelFactory } from './models/case/ticket.model.ts';
import { PropertyModelFactory } from './models/property/property.model.ts';
import { ServiceModelFactory } from './models/service/service.model.ts';

export const mongooseContextBuilder = (
initializedService: MongooseSeedwork.MongooseContextFactory,
) => {
const roleModel = RoleModelFactory(initializedService);
const userModel = UserModelFactory(initializedService);
    const ticketModel = TicketModelFactory(initializedService);
return {
        Case: {
ServiceTicket: ServiceTicketModelFactory(ticketModel),
},
Community: {
Community: CommunityModelFactory(initializedService),
},
        Member: {
           Member: MemberModelFactory(initializedService),
        },
        Property: {
Property: PropertyModelFactory(initializedService),
},
        Role: {
            EndUserRole: EndUserRoleModelFactory(roleModel),
StaffRole: StaffRoleModelFactory(roleModel),
VendorUserRole: VendorUserRoleModelFactory(roleModel),
        },
        Service: {
Service: ServiceModelFactory(initializedService),
},
User: {
EndUser: EndUserModelFactory(userModel),
StaffUser: StaffUserModelFactory(userModel),
VendorUser: VendorUserModelFactory(userModel),
},
};
};

export type { Community, CommunityModelType } from './models/community/community.model.ts';
export { CommunityModelFactory, CommunityModelName } from './models/community/community.model.ts';
export type { Member, MemberAccount, MemberCustomView, MemberModelType, MemberProfile } from './models/member/member.model.ts';
export { MemberModelFactory, MemberModelName } from './models/member/member.model.ts';
export type { EndUser, EndUserPersonalInformation, EndUserIdentityDetails, EndUserContactInformation, EndUserModelType } from './models/user/end-user.model.ts';
export { EndUserModelName, EndUserModelFactory } from './models/user/end-user.model.ts';
export type { StaffUser, StaffUserModelType } from './models/user/staff-user.model.ts';
export { StaffUserModelFactory } from './models/user/staff-user.model.ts';
export type { VendorUser, VendorUserModelType, VendorUserPersonalInformation, VendorUserIdentityDetails, VendorUserContactInformation } from './models/user/vendor-user.model.ts';
export { VendorUserModelFactory } from './models/user/vendor-user.model.ts';
export { UserModelFactory } from './models/user/user.model.ts';
export type { EndUserRole, EndUserRoleCommunityPermissions, EndUserRoleModelType, EndUserRolePermissions, EndUserRolePropertyPermissions, EndUserRoleServicePermissions, EndUserRoleServiceTicketPermissions, EndUserRoleViolationTicketPermissions } from './models/role/end-user-role.model.ts';
export { EndUserRoleModelFactory } from './models/role/end-user-role.model.ts';
export { RoleModelFactory } from './models/role/role.model.ts';
export type { StaffRole, StaffRolePermissions, StaffRoleCommunityPermissions, StaffRolePropertyPermissions, StaffRoleServicePermissions, StaffRoleServiceTicketPermissions, StaffRoleViolationTicketPermissions, StaffRoleModelType } from './models/role/staff-role.model.ts';
export { StaffRoleModelFactory } from './models/role/staff-role.model.ts';
export type { VendorUserRole, VendorUserRolePermissions, VendorUserRoleModelType, VendorUserRoleCommunityPermissions, VendorUserRolePropertyPermissions, VendorUserRoleServicePermissions, VendorUserRoleServiceTicketPermissions, VendorUserRoleViolationTicketPermissions } from './models/role/vendor-user-role.model.ts';
export { VendorUserRoleModelFactory } from './models/role/vendor-user-role.model.ts';
export type { ServiceTicket, ServiceTicketActivityDetail, ServiceTicketMessage, ServiceTicketModelType } from './models/case/service-ticket.model.ts';
export { ServiceTicketModelFactory, ServiceTicketModelName } from './models/case/service-ticket.model.ts';
export { TicketModelFactory } from './models/case/ticket.model.ts';
export type { ViolationTicket, ViolationTicketActivityDetail, ViolationTicketMessage, ViolationTicketModelType } from './models/case/violation-ticket.model.ts';
export { ViolationTicketModelFactory, ViolationTicketModelName } from './models/case/violation-ticket.model.ts';
export type { AdditionalAmenity, BedroomDetail, ListingDetail, Location, Point, Property, PropertyModelType } from './models/property/property.model.ts';
export { PropertyModelFactory, PropertyModelName } from './models/property/property.model.ts';
export type { Service, ServiceModelType } from './models/service/service.model.ts';
export { ServiceModelFactory, ServiceModelName } from './models/service/service.model.ts';
