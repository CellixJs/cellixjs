# @cellix/service-video-encoding Manifest

## Purpose

`@cellix/service-video-encoding` turns an uploaded video blob into adaptive-bitrate streaming output, stored back in Azure Blob Storage, that `@cellix/ui-video-player` can play on any network. It is the server-side half of the video feature: the player consumes what this package produces.

## Scope

- Downloading a source video blob, probing it with ffprobe, and encoding it with ffmpeg into a fixed H.264/AAC rendition ladder
- Packaging the renditions with shaka-packager into fMP4 (CMAF) segments with both a DASH manifest and an HLS master playlist
- Extracting embedded text subtitles into WebVTT text tracks referenced by both manifests
- Uploading the output under a destination prefix, with manifests written last
- Progress reporting, cancellation, and typed failure codes that a queue-triggered worker can act on
- Verifying at startup that the required executables and encoders are present

## Non-goals

- Choosing where encoding runs. Azure Functions consumption plans cannot run multi-minute ffmpeg jobs and do not ship ffmpeg. The host (a staff member's machine, a desktop app, a container job, etc.) belongs to the application. OwnerCommunity encodes on staff machines (ADR 0036).
- Queue registration or the queue trigger. `EncodeVideoRequest` is shaped to be a queue payload, but defining the `encode-video` queue belongs in an application `service-queue-storage` package, and the trigger adapter belongs in `@cellix/api-core`.
- Upload UI, GraphQL, authorization, or tracking encode status on a domain entity
- Issuing read SAS tokens for playback (owned by `@cellix/service-blob-storage`)
- Configurable or per-call ladders, codecs other than H.264/AAC, DRM, thumbnails, or posters
- Bundling ffmpeg or shaka-packager binaries

## Public API shape

- Package root import only: `@cellix/service-video-encoding`
- One service class, `ServiceVideoEncoding`, implementing `ServiceBase<VideoEncoding>`
- One error class, `VideoEncodingError`, plus its `VideoEncodingErrorCode` union
- Plain data types for the request, options, progress, and result
- No exports for the ladder, ffmpeg/packager argument builders, probe parsing, or process handling

## Core concepts

- **Serializable request, runtime options.** `EncodeVideoRequest` holds only JSON data so it can travel in a queue message unchanged. The abort signal and progress callback sit in the separate `EncodeVideoOptions` argument.
- **Fixed ladder.** 1080p/720p/480p/360p at 5000/2800/1400/800 kbps, anchored on the short side of the displayed frame (so portrait and rotated sources work), never upscaled. A source below 360p gets one rung at its own size. Audio is one 128 kbps stereo AAC track shared by all rungs.
- **Aligned segments.** Every rung forces a keyframe every 2 seconds and shaka-packager cuts 2-second segments, so players can switch rungs at any segment boundary.
- **Single ffmpeg pass.** The source is decoded once and split into every rung, the audio track, and the text tracks in one ffmpeg process. Progress comes from ffmpeg's `-progress` output.
- **Manifests last.** Segments and media playlists upload first. `manifest.mpd` and `master.m3u8` upload only after every other file succeeds, so a failed job never leaves a manifest pointing at missing segments.
- **Job isolation.** Each job works in its own temporary directory, removed in all outcomes. Concurrent jobs are independent. `shutDown()` aborts running jobs and waits for their cleanup.
- **Error codes over messages.** Expected failures are `VideoEncodingError` with a stable `code`. Messages include the tail of the tool's stderr for diagnosis but are not part of the contract.

## Package boundaries

- Internal: ladder selection, ffmpeg and packager argument construction, ffprobe parsing, child-process handling, upload ordering and concurrency, content-type mapping
- The output layout (`manifest.mpd`, `master.m3u8`, `video/<rung>/`, `audio/`, `text/<n>/`) is observable in storage but is not a documented contract beyond the two manifest addresses returned in the result
- Blob access goes through the narrow `Pick<BlobStorage, 'downloadToFile' | 'uploadFile'>` port, never through the Azure SDK directly

## Dependencies / relationships

- `@cellix/api-services-spec` for the `ServiceBase` lifecycle
- `@cellix/service-blob-storage` for the `BlobAddress` and `BlobStorage` types (type-only use; the running instance is injected)
- Runtime executables: ffmpeg with `libx264` and `aac`, ffprobe, and shaka-packager v3
- Produces output for `@cellix/ui-video-player`

## Testing strategy

- `tests/index.test.ts` is the contract suite and imports only the package root. It replaces `node:child_process` with scripted fake ffmpeg, ffprobe, and packager processes that write the files a real run would, and uses an in-memory blob-storage fake. It needs no external tools and runs in CI.
- `tests/service-video-encoding.integration.test.ts` runs the real executables against generated clips (landscape with audio and subtitles; silent portrait with an untagged subtitle) and checks the manifests and that ffprobe can read the HLS output. It requires the tools locally and runs through `pnpm run test:integration` only.
- Tests are grouped by `ServiceVideoEncoding.startUp` and `ServiceVideoEncoding.encode`, with nested `failures` and `cancellation` groups.

## Documentation obligations

- `README.md` covers installation requirements (executables), usage, the ladder, output layout, progress, cancellation, and error codes
- TSDoc on every public export, with examples on the service class and error class
- Update this manifest when the ladder, output format, or boundary changes

## Release-readiness standards

- Contract and integration suites pass, and the package builds and lints cleanly
- No Azure SDK, child-process, or tool-specific types leak into the public surface
- A hosting decision and a provisioned ffmpeg/shaka-packager runtime exist before production use
- Output has been verified to play in `@cellix/ui-video-player` in Chrome and Safari
