# UI Staff

This app follows the same deployment and IaC patterns as apps/ui-community.

Pipeline: uses apps/ui-staff/deploy-ui-staff.yml
IaC: apps/ui-staff/iac/main.bicep and dev.bicepparam

Required Azure DevOps variables / variable group keys:
- FRONTDOOR_DOMAIN_UI_STAFF
- Any VITE_... environment variables needed by the app

See apps/ui-community/README.md for examples and operational runbook notes.
