# Cellix TDD Summary

Package: `@cellix/service-video-encoding`

Package path: `packages/cellix/service-video-encoding`

## Package framing

- Greenfield `@cellix/service-video-encoding` package, plus an additive feature in `@cellix/service-blob-storage` that it depends on.
- Purpose: take an uploaded video blob, encode it with ffmpeg into an adaptive-bitrate H.264/AAC ladder, package it with shaka-packager as fMP4 segments with DASH and HLS manifests, and store the output in Blob Storage for `@cellix/ui-video-player`.
- Intended consumers: a future queue-triggered worker behind an upload feature, and application infrastructure that registers the service via `ServiceBase`.
- Non-goals: worker hosting, the queue definition and trigger, upload UI and GraphQL, playback SAS issuance, configurable ladders, posters, and DRM.
- `manifest.md` was created before tests.

## Consumer usage exploration

- **Primary flow.** A worker receives an `encode-video` queue payload, calls `encode(payload)`, and stores `result.manifests.dash` / `.hls` on the video entity so the player can load them with a prefix-scoped SAS.
- **Operational flow.**
  - The host registers the service at boot. `startUp()` fails fast if ffmpeg (with libx264/aac), ffprobe, or packager is missing.
  - `shutDown()` aborts running jobs when the host stops.
- **Shaping cases.**
  - The source can be any ffmpeg-readable container.
  - Portrait or rotated phone video.
  - Sources smaller than the ladder.
  - A silent source.
  - Embedded text subtitles, some untagged and some image-based.
  - A missing source blob.
  - A corrupt file.
  - Transient storage failures.
  - User cancellation.
  - Partial uploads must never leave a playable but broken manifest.
- **Repo findings.**
  - The player is Shaka-based and only had a single-rung VP9 DASH asset.
  - `@cellix/service-blob-storage` had no binary upload or download.
  - No queue trigger exists in `@cellix/api-core`.
  - ffmpeg is not provisioned anywhere in CI or IaC.

## Contract gate summary

Human review was required (new package). The user reviewed the proposal and decided:

- H.264/AAC fMP4 with both DASH and HLS
- ffmpeg plus shaka-packager, not ffmpeg alone
- Extend `@cellix/service-blob-storage` for blob I/O rather than calling the Azure SDK directly
- v1 extras: embedded captions, progress, and cancellation
- No poster, and no custom ladders

The user also asked what a ladder is before deciding.

Proposed and accepted exports:

- `ServiceVideoEncoding`: the lifecycle service and the only implementation.
- `VideoEncoding`: the interface consumers depend on.
- `EncodeVideoRequest`: the serializable job description and future queue payload.
- `EncodeVideoOptions`: the runtime-only signal and progress callback.
- `EncodeVideoResult`, `EncodedRendition`, `EncodedTextTrack`: the outcome a worker persists.
- `VideoEncodingProgress`, `VideoEncodingStage`: progress reporting.
- `ServiceVideoEncodingOptions`: construction.
- `VideoEncodingError`, `VideoEncodingErrorCode`: retry and permanent-failure decisions.

Removed from the surface during review:

- `DEFAULT_RENDITION_LADDER`, because without custom ladders it serves no consumer need. The ladder is documented in the README, and results report the actual renditions.

```ts
const encoder = await new ServiceVideoEncoding({ blobStorage }).startUp();
const result = await encoder.encode({
	source: { containerName: 'uploads', blobName: 'raw/abc123.mov' },
	destination: { containerName: 'videos', prefix: 'abc123/' },
});
```

Additive change to `@cellix/service-blob-storage`:

- `BlobStorage.uploadFile`, `BlobStorage.downloadToFile`, `UploadFileBlobRequest`, `DownloadBlobToFileRequest`.
- Non-breaking for in-repo dependents: the only implementer is `ServiceBlobStorage`, and `@ocom/service-blob-storage` uses `Pick<>`. Out-of-repo implementers of `BlobStorage` would need the two new methods.

## Public contract

- **`ServiceVideoEncoding.startUp()`**
  - Runs `ffmpeg -version`, `ffprobe -version`, `packager --version` and `ffmpeg -encoders`.
  - Resolves to the service, or rejects with `tool-unavailable`, naming the tool or the missing encoder.
