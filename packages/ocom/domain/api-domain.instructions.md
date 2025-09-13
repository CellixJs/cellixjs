---
applyTo: "packages/api-domain/**/*.ts"
---

# Copilot Instructions: api-domain

## Related Instructions
- `.github/instructions/contexts.instructions.md`
- `.github/instructions/events.instructions.md`
- `.github/instructions/iam.instructions.md`

## Purpose
- This package contains all application-specific domain logic for the CellixJS monorepo.
- Implements bounded contexts, aggregates, entities, value objects, domain/integration events, repositories, and unit of work patterns following DDD principles.
- Implements authentication and authorization logic through custom passport and visa strategies which safeguard interactions with aggregate roots.

## Architecture & Patterns
- **Domain-Driven Design (DDD)**: Organize code by bounded context and domain concepts. See `contexts.instructions.md` for more details.
- **Separation of Concerns**: Domain logic only; no infrastructure or application service code.
- **Ubiquitous Language**: Use terminology consistent with domain experts and business requirements.

## Coding Conventions
- Follow the global CellixJS development guide and ADRs for workspace-wide standards
- Export all public types, interfaces, and classes via context-level `index.ts` files.
- Use `readonly` for immutable properties.
- Prefer composition over inheritance unless extending domain base classes.
- Document all public APIs with JSDoc comments.
- Use kebab-case for file and directory names.
- Do not include infrastructure, persistence, or framework-specific code.

## Folder Structure
```
src/
└── domain/
  ├── contexts/         # Bounded contexts containing DDD components
  ├── events/           # Domain and integration event definitions
  ├── iam/              # Identity and access management logic
```

For detailed folder structure and conventions, see the instructions in each subfolder:
- *contexts*: `.github/instructions/contexts.instructions.md`
- *events*: `.github/instructions/events.instructions.md`
- *iam*: `.github/instructions/iam.instructions.md`

## Testing
- Unit tests required for all domain logic.
- Use `vitest` for testing.
- Each eligible source file must have a corresponding *.test.ts and *.feature file under the same context.
    - All aggregates, entities, and value object files must be covered by tests.
    - All visa and passport files must be covered by tests.

## References
- [DDD Patterns (Evans, Fowler)](https://martinfowler.com/bliki/DomainDrivenDesign.html)