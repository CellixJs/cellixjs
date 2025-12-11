---
sidebar_position: 23
sidebar_label: 0023 tsgo TypeScript Native Preview Setup
description: "Setting up tsgo with TypeScript/native-preview for enhanced type checking and future compatibility."
status: accepted
date: 2025-12-08
deciders: team
consulted:
informed:
---

# tsgo TypeScript Native Preview Setup

## Context and Problem Statement

To prepare for TypeScript 7.0 and leverage advanced type checking features, we needed to integrate `tsgo` with the `@typescript/native-preview` package. This setup provides early access to upcoming TypeScript enhancements, improving type safety and performance. However, adoption required addressing compatibility issues with existing dependencies and adding missing type annotations in our codebase.

## Decision Drivers

- **Future Compatibility**: Prepare codebase for TypeScript 7.0 features and improvements
- **Enhanced Type Safety**: Leverage stricter type checking capabilities
- **Performance Benefits**: Utilize tsgo's optimizations for better compilation and runtime performance
- **Dependency Compatibility**: Maintain compatibility with existing libraries (mongoose, vitest, etc.)

## Considered Options

- Adopt tsgo with typescript/native-preview immediately
- Wait for official TypeScript 7.0 release
- Use alternative type checking tools

## Decision Outcome

Chosen option: "Adopt tsgo with typescript/native-preview immediately", because it provides early access to beneficial features while allowing us to prepare for the official release. We implemented necessary workarounds for compatibility issues and documented the temporary nature of these changes.

### Consequences

- Good, because early adoption allows us to identify and resolve compatibility issues before the official release
- Good, because enhanced type checking improves code quality and catches potential issues earlier
- Bad, because temporary workarounds (skipLibCheck) reduce type safety in the short term
- Bad, because additional type annotations increase development overhead temporarily

## Validation

- Code compiles successfully with tsgo and typescript/native-preview
- Existing tests pass with skipLibCheck workarounds
- Type annotations in @ocom/persistence are validated through compilation
- CI pipeline build/test time decreased from ~8 minutes to ~6 minutes after tsgo implementation

## Pros and Cons of the Options

### Adopt tsgo with typescript/native-preview immediately

- Good, because it provides early access to TypeScript 7.0 features
- Good, because it allows gradual migration and issue identification
- Neutral, because it requires temporary workarounds
- Bad, because it increases maintenance burden during transition period

### Wait for official TypeScript 7.0 release

- Good, because it avoids compatibility issues and workarounds
- Good, because the official release is more stable
- Bad, because it delays access to beneficial features
- Bad, because it may require more significant changes later

### Use alternative type checking tools

- Good, because it avoids TypeScript-specific issues
- Neutral, because it may provide different benefits
- Bad, because it increases tooling complexity
- Bad, because it may not integrate as well with existing TypeScript ecosystem

## More Information

### Changes Made (tsgo + TS7 compatibility)

1. **Scoped skipLibCheck**: Enabled only in schema-bearing packages that must compile Mongoose `Schema` typings (`@cellix/mongoose-seedwork`, `@ocom/data-sources-mongoose-models`, `@ocom/persistence`). Downstream packages stay strict without `skipLibCheck`.

2. **Mongoose isolation for downstream packages** (temporary):
	- Mongoose-free public facade in `@ocom/persistence/types/public.d.ts` so consumers avoid `Schema` types.
	- Single ambient mongoose stub in `@ocom/service-mongoose/types/mongoose/index.d.ts` with `typeRoots`/`files` wiring to let `typeof import('mongoose')` compile without Schema types.
	- Minimal `MongooseLike` public surface for `ServiceMongoose` (runtime still uses real mongoose) to prevent Schema typings from leaking.
	- Removed duplicate stubs (e.g., in `@ocom/context-spec`) and avoided unnecessary `@cellix/mongoose-seedwork` deps in non-mongoose packages (e.g., `apps/api`).

3. **Type hygiene**: Added missing annotations where tsgo/TS7 required them (notably in `@ocom/persistence`).

4. **@types/chai override**: Pinned to `5.0.1` to avoid the `containSubset` conflict with vitest globals during the transition.

5. **Editor support**: Recommend the TypeScript (Native Preview) VS Code extension to align the language service with tsgo.

### Future Actions

- Reassess the need for the mongoose facade/stub and the scoped `skipLibCheck` once Mongoose/TS7 typings resolve the Schema recursion (TS4109) and tsgo stabilizes.
- Drop the `@types/chai` override when the vitest/`@types/chai` `containSubset` conflict is fixed.
- Reevaluate `@typescript/native-preview` and any remaining tsgo-specific workarounds after the TS7 release.

### Tracking tsgo progress

- Keep an eye on the [TypeScript Go README](https://github.com/microsoft/TypeScript-Go?tab=readme-ov-file#what-works-so-far) for updates on `tsgo`/`@typescript/native-preview` feature parity and resolver improvements so we can reassess the temporary `.js` import extensions when relevant.