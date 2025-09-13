---
applyTo: "packages/api-domain/src/domain/contexts/**/*.value-objects.ts"
---

# Copilot Instructions: Value Objects

See the package-wide instructions in `.github/instructions/api-domain.instructions.md` for general rules, architecture, and conventions.

## Related Instructions
- `.github/instructions/contexts.instructions.md`
- `.github/instructions/aggregates.instructions.md`
- `.github/instructions/entities.instructions.md`

## Purpose
This file defines instructions for writing value objects in the Cellix framework. Value objects are used to encapsulate and validate primitive values, enforce business invariants, and maintain immutability and referential integrity across the domain model. All domain entities and aggregate roots must utilize value objects for typed validation of their fields.

## Architecture & Patterns
- **Domain-Driven Design (DDD):** Value objects model concepts without identity.
- **Immutability:** All value objects are immutable and expose their value via `.valueOf()`.
- **Validation:** Enforced through the `@lucaspaganini/value-objects` library.
- **Optional Values:** Use `VOOptional(...)` for nullable primitives.
- **Compound Values:** Use `VOArray(...)` for collections of validated items.

## Implementation Guidelines
### Base Types
- `VOString({ ... })` is used for string values with constraints.
- `VOArray(ItemType, { maxLength })` is used for arrays of constrained items.
- `VOOptional(ValueType, [null])` is used for nullable wrappers.

### Common Types
- Common value objects are available in a shared `src/domain/contexts/value-objects.ts` file (e.g `Email`, `ExternalId`) to avoid duplicated validated logic
- Prefer value objects scoped to a context’s language and meaning. Reuse only when ubiquitous language overlaps are verified

### Optional/Nullable Examples
```ts
class HandleBase extends VOString({ trim: true, maxLength: 50, minLength: 1 }) {}
export class Handle extends VOOptional(HandleBase, [null]) {}

class RestOfNameBase extends VOString({ trim: true, maxLength: 100 }) {}
export class RestOfName extends VOOptional(RestOfNameBase, [null]) {}
```
> Note: `VOOptional(..., [null])` allows `null`, not `undefined`. Explicitly validate for `undefined` in tests.

### Value Object Naming
- Use `PascalCase` for class names.
- File names should follow the domain pattern: `<context>.value-objects.ts`.
- Co-locate with the entity or aggregate that consumes them.

### Common Patterns
#### String
```ts
export class Name extends VOString({ trim: true, maxLength: 200, minLength: 1 }) {}
```

#### Enum-based Validation
```ts
export const Types = { A: 'A', B: 'B' } as const;
type TypeEnum = typeof Types[keyof typeof Types];

class TypeBase extends VOString({ trim: true, maxLength: 100 }) {}
export class Type extends TypeBase {
  constructor(value: string) {
    super(value);
    if (!Object.values(Types).includes(value as TypeEnum)) {
      throw new Error(`Invalid type: ${value}`);
    }
  }
}
```

### Arrays
```ts
class Interest extends VOString({ trim: true, maxLength: 40 }) {}
export class Interests extends VOArray(Interest, { maxLength: 20 }) {}
```

## Error Message Guidelines
Error messages must:
- Be clear and user-facing
- Match expected strings in feature files
- Examples:
  - `"Too long"`
  - `"Too short"`
  - `"Wrong raw value type"`
  - `"Invalid <TypeName>"`

## Testing
All value objects must include:
- Unit tests using `vitest`
- Feature files using `@amiceli/vitest-cucumber`

### Coverage Requirements
- Leading/trailing whitespace handling
- Min/max length enforcement
- `null`, `undefined`, and empty string rejection (or acceptance for `VOOptional`)
- Type enforcement (`Wrong raw value type`)
- Allowed/disallowed enum values

### Feature File Alignment
- Feature scenarios must match validation rules and expected error messages.
- Scenario names should include field and condition being tested.

### Naming Conventions
- Feature files must be named `<filename>.feature` and placed in `features/` adjacent to the test file.
- Test files must be named `<filename>.test.ts` and located next to the value object file.

## Examples
### Feature: Creating a valid name
```gherkin
Scenario: Creating a name with leading/trailing whitespace
  When I create a name with "  Alice  "
  Then the value should be "Alice"
```

### Unit Test
```ts
const name = new Name("  Alice  ");
expect(name.valueOf()).toBe("Alice");
```

### Invalid Usage
```ts
expect(() => new Name(null)).toThrow("Wrong raw value type");
expect(() => new Name("")).toThrow("Too short");
```

## References
- [Cellix DDD ADR](../../../../docusaurus/decisions/0003-domain-driven-design.md)
- [`@lucaspaganini/value-objects`](https://www.npmjs.com/package/@lucaspaganini/value-objects)
- `entity.instructions.md` for consumers of value objects
