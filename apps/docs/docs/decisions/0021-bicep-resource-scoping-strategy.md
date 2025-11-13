---
sidebar_position: 21
sidebar_label: 0021 Bicep Resource Scoping Strategy
description: "This ADR documents the resource scoping strategy for Azure resources deployed via Bicep templates."
status: pending
date: 2025-10-16
contact: gidich nnoce14
deciders: gidich etang93 mgupta83 nnoce14 iwilson dheruwala
---

# Bicep Resource Scoping Strategy

## Context and Problem Statement

As we expand our Azure infrastructure using Bicep templates, we need a clear strategy for how resources are scoped and shared across applications and environments. This ADR documents the current resource scoping patterns based on our existing Bicep templates in `iac/`, `apps/api/iac/`, and `apps/ui-community/iac/` directories. It also addresses the specific case of Azure Cognitive Search service deployment strategy, particularly constrained by our $150/month MSDN subscription budget.

Resources are categorized into two types of infrastructure management:
- **Application-specific infrastructure**: Managed within each application's repository (Function Apps, Storage Accounts, Cosmos DB, etc.)
- **Shared infrastructure**: Managed in a separate infrastructure repository (Front Door, Key Vault, subscription-level resources)

## Decision Drivers

- Cost optimization and resource utilization efficiency
- Security and isolation requirements between applications
- Operational complexity and maintenance overhead
- Azure service limitations and quotas
- Environment separation (dev, qa, uat, prd)
- Compliance with Azure resource naming and scoping best practices
- **$150/month MSDN subscription budget constraint**

## Considered Options

- One resource per environment per application (maximum isolation)
- One resource per application (shared across environments)
- One resource per subscription (shared across applications)
- Hybrid approach based on resource type and business requirements

## Decision Outcome

We will use a **hybrid resource scoping strategy** based on resource type, business requirements, and Azure service characteristics. The strategy balances isolation, cost efficiency, and operational simplicity.

Resources are managed across two infrastructure repositories:
- **Application repositories**: Contain application-specific infrastructure (this repository)
- **Shared infrastructure repository**: Contains cross-application resources (Front Door, Key Vault, etc.)

### Resource Scoping Matrix

| Category | Resource Type | Scope | SKU Tier | Reasoning |
|----------|---------------|-------|----------|-----------|
| **Compute** | Function App | Two per environment per application (standard)<br/>One per environment per application (CellixJS/ShareThrift) | B1 Basic (Sample)<br/>B2 Basic (Enterprise) | Requires environment-specific configuration, deployment slots, and isolation. Standard is 2 instances for high availability, but sample applications use 1 instance to reduce costs within $150/month MSDN budget. B1 tier used for cost optimization in sample apps, B2 recommended for enterprise applications. |
| **Compute** | App Service Plan | One per environment per application | B1 Basic (Sample)<br/>B2 Basic (Enterprise) | Compute resource isolation, scaling requirements. Basic tier provides sufficient compute for development workloads. B1 used for cost optimization in sample apps, B2 recommended for enterprise applications. |
| **Storage** | Storage Account | One per environment per application | Standard_RAGZRS | Application storage for blobs, queues, and tables. Data isolation between environments, security boundaries. Geo-redundant with read access for high availability. |
| **Storage** | Static Website (Storage) | One per environment per application | Standard_RAGZRS | Frontend assets require environment-specific deployments for testing and staging. Geo-redundant with read access. |
| **Database** | Cosmos DB (MongoDB) | One per environment per application | Standard | One database per application with autoscaling to maximum 1000 RU/s shared across up to 25 collections. Data isolation, performance requirements, backup strategies. |
| **Monitoring** | Application Insights | One per environment per application | Classic | Telemetry isolation, monitoring per environment. Classic mode for cost optimization. |
| **Search/AI** | Azure Cognitive Search | See special case below | Free (Sample)<br/>Basic (Enterprise) | Complex scoping due to cost and quota constraints |
| **Security** | Key Vault | One per environment (shared across applications) | Standard | Secrets management shared across applications within each environment. Managed in separate infrastructure repository for cross-application resources. |
| **Networking** | Azure Front Door | One per subscription | Standard | Global CDN and application delivery network. Managed in separate infrastructure repository for cross-application resources. |

