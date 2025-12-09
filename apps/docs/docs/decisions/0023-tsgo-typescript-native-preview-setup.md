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

2. **Temporary skipLibCheck**: Added `skipLibCheck: true` in certain workspace package tsconfigs to work around new tsgo-related type errors in dependencies such as `mongoose` and `vitest`. This is the recommended approach for handling third-party type definition issues rather than using `@ts-ignore` comments, as `skipLibCheck` disables type checking for all declaration files (`.d.ts`) in `node_modules`, which is appropriate for issues outside our control. Using `@ts-ignore` comments would only suppress individual errors in our source files and would not address the root cause of incompatible third-party types.

3. **VSCode Extension**: Added TypeScript (Native Preview) extension to recommended workspace extensions to provide developers with the native preview TypeScript language service.

### Future Actions

- Reassess both the tsconfig `skipLibCheck` options and removal of the `@typescript/native-preview` package once TypeScript 7.0 officially releases
- Gradually remove `skipLibCheck` workarounds as dependencies update their type definitions to be compatible with TypeScript 7.0
- Monitor TypeScript 7.0 release notes for any changes affecting our setup
- Consider using module augmentation for specific type patches only if `skipLibCheck` is insufficient for particular use cases