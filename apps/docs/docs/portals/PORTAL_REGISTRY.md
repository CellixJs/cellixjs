# Portal Registry

Canonical list of UI portals in this monorepo. Each portal has a unique uppercase key used in VITE_* environment variable names (ADR-0031).

| Portal Key    | App package          | Variable prefix              | Owner group           | Evidence |
|---------------|----------------------|------------------------------|-----------------------|----------|
| UI_COMMUNITY  | `apps/ui-community`  | `VITE_APP_UI_COMMUNITY_*`    | `ocm-app-ui-community` | [addition-evidence.md](ui-community/addition-evidence.md) |
| UI_STAFF      | `apps/ui-staff`      | `VITE_APP_UI_STAFF_*`        | `ocm-app-ui-staff`     | [addition-evidence.md](ui-staff/addition-evidence.md) |
| COMMON        | shared               | `VITE_COMMON_*`              | `ocm-common`           | — |

## Adding a new portal

1. Choose a `UI_<NAME>` key (uppercase, underscores only).
2. Add a row to this table.
3. Create `apps/docs/docs/portals/ui-<name>/addition-evidence.md` from the template in `ui-staff/addition-evidence.md`.
4. Create pipeline variable group `ocm-app-ui-<name>`.
5. The ArchUnit env-var compliance test will enforce the naming automatically.

## References

- [ADR-0031: UI environment variable naming convention](../decisions/0031-ui-env-vars.md)
- [ArchUnit enforcement](../../../../packages/ocom-verification/archunit-tests/src/env-vars-naming.archunit.test.ts)
