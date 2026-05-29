---
sidebar_position: 1
title: "Queue Storage Overview"
description: "Overview of the Cellix queue storage framework service and how applications are expected to use it"
---

# Queue Storage Overview

The `@cellix/service-queue-storage` framework package provides a typed way to use Azure Queue Storage in Cellix applications.

## What It Solves

Applications need to:

1. Send and receive queue messages without exposing a broad raw queue transport API
2. Define queue payload contracts clearly and validate them consistently
3. Log queue traffic automatically on the normal application paths
4. Support local Azurite development without redefining production infrastructure expectations
5. Keep application-specific queue definitions out of the framework package

## Architecture Pattern

Cellix uses a **registered typed service** model for queues:

```text
Application Queue Definitions
            ↓
       registerQueues()
            ↓
 Application-Specific Queue Service
            ↓
  Typed send / receive / peek methods
```

The important boundary is:

- applications define queues and use typed queue methods
- the framework owns the raw Azure Queue Storage transport, validation, and logging enforcement

## Core Capabilities

### Typed Queue Definitions

Applications define queue contracts explicitly, including:

- queue name
- payload schema
- optional logging tags and metadata

### Typed Queue Services

Applications consume only the queue methods generated for their registered queues, not generic low-level queue methods.

### Automatic Logging

When logging is enabled, typed send and receive paths automatically persist queue message logs using the configured blob logger.

### Local Development Support

Azurite workflows may use startup-time provisioning for known queue resources, while production environments are expected to provision infrastructure explicitly.

## Consumer Model

The intended usage is:

1. Define queues in an application package
2. Register them once
3. Extend the generated queue `Service`
4. Use only the typed queue methods exposed by that application service

This keeps application code focused on business queues rather than Azure transport mechanics.

## Logging Model

Queue logging is treated as a framework concern on the normal typed paths:

- outbound messages are logged automatically when sent
- inbound messages are logged automatically when received
- queue definitions may contribute custom tags and metadata
- the framework guarantees standard fields such as direction and queue name

## Infrastructure Model

Cellix distinguishes between local convenience and production ownership:

- local development may provision known queue-related resources during startup
- production environments should provision queues and logging storage explicitly through infrastructure-as-code

## Related ADR

- [ADR-0033: Azure Queue Storage via Typed Registered Services](/docs/decisions/azure-queue-storage-typed-services)
