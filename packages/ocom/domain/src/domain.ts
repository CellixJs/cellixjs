// #region Exports - Domain Aggregate
// This file consolidates all exports from the domain layer.
// No barrel files (index.ts) or namespace exports are used.

// Context exports - use direct imports from aggregate files
export * from './domain/contexts/case.ts';
export * from './domain/contexts/community.ts';
export * from './domain/contexts/property.ts';
export * from './domain/contexts/service.ts';
export * from './domain/contexts/user.ts';

// Passport and execution context
export { type Passport, PassportFactory } from './domain/contexts/passport.ts';
export type { DomainExecutionContext } from './domain/domain-execution-context.ts';

// Event bus and domain events
export { EventBusInstance } from './domain/events/event-bus.ts';
export { CommunityCreatedEvent } from './domain/events/types/community-created.ts';

// Domain services
export { CommunityProvisioningService } from './domain/services/community/community-provisioning.service.ts';

// IAM
export { GuestPassport } from './domain/iam/guest/guest.passport.ts';
export { MemberPassport } from './domain/iam/member/member.passport.ts';
export { SystemPassport } from './domain/iam/system/system.passport.ts';
export { StaffUserPassport } from './domain/iam/user/staff-user/staff-user.passport.ts';

// #endregion