## Azure Cognitive Search Service Strategy

### Enterprise Applications
- **Scope**: One per application (Basic tier)
- **SKU**: basic
- **Reasoning**: Each application requires dedicated indexes for each searchable collection in each environment. Basic tier provides up to 15 indexes per service, making shared services across applications impractical due to index limits. Search indexes are application-specific with Basic tier providing adequate performance for enterprise workloads.
- **Cost**: ~$70+/month per service

### CellixJS and ShareThrift (MSDN Subscription)
- **Scope**: One shared Free tier service across both applications
- **SKU**: free
- **Reasoning**: Free tier constraints limit deployment options, cost optimization for development/testing, **constrained by $150/month MSDN subscription budget**. Despite the technical preference for separate services, budget limitations force sharing of the single allowed Free tier service across both sample applications.
- **Limitations**:
  - Only 1 Free tier service allowed per Azure subscription
  - Maximum 3 indexes per service
  - Limited to 10,000 documents total
  - No SLA, limited support
- **Cost**: $0/month (vs Basic tier at ~$70+/month)

### Future Migration Path
When applications outgrow Free tier limitations:
1. Migrate to Basic tier services (one per application)
2. Implement proper index partitioning strategies
3. Update Bicep templates to support tier-specific configurations

## Consequences

### Positive
- Cost optimization through resource sharing where appropriate
- Clear separation of concerns between applications and environments
- Compliance with Azure service limitations and quotas
- Maintainable Bicep template structure following consistent patterns

### Negative
- Cognitive Search Free tier creates coupling between CellixJS and ShareThrift (technically undesirable due to index isolation requirements)
- Potential performance bottlenecks with shared Free tier search service
- Complex migration path when outgrowing Free tier limitations
- **$150/month MSDN budget constraint limits scalability options (e.g., single Function App instance instead of standard 2-instance high availability)**
- **Reduced high availability for sample applications (CellixJS/ShareThrift) due to cost constraints**
- **Lower performance tiers (B1) used in sample applications may not meet enterprise production requirements**

## Resource Scoping Rationale

### Application-Specific Resources (One per Environment per Application)
Most Azure resources follow this pattern to ensure proper isolation, security, and operational boundaries:

- **Compute Resources** (Function Apps, App Service Plans): Environment-specific deployments allow for independent scaling, configuration, and troubleshooting. Multiple instances provide high availability in production.
- **Storage Resources** (Storage Accounts, Static Websites): Data isolation between environments prevents accidental cross-contamination. Environment-specific storage enables safe testing and staging workflows.
- **Database Resources** (Cosmos DB): Data isolation is critical for security and compliance. Environment-specific databases allow for independent backup/restore operations and performance tuning.
- **Monitoring Resources** (Application Insights): Telemetry isolation enables accurate monitoring and alerting per environment without noise from other environments.

### Shared Resources (One per Environment, Cross-Application)
- **Key Vault**: Secrets management is centralized per environment but shared across applications to reduce management overhead while maintaining security boundaries.

### Subscription-Level Resources (One per Subscription)
- **Azure Front Door**: Global CDN and traffic routing serves all applications and environments from a single entry point for optimal performance and cost efficiency.

### Special Cases
- **Azure Cognitive Search**: Complex scoping driven by technical limitations (15-index limit per service) and cost constraints ($150/month MSDN budget), resulting in shared Free tier for sample applications despite technical preference for isolation.

## More Information

