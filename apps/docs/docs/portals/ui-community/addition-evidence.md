---
portal: ui-community
portalId: UI_COMMUNITY
variableGroup: ocm-app-ui-community
pipelineTemplate: build-pipeline/templates/deploy-ui.yml
adr: ADR-0031
pr: 241
date: "2026-05-07"
---

# Portal Addition Evidence: ui-community

## Checklist

- [x] ADR-0031 compliance verified — see [ADR-0031](../../decisions/0031-ui-env-vars.md)
- [x] Environment variables follow `VITE_APP_UI_COMMUNITY_<NAME>` naming convention
- [x] Env-var compliance validated by `packages/ocom-verification/archunit-tests/src/env-vars-naming.archunit.test.ts`
- [x] Pipeline template used: `build-pipeline/templates/deploy-ui.yml`
- [x] Variable group required: `ocm-app-ui-community`
- [x] Front Door / CDN endpoint configured in Bicep (`iac/`)
- [x] Portal added to `detect-changes.cjs` affected-portal detection

## References

- PR: #241
- Date: 2026-05-07
- ADR: [0031-ui-env-vars.md](../../decisions/0031-ui-env-vars.md)
- Pipeline template: [deploy-ui.yml](../../../../../build-pipeline/templates/deploy-ui.yml)

## Reuse

To add a new portal (e.g., `ui-support`), copy this file to `apps/docs/docs/portals/ui-support/addition-evidence.md` and update all `UI_COMMUNITY` → `UI_SUPPORT` references and the variable group name.
