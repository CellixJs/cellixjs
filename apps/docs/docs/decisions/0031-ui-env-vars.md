---
sidebar_position: 31
sidebar_label: ADR 0031 — UI env vars
status: accepted
date: 2026-05-05
contact: nnoce14
deciders: gidich nnoce14
---

# ADR 0031 — UI environment variables naming convention (VITE_*)

## Context and Problem Statement

Frontend applications (apps/ui-*) expose build-time Vite environment variables (VITE_*) that are embedded into the client bundle. As the number of portals grows (UI_COMMUNITY, UI_STAFF, etc.), inconsistent naming conventions make it harder to discover variables, automate pipeline mapping, and safely manage secrets. We need a canonical, enforceable naming scheme that is simple to follow and automatable by CI.

## Decision Drivers

- Discoverability by tooling (CI, inventory scans, and pipelines)
- Clear ownership of portal-specific vs shared variables for secrets and governance
- Automatable validation and enforcement in CI (archunit tests)
- Minimize operational friction when adding new portals

## Considered Options

- Continue with ad-hoc naming (rejected)
- Use a per-portal JSON manifest (considered, rejected due to maintenance overhead)
- Use a small, enforced naming convention with clear prefixes (chosen)

## Decision Outcome

Chosen option: Adopt an explicit naming convention for client-visible Vite environment variables and enforce it via repository tests.

Naming rules (authoritative):

- Allowed prefixes for client runtime variables: VITE_APP_ and VITE_COMMON_

- Portal-specific variables
  - Format: `VITE_APP_<PORTAL_NAME>_<ENV_VAR_NAME>`
  - `<PORTAL_NAME>`: uppercase, underscore-delimited canonical portal identifier (examples: UI_COMMUNITY, UI_STAFF)
  - `<ENV_VAR_NAME>`: uppercase, underscore-delimited identifier for the value (examples: B2C_AUTHORITY, AAD_CLIENTID)
  - Example: VITE_APP_UI_COMMUNITY_B2C_CLIENTID
  - Storage/ownership: store portal-specific values in a portal-specific Azure DevOps variable group (convention: `ocm-app-ui-<portal-slug>`, e.g., ocm-app-ui-community)
  - Usage: Referenced only by that portal's source code

- Shared / common variables
  - Format: `VITE_COMMON_<ENV_NAME>`
  - Example: VITE_COMMON_API_ENDPOINT, VITE_COMMON_NODE_ENV
  - Storage/ownership: repository-level common variable group (ocm-common)
  - Usage: Referenced by any portal

- Regex for allowed names (runtime-facing keys):

  ^(VITE_APP_[A-Z0-9_]+|VITE_COMMON_[A-Z0-9_]+)$

- Portal name validation: the `<PORTAL_NAME>` segment MUST be one of the canonical portal keys listed in docs/devops/PORTAL_REGISTRY.md. Add new portal keys to that registry when onboarding a portal.

- Secrets: Do NOT place sensitive secrets in client-bundled variables unless explicitly authorized and documented. Secrets should be kept only in secure DevOps variable groups and not checked into the repository.

## Consequences

- Positive
  - CI and tooling can automatically discover variable names and derive pipeline mappings
  - Easier governance and secure secret management by separating portal-specific from shared variables
  - Predictable onboarding process for new portals

- Negative
  - Existing non-conforming variables must be migrated or mapped, which requires coordination with pipeline owners
  - External references to the old docs/devops/ENV-VARS.md path may break; consumers should update links

## Validation (Enforcement)

This naming convention is enforced by the repository's ArchUnit tests. The authoritative enforcement rule is implemented in the archunit test package: packages/ocom/archunit-tests/src/env-vars-naming.archunit.test.ts. Key points about enforcement:

- The archunit test reads pipeline variable mappings (azure-pipelines.yml) as a single source of truth and validates that all VITE_* names exposed by pipelines conform to the regex and portal registry rules above.
- Maintainers can run the rule locally with:

  pnpm -w --filter @ocom/archunit-tests test

- In CI, the test will fail the build if new non-conforming names are introduced. A migration/grace period process is expected for existing violations.

## Azure DevOps mapping

Pipelines should map secure Azure DevOps variables into Vite env names during the build step. Example mapping in azure-pipelines.yml:

VITE_APP_UI_COMMUNITY_B2C_AUTHORITY: $(OCM_APP_UI_COMMUNITY_B2C_AUTHORITY_DEV)
VITE_APP_UI_COMMUNITY_B2C_CLIENTID:  $(OCM_APP_UI_COMMUNITY_B2C_CLIENTID_DEV)

Library groups (recommended):

- Portal community: ocm-app-ui-community
- Portal staff: ocm-app-ui-staff
- Common/shared: ocm-common

## Onboarding new portals (operational steps)

1. Choose a canonical portal key (uppercase, underscores), e.g., UI_SUPPORT
2. Add the portal key to docs/devops/PORTAL_REGISTRY.md
3. Create a pipeline variable group: `ocm-app-ui-<portal-slug>` (for example: `ocm-app-ui-support`)
4. Add `VITE_APP_<PORTAL_KEY>_*` variables to that group
5. Use the variables in portal source code via `import.meta.env['VITE_APP_<PORTAL_KEY>_...']`

## Examples

- Portal-specific (Community):
  - VITE_APP_UI_COMMUNITY_B2C_AUTHORITY
  - VITE_APP_UI_COMMUNITY_B2C_CLIENTID
  - VITE_APP_UI_COMMUNITY_B2C_REDIRECT_URI

- Portal-specific (Staff):
  - VITE_APP_UI_STAFF_AAD_AUTHORITY
  - VITE_APP_UI_STAFF_AAD_CLIENTID

- Shared/common:
  - VITE_COMMON_API_ENDPOINT
  - VITE_COMMON_FUNCTION_ENDPOINT

## Alternatives considered

- Per-portal JSON manifests (adds maintenance overhead)
- Ad-hoc naming (fails discoverability and automation requirements)

## Related

- docs/devops/ENV-VARS-INVENTORY.md — an inventory of discovered VITE_* variables in the repo
- docs/devops/PORTAL_REGISTRY.md — canonical portal keys and mappings
- ArchUnit enforcement: packages/ocom/archunit-tests/src/env-vars-naming.archunit.test.ts

## Notable Exceptions

- Public standard variables which exist outside of our convention are prohibited, but must be explicitly approved and documented if they exist.

- *Allowed Exception*: `NODE_ENV` is allowed as a common variable without the VITE_ prefix since it's a widely recognized standard. Usage should be limited to NODE_ENV.

---
