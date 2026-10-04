---
sidebar_position: 35
sidebar_label: 0035 Video Encoding Worker Hosting
description: "Host the ffmpeg video encoding worker as an event-driven Azure Container Apps Job triggered by an Azure Storage queue."
status: proposed
contact: tang-eddie
date: 2026-10-03
deciders: tang-eddie
consulted:
informed:
---

# Video Encoding Worker on Azure Container Apps Jobs

## Context and Problem Statement

`@cellix/service-video-encoding` turns an uploaded video into adaptive-bitrate H.264/AAC output with DASH and HLS manifests. It shells out to ffmpeg (with `libx264`) and shaka-packager, and a single job can run for tens of minutes on a few CPU cores. Uploads will reach the encoder through an `encode-video` Azure Storage queue, using `EncodeVideoRequest` as the message payload.

The existing API runs on an Azure Functions app (`iac/function-app`, `linuxFxVersion = 'NODE|20'`). That host has no ffmpeg or shaka-packager, cannot use a custom image on the consumption plan, and has execution time limits unsuited to long encodes. Expected volume is very low (on the order of one 15-minute upload per user per year), so the worker will sit idle almost all of the time.

Where should the encoding worker run, and how should it consume the queue?

## Decision Drivers

1. **Runtime control**: ffmpeg with `libx264` and shaka-packager v3 must be present at pinned versions.
2. **Long-running CPU work**: a job must be able to run for tens of minutes without being killed.
3. **Near-zero idle cost**: the worker is idle almost all the time, so fixed hourly charges dominate the bill.
4. **Fit with existing infrastructure**: reuse the existing storage account, queues, managed identity, and Bicep conventions.
5. **Fit with ADR 0033**: keep typed queue contracts, payload validation, and logging from `@cellix/service-queue-storage`.
6. **Local development with Azurite**, matching the rest of the repo.

## Considered Options

- Azure Container Apps Job, event-triggered by the Azure Storage queue
- Azure Functions hosted on Azure Container Apps, with a queue trigger
- Azure Functions Premium or Dedicated plan with a custom container
- Azure Functions Flex Consumption with bundled static binaries
- Azure Batch or AKS
- A third-party managed video service instead of self-encoding

## Decision Outcome

Chosen option: **Azure Container Apps Job, event-triggered by the Azure Storage queue**. It is the only option that meets drivers 1–3 together: a custom image with the exact toolchain, configurable run time, and per-second billing with no charge between executions.

### What This Means

**Hosting**

- A new Container Apps environment runs an event-triggered job. Its scale rule is the `azure-queue` scaler on `encode-video`, with a queue length of 1 so that each message starts one execution.
- Each execution handles exactly one message and then exits. Parallelism comes from multiple executions, capped by the job's maximum concurrent executions setting.
- The image is built on a Node 22 base. It installs an ffmpeg build that includes `libx264` and a pinned shaka-packager release binary, and verifies the binary's checksum during the build.
- The job uses a user-assigned managed identity for Blob and Queue access. Use it for scale-rule authentication too if the platform supports that for the `azure-queue` scaler; otherwise fall back to a connection-string secret.
- Initial sizing is 4 vCPU and 8 GiB on the Consumption profile. The replica timeout should comfortably exceed the longest expected encode, starting at 4 hours. The job's own replica retries are set to 0, because retries are handled through the queue (see below).

**Queue consumption (amends ADR 0033 for this host)**

ADR 0033 designs inbound queues for Azure Functions queue triggers, where the host owns dequeue, retry, and poison handling. A Container Apps Job has no such host. Its scaler only counts messages and starts executions, so the worker has to take over those delivery concerns itself:

1. **Receive** one message with an initial visibility timeout of 10 minutes.
2. **Renew** that visibility on a heartbeat every few minutes while the encode runs. A crashed execution then frees its message within minutes, while a long encode never becomes visible to a second worker.
3. **Validate and log** by passing the message body and metadata (`id`, `popReceipt`, `dequeueCount`) to the registered `receiveFromEncodeVideoQueue(payload, metadata)`. Typed validation and logging stay in `@cellix/service-queue-storage`, exactly as ADR 0033 intends.
4. **Encode**, then **delete** the message on success.
5. **Permanent failures** (`source-not-found`, `unsupported-source`, or an invalid payload): record the failure and delete the message without retrying.
6. **Transient failures** (`storage-failed`, `encode-failed`, `packaging-failed`): leave the message, so it reappears after the visibility timeout.
7. **Poison handling**: when `dequeueCount` exceeds 5, which matches the Azure Functions default, move the message to `encode-video-poison` and delete it.

The receive, renew, delete, and poison logic lives in a small worker-host adapter. It does not belong in the queue service's public API, so ADR 0033's statement that inbound methods are "not a polling abstraction" still holds. If a second worker host later needs the same delivery loop, extracting it into a framework package should be a separate decision.

**Application boundaries**

- The API registers `encode-video` as an **outbound** queue and sends `EncodeVideoRequest` payloads. The worker registers the same schema as an **inbound** queue.
- The worker lives in its own app, for example `apps/video-worker`, so its image contains only the worker, not the GraphQL API.
- How the worker reports results (the manifest addresses, or a permanent failure) back to the upload's domain entity is left open. The options are a result queue consumed by the API, or the worker calling application services directly. It should be decided when the upload feature is designed.

**Cost guardrails**

