# Domain Package Barrel Cleanup - Migration Guide

## Overview

The `@ocom/domain` package has been refactored to remove barrel files (index.ts re-exports) and replace them with aggregate export files. This improves build performance, reduces module graph complexity, and makes the codebase more maintainable.

## What Changed

### Before (Barrel Pattern)
```typescript
// Multiple index.ts files acting as barrels
import type { Domain } from '@ocom/domain';
type MyCommunity = Domain.Contexts.Community.Community.CommunityEntityReference;
```

### After (Aggregate Files)
```typescript
// Direct imports from aggregate files
import type { CommunityEntityReference } from '@ocom/domain/community';
type MyCommunity = CommunityEntityReference;
```

## New Package Structure

The domain package now exports the following entry points:

- `@ocom/domain` - Main entry (backward compatible Domain namespace + new exports)
- `@ocom/domain/case` - Case context aggregate (ServiceTicket, ViolationTicket)
- `@ocom/domain/community` - Community context aggregate (Community, Member, Roles)
- `@ocom/domain/property` - Property context aggregate
- `@ocom/domain/service` - Service context aggregate
- `@ocom/domain/user` - User context aggregate (EndUser, StaffUser, VendorUser, StaffRole)
- `@ocom/domain/events` - Domain events
- `@ocom/domain/services` - Domain services
- `@ocom/domain/iam` - Identity and Access Management
- `@ocom/domain/passport` - Passport types and factory

## Migration Examples

### 1. Community Entity References

**Before:**
```typescript
import type { Domain } from '@ocom/domain';

function processCommunity(
  community: Domain.Contexts.Community.Community.CommunityEntityReference
): void {
  // ...
}
```

**After:**
```typescript
import type { CommunityEntityReference } from '@ocom/domain/community';

function processCommunity(community: CommunityEntityReference): void {
  // ...
}
```

### 2. Member Entity References

**Before:**
```typescript
import type { Domain } from '@ocom/domain';

type MemberRef = Domain.Contexts.Community.Member.MemberEntityReference;
```

**After:**
```typescript
import type { MemberEntityReference } from '@ocom/domain/community';

type MemberRef = MemberEntityReference;
```

### 3. Passport Factory

**Before:**
```typescript
import { Domain } from '@ocom/domain';

const passport = Domain.PassportFactory.forMember(endUser, member, community);
```

**After:**
```typescript
import { PassportFactory } from '@ocom/domain';

const passport = PassportFactory.forMember(endUser, member, community);
```

### 4. Domain Events

**Before:**
```typescript
import { Domain } from '@ocom/domain';

const { EventBusInstance, CommunityCreatedEvent } = Domain.Events;
```

**After:**
```typescript
import { EventBusInstance, CommunityCreatedEvent } from '@ocom/domain/events';
```

### 5. Domain Services

**Before:**
```typescript
import { Domain } from '@ocom/domain';

await Domain.Services.Community.CommunityProvisioningService.provisionMemberAndDefaultRole(...);
```

**After:**
```typescript
import { Community } from '@ocom/domain/services';

await Community.CommunityProvisioningService.provisionMemberAndDefaultRole(...);
```

### 6. User Context

**Before:**
```typescript
import type { Domain } from '@ocom/domain';

type EndUserRef = Domain.Contexts.User.EndUser.EndUserEntityReference;
type StaffUserRef = Domain.Contexts.User.StaffUser.StaffUserEntityReference;
```

**After:**
```typescript
import type { EndUserEntityReference, StaffUserEntityReference } from '@ocom/domain/user';

type EndUserRef = EndUserEntityReference;
type StaffUserRef = StaffUserEntityReference;
```

## Backward Compatibility

A deprecated `Domain` export is provided for backward compatibility:

```typescript
import { Domain } from '@ocom/domain';

// This still works but is deprecated
const community: typeof Domain.Contexts.Community.CommunityEntityReference = ...;
```

**Important Notes:**
- The Domain export is a const object, not a TypeScript namespace
- Type references require `typeof Domain.Contexts.X` patterns
- This backward compatibility layer will be removed in a future major version
- Migration to direct imports is strongly recommended

## Benefits of Migration

1. **Faster builds**: Eliminates unnecessary re-exports and barrel file processing
2. **Better tree-shaking**: Direct imports allow bundlers to better eliminate unused code
3. **Clearer dependencies**: Explicit imports make it obvious what each file depends on
4. **Smaller module graphs**: Reduces the number of modules loaded during development
5. **Better IDE performance**: Faster auto-imports and IntelliSense

## Migration Strategy

For large codebases, we recommend a phased approach:

### Phase 1: New Code (Immediate)
- All new code should use direct imports from aggregate files
- Do not use the deprecated Domain namespace in new code

### Phase 2: Gradual Migration (Ongoing)
- Update files as you work on them
- Focus on high-traffic areas first
- Use search and replace for mechanical changes

### Phase 3: Complete Migration (Future)
- Once all files are migrated, remove the backward compatibility layer
- Update this as a breaking change in a major version

## Automated Migration

For mechanical replacements, you can use these patterns:

```bash
# Replace Community references
sed -i "s/Domain\.Contexts\.Community\.Community\.CommunityEntityReference/CommunityEntityReference/g" file.ts

# Replace Member references
sed -i "s/Domain\.Contexts\.Community\.Member\.MemberEntityReference/MemberEntityReference/g" file.ts

# Replace PassportFactory references
sed -i "s/Domain\.PassportFactory/PassportFactory/g" file.ts
```

**Note**: Always review automated changes and run tests before committing.

## Support

For questions or issues related to this migration, please:
1. Review this migration guide
2. Check the aggregate export files for available exports
3. Refer to the inline documentation in the source code
4. Open an issue in the repository if needed

## Aggregate File Locations

All aggregate files are located in `/home/runner/work/cellixjs/cellixjs/packages/ocom/domain/src/domain/contexts/`:
- `case.ts` - Case context exports
- `community.ts` - Community context exports
- `property.ts` - Property context exports
- `service.ts` - Service context exports
- `user.ts` - User context exports
- `passport.ts` - Passport types and factory

Each aggregate file has a `//#region Exports` section clearly documenting all available exports.
