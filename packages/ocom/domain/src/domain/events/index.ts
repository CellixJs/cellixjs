// Domain events and event bus exports
import type { DomainSeedwork } from '@cellix/domain-seedwork';
import { EventBusInstance as EventBusInstanceImport } from './event-bus.ts';
export const EventBusInstance: DomainSeedwork.EventBus = EventBusInstanceImport;

// Import and re-export types to avoid export *
import * as TypesImport from './types/index.ts';
export const EventTypes = TypesImport;

// Re-export commonly used event types for convenience
export type { CommunityCreatedEvent } from './types/community-created.ts';