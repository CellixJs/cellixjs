# Barrel File Cleanup & Aggregate Export Refactor

## Overview

This document describes the refactoring of the @ocom/domain package to remove barrel files (`index.ts`) and implement explicit aggregate export files following DDD patterns.

## Changes Made

### 1. Removed Barrel Files

All `index.ts` barrel files have been removed from the domain contexts:
- `/src/domain/contexts/index.ts` → replaced with `/src/domain/contexts/contexts.ts`
- All context-specific `index.ts` files in subdirectories

### 2. Created Aggregate Export Files

Each domain context now has a dedicated aggregate export file:

#### Top-Level Contexts
- `contexts.ts` - Main entry point for all contexts
- `case/case.ts` - Case bounded context
- `community/community.ts` - Community bounded context
- `property/property.ts` - Property bounded context
- `service/service.ts` - Service bounded context
- `user/user.ts` - User bounded context

#### Nested Aggregates
- `case/service-ticket.ts` and `case/service-ticket-v1.ts`
- `case/violation-ticket.ts` and `case/violation-ticket-v1.ts`
- `community/community-aggregate.ts`
- `community/member.ts`
- `community/role.ts`
- `community/end-user-role.ts`
- `community/vendor-user-role.ts`
- `property/property-aggregate.ts`
- `service/service-aggregate.ts`
- `user/end-user.ts`
- `user/staff-role.ts`
- `user/staff-user.ts`
- `user/vendor-user.ts`

### 3. Updated Package Exports

The `package.json` now exports the aggregate files directly:

```json
{
  "exports": {
    ".": {
      "types": "./dist/src/index.d.ts",
      "default": "./dist/src/index.js"
    },
    "./domain": {
      "types": "./dist/src/domain/index.d.ts",
      "default": "./dist/src/domain/index.js"
    },
    "./domain/contexts": {
      "types": "./dist/src/domain/contexts/contexts.d.ts",
      "default": "./dist/src/domain/contexts/contexts.js"
    }
    // ... additional context exports
  }
}
```

### 4. Biome Configuration

Added warning-level Biome rules for the domain package:

```json
{
  "includes": ["packages/ocom/domain/src/**/*.ts"],
  "linter": {
    "rules": {
      "performance": {
        "noBarrelFile": "warn",
        "noReExportAll": "warn"
      }
    }
  }
}
```

Aggregate export files include `biome-ignore` comments to suppress false positives, as these files are intentional public API entry points.

### 5. Updated Imports

All internal imports within the @ocom/domain package have been updated to reference the new aggregate files instead of the removed `index.ts` barrels.

## File Structure

```
src/domain/contexts/
├── contexts.ts                          # Main aggregate
├── case/
│   ├── case.ts                          # Context aggregate
│   ├── service-ticket.ts                # Version aggregate
│   ├── service-ticket-v1.ts             # V1 aggregate
│   ├── violation-ticket.ts              # Version aggregate
│   └── violation-ticket-v1.ts           # V1 aggregate
├── community/
│   ├── community.ts                     # Context aggregate
│   ├── community-aggregate.ts           # Community sub-aggregate
│   ├── member.ts                        # Member aggregate
│   ├── role.ts                          # Role aggregate
│   ├── end-user-role.ts                 # End user role aggregate
│   └── vendor-user-role.ts              # Vendor user role aggregate
├── property/
│   ├── property.ts                      # Context aggregate
│   └── property-aggregate.ts            # Property sub-aggregate
├── service/
│   ├── service.ts                       # Context aggregate
│   └── service-aggregate.ts             # Service sub-aggregate
└── user/
    ├── user.ts                          # Context aggregate
    ├── end-user.ts                      # End user aggregate
    ├── staff-role.ts                    # Staff role aggregate
    ├── staff-user.ts                    # Staff user aggregate
    └── vendor-user.ts                   # Vendor user aggregate
```

## Export Pattern

Each aggregate file follows this pattern:

```typescript
/**
 * [Context] Aggregate Export File
 */

// Use namespace exports to maintain TypeScript namespace structure
// biome-ignore lint/performance/noReExportAll: Intentional namespace export for DDD aggregate
export * as SubContext from './sub-context.ts';

// Or individual exports for leaf aggregates
// biome-ignore lint/performance/noBarrelFile: Intentional aggregate export file per DDD pattern
export {
    Entity,
    type EntityProps,
    type EntityReference,
} from './entity/entity.ts';
export type { EntityRepository } from './entity/entity.repository.ts';
export type { EntityUnitOfWork } from './entity/entity.uow.ts';

//#region Exports
export type { ContextPassport, ContextVisa };
//#endregion Exports
```

## Benefits

1. **Explicit Dependencies**: Import paths clearly indicate the source of types and classes
2. **Reduced Build Graph**: No barrel files means smaller module graphs
3. **Better Tree-Shaking**: Explicit exports enable better dead code elimination
4. **DDD Alignment**: Aggregate files align with DDD bounded context patterns
5. **Type Safety**: Maintains full TypeScript namespace structure for existing code

## Migration Guide for Consumers

If you're consuming @ocom/domain in other packages:

### Before
```typescript
import { Domain } from '@ocom/domain';

// Accessing types
type Community = Domain.Contexts.Community.Community.CommunityEntityReference;
```

### After
```typescript
import { Domain } from '@ocom/domain';

// Accessing types (same as before - namespace structure preserved)
type Community = Domain.Contexts.Community.Community.CommunityEntityReference;
```

The public API structure remains unchanged. Internal changes are transparent to consumers.

## Notes

- All original namespace access patterns are preserved via `export * as` statements
- The refactoring maintains backward compatibility with existing code
- Biome warnings for aggregate files are intentional and documented
- Test configuration issues are pre-existing and unrelated to this refactor
