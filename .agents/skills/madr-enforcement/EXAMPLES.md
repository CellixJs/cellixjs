# MADR Enforcement Examples

This document provides examples of how to write code that adheres to the architectural standards 
defined in CellixJS MADRs.

## Example 1: Domain-Driven Design (ADR-0003)

### Correct: Implementing a Domain Entity

**File**: `packages/ocom/domain/contexts/property/property.ts`

```typescript
import { AggregateRoot } from '@cellix/domain-seedwork';
import { PropertyId } from './property.value-objects';
import { PropertyAddress } from './property.value-objects';

export interface PropertyProps {
  readonly id: PropertyId;
  readonly address: PropertyAddress;
  readonly ownerId: string;
  readonly listedDate: Date;
}

export interface PropertyReference extends Readonly<PropertyProps> {}

/**
 * Property aggregate root per ADR-0003
 * Manages property information and business rules
 */
export class Property implements AggregateRoot<PropertyProps> {
  // Note: props is not readonly to allow updates via immutable pattern
  // Each update creates a new props object, maintaining immutability
  private props: PropertyProps;
  
  constructor(props: PropertyProps) {
    this.props = props;
  }
  
  get id(): PropertyId {
    return this.props.id;
  }
  
  get address(): PropertyAddress {
    return this.props.address;
  }
  
  /**
   * Business logic: Update property address
   * Enforces business rules in domain layer per ADR-0003
   */
  updateAddress(newAddress: PropertyAddress): void {
    // Validation logic (business rules)
    if (!newAddress.isValid()) {
      throw new Error('Invalid address');
    }
    
    // Update is done via Unit of Work, not direct database access
    this.props = { ...this.props, address: newAddress };
  }
  
  /**
   * Business logic: Check if property is newly listed
   */
  isNewListing(): boolean {
    const daysSinceListing = Date.now() - this.props.listedDate.getTime();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return daysSinceListing < thirtyDays;
  }
  
  // Reference pattern for external access
  toReference(): PropertyReference {
    return {
      id: this.id,
      address: this.address,
      ownerId: this.props.ownerId,
      listedDate: this.props.listedDate,
    };
  }
}
```

### Correct: Value Objects

**File**: `packages/ocom/domain/contexts/property/property.value-objects.ts`

```typescript
import { ValueObject } from '@lucaspaganini/value-objects';

/**
 * PropertyId value object per ADR-0003
 * Immutable identifier for Property aggregate
 */
export class PropertyId extends ValueObject<string> {
  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('PropertyId cannot be empty');
    }
    super(value);
  }
}

/**
 * PropertyAddress value object per ADR-0003
 * Represents compound address data
 */
export interface PropertyAddressData {
  readonly street: string;
  readonly city: string;
  readonly state: string;
  readonly zipCode: string;
}

export class PropertyAddress extends ValueObject<PropertyAddressData> {
  constructor(data: PropertyAddressData) {
    super(data);
  }
  
  get street(): string {
    return this.value.street;
  }
  
  get city(): string {
    return this.value.city;
  }
  
  isValid(): boolean {
    return (
      this.value.street.trim().length > 0 &&
      this.value.city.trim().length > 0 &&
      this.value.state.length === 2 &&
      /^\d{5}$/.test(this.value.zipCode)
    );
  }
  
  // Value objects are immutable - return new instance
  withStreet(newStreet: string): PropertyAddress {
    return new PropertyAddress({
      ...this.value,
      street: newStreet,
    });
  }
}
```

### Correct: Unit of Work

**File**: `packages/ocom/domain/contexts/property/property.uow.ts`

```typescript
import type { UnitOfWork } from '@cellix/domain-seedwork';
import type { Property } from './property';
import type { PropertyId } from './property.value-objects';

/**
 * PropertyUnitOfWork per ADR-0003
 * Transaction boundary for Property aggregate persistence
 */
export interface PropertyUnitOfWork extends UnitOfWork {
  /**
   * Get property by ID
   */
  getById(id: PropertyId): Promise<Property | null>;
  
  /**
   * Add new property to unit of work
   */
  add(property: Property): void;
  
  /**
   * Mark property for deletion
   */
  delete(property: Property): void;
  
  /**
   * Commit all changes atomically
   */
  commit(): Promise<void>;
}
```

