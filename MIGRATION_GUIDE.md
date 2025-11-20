# Domain Package Migration Guide

## Overview
This guide documents the migration from barrel file exports with namespace patterns (`Domain.Contexts.X.Y`) to direct aggregate file exports in `@ocom/domain`.

## Changes Made

### 1. New Aggregate Export Files Created
- `@ocom/domain/case` - All Case context exports
- `@ocom/domain/community` - All Community context exports  
- `@ocom/domain/property` - All Property context exports
- `@ocom/domain/service` - All Service context exports
- `@ocom/domain/user` - All User context exports
- `@ocom/domain/events` - Event bus and event types
- `@ocom/domain/services` - Domain services (singletons)
- `@ocom/domain/passport` - Passport factory and types
- `@ocom/domain/iam` - IAM passport implementations
- `@ocom/domain/value-objects` - Shared value objects
- `@ocom/domain/domain-execution-context` - Execution context types

### 2. Removed Files
- All 27 `index.ts` barrel files from domain contexts
- 2 obsolete test files (services/index.test.ts, services/community/index.test.ts)

## Migration Instructions

### Before (OLD Pattern)
```typescript
import { Domain, type DomainDataSource } from '@ocom/domain';

// Using namespace pattern
const community: Domain.Contexts.Community.Community.CommunityEntityReference = ...;
const member: Domain.Contexts.Community.Member.MemberEntityReference = ...;

// Accessing services
Domain.Services.Community.CommunityProvisioningService.provisionMemberAndDefaultRole(...);

// Accessing events
const { EventBusInstance, CommunityCreatedEvent } = Domain.Events;
```

### After (NEW Pattern)
```typescript
import type { DomainDataSource } from '@ocom/domain';
import type { CommunityEntityReference, MemberEntityReference } from '@ocom/domain/community';
import { CommunityProvisioningService } from '@ocom/domain/services';
import { EventBusInstance, CommunityCreatedEvent } from '@ocom/domain/events';

// Using direct imports
const community: CommunityEntityReference = ...;
const member: MemberEntityReference = ...;

// Accessing services (now singleton instance)
CommunityProvisioningService.provisionMemberAndDefaultRole(...);

// Accessing events
EventBusInstance.register(CommunityCreatedEvent, ...);
```

## Import Mapping Reference

### Context Imports
| Old Pattern | New Import |
|------------|------------|
| `Domain.Contexts.Case.*` | `@ocom/domain/case` |
| `Domain.Contexts.Community.*` | `@ocom/domain/community` |
| `Domain.Contexts.Property.*` | `@ocom/domain/property` |
| `Domain.Contexts.Service.*` | `@ocom/domain/service` |
| `Domain.Contexts.User.*` | `@ocom/domain/user` |

### Other Imports
| Old Pattern | New Import |
|------------|------------|
| `Domain.Events.*` | `@ocom/domain/events` |
| `Domain.Services.*` | `@ocom/domain/services` |
| `Domain.PassportFactory` | `@ocom/domain/passport` |
| `Domain.Passport` | `@ocom/domain/passport` |

### Type Replacements
Replace long namespace paths with direct type imports:

```typescript
// OLD
Domain.Contexts.Community.Community.CommunityEntityReference
Domain.Contexts.Community.Member.MemberEntityReference
Domain.Contexts.Community.Role.EndUserRole.EndUserRoleEntityReference
Domain.Contexts.User.EndUser.EndUserEntityReference
Domain.Contexts.User.StaffUser.StaffUserEntityReference
Domain.Contexts.Case.ServiceTicket.V1.ServiceTicketV1EntityReference
Domain.Contexts.Property.Property.PropertyEntityReference
Domain.Contexts.Service.Service.ServiceEntityReference

// NEW
CommunityEntityReference
MemberEntityReference
EndUserRoleEntityReference
EndUserEntityReference
StaffUserEntityReference
ServiceTicketV1EntityReference
PropertyEntityReference
ServiceEntityReference
```

## Automated Migration Script

For bulk replacements across packages:

```bash
# Find all files using old pattern
find packages/ apps/ -name "*.ts" -o -name "*.tsx" | \
  xargs grep -l "from '@ocom/domain'" | \
  xargs grep -l "Domain\."

# Replace imports (run from repo root)
find packages/ apps/ -name "*.ts" -o -name "*.tsx" -type f -exec sed -i \
  -e "s/import { Domain,/import {/g" \
  -e "s/import { Domain }/import type { DomainDataSource }/g" \
  -e "s/import type { Domain,/import type {/g" \
  {} \;

# Then manually add specific imports based on usage
```

## Common Patterns to Fix

### Pattern 1: Service Access
```typescript
// OLD
Domain.Services.Community.CommunityProvisioningService.method()

// NEW  
import { CommunityProvisioningService } from '@ocom/domain/services';
CommunityProvisioningService.method()
```

### Pattern 2: Event Access
```typescript
// OLD
const { EventBusInstance, CommunityCreatedEvent } = Domain.Events;

// NEW
import { EventBusInstance, CommunityCreatedEvent } from '@ocom/domain/events';
```

### Pattern 3: Entity Type References
```typescript
// OLD
function foo(community: Domain.Contexts.Community.Community.CommunityEntityReference) { }

// NEW
import type { CommunityEntityReference } from '@ocom/domain/community';
function foo(community: CommunityEntityReference) { }
```

### Pattern 4: Passport Factory
```typescript
// OLD
Domain.PassportFactory.forMember(...)

// NEW
import { PassportFactory } from '@ocom/domain/passport';
PassportFactory.forMember(...)
```

## Affected Packages

The following packages need to be updated (approximately 807 references):
- `@ocom/application-services`
- `@ocom/event-handler` ✅ (DONE)
- `@ocom/graphql`
- `@ocom/persistence`  
- `@ocom/service-mongoose`
- Any other packages importing from `@ocom/domain`

## Validation

After migration, verify:
1. `pnpm run lint` passes for all packages
2. `pnpm run build` succeeds for all packages
3. `pnpm run test` passes for all packages
4. No remaining `Domain.*` references: `grep -r "Domain\." packages/ apps/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v dist`

## Breaking Changes

### For External Consumers
If `@ocom/domain` is consumed by external packages:
1. The main export `@ocom/domain` still provides backwards compatibility
2. Consumers should migrate to subpath exports for tree-shaking benefits
3. The `Domain` namespace export is deprecated and will be removed in a future version

### Internal Changes
- All barrel `index.ts` files removed
- Namespace pattern (`Domain.*`) replaced with direct imports
- Service access changed from namespace to singleton instances

## Benefits

1. **Performance**: Eliminates barrel file overhead and module graph bloat
2. **Tree Shaking**: Better dead code elimination with direct imports
3. **Type Safety**: Clearer type imports without namespace nesting
4. **Maintainability**: Explicit imports make dependencies clearer
5. **Build Speed**: Faster TypeScript compilation without barrel files

## Next Steps

1. Complete migration of remaining packages
2. Run full test suite
3. Update any documentation referencing old patterns
4. Consider deprecation timeline for backwards-compatible main export
