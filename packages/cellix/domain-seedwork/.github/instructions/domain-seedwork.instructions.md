---
applyTo: "packages/cellix-domain-seedwork/src/domain-seedwork/**/*.ts"
---
# Copilot Instructions for src/domain-seedwork

See the package-wide instructions in `.github/instructions/cellix-domain-seedwork.instructions.md` for general rules, architecture, and conventions for this package.

## Purpose
- This folder provides foundational abstractions for Domain-Driven Design (DDD) in the Cellix monorepo.
- Contains base classes and interfaces for aggregates, entities, value objects, repositories, domain events, event bus, type converters, and unit of work.
- All code here is intended to be extended or implemented by downstream domain packages.

## File/Folder Structure
- `domain-seedwork/`
    - Contains core DDD abstractions.
    - Each concept (aggregate root, entity, value object, etc.) should have its own file.
    - All public classes and interfaces must be exported through `index.ts`.

## Additional Notes for this Folder
- All abstractions here must be generic and reusable across domain contexts.
- Do not add any context-specific logic or dependencies.
- Each concept (aggregate, entity, value object, etc.) should have its own file and be exported from `index.ts`.