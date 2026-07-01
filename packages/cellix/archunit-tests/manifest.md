# @cellix/archunit-tests package manifest

## Purpose

Provide reusable architectural fitness checks that Cellix applications and libraries can register in their own Vitest suites. The package turns framework composition and organization conventions into executable, consumer-owned contracts.

## Scope

The package inspects TypeScript project source and registers Vitest architecture suites. It covers general framework composition, infrastructure initialization, package-layer conventions, and configurable source organization.

## Public API shape

Each focused export module exposes configuration types, asynchronous checkers that return all discovered violations, and `describe...Tests` helpers that register the checker with Vitest.

## Core concepts

- A checker reports violations without loading consumer runtime modules.
- A suite helper lets each consumer own and run its architecture contract.
- Configuration makes project paths and providers explicit, while Serenity bounded contexts are discovered from the consumer's standard context directory instead of embedding OCom-specific names in reusable rules.

## Intended consumers

- Cellix-based API and UI application entrypoints
- Cellix-based Serenity/Cucumber acceptance and end-to-end suites
- Cellix library packages that opt into the existing domain, persistence, GraphQL, application-service, frontend, or general conventions

## Package boundaries

- Public modules expose configuration types, violation-returning checkers, and Vitest suite registration helpers.
- Checks inspect consumer-owned source trees and do not import or execute consumer runtime code.
- Application-specific paths and bounded-context names are supplied by consumers.

## Non-goals

- Owning OCom-specific business rules or package names
- Generating application code
- Replacing behavioral, acceptance, or end-to-end tests
- Enforcing one fixed monorepo topology where a configurable project path is sufficient

## Dependencies / relationships

The package depends on Node filesystem APIs, Vitest for suite registration, and ArchUnit for established dependency checks. Consumer packages depend on a focused package subpath and provide only their own source paths and conventions.

## Testing strategy

Public contract tests exercise success and violation cases through module entrypoints. Real API, UI, acceptance, and E2E packages then register the reusable suites as downstream architecture tests.

## Documentation obligations

Every new public module must be represented in this manifest and the consumer README. Public functions require parameter, return, and usage documentation at their declaration.

## Release-readiness standards

The package build, full package test suite, and representative downstream consumer suites must pass. Additive exports must remain narrowly scoped; removals or behavior changes require downstream impact review and explicit migration guidance.