### ❌ Incorrect: Domain with Infrastructure

```typescript
// ❌ WRONG: Violates ADR-0003 by mixing domain and infrastructure
import mongoose from 'mongoose';

export class Property {
  constructor(private data: any) {}
  
  // ❌ Database logic in domain layer!
  async save(): Promise<void> {
    await mongoose.model('Property').create(this.data);
  }
  
  // ❌ Database query in domain layer!
  static async findById(id: string): Promise<Property> {
    const doc = await mongoose.model('Property').findById(id);
    return new Property(doc);
  }
}
```

**Why Wrong**: Domain layer should not depend on infrastructure. Use Unit of Work pattern instead.

---

## Example 2: Biome Linting (ADR-0012)

### Correct: Using Biome

**Before Committing:**
```bash
# Run Biome linting per ADR-0012
pnpm run lint

# Auto-fix issues
pnpm run format
```

### ❌ Incorrect: Using ESLint or Prettier

```json
// ❌ WRONG: Don't add ESLint configuration
// File: .eslintrc.json
{
  "extends": ["eslint:recommended"]
}
```

```json
// ❌ WRONG: Don't add Prettier configuration  
// File: .prettierrc
{
  "semi": true,
  "singleQuote": true
}
```

**Why Wrong**: ADR-0012 mandates Biome for linting and formatting. ESLint and Prettier should not be used.

**Correct Approach:**
- Use `biome.json` for configuration
- Run `pnpm run lint` (uses Biome)
- Run `pnpm run format` (uses Biome)

---

## Example 3: Security Scanning (ADR-0022)

### Correct: Scanning Before Commit

**When Adding a Dependency:**
```bash
# Install the dependency
pnpm install react-query --filter @ocom/ui-community

# Run Snyk scan per ADR-0022
pnpm run snyk

# Or use MCP tool during development
# snyk_code_scan tool will scan new code
```

### Correct: Handling Vulnerabilities

**Fix high/critical vulnerabilities:**
```bash
# Upgrade vulnerable dependency
pnpm install package-name@fixed-version --filter <workspace>

# Verify fix
pnpm run snyk:test
```

**Document unavoidable vulnerabilities:**
```yaml
# .snyk file
version: v1.5.0
ignore:
  'SNYK-JS-[PACKAGE-NAME]-[EXAMPLE-ID]':
    - '* > [package-name]@[version]':
        reason: 'Vulnerability not exploitable in our use case - document specific reason'
        expires: '2026-06-01T00:00:00.000Z'
        created: '2026-02-04T00:00:00.000Z'
```

### ❌ Incorrect: Ignoring Security

```bash
# ❌ WRONG: Committing without security scan
git commit -m "Add new feature"
# Should run `pnpm run verify` first (includes Snyk)
```

**Why Wrong**: ADR-0022 requires security scanning before commits. All vulnerabilities must be addressed or documented.

---

## Example 4: Turborepo Monorepo (ADR-0019)

### Correct: Package Structure

**File**: `packages/ocom/property-service/package.json`

```json
{
  "name": "@ocom/property-service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsgo --build",
    "test": "vitest run",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "@ocom/domain": "workspace:*",
    "@cellix/domain-seedwork": "workspace:*"
  }
}
```

**Correct Build Commands:**
```bash
# Build all packages (uses Turborepo)
pnpm run build

# Build only affected packages
pnpm run build:affected

# Test with caching
pnpm run test

# Full verification
pnpm run verify
```

### ❌ Incorrect: Direct Package Builds

```bash
# ❌ WRONG: Bypassing Turborepo
cd packages/ocom/domain
npm run build

# ❌ WRONG: Not using workspace protocol
# In package.json:
"dependencies": {
  "@ocom/domain": "^1.0.0"  // Should be "workspace:*"
}
```

