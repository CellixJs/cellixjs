---
applyTo: "packages/api-persistence/**/*.ts"
---

# API Persistence Package Development Guide

## Package Purpose
The `@ocom/api-persistence` package serves as the **Infrastructure Layer** in the DDD architecture, implementing data persistence for domain entities using MongoDB through Mongoose. It bridges domain models with data storage via the Repository and Unit of Work patterns.

## Architecture Patterns

### Repository Pattern
- Each domain entity has a corresponding repository implementing domain-specific query methods
- Repositories extend `MongooseSeedwork.MongoRepositoryBase` for standardized CRUD operations
- Custom query methods should be implemented for business-specific data access needs
- Repository classes MUST implement the corresponding domain repository interface

### Unit of Work Pattern
- Each aggregate root has a Unit of Work factory function (`get{Entity}UnitOfWork`)
- Unit of Work instances handle transaction boundaries and event publishing
- Use `MongooseSeedwork.MongoUnitOfWork` with event bus instances for consistency
- UoW coordinates between repository, domain adapter, and event publishing

### Domain Adapter Pattern
- Domain adapters convert between Mongoose documents and domain entities
- Implement `MongooseSeedwork.MongooseDomainAdapter` for property mappings
- Use corresponding converter classes extending `MongooseSeedwork.MongoTypeConverter`
- Adapters provide clean separation between persistence and domain concerns

## Folder Structure

### Context-Based Organization
```
src/
├── index.ts                    # Main persistence factory
├── {context}/                  # Bounded context (e.g., community, user)
│   ├── index.ts               # Context persistence factory
│   └── {entity}/              # Specific entity within context
│       ├── index.ts           # Entity persistence factory
│       ├── {entity}.uow.ts    # Unit of Work factory
│       ├── {entity}.repository.ts         # Repository implementation
│       └── {entity}.domain-adapter.ts     # Domain/persistence mapping
```

### Naming Conventions
- Directories: kebab-case (`end-user/`, `community/`)
- Files: `{entity}.{pattern}.ts` format
- Classes: PascalCase (`CommunityRepository`, `EndUserConverter`)
- Factory functions: `get{Entity}UnitOfWork` format

## Key Dependencies

### Required Peer Dependencies
- `@cellix/domain-seedwork` - Base domain patterns and interfaces
- `@cellix/data-sources-mongoose` - Mongoose integration seedwork
- `@cellix/event-bus-seedwork-node` - Event publishing infrastructure
- `@ocom/api-domain` - Domain models and interfaces
- `@ocom/api-data-sources-mongoose-models` - Mongoose model definitions

### Event Bus Integration
- Use `InProcEventBusInstance` for in-process events
- Use `NodeEventBusInstance` for external event publishing
- Both are required parameters for Unit of Work construction

## Implementation Guidelines

### Factory Pattern Usage
- Each level exposes a factory function accepting `MongooseSeedwork.MongooseContextFactory`
- Main entry point: `Persistence()` function returns `DomainDataSource` interface
- Context factories: `{Context}ContextPersistence()` functions
- Entity factories: `{Entity}Persistence()` functions

### Error Handling
- Validate `MongooseContextFactory` service availability with explicit null checks
- Throw descriptive errors for missing dependencies
- Repository methods should handle not-found cases appropriately

### Type Safety
- Use strict typing with domain interfaces and model types
- Leverage TypeScript's type inference where possible
- Define clear type aliases for complex Mongoose model types

## Testing Considerations
- Mock `MongooseContextFactory` for unit tests
- Test repository methods with actual Mongoose models for integration tests
- Verify domain adapter conversions between document and entity formats
- Ensure Unit of Work properly coordinates transactions and events

## Code Quality Standards
- Follow Biome linting rules with `npm run lint`
- Use TSConfig strict mode settings
- Implement proper error handling and validation
- Maintain clean separation between persistence and domain logic
