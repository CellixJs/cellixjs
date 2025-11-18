// Domain events and event bus exports
// This file provides a centralized export point for all event-related functionality
// including the EventBusInstance singleton and all domain event types.

import { EventBusInstance as EventBusInstanceImport } from './event-bus.ts';

// Export the singleton EventBus instance used throughout the application
export const EventBusInstance = EventBusInstanceImport;

// Re-export all event types for convenience
// These event types are used for type-safe event handling across the domain
export type { CommunityCreatedEvent } from './types/community-created.ts';
export type { CommunityDomainUpdatedEvent } from './types/community-domain-updated.ts';
export type { CommunityWhiteLabelDomainUpdatedEvent } from './types/community-white-label-domain-updated.ts';
export type { EndUserCreatedEvent } from './types/end-user-created.ts';
export type { PropertyCreatedEvent } from './types/property-created.ts';
export type { PropertyDeletedEvent } from './types/property-deleted.ts';
export type { PropertyUpdatedEvent } from './types/property-updated.ts';
export type { RoleDeletedReassignEvent } from './types/role-deleted-reassign.ts';
export type { ServiceTicketV1CreatedEvent } from './types/service-ticket-v1-created.ts';
export type { ServiceTicketV1DeletedEvent } from './types/service-ticket-v1-deleted.ts';
export type { ServiceTicketV1UpdatedEvent } from './types/service-ticket-v1-updated.ts';
export type { StaffUserCreatedEvent } from './types/staff-user-created.ts';
export type { VendorUserCreatedEvent } from './types/vendor-user-created.ts';
export type { ViolationTicketV1CreatedEvent } from './types/violation-ticket-v1-created.ts';
export type { ViolationTicketV1DeletedEvent } from './types/violation-ticket-v1-deleted.ts';
export type { ViolationTicketV1UpdatedEvent } from './types/violation-ticket-v1-updated.ts';