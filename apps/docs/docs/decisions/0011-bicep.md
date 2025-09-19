---
sidebar_position: 11
sidebar_label: 0011 Bicep
description: "This MADR explains the decision to use Bicep."
# These are optional elements. Feel free to remove any of them.
status: accepted
date: 2024-09-09
deciders:
---

# Using Bicep for Infrastructure as Code instead of manual configuration of environments



## Context and Problem Statement
Bicep is a domain-specific language (DSL) for deploying Azure resources declaratively. It aims to simplify the authoring experience compared to traditional ARM templates. Prior to this decision, we were manually configuring Azure resources, which was error-prone and hard to maintain. We need a more structured and maintainable approach to managing infrastructure as code in our build pipeline.

## Decision Drivers

- Simplified syntax for defining Azure resources.
- Improved readability and maintainability of infrastructure code.
- Better tooling support and integration with Azure services.
- Reduced cognitive load when managing complex infrastructure.
- Consistency and reliability in resource deployments.

## Considered Options
-  ARM templates.
-  Bicep.
-  Terraform.


## Decision Outcome
We will use Bicep for defining and deploying Azure resources.

## Consequences
### Positive
- Simplified syntax compared to ARM templates.
- Improved readability and maintainability of infrastructure code.
- Better tooling support and integration with Azure services.

### Negative
- When using Bicep with automated builds, it doesn't properly detect changes when running in validate mode, so it's skipped for now.
- Potential learning curve for team members unfamiliar with Bicep.


## Pros and Cons of the Options

### ARM templates
Pros:
- Proven and reliable.
- Widely used in the Azure ecosystem.
Cons:
- Complex syntax and boilerplate code.
- Harder to maintain and read.

### Bicep
Pros:
- Simplified syntax for defining Azure resources.
- Improved readability and maintainability of infrastructure code.
- Better tooling support and integration with Azure services.
Cons:
- Validation mode does not detect changes as expected, necessitating incremental mode or manual checks.

### Terraform
Pros:
- Widely supported across multiple cloud platforms.
- Robust change detection mechanisms.
Cons:
- Adds complexity if Azure is the sole target environment.

## MORE INFORMATION
- [Bicep Documentation](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/)