- [Azure Cognitive Search Service Limits](https://docs.microsoft.com/en-us/azure/search/search-limits-quotas-capacity)
- [Azure Resource Naming Conventions](https://docs.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-naming)
- [Bicep Template Best Practices](https://docs.microsoft.com/en-us/azure/azure-resource-manager/bicep/best-practices)


## Front Door Origin Group Naming Convention

There is no official recommendation from Microsoft for Origin Group naming convention. We are using `ogn` in our Bicep templates and parameter names to refer to Front Door "Origin Groups". In this repository `ogn` specifically means "origin group name" (for example: `ocm-dev-ogn-ui-community`). Using `ogn` consistently keeps origin-group identifiers concise and makes cross-references between Bicep modules and deployment parameters easier to follow.

### Function App High Availability Standard
For production enterprise applications, we recommend 2 Function App instances per environment for high availability and load distribution. The sample applications (CellixJS and ShareThrift) currently use 1 instance to stay within the $150/month MSDN budget constraints.

### SKU Tier Guidelines
The current Bicep templates use cost-optimized tiers (B1 Basic) for the sample applications to stay within the $150/month MSDN budget. For enterprise applications, we recommend upgrading to B2 Basic tier for improved performance and capacity. This provides better CPU and memory allocation suitable for production workloads.

### Azure Cognitive Search Index Considerations
Each application typically requires multiple indexes for different searchable collections (e.g., users, products, documents) across multiple environments (dev, qa, uat, prod). The Basic tier allows up to 15 indexes per service, making it technically infeasible to share search services across multiple applications. This architectural requirement drives the "one service per application" scoping decision for enterprise deployments.

### Cosmos DB Autoscaling Configuration
Cosmos DB accounts use autoscaling with a shared maximum throughput limit of 1000 RU/s across all databases within the account. This cost-optimized approach provides automatic scaling based on demand while staying within budget constraints. Individual databases can burst up to this shared limit, with the system automatically managing throughput distribution.

### Separate Infrastructure Repository
Certain Azure resources that span multiple applications or require subscription-level management are handled in a separate infrastructure repository. This includes:

- **Azure Front Door**: Global CDN and application delivery network
- **Key Vault**: Shared secrets management across applications within each environment
- **Other cross-cutting resources**: Network security groups, subscription-level policies, etc.

This separation ensures proper isolation between application-specific infrastructure (managed per application) and shared infrastructure (managed centrally) while maintaining clear ownership and deployment boundaries.

### Resource Dependencies and Deployment Order
Resource scoping decisions are influenced by deployment dependencies and operational requirements:

- **App Service Plan → Function App**: Function Apps depend on pre-existing App Service Plans for compute resources
- **Storage Account → Function App**: Required for AzureWebJobsStorage and WEBSITE_CONTENTAZUREFILECONNECTIONSTRING
- **Application Insights → Function App**: Connection string must be available for telemetry configuration
- **Cosmos DB Account → Database**: Database creation depends on account provisioning
- **Key Vault → Function App**: Managed identity setup requires Key Vault to exist first

This dependency chain drives the modular Bicep template structure and explains why some resources are referenced as `existing` while others are created within the same deployment.

### Cost Governance and Budget Management
The $150/month MSDN subscription constraint drives several architectural decisions:

- **Tier Selection**: B1 Basic instead of B2 Basic for compute resources
- **Instance Counts**: Single Function App instances instead of high availability pairs
- **Service Selection**: Shared Free tier Cognitive Search instead of per-application Basic tier
- **Resource Sharing**: Key Vault shared across applications per environment to minimize overhead

**Ongoing Monitoring Requirements:**
- Monthly cost reviews against the $150 budget
- Resource utilization monitoring to identify optimization opportunities
- Regular assessment of whether sample applications can migrate to more robust tiers
- Cost alerts configured at 80% of budget threshold

We maintain an Excel spreadsheet tracking the Simnova MSDN subscription budget for all resources required by CellixJS/ShareThrift applications. This spreadsheet includes detailed cost breakdowns by resource type, environment, and projected monthly totals to ensure we stay within the $150/month limit. See the [Azure Resource Pricing Calculator](https://azure.microsoft.com/en-us/pricing/calculator/) for reference.

While respecting the $150/month MSDN budget constraint, we aim to align our development environment as closely as possible with production application needs. This allows us to effectively explore and test scenarios in an environment that emulates production requirements, while strategically reducing unnecessary costs where possible. The resource scoping decisions balance these competing priorities to maintain development velocity without compromising architectural integrity.

This constraint is temporary for development/demo environments and should be reassessed when applications move to production subscriptions with higher budgets.

## Resource Naming Conventions

We defer to Microsoft's recommended resource naming conventions as documented in the [Azure Cloud Adoption Framework](https://learn.microsoft.com/en-us/azure/cloud-adoption-framework/ready/azure-best-practices/resource-abbreviations). Our Bicep templates implement these conventions using standardized prefixes and abbreviations defined in `iac/global/resource-types.json` and `iac/global/resource-naming-convention.bicep`.

The naming convention follows a consistent pattern across resources:
- **Prefix**: `${applicationPrefix}-${environment}-` (e.g., `ocm-dev-`)
- **Small Prefix**: `${applicationPrefix}${environment}` (e.g., `ocmdev`)
- **Abbreviation**: Microsoft's standard abbreviation from `resource-types.json`
- **Instance Name**: Application-specific identifier
- **Unique ID**: `uniqueString(resourceGroup().id)` for global uniqueness

| Resource | Naming Convention | Date of Implementation | Who Decided It |
|----------|-------------------|-------------------------|----------------|
| Resource Group | `${applicationPrefix}-${environment}-rg` | 2025-10-16 | gidich, nnoce14 |
| CDN Profile | `${smallPrefix}${abbrev}${instanceName}${uniqueId}` | 2025-10-16 | gidich, nnoce14 |
| CDN Endpoint | `${prefix}${abbrev}-${instanceName}-${uniqueId}` | 2025-10-16 | gidich, nnoce14 |
| Front Door Endpoint | `${prefix}${abbrev}-${instanceName}-${uniqueId}` | 2025-10-16 | gidich, nnoce14 |
| Application Insights | `${prefix}${abbrev}` | 2025-10-16 | gidich, nnoce14 |
| App Service Plan | `${applicationPrefix}-${environment}-asp-${instanceName}` | 2025-10-16 | gidich, nnoce14 |
| Function App | `${prefix}${abbrev}-${instanceName}-${uniqueId}` | 2025-10-16 | gidich, nnoce14 |
| Cosmos DB Mongo Account | `${smallPrefix}${abbrev}${instanceName}${uniqueId}` | 2025-10-16 | gidich, nnoce14 |
| Cosmos DB | `${smallPrefix}${abbrev}${instanceName}${uniqueId}` | 2025-10-16 | gidich, nnoce14 |
| Cognitive Search | `${applicationPrefix}${abbrev}cog${location}${uniqueId}` | 2025-10-16 | gidich, nnoce14 |
| Storage Account | `${smallPrefix}${abbrev}${instanceName}${uniqueId}` | 2025-10-16 | gidich, nnoce14 |
| Managed Identity | `${smallPrefix}${abbrev}${instanceName}${uniqueId}` | 2025-10-16 | gidich, nnoce14 |
| Event Hub Namespace | `${smallPrefix}${abbrev}${instanceName}${uniqueId}` | 2025-10-16 | gidich, nnoce14 |
| Event Hub | `${prefix}${abbrev}-${instanceName}-${uniqueId}` | 2025-10-16 | gidich, nnoce14 |

*Note: Abbreviations are sourced from Microsoft's official resource abbreviation list. The "ogn" convention for Front Door Origin Groups is a custom addition for clarity in our templates.*