**Why Wrong**: ADR-0019 mandates Turborepo for builds. Use workspace protocol and Turborepo commands.

---

## Example 5: Azure Functions (ADR-0014)

### Correct: Service Registration and Function Handlers

**File**: `packages/ocom/api/src/index.ts`

```typescript
import { Cellix } from '@cellix/api-services-spec';
import { ServiceMongoose } from '@ocom/service-mongoose';
import { ServiceOtel } from '@ocom/service-otel';
import { graphHandlerCreator } from '@ocom/graphql-handler';

/**
 * Initialize services per ADR-0014
 * Uses Cellix DI container for service registration
 */
const cellix = Cellix.initializeServices<ApiContextSpec>((serviceRegistry) => {
  // Register infrastructure services
  serviceRegistry.registerService(new ServiceMongoose(process.env.MONGODB_URI));
  serviceRegistry.registerService(new ServiceOtel(process.env.OTEL_ENDPOINT));
})
.setContext((serviceRegistry) => ({
  // Provide typed context to application
  domainDataSource: contextBuilder(serviceRegistry.getService(ServiceMongoose)),
  telemetry: serviceRegistry.getService(ServiceOtel),
}));

/**
 * Register Azure Function handlers per ADR-0014
 * Each handler is an Azure Functions v4 endpoint
 */
cellix.registerAzureFunctionHandler('graphql', { route: 'graphql' }, graphHandlerCreator);
cellix.registerAzureFunctionHandler('rest-api', { route: 'api/{*segments}' }, restHandlerCreator);

export default cellix.getAzureFunctionApp();
```

### ❌ Incorrect: Manual Service Instantiation

```typescript
// ❌ WRONG: Creating services directly instead of DI
import mongoose from 'mongoose';

const db = mongoose.connect(process.env.MONGODB_URI);

export async function httpTrigger(context, req) {
  // Using global db connection instead of DI
  const data = await db.model('Property').find();
  return { body: data };
}
```

**Why Wrong**: ADR-0014 requires Cellix DI container for service management. Services must be registered and accessed via context.

---

## Example 6: Testing (ADR-0013)

### Correct: Unit Tests with Vitest

**File**: `packages/ocom/domain/contexts/property/property.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { Property } from './property';
import { PropertyId, PropertyAddress } from './property.value-objects';

describe('Property', () => {
  it('should create valid property', () => {
    const property = new Property({
      id: new PropertyId('prop-123'),
      address: new PropertyAddress({
        street: '123 Main St',
        city: 'Portland',
        state: 'OR',
        zipCode: '97201',
      }),
      ownerId: 'owner-456',
      listedDate: new Date(),
    });
    
    expect(property.id.value).toBe('prop-123');
  });
  
  it('should identify new listings', () => {
    const recentDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    
    const property = new Property({
      id: new PropertyId('prop-123'),
      address: new PropertyAddress({
        street: '123 Main St',
        city: 'Portland',
        state: 'OR',
        zipCode: '97201',
      }),
      ownerId: 'owner-456',
      listedDate: recentDate,
    });
    
    expect(property.isNewListing()).toBe(true);
  });
});
```

**Running Tests:**
```bash
# Run all tests per ADR-0013
pnpm run test

# Run with coverage
pnpm run test:coverage

# Run only affected tests
pnpm run test:affected
```

### ❌ Incorrect: Using Jest Instead of Vitest

```javascript
// ❌ WRONG: Using Jest (not Vitest)
const { describe, it, expect } = require('@jest/globals');

describe('Property', () => {
  // Tests...
});
```

**Why Wrong**: ADR-0013 mandates Vitest for unit tests, not Jest.

---

## Example 7: Infrastructure as Code (ADR-0011)

### Correct: Bicep Template

**File**: `iac/modules/function-app.bicep`

