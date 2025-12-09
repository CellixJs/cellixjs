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

### Changes Made

1. **Type Annotations in @ocom/persistence**: Added additional type annotations that were not previously required, ensuring compatibility with stricter tsgo type checking.

2. **VSCode Extension**: Added TypeScript (Native Preview) extension to recommended workspace extensions to provide developers with the native preview TypeScript language service.

3. **@types/chai Override**: Pinned `@types/chai` to version `5.0.1` in the root `package.json` overrides to resolve duplicate identifier conflicts with vitest's global type definitions. The newer versions of `@types/chai` (5.2.3+) introduce a `containSubset` assertion that conflicts with vitest's own `containSubset` global type, causing TypeScript compilation errors. This override ensures compatibility between chai testing utilities and vitest's assertion extensions during the tsgo transition period.

4. **tsgo import workarounds**: The `rewriteRelativeImportExtensions` and `allowImportingTsExtensions` flags in our tsconfig still behave inconsistently under `tsgo`, so we added `@ts-ignore` comments to the remaining problematic imports and manually switched those relative paths to `.js` extensions, which keeps the build green while we await more complete resolver support.

### Future Actions

- Reassess removal of the `@typescript/native-preview` package as well as the need to keep certain manual `.js` import extensions once TypeScript 7.0 officially releases and our module resolver behavior stabilizes
- Gradually remove workarounds as dependencies update their type definitions
- Monitor TypeScript 7.0 release notes for any changes affecting our setup
- Remove the `@types/chai` version override once vitest and @types/chai resolve their conflicting `containSubset` type definitions

### Tracking tsgo progress

- Keep an eye on the [TypeScript Go README](https://github.com/microsoft/TypeScript-Go?tab=readme-ov-file#what-works-so-far) for updates on `tsgo`/`@typescript/native-preview` feature parity and resolver improvements so we can reassess the temporary `.js` import extensions when relevant.