# @ocom/domain

This package contains all the application-specific Domain code implementing Domain-Driven Design (DDD) patterns.

## Package Structure

The domain package is organized using DDD bounded contexts with aggregate export files:

```
src/
├── domain/
│   ├── contexts/
│   │   ├── case.ts           # Case domain aggregate (ServiceTicket, ViolationTicket)
│   │   ├── community.ts      # Community domain aggregate (Community, Member, Roles)
│   │   ├── property.ts       # Property domain aggregate
│   │   ├── service.ts        # Service domain aggregate
│   │   ├── user.ts           # User domain aggregate (EndUser, StaffUser, VendorUser, StaffRole)
│   │   └── [context]/        # Individual context implementations
│   ├── events/               # Domain events
│   ├── iam/                  # Identity and access management
│   └── services/             # Domain services
└── index.ts                  # Main package entry point
```

## Import Paths

### After Refactor (Current)

Import domain types using the aggregate files or the Domain namespace:

```typescript
// Via Domain namespace (recommended for existing code)
import type { Domain } from '@ocom/domain';
const community: Domain.Community.CommunityEntityReference;

// Via direct aggregate imports (recommended for new code)
import type * as Community from '@ocom/domain/contexts/community';
const community: Community.CommunityEntityReference;
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
