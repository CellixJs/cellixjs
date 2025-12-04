# @cellix/graphql-core

Shared, reusable GraphQL utilities for Cellix framework projects.

## Purpose

This package provides common GraphQL utilities and schema definitions that can be shared across all Cellix-based applications. It is framework-level code, not application-specific.

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

## Usage

```typescript
import { getRequestedFieldPaths, Scalars } from '@cellix/graphql-core';

// Use in resolvers
const requestedFields = getRequestedFieldPaths(info);

// Use scalar resolvers
const resolvers = [Scalars.resolvers, myResolvers];
```

## Schema Files

GraphQL schema files (*.graphql) are included in the package distribution and can be loaded using @graphql-tools/load-files or similar utilities:

```typescript
import { loadFilesSync } from '@graphql-tools/load-files';
import path from 'node:path';

// Load core schema files
const coreSchemaFiles = loadFilesSync(
  path.join(require.resolve('@cellix/graphql-core'), '../../schema/**/*.graphql')
);
```
