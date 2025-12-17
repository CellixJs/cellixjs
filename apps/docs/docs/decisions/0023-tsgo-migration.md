---
sidebar_position: 23
sidebar_label: 0023 tsgo Migration
description: "Documenting the decision to postpone the tsgo migration until TypeScript 7 and surrounding typings stabilize."
status: monitored
date: 2025-12-17
deciders: team
consulted:
informed:
---

# tsgo Migration

## Context and Problem Statement

To prepare for TypeScript 7.0 and leverage advanced type checking features, we evaluated integrating `tsgo` with the `@typescript/native-preview` package. Early experimentation delivered potential benefits like stricter type checking and faster incremental builds, but the implementation introduced compatibility issues with critical dependencies (notably mongoose `Schema` typings) and required temporary workarounds that increased maintenance burden. After attempting the mongoose 9.0.1 upgrade and encountering issues from having exactOptionalPropertyTypes enabled in our tsconfig, we reverted to the 8.17.0 version and now prefer to keep the existing `tsc`-based workflow stable while TypeScript 7 matures.

## Decision Drivers

- **Future Compatibility**: Monitor TypeScript 7.0 while waiting for first-party stability
- **Enhanced Type Safety**: Track `tsgo` and `@typescript/native-preview` to adopt them when the benefits outweigh the costs
- **Performance Balance**: Avoid premature optimization if it impairs the developer experience today
- **Dependency Compatibility**: Keep mongoose, Vitest, and other core libraries running on the officially supported TypeScript toolchain
- **Stability**: Roll back the mongoose 9.0.1 upgrade (migrating back to 8.17.0) because the new typings triggered exactOptionalPropertyTypes issues in our tsconfig that the tsgo build could not resolve.

## Considered Options

- Adopt tsgo with @typescript/native-preview immediately
- Wait for official TypeScript 7.0 release
- Use alternative type checking tools

## Decision Outcome

Chosen option: "Wait for the official TypeScript 7.0 release", because the temporary compatibility workarounds (like `skipLibCheck`, mongoose type facades, and editor extensions) are more disruptive than the incremental benefits right now. We will continue to monitor tsgo and revisit the migration once the tooling and type definitions stabilize.

### Consequences

- Good, because we avoid fragile tsgo-specific workarounds across multiple packages
- Good, because we reverted the mongoose upgrade back to 8.17.0 which preserves a stable dependency while we wait for tsgo/mongoose 9.x typings to catch up
- Neutral, because we lose early access to TS7 features but gain confidence in the current compiler
- Bad, because we defer potential compilation and runtime benefits from tsgo until later

## Validation

- We exercised `tsgo --build` across every workspace package and hit new type errors that do not occur when running `tsc` with no changes: mongoose emits a `TS4109` circular-reference failure (notably under *packages/ocom/data-sources-mongoose-models/dist/src/index.d.ts*), and our own code surfaces `TS2742` “inferred type cannot be named” errors.
- The only ways we could persuade the `tsgo` compiler to finish were enabling `skipLibCheck` everywhere (even downstream packages that never touch mongoose) or layering temporary stub mongoose typings that hid the real errors. Neither approach felt acceptable because they amount to manual workarounds for tsgo bugs instead of a stable migration path.
- Because there was no way to satisfy the CI pipeline when using `tsgo` without those temporary changes, we kept the existing `tsc` workflow and decided to revisit `tsgo` once TypeScript/mongoose typings stabilize.

## More Information

- Every `tsgo`-specific configuration was removed: `tsconfig` files extend the base config without `skipLibCheck`, package scripts call `tsc`, and temporary mongoose type facades/stubs have been deleted.
- The TypeScript (Native Preview) VS Code recommendation and other editor guidance were reverted to the standard experience.
- We continue to monitor TypeScript Go for resolver improvements but intend to revisit this work only once TypeScript 7.0 and the related mongoose typings (TS4109) stabilize.
- `pnpm run verify` remains the benchmark for verifying the migration when it is reattempted.

### Future Actions

- Track the TypeScript 7.0 release timeline and tsgo stability so we know when a second attempt makes sense.
- Keep an eye on mongoose typings (TS4109) to see when the schema recursion issues resolve without requiring `skipLibCheck` or manual stubs.
- Reassess the necessity of the `@types/chai` pin whenever the Vitest globals conflict is resolved. Needed to pin `@types/chai@5.0.1` in root `package.json` overrides section to avoid conflicts with Vitest-provided types when using `tsgo`.
- Document any follow-up migration plan before reintroducing new tooling.

### Weekly Reassessment

- Every Monday, review the linked issues to see if the tsgo blockers have advanced toward resolution. Update this ADR and the main [README.md](https://github.com/cellixjs/cellixjs)'s In Progress ADRs section with the new status and any clean-up that becomes relevant.
- **Schema circular reference (TS4109):** [Issue 929](https://github.com/microsoft/typescript-go/issues/929) (monitor the related [issue 948](https://github.com/microsoft/typescript-go/issues/948) even though it is closed in case the problem reappears).
- **Inferred type cannot be named (TS2742):** [Issue 2220](https://github.com/microsoft/typescript-go/issues/2220) plus the related reports [2233](https://github.com/microsoft/typescript-go/issues/2233) and [2277](https://github.com/microsoft/typescript-go/issues/2277).
- **tsgo issue queue:** Refer to the [TypeScript Go issue tracker](https://github.com/microsoft/typescript-go/issues) as needed to find other relevant bugs that impact our planned migration.

### Remediation plan after TypeScript 7 GA

- Revisit this ADR and either mark it as superseded or update it with the new migration plan.
- If tsgo proves stable, reintroduce the necessary configuration changes (plugin, `@typescript/native-preview`, tsconfig tweaks) while following the previously documented steps for mongoose isolation.
- Remove any remaining `skipLibCheck` flags and stub type facades once the official mongoose typings can coexist with tsgo.
- Unpin `@types/chai` when the Vitest conflict is fully fixed and the default types align with our usage.
- Run `pnpm run verify` again to prove that linting, building, testing, SonarCloud, and Snyk scans pass without requiring temporary compiler workarounds for tsgo.

### Tracking tsgo progress

- Keep an eye on the [TypeScript Go README](https://github.com/microsoft/TypeScript-Go?tab=readme-ov-file#what-works-so-far) for updates on `tsgo`/`@typescript/native-preview` feature parity and resolver improvements so we can reassess the temporary `.js` import extensions when relevant.