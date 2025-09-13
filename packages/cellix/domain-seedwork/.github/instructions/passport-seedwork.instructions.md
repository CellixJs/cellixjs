---
applyTo: "packages/cellix-domain-seedwork/src/passport-seedwork/**/*.ts"
---
# Copilot Instructions: @cellix-domain-seedwork/src/passport-seedwork

See the package-wide instructions in `.github/instructions/cellix-domain-seedwork.instructions.md` for general rules, architecture, and conventions for this package.

## Purpose
- This folder provides foundational abstractions for authentication and authorization in the Cellix monorepo.
- Contains base interface for custom visa implementation for authentication and authorization.
- All code here is intended to be extended or implemented by downstream domain packages.

## File/Folder Structure
- `passport-seedwork/`
    - Contains core authentication and authorization abstractions.
    - All public classes and interfaces must be exported through `index.ts`.

## Additional Notes for this Folder
- All abstractions here must be generic and reusable across domain contexts.
- Do not add any context-specific logic or dependencies.