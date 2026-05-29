---
sidebar_position: 33
sidebar_label: 0033 Azure Queue Storage Typed Services
description: "Architecture decision for exposing Azure Queue Storage through typed registered services in Cellix"
status: accepted
contact: nnoce14
date: 2026-05-29
deciders: nnoce14
consulted:
informed:
---

# Azure Queue Storage via Typed Registered Services

## Problem Statement

Cellix needs a consistent way to make Azure Queue Storage available to applications without leaking a broad low-level transport API into application code. The framework also needs to enforce queue contracts, logging expectations, and local-versus-production infrastructure boundaries consistently.

## Decision Drivers

1. Narrow consumer API for applications
2. Strong compile-time and runtime queue contract enforcement
3. Automatic logging on the normal queue paths
4. Clear separation between framework internals and application-specific queues
5. Practical Azurite support without weakening production infrastructure discipline

## Considered Options

- Expose a broad raw Azure Queue Storage service directly to consumers
- Hide Azure Queue Storage behind typed registered queue services
- Use Azure Queue Storage only through Azure Functions triggers with no framework service abstraction

## Decision Outcome

Chosen option: **Hide Azure Queue Storage behind typed registered queue services**, because it best aligns with the Cellix service model and gives applications a narrow, typed, intention-revealing API.

### What This Means

- Azure Queue Storage is exposed through **application-specific typed services**
- Application packages define concrete queues; the framework package stays queue-agnostic
- Application consumers use only the generated typed queue methods for the queues registered by their application
- Raw queue transport operations remain framework-internal
- Queue validation and queue logging are enforced by the framework on the normal typed send and receive paths

### Boundary Decision

#### Public to application consumers

- Queue-definition authoring helpers
- Queue registration
- Typed send, receive, and peek methods for registered queues

#### Internal to the framework

- Raw Azure Queue Storage transport operations
- Method binding and naming mechanics
- Logging enforcement mechanics
- Local provisioning mechanics

### Environment Decision

Cellix distinguishes between local development convenience and production ownership:

- Local/Azurite workflows may provision known queue-related resources during startup
- Production environments are expected to provision queues and related storage resources explicitly through infrastructure-as-code

This avoids turning normal runtime queue or logging operations into hidden infrastructure mutation.

## Consequences

### Positive

1. Applications get a narrow and intention-revealing queue API
2. Queue payload contracts are explicit and consistently enforced
3. Logging becomes a framework guarantee on typed queue paths
4. The framework remains reusable across multiple application packages
5. Local development remains practical without redefining production standards

### Neutral

1. Queue usage is opinionated around a registration pattern instead of ad hoc transport access
2. Application queue definitions follow framework-provided conventions

### Negative

1. The framework must maintain the typed registered-service abstraction over Azure Queue Storage
2. Consumers who need to bypass the typed queue model would require explicit framework changes

## Validation

Compliance with this decision is validated through:

- public contract tests in `@cellix/service-queue-storage`
- downstream package build and typecheck validation
- alignment between framework package docs and developer guidance in the docs site

## Pros and Cons of the Options

### Expose a broad raw Azure Queue Storage service directly to consumers

- Good, because it is simple to expose
- Good, because it mirrors the Azure SDK closely
- Bad, because it leaks framework internals into application code
- Bad, because it weakens consistency around validation and logging
- Bad, because it creates multiple competing usage styles

### Hide Azure Queue Storage behind typed registered queue services

- Good, because it gives applications a narrow and typed service contract
- Good, because it centralizes framework policies for validation and logging
- Good, because it keeps application queue definitions outside the framework package
- Neutral, because it introduces a registration pattern
- Bad, because it adds abstraction over the raw SDK

### Use Azure Queue Storage only through Azure Functions triggers with no framework service abstraction

- Good, because it follows an Azure-native trigger model
- Good, because it can simplify some event-driven integrations
- Bad, because it does not fit the Cellix application-service consumption model
- Bad, because it makes typed queue APIs less consistent across applications
- Bad, because it pushes queue policy into host-specific trigger implementations

## More Information

This decision complements:

- [0011 Bicep](/docs/decisions/0011-bicep.md)
- [0014 Azure Infrastructure Deployments](/docs/decisions/0014-azure-infrastructure-deployments.md)
- [0032 Azure Blob Storage with Managed Identity & Client Uploads](/docs/decisions/0032-azure-blob-storage-client-uploads.md)

Detailed developer and agent guidance belongs in the queue-storage technical overview and framework package docs rather than in this ADR.
