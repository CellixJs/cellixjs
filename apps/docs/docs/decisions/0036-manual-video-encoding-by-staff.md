---
sidebar_position: 36
sidebar_label: 0036 Manual Video Encoding by Staff
description: "Staff encode uploaded videos on their own machines with an encoder CLI that works through the API; no cloud encoding."
status: accepted
contact: tang-eddie
date: 2026-10-05
deciders: tang-eddie
consulted:
informed:
---

# Manual Video Encoding by Staff

## Context and Problem Statement

Community members upload videos, and `@cellix/service-video-encoding` turns an upload into adaptive-bitrate output (H.264/AAC with DASH and HLS manifests) for `@cellix/ui-video-player`. [ADR 0035](0035-video-encoding-worker-hosting.md) planned to run that encoding automatically in Azure, as a queue-triggered Container Apps Job.

It has since been decided that users will not trigger encoding. Users still upload videos, but platform staff encode them on their own machines with the existing encoding logic. A desktop (Electron) app may replace the first tool later.

How do staff find, encode, and publish uploaded videos, and how does that work with the upload flow already built?

## Decision Drivers

1. Encoding runs on staff machines, not in Azure.
2. No storage account keys or broad storage access on staff machines.
3. The first tool should be quick to build, and its logic reusable by a future Electron app.
4. Members' upload and playback flows stay as designed.
5. Encoding permission is explicit and grantable per staff role.

## Considered Options

- Staff encoder CLI that works entirely through the API
- Staff encoder that reads and writes Blob Storage directly with the staff member's Azure identity
- Electron app first
- Keep automatic cloud encoding (ADR 0035)

## Decision Outcome

Chosen option: **Staff encoder CLI that works entirely through the API**. Staff sign in as staff users, and the API issues narrowly scoped, short-lived storage access for each step, so staff machines never hold storage credentials. The same flow can run inside an Electron app later.

### Video lifecycle

`AWAITING_UPLOAD` → `UPLOADED` → `ENCODING` → `READY` or `FAILED`

1. **Upload (member).** A member whose role can manage site content requests an upload. The API creates the video (`AWAITING_UPLOAD`) and returns a signed PUT for `video-uploads/<communityId>/<videoId>`, locked to the declared size and content type (ADR 0032). The browser uploads directly. Completing the upload checks that the blob exists with the expected size, and moves the video to `UPLOADED`.
2. **Start encoding (staff).** The CLI lists videos that are `UPLOADED` (or `FAILED`, for a retry) across all communities. Starting one moves it to `ENCODING`, and the API returns a short-lived read link for the original plus the output destination: container `videos-<communityId>`, prefix `<videoId>/`. Starting a video that is already `ENCODING` is allowed, so another staff member can take over an abandoned encode.
3. **Encode (staff machine).** The CLI runs `ServiceVideoEncoding` locally. Instead of a storage SDK client, the encoder uses an adapter that downloads with the read link and uploads through write links requested from the API in batches. Each write link is a **blob-scoped SAS** with create and write permission, locked to one path under `<videoId>/` in the community's container, and valid for about an hour. The API validates every requested path and caps the number per video.
4. **Record the result (staff).** The CLI reports `READY` (manifest names, duration, rendition heights) or `FAILED` (error code and message).
5. **Playback (member).** Members of the community get the manifest URL and a short-lived, read-only, container-scoped SAS for `videos-<communityId>` (ADR 0032 amendment).

### Permissions

- Members: `canManageSiteContent` on their community role allows uploading and managing videos. Any member of the community can watch its ready videos.
- Staff: a new staff role permission, **`canEncodeVideos`**, allows listing, starting, and recording encodes for any community, and previewing the result. It appears in the staff role editor and is on by default for the Tech Admin role.
- Recording encoding results requires `canEncodeVideos`, not the system account.

### The encoder tool

- `apps/video-encoder` (formerly `apps/video-worker`) is the staff encoder CLI: `login`, `logout`, `list`, `encode <id>...`, and `encode --all`. `encode --all` skips videos another staff member is already encoding.
- The sign-in, start, download, encode, upload, and record flow lives in `@ocom/video-encoder-client`, so an Electron app can import it from its main process.
- Staff machines need ffmpeg (with `libx264` and `aac`), ffprobe, and shaka-packager v3. They are checked before the API is asked to start encoding, so a machine without them never leaves a video in `ENCODING`. An Electron app could bundle them later.
- Stopping an encode (Ctrl+C) or a missing tool is not recorded as a failure: the video stays `ENCODING`, and anyone with `canEncodeVideos` can start it again.

