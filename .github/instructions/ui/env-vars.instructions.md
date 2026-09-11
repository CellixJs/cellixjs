---
applyTo: "**/ui-*/**/*.{ts,tsx}"
---

# Copilot Instructions: UI Environment Variables

## Internal References

- ADR-0031: `apps/docs/docs/decisions/0031-ui-env-vars.md`
- Portal `ImportMetaEnv` types: `packages/ocom/ui-shared/env`, `packages/ocom/ui-community-shared/env`, `packages/ocom/ui-staff-shared/env`

## Required access style

Read Vite env vars with property access only. That is what makes `noPropertyAccessFromIndexSignature` reject undeclared names at compile time (TS4111).

```ts
const endpoint = import.meta.env.VITE_COMMON_API_ENDPOINT;
const authority = import.meta.env.VITE_APP_UI_COMMUNITY_END_USER_B2C_AUTHORITY;
const isProd = import.meta.env.PROD;
```

## Forbidden

Do not destructure `import.meta.env`. Do not use bracket/index access. Both compile for misspelled names and ship as `undefined`.

```ts
// Forbidden — undeclared names type-check
const { VITE_COMMON_API_ENDPOINT } = import.meta.env;
const endpoint = import.meta.env['VITE_COMMON_API_ENDPOINT'];
```

Do not "fix" TS4111 by switching to brackets. TS4111 is the intended failure for an undeclared name. Add the name to the portal `ImportMetaEnv` declaration, or correct the spelling, then keep property access.

## Declaring a new variable

1. Name it per ADR-0031 (`VITE_APP_<PORTAL>_…` or `VITE_COMMON_…`).
2. Add it to that portal's shared `ImportMetaEnv` in `env/index.d.ts`.
3. Read it with `import.meta.env.VITE_…`.
