# @cellix/graphql-core

Shared, reusable GraphQL utilities for Cellix framework projects.

## Purpose

This package provides common GraphQL utilities and base schema definitions that can be shared across all Cellix-based applications. It is framework-level code, not application-specific.

In the current Cellix GraphQL architecture, this package owns the shared SDL and resolver helpers, while `@cellix/graphql-codegen` is responsible for turning the SDL into rolldown-friendly generated artifacts consumed at runtime.

## Contents

### Utilities

- **resolver-helper**: Helper functions for working with GraphQL resolvers
  - `getRequestedFieldPaths()`: Extracts requested field paths from GraphQL resolve info

### Schema Definitions

- **schema/core**: Base schema definitions and scalar types
  - `base.graphql`: Core schema with Query and Mutation base types
  - `graphql-tools-scalars.ts`: GraphQL scalar types utilities

- **schema/interfaces**: Reusable interface definitions
  - `mongo-base.graphql`: Base interface for MongoDB models
  - `mongo-subdocument.graphql`: Interface for MongoDB subdocuments
  - `mutation-result.graphql`: Standard mutation result interface

- **schema/shared**: Shared type definitions
  - `blob-auth-header.graphql`: Types for blob storage authentication
  - `mutation-status.graphql`: Standard mutation status types

### Generated Exports

- **baseCellixTypeDefs**: A generated static array of the framework SDL exported from `@cellix/graphql-core`

## Usage

```typescript
import { getRequestedFieldPaths, Scalars, baseCellixTypeDefs } from '@cellix/graphql-core';

// Use in resolvers
const requestedFields = getRequestedFieldPaths(info);

// Use scalar resolvers
const resolvers = [Scalars.resolvers, myResolvers];

// Use generated base SDL
const typeDefs = [...baseCellixTypeDefs];
```

## How It Fits Together

Cellix projects do not load `.graphql` files from this package dynamically at runtime.

Instead, the recommended flow is:

1. Keep shared framework SDL in `@cellix/graphql-core/src/schema/**/*.graphql`
2. Generate `base-type-defs.generated.ts` using the `@cellix/graphql-codegen/plugins/static-type-defs` plugin
3. Import `baseCellixTypeDefs` from `@cellix/graphql-core`
4. Build the application schema with `buildCellixSchema` from `@cellix/graphql-codegen`

Example:

```typescript
import { buildCellixSchema } from '@cellix/graphql-codegen';
import { baseCellixTypeDefs } from '@cellix/graphql-core';
import { myAppTypeDefs } from './schema-type-defs.generated.ts';
import { myAppResolvers } from './resolver-manifest.generated.ts';

const schema = buildCellixSchema(
  [...myAppTypeDefs],
  myAppResolvers,
);
```

This approach keeps schema assembly statically analyzable so rolldown can bundle GraphQL applications without runtime glob discovery.

## Notes

- The `.graphql` files in this package are source inputs for code generation.
- The primary runtime contract for consumers is the generated `baseCellixTypeDefs` export.
- If you are building a Cellix GraphQL app, prefer the generated static exports over `loadFilesSync` or other runtime file-loading patterns.
