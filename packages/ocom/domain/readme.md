# @ocom/domain

This package contains all the application-specific Domain code following Domain-Driven Design (DDD) principles.

## Important: Barrel File Cleanup Complete ✅

**The domain package has been refactored to remove barrel files (index.ts re-exports).** All exports now use aggregate files for better performance and maintainability.

### Migration Required

If you're using the deprecated `Domain.Contexts.*` namespace pattern, please migrate to direct imports:

**Before:**
```typescript
import type { Domain } from '@ocom/domain';
type MyCommunity = Domain.Contexts.Community.Community.CommunityEntityReference;
```

**After:**
```typescript
import type { CommunityEntityReference } from '@ocom/domain/community';
type MyCommunity = CommunityEntityReference;
```

**See [MIGRATION.md](./MIGRATION.md) for complete migration guide and examples.**

## Package Exports

The package now provides these entry points:

- `@ocom/domain` - Main entry (includes backward-compatible Domain namespace)
- `@ocom/domain/case` - Case context (ServiceTicket, ViolationTicket)
- `@ocom/domain/community` - Community context (Community, Member, Roles)
- `@ocom/domain/property` - Property context
- `@ocom/domain/service` - Service context
- `@ocom/domain/user` - User context (EndUser, StaffUser, VendorUser, StaffRole)
- `@ocom/domain/events` - Domain events
- `@ocom/domain/services` - Domain services
- `@ocom/domain/iam` - Identity and Access Management
- `@ocom/domain/passport` - Passport types and factory



Recipe:


```shell
nvm use v20

npm i -D jest @types/jest -w @ocom/domain
npm i -D eslint @eslint/js typescript-eslint -w @ocom/domain
npx jest --init -w @ocom/domain
(choose node)


npm i @lucaspaganini/value-objects -w @ocom/domain

```