- **`shutDown()`**: aborts running jobs and waits for their cleanup. `encode()` afterwards rejects with "not started".
- **`encode(request, options?)`**: downloads, probes, encodes, packages and uploads, then resolves with the manifest addresses, duration, renditions, `hasAudio` and `textTracks`.
  - **Ladder:** 1080/720/480/360 at 5000/2800/1400/800 kbps on the displayed short side, never upscaled. One source-size rung below 360p.
  - **Tracks:** one 128 kbps AAC track when the source has audio. WebVTT tracks for text subtitles, in source order; image subtitles are skipped and missing languages become `und`.
  - **Segments:** 2 s segments with aligned keyframes.
  - **Prefix:** gets a trailing `/` if it lacks one. An empty prefix writes to the container root.
  - **Upload order:** manifests are uploaded last, and only if every other upload succeeded.
  - **Temporary files:** a per-job temporary directory is removed in all outcomes.
  - **Progress:** reported per stage in order, 0 to 100 and monotonic. Listener exceptions are ignored.
  - **Abort:** kills the running tool, cancels blob transfers, and rejects with `aborted`.
- **Failures:**
  - `source-not-found` (404)
  - `storage-failed` (other download or upload errors)
  - `unsupported-source` (ffprobe failure, no video stream, or unknown duration)
  - `encode-failed`
  - `packaging-failed`
- **Internal:** ladder, argument builders, probe parsing, process runner, upload ordering and concurrency, content types.

## Test plan

- Tests were written before implementation against a stub. All 32 contract tests initially failed.
- `tests/index.test.ts` imports only `@cellix/service-video-encoding`. It mocks `node:child_process` with scripted fake ffmpeg, ffprobe and packager processes that write the files a real run produces, and uses an in-memory blob-storage fake.
  - It is grouped as `ServiceVideoEncoding.startUp`, then `ServiceVideoEncoding.encode`, with nested `failures` and `cancellation` groups.
  - **startUp:**
    - success
    - custom paths
    - undefined paths fall back to defaults
    - spawn failure
    - missing libx264
    - a version check that exits non-zero
  - **encode:**
    - full ladder with all uploads and content types
    - manifests uploaded last
    - H.264 arguments, keyframes, AAC and segment duration
    - no upscaling
    - portrait source
    - rotated source
    - tiny source
    - silent source
    - subtitle selection and the `und` handling
    - prefix normalization
    - empty prefix
    - progress order and values
    - listener exceptions ignored
    - temporary directory cleanup on success and failure
    - concurrent jobs isolated
  - **failures:** each error code, including no manifests after a failed segment upload.
  - **cancellation:**
    - pre-aborted signal
    - abort during ffmpeg (process killed)
    - abort during upload (transfer signals aborted)
    - `shutDown` aborting a job
- `tests/service-video-encoding.integration.test.ts` runs the real tools against two generated clips.
  - The cases are a 720p clip with audio and an `eng` SRT subtitle, and a silent portrait clip with an untagged WebVTT subtitle.
  - Checks:
    - which renditions were produced
    - the uploaded layout
    - MPD codecs, sizes and relative URLs
    - HLS master variants and media groups
    - ffprobe can decode the HLS output
  - It caught a real defect: shaka-packager rejects the `und` language. A contract assertion was added first, then the fix.
- Blob storage: four contract tests in `tests/index.test.ts` (upload with options, upload without options, download with abort signal, before-startup rejection) and one Azurite round-trip covering binary content and the 404 rejection.
- Duplicate coverage was avoided. Argument-level assertions appear only where the result object cannot show the behavior: keyframe alignment, bitrates, the skipped image-subtitle stream index, and omitting the `und` language.

## Changes made

