# Architecture Testing with ArchUnitTS and Vitest

This document explains how to use and maintain architectural fitness tests in the CellixJS monorepo.

## Overview

CellixJS uses [ArchUnitTS](https://lukasniessen.github.io/ArchUnitTS/) integrated with Vitest to enforce architectural guardrails and maintain code quality across all workspace packages. These tests validate Clean Architecture and Domain-Driven Design principles.

## Quick Start

### Running Architecture Tests

```bash
# Run all tests (including architecture tests)
npm test

# Run architecture tests for a specific package
cd packages/api-domain
npx vitest run src/architecture.test.ts

# Run monorepo-level architecture tests
cd architecture
npx vitest run monorepo.arch.test.ts

# Run with debug logging
ARCH_DEBUG=true npm test
```

### Writing Your First Architecture Test

```typescript
import { describe, it, expect } from 'vitest';
import { projectFiles, metrics } from 'archunit';

describe('Architecture: My Package', () => {
  it('should not have circular dependencies', async () => {
    const rule = projectFiles()
      .inFolder('src/**')
      .should()
      .haveNoCycles();
      
    const violations = await rule.check();
    expect(violations).toHaveLength(0);
  });
  
  it('should follow Clean Architecture dependency rules', async () => {
    const rule = projectFiles()
      .inFolder('src/domain/**')
      .shouldNot()
      .dependOnFiles()
      .inFolder('src/infrastructure/**');
      
    const violations = await rule.check({ allowEmptyTests: true });
    expect(violations).toHaveLength(0);
  });
});
```

## Architecture Testing Structure

```
architecture/
├── README.md                 # Architecture testing overview
├── shared/
│   ├── rules/               # Reusable architectural rules
│   │   ├── clean-architecture.rules.ts
│   │   ├── domain-layer.rules.ts
│   │   ├── cyclic-dependency.rules.ts
│   │   └── naming-convention.rules.ts
│   └── utils/               # Shared testing utilities
│       ├── test-helpers.ts
│       └── matchers.ts
├── monorepo.arch.test.ts    # Monorepo-level tests
└── vitest.config.ts         # Architecture test config

packages/
├── {package-name}/
│   └── src/
│       └── architecture.test.ts  # Package-specific tests
```

## Types of Architecture Tests

### 1. Clean Architecture Rules

Enforce the fundamental Clean Architecture dependency rule:

```typescript
// Domain should not depend on outer layers
const rule = projectFiles()
  .inFolder('src/domain/**')
  .shouldNot()
  .dependOnFiles()
  .inFolder('src/infrastructure/**');
```

### 2. Cyclic Dependency Detection

Prevent circular dependencies that lead to tight coupling:

```typescript
const rule = projectFiles()
  .inFolder('src/**')
  .should()
  .haveNoCycles();
```

### 3. Code Quality Metrics

Maintain code quality with metrics-based rules:

```typescript
// High cohesion (low LCOM)
const rule = metrics()
  .inFolder('src/domain/**')
  .lcom()
  .lcom96b()
  .shouldBeBelow(0.5);

// Reasonable file sizes
const rule = metrics()
  .inFolder('src/**')
  .count()
  .linesOfCode()
  .shouldBeBelow(300);
```

### 4. Naming Conventions

Enforce consistent naming patterns:

```typescript
// Domain entities should follow naming convention
const rule = projectFiles()
  .inFolder('src/domain/**')
  .withName('*.entity.ts')
  .should()
  .exist(); // Basic validation
```

## Integration with Vitest

### Test Configuration

Architecture tests are integrated with existing Vitest configurations:

- Root `vitest.config.ts` includes `architecture` project
- Package-specific tests use existing package Vitest configs
- Tests use `.arch.test.ts` or `architecture.test.ts` naming convention

### Test Execution

```typescript
import { expect } from 'vitest';
import { projectFiles } from 'archunit';

// Use .check() method for universal compatibility
const violations = await rule.check({ allowEmptyTests: true });
expect(violations).toHaveLength(0);
```

### Options

```typescript
const options = {
  allowEmptyTests: true,    // Allow tests with no matching files
  logging: {
    enabled: true,          // Enable debug logging
    level: 'info'           // Log level: error, warn, info, debug
  },
  clearCache: true          // Clear analysis cache
};

const violations = await rule.check(options);
```

## Common Patterns

### Package-Level Tests

Each package should have an `architecture.test.ts` file:

```typescript
describe('Architecture: Package Name', () => {
  describe('Clean Architecture', () => {
    // Dependency rules
  });
  
  describe('Cyclic Dependencies', () => {
    // Circular dependency checks
  });
  
  describe('Code Quality', () => {
    // Metrics-based rules
  });
});
```

### Handling Violations

When tests fail, violations provide detailed information:

```typescript
const violations = await rule.check();

if (violations.length > 0) {
  console.log('Violations found:');
  violations.forEach((violation, index) => {
    console.log(`${index + 1}. ${violation.toString()}`);
  });
}
```

### Empty Test Handling

Use `allowEmptyTests: true` when the absence of violations is expected:

```typescript
// Domain shouldn't depend on infrastructure - empty test is success
const violations = await rule.check({ allowEmptyTests: true });
```

## Extending Architecture Tests

### Adding New Rules

1. Create rule functions in `architecture/shared/rules/`
2. Export rule factories that return ArchUnit rule objects
3. Use rules in package-specific tests

### Custom Matchers

Create custom matchers in `architecture/shared/utils/matchers.ts`:

```typescript
export class DomainMatcher {
  constructor(private domainPath: string) {}
  
  shouldBeIndependent() {
    return projectFiles()
      .inFolder(this.domainPath)
      .shouldNot()
      .dependOnFiles()
      .inFolder('**/infrastructure/**');
  }
}

export function domain(path: string): DomainMatcher {
  return new DomainMatcher(path);
}
```

### Shared Utilities

Add helper functions to `architecture/shared/utils/test-helpers.ts`:

```typescript
export async function executeArchRule(rule: any, options = {}) {
  const violations = await rule.check(options);
  expect(violations).toHaveLength(0);
}
```

## CI Integration

Architecture tests run as part of the standard test suite:

```bash
# CI runs this automatically
npm test
```

For debugging in CI, enable logging:

```yaml
- name: Run Architecture Tests
  run: ARCH_DEBUG=true npm test
  env:
    NODE_ENV: test
```

## Troubleshooting

### Common Issues

1. **"Invalid Chai property: toPassAsync"**
   - Use `.check()` method instead of `.toPassAsync()`
   - ArchUnit Vitest matchers may not be properly configured

2. **"EmptyTestViolation"**
   - Add `allowEmptyTests: true` to rule options
   - Empty tests often indicate successful architectural boundaries

3. **Timeout Issues**
   - Increase test timeout for large codebases
   - Architecture analysis can be CPU intensive

4. **False Positives**
   - Use more specific path patterns
   - Consider excluding generated or test files

### Debug Logging

Enable detailed logging:

```bash
ARCH_DEBUG=true npm test
```

Or in code:

```typescript
const violations = await rule.check({
  logging: {
    enabled: true,
    level: 'debug'
  }
});
```

## Best Practices

1. **Start Simple**: Begin with basic cyclic dependency and Clean Architecture tests
2. **Iterative Improvement**: Add more specific rules as architecture matures  
3. **Document Violations**: When violations are found, document the architectural decisions
4. **Regular Review**: Review and update architecture tests as the codebase evolves
5. **Team Education**: Ensure team understands architecture principles being enforced

## Further Reading

- [ArchUnitTS Documentation](https://lukasniessen.github.io/ArchUnitTS/)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Architectural Fitness Functions](https://www.thoughtworks.com/en-de/insights/articles/fitness-function-driven-development)