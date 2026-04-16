# Package Documentation Model

Each `@cellix/*` package should maintain three documentation layers that stay aligned with the public contract.

## 1. `manifest.md`

Audience: maintainers and contributors

Purpose:

- define package purpose
- define scope and non-goals
- clarify boundaries
- describe intended public API shape
- document package relationships
- define testing expectations
- define documentation obligations
- define release-readiness expectations

## 2. `README.md`

Audience: package consumers

Purpose:

- explain what the package is for
- explain when to use it
- show high-level concepts and exports
- provide examples
- document caveats and constraints

The README should stay consumer-facing and digestible.

## 3. TSDoc

Audience: developers and agents using the package APIs

Purpose:

- document meaningful public exports
- explain purpose and expected usage
- clarify signature or type intent where needed
- describe parameters, returns, invariants, errors, and side effects
- provide examples when helpful
- improve discoverability in editors and tools

## Alignment Rule

If public behavior, exports, or usage changes, all relevant documentation layers must be reviewed and updated.
