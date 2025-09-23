---
applyTo: "packages/api-domain/src/domain/events/**/*.ts"
---

# Copilot Instructions: Domain and Integration Events

See the package-wide instructions in `.github/instructions/api-domain.instructions.md` for general rules, architecture, and conventions.

## Related Instructions
- `.github/instructions/aggregates.instructions.md`

## Purpose
- This folder contains all domain and integration event definitions for the application-specific domain layer.
- Events are used to signal state changes or important actions within or across bounded contexts.

## Architecture & Patterns
- **Domain Events**: Represent significant changes within a bounded context and are processed within the same transactional scope as the aggregate root.
- **Integration Events**: Used for communication across bounded contexts or external systems; processed asynchronously and do not affect aggregate root transactions.
- **Event Classes**: Extend from `DomainSeedwork.CustomDomainEventImpl` and use strongly typed payloads.
- **Event Naming**: Use the `{Aggregate}{Action}Event` convention (e.g., `CommunityCreatedEvent`).

## Coding Conventions
- Export all event types and classes from `index.ts`.
- Each event must have a corresponding payload interface `{Aggregate}{Action}Props` (e.g., `CommunityCreatedProps`).
- Use kebab-case for file names matching the `{aggregate}-{action}.ts` pattern.
- Do not include business logic or event handler implementations in this folder (See `api-event-handler`).

## Folder Structure

### Context-Based Organization
```
src/
└── domain/
    └── events/
        ├── types/
        │   ├── {aggregate}-{action}.ts         # Event type definitions and payload interfaces
        │   ├── README.md                       # Documentation for the purpose and usage of each event type
        │   └── index.ts                        # Export all event types and payload interfaces
        ├── event-bus.ts                        # Exports NodeEventBusInstance from @cellix/event-bus-seedwork-node
```

## Implementation Guidelines

### Example Event File Structure
All events should adhere to the following structure:
```typescript
// src/domain/events/types/community-created.event.ts
export interface CommunityCreatedProps {
    communityId: string;
    name: string;
}
export class CommunityCreatedEvent extends DomainSeedwork.CustomDomainEventImpl<CommunityCreatedProps> {}
```

### Event Bus
```typescript
import type { DomainSeedwork } from '@cellix/domain-seedwork';
import { NodeEventBusInstance } from '@cellix/event-bus-seedwork-node';
export const EventBusInstance: DomainSeedwork.EventBus = NodeEventBusInstance;
```

## Testing
- The events are tested indirectly through the unit test suites for aggregates.
- Do not add standalone unit tests for event classes; ensure event payload validation coverage through aggregate and context tests.