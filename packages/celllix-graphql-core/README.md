# @celllix/graphql-core

Core GraphQL utilities and schema building components for Cellix applications.

## Overview

This package provides reusable GraphQL schema building functionality, common GraphQL types, and utilities that reduce boilerplate code in Cellix-based GraphQL applications.

## Features

- **Schema Building**: Generic, configurable schema builder with GraphQL Scalars support
- **Resolver Loading**: Automatic resolver and permissions loading from application directories
- **Common Types**: Pre-configured GraphQL scalar types and interfaces
- **Shared GraphQL Files**: Core GraphQL type definitions that can be reused across applications

## Installation

```bash
npm install @celllix/graphql-core
```

## Usage

### Basic Schema Creation

```typescript
import { createCellixSchemaSimple, createResolverBuilders } from '@celllix/graphql-core';

// Load your application resolvers
const { resolvers } = createResolverBuilders();

// Create executable schema
export const combinedSchema = createCellixSchemaSimple(resolvers);
```

### Advanced Schema Creation

```typescript
import { createCellixSchema, createResolverBuilders, GraphQLScalars } from '@celllix/graphql-core';

const { resolvers, permissions } = createResolverBuilders('/path/to/your/app');

export const combinedSchema = createCellixSchema({
  resolvers,
  customTypeDefs: [
    'type CustomType { id: ID! }',
  ],
  schemaFilesPath: './src/schema/**/*.graphql',
  schemaTransforms: [
    // Add any schema transformations
  ],
});
```

## Code Generation

This package includes a sample codegen configuration. Copy `codegen.sample.yml` to your application and customize it:

```bash
cp node_modules/@celllix/graphql-core/codegen.sample.yml ./codegen.yml
```

Then update the paths and context types to match your application structure.

## Directory Structure

The package includes these shared GraphQL components:

- `core/` - Base GraphQL types and scalars configuration
- `interfaces/` - Common interface definitions (e.g., MongoDB types)  
- `shared/` - Shared utility types and enums

## API Reference

### `createCellixSchema(options)`

Creates a complete executable GraphQL schema with Cellix conventions.

**Parameters:**
- `options.resolvers` - Application resolvers to merge with scalar resolvers
- `options.customTypeDefs` - Custom GraphQL type definitions (optional)
- `options.schemaFilesPath` - Path to load GraphQL schema files from
- `options.schemaTransforms` - Schema transformations to apply

### `createCellixSchemaSimple(resolvers, schemaFilesPath?)`

Convenience function for creating a schema with common patterns.

### `createResolverBuilders(applicationRootPath?)`

Creates resolver and permission builders for the application.

**Returns:**
- `resolvers` - Merged application resolvers
- `permissions` - Merged application permissions

## Contributing

This package follows Cellix architectural patterns and should maintain backward compatibility with existing GraphQL applications.