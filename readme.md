## CellixJS Monorepo

Domain-driven architecture for Azure Functions with GraphQL/REST, MongoDB (Mongoose), and OpenTelemetry. This repo contains the API app, domain, infrastructure, and local dev services.

## Introduction

[Getting Started](https://developers.cellixjs.org/docs/intro):
Our Docusaurus website will help you get started in running and contributing to CellixJS


## Developer usage

- Full local dev with automatic rebuild/restart (builds, starts Azurite, emulators, and watches for changes):

  ```bash
  npm run dev
  ```

  This uses Turborepo's watch mode to automatically rebuild affected packages and restart dev servers when source files change.

- Development with test watching (includes all of the above plus test runners in watch mode):

  ```bash
  npm run dev:test
  ```

- Start only the API app:

  ```bash
  npm run start:api
  ```

- Start the UI (frontend):

  ```bash
  npm run start:ui-community
  ```

- Start emulators individually:

  ```bash
  # MongoDB in-memory replica set
  npm run start-emulator:mongo-memory-server

  # OAuth2/OIDC mock server
  npm run start-emulator:auth-server
  ```

## Scripts

### Development
- **Development with watch mode**: `npm run dev` - Starts all development services with automatic rebuild/restart using Turborepo watch mode
- **Development with tests**: `npm run dev:test` - Same as above but also runs tests in watch mode
- **Build all workspaces**: `npm run build`
- **Build affected packages only**: `npm run build:affected`

### Code Quality
- **Lint all**: `npm run lint`
- **Lint affected packages only**: `npm run lint:affected`
- **Format all**: `npm run format`

### Testing
- `npm run test`
- `npm run test:affected` (affected packages only)
- `npm run test:coverage`
- `npm run test:coverage:affected` (affected packages only)
- `npm run test:integration`
- `npm run test:serenity`
- `npm run test:unit`
- `npm run test:watch` (typically run per workspace package)

## Turborepo Watch Mode

The `dev` script leverages Turborepo's watch mode for intelligent development workflow:

- **Automatic Dependency Tracking**: Changes in source files trigger rebuilds of affected packages only
- **Parallel Execution**: Azurite, code generation, and dev servers run simultaneously
- **No Redundant Watchers**: Single file watching system manages all change detection
- **Efficient Rebuilds**: Only packages with actual changes are rebuilt, cached packages are skipped

### Watch Mode Tasks

- `dev` - Development servers for applications (API, UI)
- `azurite` - Local Azure Storage emulator
- `gen:watch` - GraphQL code generation in watch mode
- `test:watch` - Test runners in watch mode (optional, via `npm run dev:test`)

## Turborepo Optimization

This monorepo uses [Turborepo](https://turbo.build/) for optimized builds and testing:

- **Selective Builds**: Only affected packages are built/tested in CI
- **Remote Caching**: Shared build cache across team and CI (when configured)
- **Local Caching**: Faster subsequent builds on your machine
- **Package Categories**: 
  - Frontend: `ui-*`, `cellix-ui-core` packages
  - Backend: All other packages (excluding mock servers)

For detailed setup and usage, see [TURBOREPO.md](TURBOREPO.md).

## Decisions

- Architecture docs and ADRs in `docusaurus/decisions`

## VS Code tips

- Install recommend VSCode extensions for best developer experience.
- Use built-in tasks to run the Functions host and watch builds.

## Dependency Graph

```mermaid
---
config:
    layout: elk
---
flowchart BT
  %% Keep two top-level groups for clarity
  subgraph ocom
    direction TB
    %% API and services
    ocom_api["@ocom/api"]
    ocom_api_graphql["@ocom/api-graphql"]
    ocom_api_rest["@ocom/api-rest"]
    ocom_api_application_services["@ocom/api-application-services"]
    ocom_api_context_spec["@ocom/api-context-spec"]
    ocom_api_event_handler["@ocom/api-event-handler"]
    ocom_api_domain["@ocom/api-domain"]
    ocom_api_persistence["@ocom/api-persistence"]
    ocom_api_ds_mongoose_models["@ocom/api-data-sources-mongoose-models"]

    %% Infra services (OCom)
    ocom_service_mongoose["@ocom/service-mongoose"]
    ocom_service_blob_storage["@ocom/service-blob-storage"]
    ocom_service_otel["@ocom/service-otel"]
    ocom_service_token_validation["@ocom/service-token-validation"]

    %% Local dev + UI
    ocom_service_oauth2_mock_server["@ocom/service-oauth2-mock-server"]
    ocom_service_mongodb_memory_server["@ocom/service-mongodb-memory-server"]
    ocom_ui_community["@ocom/ui-community"]
  end

  subgraph cellix
    direction TB
    cellix_api_services_spec["@cellix/api-services-spec"]
    cellix_data_sources_mongoose["@cellix/mongoose-seedwork"]
    cellix_domain_seedwork["@cellix/domain-seedwork"]
    cellix_event_bus_seedwork_node["@cellix/event-bus-seedwork-node"]
  end

  %% Dependencies (left -> right for cleaner routing)
  %% Cellix base
  cellix_data_sources_mongoose --> cellix_domain_seedwork
  cellix_data_sources_mongoose --> cellix_event_bus_seedwork_node

  %% OCom -> Cellix
  ocom_api_ds_mongoose_models --> cellix_data_sources_mongoose
  ocom_api_domain --> cellix_domain_seedwork
  ocom_api_domain --> cellix_event_bus_seedwork_node
  ocom_api_persistence --> cellix_domain_seedwork
  ocom_api_persistence --> cellix_event_bus_seedwork_node
  ocom_api_persistence --> cellix_data_sources_mongoose
  ocom_service_mongoose --> cellix_api_services_spec
  ocom_service_mongoose --> cellix_data_sources_mongoose
  ocom_service_blob_storage --> cellix_api_services_spec
  ocom_service_otel --> cellix_api_services_spec
  ocom_service_token_validation --> cellix_api_services_spec

  %% OCom internal
  ocom_api_persistence --> ocom_api_domain
  ocom_api_persistence --> ocom_api_ds_mongoose_models
  ocom_api_context_spec --> ocom_api_persistence
  ocom_api_context_spec --> ocom_service_token_validation
  ocom_api_application_services --> ocom_api_context_spec
  ocom_api_application_services --> ocom_api_domain
  ocom_api_application_services --> ocom_api_persistence
  ocom_api_event_handler --> ocom_api_domain
  ocom_api_event_handler --> ocom_api_persistence
  ocom_api_graphql --> ocom_api_application_services
  ocom_api_graphql --> ocom_api_context_spec
  ocom_api_rest --> ocom_api_application_services
  ocom_api_rest --> ocom_api_context_spec

  %% Composition
  ocom_api --> cellix_api_services_spec
  ocom_api --> ocom_api_context_spec
  ocom_api --> ocom_api_application_services
  ocom_api --> ocom_api_graphql
  ocom_api --> ocom_api_persistence
  ocom_api --> ocom_api_rest
  ocom_api --> ocom_service_blob_storage
  ocom_api --> ocom_service_mongoose
  ocom_api --> ocom_service_otel
  ocom_api --> ocom_service_token_validation

  %% Keep these as standalone to avoid clutter
  ocom_service_oauth2_mock_server
  ocom_service_mongodb_memory_server
  ocom_ui_community
```

## Recipe History

This section preserves prior setup notes and commands for reference as the repo evolved.

```bash
npm i -D concurrently

npm init -w ./packages/api-graphql
npm install @as-integrations/azure-functions @apollo/server graphql @azure/functions -w api-graphql

npm init -w ./packages/api-event-handler

npm init -w ./packages/api-services
npm init -w ./packages/api-rest
npm install @azure/functions -w api-rest

npm init -w ./packages/api-data-sources-domain

npm init -w ./packages/service-otel
npm install @azure/monitor-opentelemetry -w service-otel

npm init -w ./packages/api-persistence

npm init -w ./packages/event-bus-seedwork-node

npm install --save-dev @tsconfig/node20 @tsconfig/node-ts vitest @vitest/coverage-v8
```

## Your feedback matters!

Do you find CellixJS useful? [Give us a ⭐ star on GitHub](https://github.com/cellixjs/cellixjs)!

[![GitHub stars](https://img.shields.io/github/stars/cellixjs/cellixjs)](https://github.com/cellixjs/cellixjs)

Found a bug? Need a feature? Raise [an issue](https://github.com/cellixjs/cellixjs/issues?state=open)
or submit a pull request.

Have feedback? Leave a comment in [CellixJS discussions on GitHub](https://github.com/cellixjs/cellixjs/discussions)


## Project Status

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=simnova_cellix-data-access&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=simnova_cellix-data-access)

[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=simnova_cellix-data-access&metric=bugs)](https://sonarcloud.io/summary/new_code?id=simnova_cellix-data-access)

[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=simnova_cellix-data-access&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=simnova_cellix-data-access)

[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=simnova_cellix-data-access&metric=coverage)](https://sonarcloud.io/summary/new_code?id=simnova_cellix-data-access)

[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=simnova_cellix-data-access&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=simnova_cellix-data-access)

Cellix Build:
[![Build Status](https://dev.azure.com/simnova/ShareThrift/_apis/build/status%2FCellixJs?branchName=main)](https://dev.azure.com/simnova/ShareThrift/_build/latest?definitionId=12&branchName=main)

Cellix Docs Build:
[![Build Status](https://dev.azure.com/simnova/ShareThrift/_apis/build/status%2FCellixJs.cellixjs.docs?branchName=main)](https://dev.azure.com/simnova/ShareThrift/_build/latest?definitionId=15&branchName=main)

## Thanks to all our contributors

[![sharethrift contributors](https://contrib.rocks/image?repo=cellixjs/cellixjs)](https://github.com/cellixjs/cellixjs/graphs/contributors)

[⬆ Back to Top](#table-of-contents)
