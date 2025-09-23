---
applyTo: "packages/api-domain/src/domain/iam/**/*.ts"
---

# Copilot Instructions: Identity Access and Management

See the package-wide instructions in `.github/instructions/api-domain.instructions.md` for general rules, architecture, and conventions.

## Purpose
- This folder contains all identity and access management (IAM) logic for the domain layer.
- Implements passport and visa patterns for authentication and authorization, enforcing permissions for aggregate roots and value objects.
- The aggregates and entities in `src/domain/contexts` make use of the visas to enforce fine-grained access control over their members.

## Architecture & Patterns
- **Passports**:  
    - Passports encapsulate logic for obtaining visas to operate on a specific aggregate within a particular context.
    - Passports contain visa implementations that enforce permissions for the aggregate's operations.
- **Visas**:  
    - Visas encapsulate effective permissions for a user or entity, typically by merging role-based and direct domain permissions.
    - Visas are available on a per-aggregate basis and are used to enforce access control at the aggregate root level.


## Coding Conventions
- Use TypeScript with strict typing.
- Export all public types, interfaces, and classes via `index.ts` files.
- Use kebab-case for file and directory names.
- Document all public APIs with JSDoc comments.
- Do not include infrastructure or persistence logic.

## Folder Structure (Work In Progress)

### Context-Based Organization
```
src/
└── domain/
    └── iam/
        ├── {aggregate}/                        # Subfolder for every applicable aggregate (e.g., user, member)
        │   ├── contexts/                       # Implements passport/visa logic for that aggregate in all contexts
        │   │   ├── {aggregate}.{context}.passport.ts   # Passport implementation for aggregate/context
        │   │   ├── {aggregate}.{context}.visa.ts      # Visa implementation for aggregate/context
        │   │   ├── {aggregate}.{context}.{aggregate}.visa.ts # Optional: for contexts with multiple visas
        │   ├── {aggregate}.passport-base.ts    # Base passport implementation for aggregate
        │   ├── {aggregate}.passport.ts         # Main passport implementation for aggregate
        │   ├── README.md                       # Documentation for Passport and Visa structure for the aggregate
        ├── index.ts                            # Export all {aggregate}.passport.ts files
        ├── README.md                           # Documentation for the available Passports
```

Each context dictates its own passport and visa requirements, which may vary based on the specific use cases and access control needs.
Every subfolder of `iam` must provide an implementation for the passport and visa specs defined in each context.

## Testing
- Unit tests required for all passport and visa logic. 
    - Confirm that each passport correctly provides the necessary visas required by its bounded context
    - Ensure that each visa respects role-based permissions if applicable
    - Verify that the expected behavior for domain permissions is enforced for all relevant scenarios
    - Be sure to test positive and negative scenarios
- Use `vitest` for testing.
- Each source file must have a corresponding `*.test.ts` file and `./feature/*.feature` file.

## References
- [DDD Patterns (Evans, Fowler)](https://martinfowler.com/bliki/DomainDrivenDesign.html)
-