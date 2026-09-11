---
sidebar_position: 31
sidebar_label: 0031 UI Env Vars Naming Convention
status: accepted
date: 2026-09-11
contact: nnoce14
deciders: gidich nnoce14
---

# UI Environment Variables Naming Convention

## Context and Problem Statement

Frontend applications (apps/ui-*) expose build-time Vite environment variables (VITE_*) that are embedded into the client bundle. As the number of portals grows (UI_COMMUNITY, UI_STAFF, etc.), inconsistent naming conventions make it harder to discover variables, automate pipeline mapping, and safely manage secrets. We need a canonical, enforceable naming scheme that is simple to follow and automatable by CI.

## Decision Drivers

- Discoverability by tooling (CI, inventory scans, and pipelines)
- Clear ownership of portal-specific vs shared variables for secrets and governance
- Compile-time type safety for `import.meta.env` reads so misspelled names cannot ship as `undefined`
- Automatable validation and enforcement in CI (ArchUnit tests)
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

Source access (authoritative):

- Declare each portal's `ImportMetaEnv` shape in one shared types file for that portal (for example `packages/ocom/ui-community-shared/env/index.d.ts`). UI packages in the portal reference those types from `vite-env.d.ts`.
- Read values with property access only: `import.meta.env.VITE_APP_<PORTAL_KEY>_…` and `import.meta.env.VITE_COMMON_…`. Vite builtins (`PROD`, `DEV`, `MODE`, `SSR`, `BASE_URL`) use the same form.
- Do not destructure `import.meta.env` (`const { VITE_… } = import.meta.env`).
- Do not use index/bracket access (`import.meta.env['VITE_…']`).

Vite's `ImportMetaEnv` retains an index signature. With `noPropertyAccessFromIndexSignature`, a misspelled property access is a compile error (TS4111). Destructuring and bracket access skip that check, type as the index signature (`any` / `string | boolean | undefined`), and deploy green with `undefined` at runtime. TS4111 itself suggests bracket access; that suggestion is the bypass and must not be followed. The error is not TS2339 ("does not exist") because the index signature means the name can exist.

## Consequences

- Positive
  - CI and tooling can automatically discover variable names and derive pipeline mappings
  - Easier governance and secure secret management by separating portal-specific from shared variables
  - Predictable onboarding process for new portals
  - Misspelled `import.meta.env` names fail the TypeScript build when property access is used, and ArchUnit rejects the access styles that bypass that check

- Negative
  - Existing non-conforming variables must be migrated or mapped, which requires coordination with pipeline owners
  - External references to the old docs/devops/ENV-VARS.md path may break; consumers should update links

## Validation (Enforcement)

Naming is a repo-wide inventory and stays in `@ocom-verification/archunit-tests` (`src/env-vars-naming.archunit.test.ts`). Access style is a per-package source convention: each UI package registers `describeViteEnvAccessStyleTests` from `@cellix/archunit-tests/frontend` in `src/archunit-tests/`, the same way it registers frontend architecture tests.

- The naming test validates that discovered `VITE_*` names conform to the regex and portal registry rules above.
- Each UI package's `test:arch` fails when that package's source destructures `import.meta.env` or reads it with brackets.
- Adopting Cellix projects register the same suite with `describeViteEnvAccessStyleTests({ scanPaths: ['./src'] })`.

## Azure DevOps mapping

Pipelines should map secure Azure DevOps variables into Vite env names during the build step. Example mapping in azure-pipelines.yml:

VITE_APP_UI_COMMUNITY_B2C_AUTHORITY: $(OCM_APP_UI_COMMUNITY_B2C_AUTHORITY_DEV)
VITE_APP_UI_COMMUNITY_B2C_CLIENTID:  $(OCM_APP_UI_COMMUNITY_B2C_CLIENTID_DEV)

Variable groups (recommended):

- Portal community: ocm-app-ui-community
- Portal staff: ocm-app-ui-staff
- Common/shared: ocm-common

## Onboarding new portals (operational steps)

1. Choose a canonical portal key (uppercase, underscores), e.g., UI_SUPPORT
2. Add the portal key to [apps/docs/docs/portals/PORTAL_REGISTRY.md](../portals/PORTAL_REGISTRY.md)
3. Create a pipeline variable group: `ocm-app-ui-<portal-slug>` (for example: `ocm-app-ui-support`)
4. Add `VITE_APP_<PORTAL_KEY>_*` variables to that group
5. Declare the new names on that portal's shared `ImportMetaEnv` type
6. Use the variables in portal source code via `import.meta.env.VITE_APP_<PORTAL_KEY>_…` (property access only)

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
- Destructuring `import.meta.env` (shorter, but undeclared names compile as the index-signature type and ship as `undefined`)
- Bracket access `import.meta.env['VITE_…']` (this is the TS4111-suggested fix, and it is the same type-safety hole)

## Related

- [apps/docs/docs/portals/PORTAL_REGISTRY.md](../portals/PORTAL_REGISTRY.md) — canonical portal keys, owner groups, and onboarding evidence
- `packages/ocom-verification/archunit-tests/build-artifacts/env-var-compliance-evidence.json` — machine-generated inventory of discovered VITE_* variables (produced on every test run, gitignored)
- `packages/ocom-verification/archunit-tests/src/env-vars-naming.archunit.test.ts` — OCom naming enforcement test
- `@cellix/archunit-tests/frontend` — reusable `checkViteEnvAccessStyle` / `describeViteEnvAccessStyleTests`
- UI package `src/archunit-tests/vite-env-access-style.test.ts` — per-package consumption of the access-style rule

## Notable Exceptions

- Public standard variables which exist outside of our convention are prohibited, but must be explicitly approved and documented if they exist.

- *Allowed Exception*: `NODE_ENV` is allowed as a common variable without the VITE_ prefix since it's a widely recognized standard. Usage should be limited to NODE_ENV.

---
