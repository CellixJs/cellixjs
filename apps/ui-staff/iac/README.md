# IaC for @apps/ui-staff

This directory contains Bicep templates to provision the storage account and static website backing the UI Staff portal.

Validate locally:

- Build the Bicep template to generate JSON output:
  bicep build main.bicep --outdir build

- Validate with az (replace resource group and parameters as appropriate):
  az deployment group validate --resource-group rg-your-dev --template-file build/main.json --parameters @dev.bicepparam

Follow the repository pattern used by apps/ui-community/iac when creating additional environments.
