---
applyTo: "packages/cellix-domain-seedwork/**/*.ts"
---
# Copilot Instructions: @cellix/domain-seedwork

## Purpose
- This package provides foundational abstractions for DDD (Domain-Driven Design) in the Cellix monorepo.
- Implements base classes and interfaces for aggregates, entities, value objects, repositories, domain events, and unit of work.
- Used as "seedwork" for other domain packages in application-specific implementations which make use of the Cellix framework.

## Architecture & Patterns
- **TypeScript only**. Follow modern TypeScript best practices
- **Domain-Driven Design**: Focus on aggregates, entities, value objects, repositories, and domain events.
- **Seedwork**: Classes/interfaces here are intended to be extended or implemented by domain contexts.
- **Mediator/Event Bus**: Event bus abstractions follow the mediator pattern.
- **No direct infrastructure dependencies**: Do not import database, HTTP, or framework-specific code.

## Coding Conventions
- All public classes and interfaces must be exported through `index.ts`.
- Use `readonly` for properties that should not change after construction.
- Prefer composition over inheritance unless extending seedwork base classes.
- Use generic types for flexibility (e.g., in repositories, unit of work).
- Document all public APIs with JSDoc comments.
- Do not include business logic; only provide abstractions and base implementations.

## File/Folder Structure
- `src/`
   - `domain-seedwork/`
   - `passport-seedwork/`

- Do not add or modify the folder structure.
- Keep `readme.md` up to date.

## Testing
- Unit tests are required for classes and functions in this package.
- Use `vitest` for testing. Example: `npm run test:unit -w @cellix/domain-seedwork`.
- Each eligible source code file must have a corresponding `*.test.ts` file and `./features/*.feature` file.

## Examples
- To add a new base DDD class or interface, place it in `src/domain-seedwork/` and export from `index.ts`.
- To add a new base authentication class or interface, place it in `src/passport-seedwork/` and export from `index.ts`.
- To update an abstraction, ensure backward compatibility for downstream packages. Verify that all tests pass after making changes.

## References
- [Seedwork (Martin Fowler)](https://martinfowler.com/bliki/Seedwork.html)
- [DDD Seedwork in .NET](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/seedwork-domain-model-base-classes-interfaces)
- [Google TypeScript Style Guide](https://github.com/google/styleguide?tab=readme-ov-file#google-style-guides)