The environment must not use any feature that triggers the $0.10/hour management fee (about $73/month), which would dominate cost at this volume:

- only the **Consumption** workload profile, with no Dedicated profiles
- **no private endpoint**
- **no planned maintenance** window
- **no custom virtual network** unless one is required later

The Bicep also adds an **Azure Cost Management budget alert** on the worker's resource group, starting at $10/month. A September 2026 change split the management fee into per-feature meters (`Environment Management Hour`, `Environment Planned Maintenance Hour`, `Environment Private Endpoint`). Microsoft's documentation ties the fee only to Dedicated profiles, private endpoints, and planned maintenance, but it does not map the new meter names explicitly. The alert catches an unexpected environment charge within days.

**Local development**

- There is no local Container Apps emulator. Locally, the worker runs in **loop mode**: the same handler, wrapped in a loop that keeps receiving from the Azurite queue, with ffmpeg and shaka-packager installed on the developer machine.
- The container image can also run against Azurite to test the image itself. Inside a container, Azurite is reached at `host.docker.internal` (or a compose service name), with ports taken from `getAzuritePorts()`. Two existing checks do not recognise those hosts as local and must be broadened before this works:
  - `isLocalBlobConnectionString` in `@cellix/service-blob-storage` accepts only `localhost`, `127.0.0.1`, and `[::1]`.
  - Azurite detection for queue provisioning in `@cellix/service-queue-storage` checks only for `UseDevelopmentStorage=true` and `127.0.0.1`.

### Consequences

- Good, because the image pins the exact toolchain that the encoder's integration tests run against.
- Good, because idle time costs nothing. At the expected volume, compute falls within the monthly free grant of 180,000 vCPU-seconds and 360,000 GiB-seconds per subscription, and the main fixed cost is the container registry (about $5/month for Basic).
- Good, because typed payload validation and logging from ADR 0033 are reused unchanged.
- Good, because the encoder's work stays out of the API's Function App, so a long encode cannot affect API latency or scaling.
- Bad, because it introduces new infrastructure: a container registry, a Container Apps environment, the job, image build and push in CI, and new Bicep modules.
- Bad, because queue delivery semantics (visibility renewal, retry, poison) are now implemented by the worker instead of a host, and need their own tests.
- Bad, because the job's queue trigger polls on an interval, which adds up to about 30 seconds of delay before an encode starts. That is acceptable for this workload.
- Neutral, because GPL-licensed `libx264` ships in the image. That is acceptable for an internally run service, but should be noted for licence review.

## Validation

- The worker has contract tests for its delivery behaviour against Azurite: success deletes the message, a permanent failure deletes it, a transient failure leaves it, `dequeueCount` above 5 moves it to the poison queue, and the heartbeat extends visibility.
- A CI step builds the image and runs `ServiceVideoEncoding.startUp()` inside it, which fails if ffmpeg, `libx264`, `aac`, ffprobe, or shaka-packager is missing.
- Bicep review confirms the environment has no Dedicated profile, private endpoint, planned maintenance, or custom VNet, and that the budget alert exists.
- After the first billed month, Cost analysis grouped by meter shows no Container Apps environment or management charges.

## Pros and Cons of the Options

### Azure Container Apps Job, event-triggered by the Azure Storage queue

- Good, because it supports a custom image, a configurable run time, and per-second billing only while an execution runs.
- Good, because one execution per message isolates jobs and makes them easy to reason about.
- Bad, because the worker must implement queue delivery semantics itself.
- Bad, because it is the first container-based infrastructure in the repo.

### Azure Functions hosted on Azure Container Apps, with a queue trigger

- Good, because it keeps the Functions programming model and host-owned queue semantics from ADR 0033, and supports a custom image.
- Neutral, because it would need a new queue-trigger adapter in `@cellix/api-core`, which currently supports only HTTP functions.
- Bad, because Functions timeouts and host behaviour still apply to long CPU-bound work, and it adds the Functions host's complexity for a single task.

### Azure Functions Premium or Dedicated plan with a custom container

- Good, because it supports host-managed queue triggers and custom images.
- Bad, because at least one instance is always running, which is a fixed monthly cost that is hard to justify for one encode per user per year.

### Azure Functions Flex Consumption with bundled static binaries

- Good, because it bills per execution and uses Functions queue triggers.
- Bad, because it has no custom containers, so static ffmpeg and shaka-packager binaries would have to be bundled into the deployment package and kept in sync by hand.
- Bad, because instance size and execution limits are less suited to long encodes.

### Azure Batch or AKS

- Good, because they scale to very high volume.
- Bad, because the operational and configuration overhead is far beyond what this workload needs.

### A third-party managed video service

- Good, because there is no encoding infrastructure to run.
- Bad, because it replaces `@cellix/service-video-encoding` instead of hosting it, and adds a vendor dependency and per-minute pricing. Azure Media Services, the Azure-native option, was retired in June 2024.

## More Information

- [ADR 0032: Azure Blob Storage client uploads](0032-azure-blob-storage-client-uploads.md)
- [ADR 0033: Azure Queue Storage typed services](0033-azure-queue-storage-typed-services.md)
- [Jobs in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/jobs)
- [Billing in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/billing)
- [Azure Container Apps pricing](https://azure.microsoft.com/en-us/pricing/details/container-apps/)
- [KEDA Azure Storage Queue scaler](https://keda.sh/docs/latest/scalers/azure-storage-queue/)
- `packages/cellix/service-video-encoding/README.md`
