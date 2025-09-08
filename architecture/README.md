# Architecture Testing with ArchUnitTS

This directory contains shared architectural testing utilities and rules for the CellixJS monorepo.

## Overview

ArchUnitTS is integrated with Vitest to enforce architectural guardrails, maintain code quality, and support Clean Code/Clean Architecture principles across all workspace packages.

## Directory Structure

```
architecture/
├── README.md                    # This file
├── shared/                      # Shared architectural rules and utilities
│   ├── rules/                   # Reusable architectural rules
│   │   ├── clean-architecture.rules.ts    # Clean Architecture dependency rules
│   │   ├── domain-layer.rules.ts          # Domain layer architectural rules
│   │   ├── cyclic-dependency.rules.ts     # Cyclic dependency detection
│   │   └── naming-convention.rules.ts     # Naming convention rules
│   └── utils/                   # Shared testing utilities
│       ├── test-helpers.ts      # Test helper functions
│       └── matchers.ts          # Custom matchers
└── package-tests/               # Package-specific architectural tests
    ├── api-domain.arch.test.ts  # Domain layer tests
    ├── api-application-services.arch.test.ts  # Application services tests
    └── ...                      # Other package tests
```

## Usage

### Running Architecture Tests

```bash
# Run all architecture tests
npm test

# Run architecture tests for specific packages
npm test -- --grep="Architecture"

# Run with detailed logging
npm test -- --grep="Architecture" --reporter=verbose
```

### Writing Architecture Tests

Architecture tests should be co-located with each package and follow the naming convention `*.arch.test.ts`:

```typescript
import { projectFiles, metrics } from 'archunit';
import { describe, it, expect } from 'vitest';

describe('Architecture: Package Name', () => {
  it('should not have circular dependencies', async () => {
    const rule = projectFiles().inFolder('src/**').should().haveNoCycles();
    await expect(rule).toPassAsync();
  });
});
```

## Integration with Vitest

Architecture tests are integrated with the existing Vitest configuration:

- Tests use the `.arch.test.ts` naming convention
- Tests are included in the standard test run via existing Vitest configs
- Coverage and reporting work seamlessly with existing setup

## Architectural Rules

### Clean Architecture Principles

1. **Dependency Rule**: Dependencies should point inward (UI → Application → Domain)
2. **Domain Independence**: Domain layer should not depend on external layers
3. **Interface Segregation**: Interfaces should be lean and focused
4. **Single Responsibility**: Each component should have one reason to change

### Code Quality Rules

1. **Cyclic Dependencies**: No circular dependencies within packages
2. **File Size**: Files should not exceed reasonable size limits
3. **Class Cohesion**: Classes should have high cohesion (low LCOM)
4. **Coupling**: Minimize coupling between components

## References

- [ArchUnitTS Documentation](https://lukasniessen.github.io/ArchUnitTS/)
- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Clean Code by Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)