- `@cellix/service-blob-storage`: `uploadFile` (`BlockBlobClient.uploadFile`, streamed) and `downloadToFile`, each with optional headers, metadata, tags and abort signal. New request types are exported from the root, with TSDoc.
- New package `packages/cellix/service-video-encoding`:
  - `src/service-video-encoding.ts`: lifecycle, job orchestration, upload ordering and concurrency, error mapping.
  - `src/encoding-plan.ts`: ladder selection, ffmpeg single-pass split/scale arguments, shaka-packager descriptors.
  - `src/probe-source.ts`: ffprobe JSON parsing with rotation, duration, audio and text-subtitle detection.
  - `src/run-process.ts`: spawn wrapper with abort, a bounded stderr tail, and line-streamed stdout.
  - `src/interfaces.ts` and `src/video-encoding-error.ts`: public types.
- Tool path options accept `string | undefined`, because the repo enables `exactOptionalPropertyTypes` and consumers pass environment variables directly.

## Documentation updates

- `manifest.md` was created: purpose, scope, non-goals (hosting, queue, UI), core concepts (serializable request, fixed ladder, aligned segments, manifests last, job isolation), boundaries, and testing strategy.
- `README.md` is written for a standalone consumer: tool requirements and tested versions, usage, options, the ladder table, output layout, progress and cancellation, an error-code table with retry guidance, queue usage, and exports.
- TSDoc covers every public export. The service class and error class have examples, and request, options, result and progress document every property.
- `@cellix/service-blob-storage`: the README gained a file-transfer section and export entries. The manifest scope was updated, and TSDoc was added for the new methods and types.

## Release hardening notes

- **Export surface:** 2 runtime exports (`ServiceVideoEncoding`, `VideoEncodingError`) plus types. No Azure SDK, child-process or tool types leak.
- **Semver:**
  - The new package starts at 1.0.0 (private).
  - The blob-storage change is additive. It is only breaking for external implementers of the `BlobStorage` interface.
- **Blockers before production use:**
  - **Hosting:** a long-running host with ffmpeg (libx264) and shaka-packager v3 installed. Consumption-plan Functions are not suitable.
  - **Queue:** an `encode-video` queue in the application queue package, plus a queue-trigger adapter in `@cellix/api-core` (none exists today).
  - **Playback SAS:** a prefix- or container-scoped read SAS in `@cellix/service-blob-storage`, already a known follow-up of the player.
  - **Storage CORS:** the account's CORS rules must expose `HEAD` and the range headers for playback.
  - **Browser check:** play the output in `@cellix/ui-video-player` in Chrome and Safari. Playwright's bundled Chromium lacks H.264, so automated browser checks need `channel: 'chrome'`.
- **Risks:**
  - `libx264` is GPL, so the operator must accept GPL ffmpeg builds in production.
  - Encode time is unmeasured for long sources.
  - A failed job leaves orphan segments under the prefix (no manifest), which the caller should clean up or overwrite.
- **Pre-existing, unrelated:** the blob-storage Azurite integration test expects `node_modules/.bin/azurite-blob` at the repo root. Since the pnpm upgrade it exists only under `apps/api`.

## Validation performed

I ran the following commands after the final code change:

- `@cellix/service-blob-storage`:
  - `pnpm run build`: passed (lint and tsgo).
  - `pnpm run test`: passed. Both new and existing tests pass, and type checks are clean.
  - `pnpm exec vitest run tests/service-blob-storage.integration.test.ts`: passed, including the new file round-trip. It needed a temporary symlink to the Azurite binary because of the pre-existing issue above; the symlink was removed afterwards.
- `@cellix/service-video-encoding`:
  - `pnpm run build`: passed.
  - `pnpm run test`: passed.
  - `pnpm run test:coverage`: 97.96% statements, 90.17% branches, 100% functions.
  - `pnpm run test:integration`: 2/2 passed with ffmpeg 9.0.1 and shaka-packager v3.9.3.
  - `pnpm exec biome lint`: clean.
- Wider:
  - `turbo run build --filter='...@cellix/service-blob-storage'`: 35/35 succeeded.
  - `@ocom/service-blob-storage` tests: passed.
  - `pnpm run knip`: no issues.
  - `@cellix/archunit-tests` `test:arch`: 10/10 passed, including the `service-*` naming rule.
  - biome format check: clean.
- Not covered:
  - Playback in a real browser.
  - Encode performance on long or high-resolution sources.
  - Sources with multiple audio tracks (only the first is used) and variable frame rate.
  - Running the integration suite in CI, which has no tools.
