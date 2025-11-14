# @ocom/domain

This package contains all the application-specific Domain code implementing Domain-Driven Design (DDD) patterns.

## Package Structure

The domain package is organized using DDD bounded contexts with direct aggregate exports (no barrel files):

```
src/
├── domain/
│   ├── contexts/
│   │   ├── case/
│   │   │   ├── service-ticket/v1/service-ticket-v1.aggregate.ts
│   │   │   └── violation-ticket/v1/violation-ticket-v1.aggregate.ts
│   │   ├── community/
│   │   │   ├── community/community.ts        # Community aggregate
│   │   │   ├── member/member.ts              # Member aggregate
│   │   │   └── role/
│   │   │       ├── end-user-role/end-user-role.ts
│   │   │       └── vendor-user-role/vendor-user-role.ts
│   │   ├── property/property/property.aggregate.ts
│   │   ├── service/service/service.aggregate.ts
│   │   └── user/
│   │       ├── end-user/end-user.ts
│   │       ├── staff-role/staff-role.ts
│   │       ├── staff-user/staff-user.ts
│   │       └── vendor-user/vendor-user.ts
│   ├── events/               # Domain events
│   ├── iam/                  # Identity and access management
│   └── services/             # Domain services
└── index.ts                  # Main package entry point
```

## Import Paths

### Direct Package Exports (Recommended)

Import individual aggregates directly using package exports:

```typescript
// Community aggregate
import type * as Community from '@ocom/domain/contexts/community';
const community: Community.CommunityEntityReference;
const repo: Community.CommunityRepository;

// Member aggregate
import type * as Member from '@ocom/domain/contexts/member';
const member: Member.MemberEntityReference;

// Service Ticket V1 aggregate
import type * as ServiceTicketV1 from '@ocom/domain/contexts/service-ticket/v1';
const ticket: ServiceTicketV1.ServiceTicketV1EntityReference;

// End User Role aggregate
import type * as EndUserRole from '@ocom/domain/contexts/end-user-role';
const role: EndUserRole.EndUserRoleEntityReference;
```

### Available Package Exports

- `@ocom/domain/contexts/community` - Community aggregate
- `@ocom/domain/contexts/member` - Member aggregate
- `@ocom/domain/contexts/end-user-role` - End User Role aggregate
- `@ocom/domain/contexts/vendor-user-role` - Vendor User Role aggregate
- `@ocom/domain/contexts/property` - Property aggregate
- `@ocom/domain/contexts/service` - Service aggregate
- `@ocom/domain/contexts/service-ticket/v1` - Service Ticket V1 aggregate
- `@ocom/domain/contexts/violation-ticket/v1` - Violation Ticket V1 aggregate
- `@ocom/domain/contexts/end-user` - End User aggregate
- `@ocom/domain/contexts/staff-role` - Staff Role aggregate
- `@ocom/domain/contexts/staff-user` - Staff User aggregate
- `@ocom/domain/contexts/vendor-user` - Vendor User aggregate

### Via Domain Namespace (For Existing Code)

The Domain namespace re-exports all aggregates for backward compatibility:

```typescript
import type { Domain } from '@ocom/domain';

const community: Domain.Community.CommunityEntityReference;
const member: Domain.Member.MemberEntityReference;
const ticket: Domain.ServiceTicketV1.ServiceTicketV1EntityReference;
```

### Available Context Exports

- `@ocom/domain/contexts/case` - Case domain (ServiceTicket, ViolationTicket)
- `@ocom/domain/contexts/community` - Community domain (Community, Member, EndUserRole, VendorUserRole)
- `@ocom/domain/contexts/property` - Property domain
- `@ocom/domain/contexts/service` - Service domain
- `@ocom/domain/contexts/user` - User domain (EndUser, StaffUser, VendorUser, StaffRole)

### Migration from Old Barrel Structure

Previous imports using nested `Contexts` namespace:
```typescript
// OLD (deprecated)
import type { Domain } from '@ocom/domain';
const community: Domain.Contexts.Community.Community.CommunityEntityReference;
```

New flat namespace structure:
```typescript
// NEW
import type { Domain } from '@ocom/domain';
const community: Domain.Community.CommunityEntityReference;
```

## Architectural Decisions

- **No Barrel Files**: All barrel files (index.ts that only re-export) have been removed to improve build performance and module graph clarity
- **Aggregate Exports**: Each bounded context exports through a single aggregate file (e.g., `case.ts`, `community.ts`)
- **Explicit Exports**: All exports use explicit named exports in designated `//#region Exports` sections
- **Biome Enforcement**: Barrel file rules (`noBarrelFile`, `noReExportAll`) are enforced at error level for the contexts folder

## Development

```shell
# Build
pnpm run build

# Lint
pnpm run lint

# Test
pnpm run test
```
