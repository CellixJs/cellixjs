// Import all aggregate modules
import * as CommunityImport from './contexts/community/community/community.ts';
import * as MemberImport from './contexts/community/member/member.ts';
import * as EndUserRoleImport from './contexts/community/role/end-user-role/end-user-role.ts';
import * as VendorUserRoleImport from './contexts/community/role/vendor-user-role/vendor-user-role.ts';
import * as PropertyImport from './contexts/property/property/property.aggregate.ts';
import * as ServiceImport from './contexts/service/service/service.aggregate.ts';
import * as ServiceTicketV1Import from './contexts/case/service-ticket/v1/service-ticket-v1.aggregate.ts';
import * as ViolationTicketV1Import from './contexts/case/violation-ticket/v1/violation-ticket-v1.aggregate.ts';
import * as EndUserImport from './contexts/user/end-user/end-user.ts';
import * as StaffRoleImport from './contexts/user/staff-role/staff-role.ts';
import * as StaffUserImport from './contexts/user/staff-user/staff-user.ts';
import * as VendorUserImport from './contexts/user/vendor-user/vendor-user.ts';

// Re-export as named constants to create namespace structure
export const Community = CommunityImport;
export const Member = MemberImport;
export const EndUserRole = EndUserRoleImport;
export const VendorUserRole = VendorUserRoleImport;
export const Property = PropertyImport;
export const Service = ServiceImport;
export const ServiceTicketV1 = ServiceTicketV1Import;
export const ViolationTicketV1 = ViolationTicketV1Import;
export const EndUser = EndUserImport;
export const StaffRole = StaffRoleImport;
export const StaffUser = StaffUserImport;
export const VendorUser = VendorUserImport;

// Passport and other domain concerns
export type { Passport } from './contexts/passport.ts';
import { PassportFactory as PassportFactoryImport } from './contexts/passport.ts';
export const PassportFactory = PassportFactoryImport;
export type { DomainExecutionContext } from './domain-execution-context.ts';

// Events and Services (these reference barrel files and need similar treatment)
import * as EventsImport from './events/index.ts';
import * as ServicesImport from './services/index.ts';
export const Events = EventsImport;
export const Services = ServicesImport;
