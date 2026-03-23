---
sidebar_position: 25
sidebar_label: 0025 Rolldown for Azure Functions
description: "Adopt Rolldown as the Cellix-standard bundler for Azure Functions API apps and require static GraphQL code generation for bundler compatibility."
status: accepted
date: 2026-03-23
contact: nnoe14 gidich
deciders: nnoce14 gidich etang93 mgupta83 iwilson dheruwala
---

# Adopt Rolldown for Azure Functions API Applications and Static GraphQL Code Generation

## Context and Problem Statement

For Azure Functions API applications, we wanted a portable and opinionated bundling approach that could be reused across Cellix projects with minimal setup while still producing a clean deploy artifact for local development and CI/CD. We are looking to optimize the deployed package size and startup performance of our Azure Functions apps, which led us to consider `rolldown` for bundling the compiled TypeScript output.

The existing TypeScript compile output was workable, but it left each application responsible for its own deploy artifact preparation and did not give us a single standardized bundling story. At the same time, our GraphQL schema assembly previously relied on runtime glob-based file discovery, which is a poor fit for static bundlers like Rolldown because the full dependency graph is not visible at bundle time.

## Decision Drivers

- **Consistency across Cellix projects**: Azure Functions apps should follow one standard bundling and deploy preparation pattern
- **Portable framework conventions**: Shared Cellix infrastructure should be reusable across multiple repos with minimal copy/paste changes
- **Static bundle analysis**: The bundler must be able to resolve the full application graph at build time
- **Operational simplicity**: Azure Functions apps should emit a predictable `deploy/` artifact layout
- **Developer experience**: App packages should require only small local config files and scripts
- **GraphQL compatibility**: Schema assembly must remain compatible with bundling and avoid runtime file-system discovery

## Considered Options

- Keep `tsc` output unbundled and manage Azure Functions deploy artifacts per application
- Use a different bundler such as esbuild or tsup with app-local configuration
- Adopt Rolldown with a shared Cellix configuration package and static GraphQL code generation

## Decision Outcome

Chosen option: "Adopt Rolldown with a shared Cellix configuration package and static GraphQL code generation", because it gives us a single opinionated path for Azure Functions API packaging while preserving portability across Cellix projects.

The standard Cellix approach is now:

- Azure Functions API apps compile TypeScript first and then bundle the compiled entrypoint with Rolldown
- Shared bundling and deploy preparation behavior lives in `@cellix/config-rolldown`
- GraphQL schema inputs for bundled applications are generated as static TypeScript modules through `@cellix/graphql-codegen`
- Deploy artifacts are written to a standard `deploy/` layout suitable for local development and CI/CD packaging

### Consequences

- Good, because Azure Functions API apps now have a consistent and reusable bundling story across Cellix repos
- Good, because `@cellix/config-rolldown` centralizes the Rolldown configuration, workspace alias handling, and deploy artifact preparation
- Good, because GraphQL schema assembly is now bundler-friendly through generated static imports and type definition arrays
- Good, because applications only need light project-specific configuration such as `appPackageName`, repo root, and project namespaces
- Neutral, because this approach is intentionally Cellix-opinionated rather than a generic bundler abstraction
- Bad, because GraphQL code generation becomes a required build-time concern for bundled applications
- Bad, because we accept some current Rolldown-specific workarounds while the ecosystem and Rolldown beta behavior continue to mature

## Validation

This decision is validated by the current Cellix implementation:

1. `@apps/api` successfully builds through TypeScript compilation followed by Rolldown bundling.
2. `@cellix/config-rolldown` provides the shared Rolldown config factory and the standard Azure Functions deploy preparation CLI and helper.
3. `@cellix/graphql-codegen` generates static SDL arrays and resolver manifests that replace runtime glob-based GraphQL discovery.
4. The root `gen` task runs before `build`, ensuring generated GraphQL artifacts exist before application bundling.
5. The generated deploy artifact structure is standardized at `deploy/dist/index.js` with supporting Azure Functions files prepared alongside it.

## Pros and Cons of the Options

### Keep `tsc` output unbundled and manage deploy artifacts per application

- Good, because it is simple and requires fewer moving parts
- Good, because it avoids bundler-specific workarounds
- Bad, because each application must own its own deploy artifact conventions
- Bad, because it does not create a shared Cellix-standard packaging path
- Bad, because GraphQL runtime file discovery remains a weaker fit for predictable deployment packaging

### Use a different bundler such as esbuild or tsup with app-local configuration

- Good, because other bundlers are also capable of producing deployable Node/Azure outputs
- Neutral, because the ecosystem familiarity may be higher in some teams
- Bad, because app-local bundler configuration would still leave us with duplicated setup across Cellix repos
- Bad, because it does not by itself solve the GraphQL runtime discovery problem
- Bad, because it provides less leverage than a dedicated Cellix-owned bundling package

### Adopt Rolldown with a shared Cellix configuration package and static GraphQL code generation

- Good, because it gives us one reusable and documented Cellix bundling approach
- Good, because static GraphQL code generation makes the dependency graph visible to the bundler
- Good, because deploy preparation is standardized through the shared package rather than reimplemented per app
- Good, because the same package can be copied or published for future Cellix repos with minimal changes
- Neutral, because applications still own a thin `rolldown.config.ts` and a few project-specific settings
- Bad, because GraphQL codegen conventions must be followed consistently
- Bad, because we depend on Rolldown behavior and occasional ecosystem-specific compatibility workarounds

## More Information

### Why GraphQL code generation is part of this decision

This ADR is not only a bundler choice. It also formalizes a GraphQL packaging rule for bundled Cellix API applications:

- Do not rely on runtime globbing such as `loadFilesSync` or resolver directory scanning at startup for bundled GraphQL applications.
- Generate static TypeScript artifacts instead:
  - static SDL arrays via `@cellix/graphql-codegen/plugins/static-type-defs`
  - static resolver manifests via `@cellix/graphql-codegen/plugins/resolver-manifest`

These generated modules allow Rolldown to statically analyze the GraphQL schema inputs and include them in the final bundle without runtime file-system discovery.

### Standard Cellix package responsibilities

- `@cellix/config-rolldown` owns:
  - the shared Rolldown config factory for Azure Functions API apps
  - workspace alias handling needed for current bundling behavior
  - deploy artifact preparation for Azure Functions
- `@cellix/graphql-codegen` owns:
  - GraphQL codegen plugins that replace runtime discovery with static generated modules
  - the `buildCellixSchema` helper that composes Cellix base schema with application schema inputs
- Application packages own:
  - their local `rolldown.config.ts`
  - their `codegen.yml` project wiring
  - app-specific namespace configuration and GraphQL mappers

### Expected usage for future Cellix projects

New Cellix Azure Functions API apps should:

1. use `@cellix/config-rolldown` as the default Rolldown integration
2. generate GraphQL artifacts with `@cellix/graphql-codegen` before build
3. avoid runtime GraphQL file discovery in bundled apps
4. keep project-specific configuration thin and leave the bundling conventions to the shared Cellix packages
