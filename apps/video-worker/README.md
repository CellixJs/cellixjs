# @apps/video-worker

Processes the `encode-video` queue. Each message describes an uploaded video blob. The worker encodes it with `@ocom/service-video-encoding` into adaptive-bitrate H.264/AAC output with DASH and HLS manifests, and writes the result back to Blob Storage.

> **Being repurposed.** Video encoding is no longer done in the cloud. Staff encode uploaded videos on their own machines with an encoder CLI that works through the API ([ADR 0036](../docs/docs/decisions/0036-manual-video-encoding-by-staff.md)). This app will become that CLI. Until then it runs only locally, as a loop against Azurite.

## Running locally

Install ffmpeg (with the `libx264` and `aac` encoders), ffprobe, and [shaka-packager](https://github.com/shaka-project/shaka-packager) v3 as `packager` on your `PATH`. The worker checks for them at startup and exits if any are missing.

Start Azurite and the API with `pnpm run dev`, then in a second terminal:

```bash
pnpm run dev:video-worker
```

This builds the worker's dependencies and runs it in `loop` mode, using the API's Azurite storage settings (scoped to the current worktree). It is not part of `pnpm run dev`, so developers without ffmpeg are unaffected.

## How a message is handled

`processNextFromEncodeVideoQueue` from `@cellix/service-queue-storage` receives one message and keeps it hidden with a heartbeat while it encodes. Then:

| Outcome | What happens to the message |
|---|---|
| Encoded | Deleted |
| `source-not-found` or `unsupported-source` | Moved to `encode-video-poison` |
| Invalid payload | Moved to `encode-video-poison` |
| Any other failure (storage, ffmpeg, packager) | Left on the queue for retry |
| Delivered more than `QUEUE_MAX_DEQUEUE_COUNT` times | Moved to `encode-video-poison` |
| SIGTERM or SIGINT while encoding | ffmpeg is stopped and the message is released for immediate retry |

Outcomes are written as JSON log lines keyed by `videoId` (`encode.started`, `encode.stage`, `encode.completed`, `queue.message`). Results are not yet reported back to the API.

In `once` mode the process exits with code 1 when the message was left for retry or lost, so the job execution shows as failed. Otherwise it exits with code 0, including after poisoning a message.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `WORKER_MODE` | `once` | `once` (one message, then exit) or `loop` |
| `AZURE_STORAGE_ACCOUNT_NAME` | required | Storage account holding the queue and blobs |
| `AZURE_STORAGE_CONNECTION_STRING` | unset | Azurite connection string. When unset, managed identity is used (`AZURE_CLIENT_ID` selects a user-assigned identity). |
| `FFMPEG_PATH`, `FFPROBE_PATH`, `PACKAGER_PATH` | on `PATH` | Encoder executables |
| `ENCODING_WORKING_DIRECTORY` | OS temp dir | Scratch space for encode jobs |
| `QUEUE_VISIBILITY_TIMEOUT_SECONDS` | 300 | Message lease, renewed while encoding |
| `QUEUE_MAX_DEQUEUE_COUNT` | 5 | Deliveries before a message is poisoned |
| `QUEUE_POLL_INTERVAL_SECONDS` | 5 | Sleep between empty polls in `loop` mode |
