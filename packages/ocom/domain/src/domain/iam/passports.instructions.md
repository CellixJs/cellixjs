---
applyTo: "packages/api-domain/src/domain/iam/**/*.passport.ts"
---

# Copilot Instructions: Passports

## Purpose

- Passports encapsulate authentication and authorization logic for aggregate roots and their related entities within a given bounded context.
- They provide a unified interface for permission checks, context-aware access, and domain-specific authorization strategies.

## Architecture & Patterns
- **Base Passport Class**: Create a base passport class (e.g., `{aggregate}.passport-base.ts`) to encapsulate required entities for authentication and authorization from the perspective of the aggregate. All specific passport classes should extend this base class.
- **Passport Class**: Implement a passport class for the aggregate (e.g `{aggregate}.passport.ts`) which extends the base passport class and implements the *Passport* interface defined in `src/domain/contexts/passport.ts`. This ensures that this specific passport class has all the necessary passport and visa implementations required by each bounded context.
- **Context-Specific Implementations**: In order to satisfy the requirements of the passport class, all passports on the `Passport` interface must have context-specific implementations for their permission checks and authorization logic.
- **Context Integration**: Passports are constructed and injected into aggregate roots and entities to enforce authorization on all mutating operations.
- **Permission Methods**: Expose methods for permission checks, such as `determineIf`, which accept a predicate over the domain permissions.

## Implementation Guidelines

1. **File Naming**
    - Use `{aggregate}.passport.ts` for the main passport class to enforce conformity to the domain context `Passport` requirements.
    - Use `{aggregate}.passport-base.ts` for enforcing required entities necessary for passport logic..

2. **Base Passport Class Structure**
    - Implement a constructor that receives entities relevant to domain permission logic.
    - Constructor can include common logic for verifying these entities within the specific context. For example, comparing object IDs of reference fields between entities to ensure proper authorization.
    - Store these entities as private members.

3. **Permission Checks**
    - All mutating operations in aggregates and entities must use the passport to enforce authorization.
    - Use clear, consistent error messages for permission failures (e.g., "You do not have permission to update this property").

4. **Integration with Aggregates/Entities**
    - Pass the passport instance to aggregates and entities via their constructors.
    - Use the passport's permission-checking methods in setters and domain methods.

5. **Testing**
    - Provide comprehensive unit tests for all passport logic.
    - Cover positive and negative permission scenarios.
    - Use BDD feature files to describe business and permission rules.

6. **Documentation**
    - Document the passport's purpose, supported permissions, and integration points in JSDoc comments and README files.

## Example Structure

```
src/
└── domain/
    └── iam/
        ├── {contexts}/                           # Contains as many passport and visa implementations as defined by the bounded contexts `Passport` interface (`src/domain/contexts/passport.ts`)
        │   ├── {aggregate}.{context}.passport.ts # Context-specific passport implementation for the aggregate using the base passport and context-specific passport interface (`src/domain/contexts/**/*.passport.ts`)
        │   ├── {aggregate}.{context}.visa.ts     # Context-specific visa implementation for the aggregate using 
        ├── {aggregate}.passport.ts
        ├── {aggregate}.passport-base.ts          # Base passport class used by main passport class and context-specific passport implementations
        ├── {aggregate}.passport.test.ts
        └── features/
            └── {aggregate}.passport.feature
```

## Example Passport Class

```typescript
import type { DomainSeedwork } from '@cellix/domain-seedwork';

export class MemberPassport {
  private readonly principal: AuthenticatedPrincipal;
  private readonly permissions: MemberDomainPermissions;

  constructor(principal: AuthenticatedPrincipal, permissions: MemberDomainPermissions) {
    this.principal = principal;
    this.permissions = permissions;
  }

  public determineIf(predicate: (permissions: MemberDomainPermissions) => boolean): boolean {
    return predicate(this.permissions);
  }

  // Additional permission methods as needed
}
```

## Generalization

- Repeat this pattern for any aggregate or context requiring authentication/authorization.
- Adapt permission types and logic to fit the business domain.
- Ensure all domain logic is protected by passport-based permission checks.

---

**Note:** Do not duplicate rules from `iam.instructions.md`. For aggregate/entity integration, follow the conventions in the aggregates and entities instructions. For context structure, see the contexts instructions. For testing, follow the api-domain and context-level testing requirements.