### Staff sign-in

- The CLI uses OAuth 2.0 authorization code with PKCE and a loopback redirect (RFC 8252): it listens on `http://127.0.0.1:<random port>/callback/<random path>` for the duration of the sign-in and opens the system browser.
- It reuses the **staff portal's app registration**, so tokens carry the same audience the API already validates for staff, and the staff user's `sub` matches the one the portal created (Entra ID subjects are pairwise per application).
- **Entra ID administrator step:** add a **Mobile and desktop applications** platform with redirect URI `http://localhost` to the staff portal's app registration. Entra ID accepts any port on a loopback redirect, and public-client sign-in needs no secret.
- The CLI requests `offline_access` so it can refresh its access token during long encodes. The session is saved in a file readable only by the user (`~/.ocom-video-encoder/session.json`).
- In local development the mock OIDC server accepts loopback redirects for the staff portal (`allowLoopbackRedirects` in `apps/ui-staff/mock-oidc.json`). It does not implement refresh tokens, so an encode that outlasts the mock's one-hour token opens the browser to sign in again.

### Retired from ADR 0035

- The Container Apps Job, container registry, image build, and related Bicep are not built. The worker's Dockerfile and ACR build template are removed.
- The `encode-video` queue and the worker's queue registry (`ServiceVideoWorkerQueueStorage`) are removed.
- `processNextFrom<QueueName>Queue` stays in `@cellix/service-queue-storage` as a general framework capability for hosts without queue triggers (ADR 0033 amendment), although nothing in OwnerCommunity uses it yet.

### Consequences

- Good, because no Azure compute, container registry, or always-on cost is added for encoding.
- Good, because staff machines never hold storage keys: every storage operation uses a link that is scoped to one blob or one container and expires.
- Good, because the encoding package, the upload flow, and the playback design built so far are reused unchanged.
- Good, because the encode flow is tool-agnostic, so the CLI and a future Electron app share it.
- Bad, because videos are only playable after a staff member encodes them, so publishing is delayed by staff availability.
- Bad, because each staff machine needs ffmpeg, ffprobe, and shaka-packager installed at the right versions until a bundled desktop app exists.
- Bad, because encodes depend on staff machine uptime and bandwidth. Uploading the output for a long 1080p video can take a while on a slow connection.
- Neutral, because GPL-licensed `libx264` runs on staff machines rather than in a deployed image. Licence obligations still apply if the tool, or an Electron app, ships ffmpeg binaries.

## Validation

- Domain tests cover the new statuses and transitions, and the `canEncodeVideos` permission for staff and members.
- API tests cover upload, start-encoding, write-link validation (paths outside `<videoId>/`, too many files), and recording results.
- An end-to-end local run: upload a video in the browser, encode it with the CLI as a staff user, and play it in the browser. The API part has been run: an upload through the member API, `encode --all` with the CLI against the local stack, and member playback of the DASH and HLS manifests and segments.

## Pros and Cons of the Options

### Staff encoder CLI through the API

- Good, because no storage credentials are needed on staff machines, and authorization stays in the domain.
- Good, because the same flow serves a future Electron app.
- Bad, because the API needs extra operations (start encoding, issue write links, record results) and the CLI needs a staff sign-in flow.

### Staff encoder with direct Azure identity

- Good, because the tool is simpler: it uses the storage SDK with `DefaultAzureCredential`.
- Bad, because every staff member needs a Storage Blob Data role on the storage account, which grants access far beyond one video.
- Bad, because a desktop app would have to handle Azure sign-in separately from the application's own sign-in.

### Electron app first

- Good, because staff get a visual tool immediately.
- Bad, because it front-loads desktop packaging, ffmpeg bundling, and UI work before the flow is proven.

### Keep automatic cloud encoding (ADR 0035)

- Good, because it is mostly built and needs no staff action.
- Bad, because it contradicts the product decision that users do not trigger encoding.
