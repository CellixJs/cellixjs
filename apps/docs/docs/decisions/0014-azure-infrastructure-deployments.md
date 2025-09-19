---
sidebar_position: 14
sidebar_label: 0014 Azure Infrastructure Deployments
description: "Decision record for selecting deployment approach: AVM vs Bicep."
status: proposed
contact: gidich etang93 mgupta83
date: 2025-08-01
deciders: gidich etang93 mgupta83 nnoce14 iwilson dheruwala
consulted:
informed:
---

# Select a Deployment Approach: AVM vs Bicep

## Context and Problem Statement

The project requires a reliable and maintainable deployment approach for Azure infrastructure. The chosen solution must balance ease of use, maintainability, and flexibility while supporting the project's long-term scalability. The decision revolves around whether to use Azure Verified Modules (AVM) or Bicep templates for infrastructure deployments. AVM modules are maintained by Microsoft, reducing the need for manual updates, while Bicep templates provide greater flexibility but require more manual maintenance over time.

## Decision Drivers

- Ease of use and maintainability
- Long-term scalability and reduced manual updates
- Flexibility for custom infrastructure requirements
- Alignment with Azure best practices
- Community support and documentation

## Considered Options

- **Azure Verified Modules (AVM)**: Pre-built modules maintained by Microsoft, offering ease of use and reduced maintenance.
- **Bicep Templates**: Lightweight, declarative infrastructure-as-code language for Azure, providing flexibility but requiring manual updates.
- **Hybrid of Both**: Frontend Deployments will use Bicep as enabling static websites are not a capability of Bicep directly, we need the flexibility to call upon powershell which AVM will not allow. We will also need the frontdoor cdn profile to be shared across the organization which currently isn't an option with AVM.
Backend Deployments will use a mixture of Bicep and AVM. 
CosmosDB: There is a bug with the cosmos AVM where the ternary options are not being respected causing parameters we are setting to be ignored. All other resources and modules can use AVM for the backend Deployments.


## Decision Outcome

Chosen option: **TBD**

No decision has been made yet. The team will conduct a focused evaluation by implementing deployments for selected infrastructure components using both AVM and Bicep. This approach ensures a fair comparison and avoids redundant effort. The final decision will be based on the criteria above and the results of this evaluation.

### Consequences

- Good: The selected approach will streamline infrastructure deployments, improve maintainability, and align with Azure best practices.
- Good: Using AVM reduces manual updates, freeing up developer time for other tasks.
- Bad: Bicep may require more manual updates, increasing maintenance overhead.

## Validation

- Comparison of deployment complexity and maintainability for selected infrastructure components
- Evaluation of long-term scalability and update requirements
- Alignment with Azure best practices and CI/CD workflows

## Pros and Cons of the Options

### Azure Verified Modules (AVM)

- Good, because modules are maintained by Microsoft, reducing manual updates.
- Good, because it simplifies deployment workflows and aligns with Azure best practices.
- Neutral, because it may have limited flexibility for custom infrastructure requirements.
- Bad, because it may not cover all use cases, requiring fallback to custom solutions.

### Bicep Templates

- Good, because it provides flexibility for custom infrastructure requirements.
- Good, because it is lightweight and integrates seamlessly with Azure.
- Neutral, because it requires manual updates over time, increasing maintenance overhead.
- Bad, because it may require more effort to align with Azure best practices.

### Hybrid of Both

- Good, because it provides flexibility where needed
- Bad, because decision makers need to remember to update with every module not listed.

## More Information

The team will select one or more infrastructure components to implement deployments using both AVM and Bicep. This focused approach ensures a fair comparison and avoids redundant effort. The evaluation will consider ease of use, maintainability, scalability, and alignment with Azure best practices. The final decision will be documented in this ADR after the evaluation is complete.

> For ongoing reference, the team can track the relative adoption and popularity of these tools using [Azure documentation](https://learn.microsoft.com/en-us/azure/).