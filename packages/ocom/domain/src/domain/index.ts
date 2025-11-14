// Export individual aggregates directly (no barrels)
export * as Community from './contexts/community/community/community.ts';
export * as Member from './contexts/community/member/member.ts';
export * as EndUserRole from './contexts/community/role/end-user-role/end-user-role.ts';
export * as VendorUserRole from './contexts/community/role/vendor-user-role/vendor-user-role.ts';

export * as Property from './contexts/property/property/property.aggregate.ts';

export * as Service from './contexts/service/service/service.aggregate.ts';

export * as ServiceTicketV1 from './contexts/case/service-ticket/v1/service-ticket-v1.aggregate.ts';
export * as ViolationTicketV1 from './contexts/case/violation-ticket/v1/violation-ticket-v1.aggregate.ts';

export * as EndUser from './contexts/user/end-user/end-user.ts';
export * as StaffRole from './contexts/user/staff-role/staff-role.ts';
export * as StaffUser from './contexts/user/staff-user/staff-user.ts';
export * as VendorUser from './contexts/user/vendor-user/vendor-user.ts';

// Passport and other domain concerns
export { type Passport, PassportFactory } from './contexts/passport.ts';
export type { DomainExecutionContext } from './domain-execution-context.ts';
export * as Events from './events/index.ts';
export * as Services from './services/index.ts';