```bicep
// Azure Function App defined in Bicep per ADR-0011

@description('Function App name')
param functionAppName string

@description('Location for resources')
param location string = resourceGroup().location

@description('Storage account name')
param storageAccountName string

resource functionApp 'Microsoft.Web/sites@2022-09-01' = {
  name: functionAppName
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'NODE|20'
      appSettings: [
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccountName}'
        }
      ]
    }
  }
}
```

### ❌ Incorrect: Using ARM Templates or Terraform

```json
// ❌ WRONG: ARM template instead of Bicep
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "resources": [
    {
      "type": "Microsoft.Web/sites",
      "apiVersion": "2022-09-01",
      "name": "[parameters('functionAppName')]"
    }
  ]
}
```

```hcl
# ❌ WRONG: Terraform instead of Bicep
resource "azurerm_function_app" "main" {
  name                       = var.function_app_name
  location                   = var.location
  resource_group_name        = var.resource_group_name
}
```

**Why Wrong**: ADR-0011 mandates Bicep for all Azure infrastructure. Do not use ARM templates or Terraform.

---

## Example 8: Code Review Checklist

### Reviewing a Pull Request

**PR Title**: "Add property listing feature"

**Files Changed:**
- `packages/ocom/domain/contexts/property/listing.ts`
- `packages/ocom/application-services/property-listing.service.ts`
- `packages/ocom/graphql/resolvers/listing.resolver.ts`

**Review Checklist (based on ADRs):**

✅ **ADR-0003 (DDD) Compliance:**
- [ ] Is `listing.ts` in correct bounded context?
- [ ] Does entity follow DDD patterns (props interface, methods)?
- [ ] Is domain logic separate from infrastructure?
- [ ] Are value objects used appropriately?

✅ **ADR-0012 (Biome) Compliance:**
- [ ] Does code pass `pnpm run lint`?
- [ ] Is formatting consistent with Biome rules?
- [ ] No ESLint/Prettier configs added?

✅ **ADR-0013 (Testing) Compliance:**
- [ ] Are unit tests present for `listing.ts`?
- [ ] Do tests use Vitest?
- [ ] Is coverage adequate?

✅ **ADR-0022 (Security) Compliance:**
- [ ] Were dependencies scanned with Snyk?
- [ ] Are there any new vulnerabilities?
- [ ] Are security issues documented if not fixable?

**Example Review Comment:**

```
This looks good overall, but I noticed the domain entity in `listing.ts` has 
database code. Per **ADR-0003** (Domain-Driven Design), domain entities should 
not contain infrastructure code like database queries. 

Please:
1. Move persistence logic to a Unit of Work implementation
2. Create `listing.uow.ts` following the pattern in ADR-0003
3. Update the application service to use the UoW

See the MADR enforcement skill examples for the correct pattern.
```

---

## Summary: ADR Enforcement Patterns

### Core Principles

1. **Separation of Concerns** (ADR-0003)
   - Domain logic ≠ Infrastructure
   - Use Unit of Work for persistence
   
2. **Standard Tooling** (ADR-0012, ADR-0013, ADR-0022)
   - Biome for linting/formatting
   - Vitest for testing
   - Snyk for security
   
3. **Infrastructure as Code** (ADR-0011)
   - Bicep for Azure resources
   - No ARM or Terraform
   
4. **Monorepo Best Practices** (ADR-0019)
   - Turborepo for builds
   - Workspace protocol for dependencies
   - Affected builds/tests

### Before Every Commit

```bash
# Full verification per multiple ADRs
pnpm run verify

# This runs:
# - Biome linting (ADR-0012)
# - Tests with coverage (ADR-0013)  
# - Snyk security scan (ADR-0022)
# - SonarCloud quality checks (ADR-0015)
```

### When in Doubt

1. **Search ADRs**: `grep -r "keyword" apps/docs/docs/decisions/`
2. **Read relevant ADR**: Check validation section for compliance criteria
3. **Follow documented patterns**: Use examples from ADRs
4. **Ask for review**: Reference specific ADR in questions
