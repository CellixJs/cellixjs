# @cellix/ui-video-player Manifest

## Purpose

`@cellix/ui-video-player` provides a reusable React video player for Cellix applications. It wraps Shaka Player so applications can stream adaptive (DASH/HLS) or progressive video directly from Azure Blob Storage using short-lived read SAS tokens, without each application re-solving player lifecycle, token handling, and error reporting.

## Scope

- A single `VideoPlayer` React component backed by Shaka Player and its UI controls
- Appending a caller-supplied SAS token to same-origin manifest, segment, media, and caption requests
- Closed captions and subtitles: manifest text tracks, separately loaded caption files, and initial caption state
- An optional seek limit that keeps viewers from seeking past the furthest point they have played
- Normalizing Shaka failures into a small, stable `VideoPlayerError` contract
- Lazy-loading Shaka so it only affects bundles of pages that render video
- Local development assets and scripts: a placeholder DASH clip, an Azurite seeding script, and Storybook stories

## Non-goals

- Issuing SAS tokens or knowing about storage accounts, containers, or blob naming (server/application concern)
- GraphQL operations, authorization, or any application-specific playback workflow
- Tracking or saving what a viewer has watched, or enforcing it (the application reads `played` from the handle's element and checks progress on its server)
- Custom control skins, caption styling, playlists, analytics, DRM license configuration, or offline storage
- Exposing Shaka Player types or the raw `shaka.Player` instance

## Public API shape

- The supported public API is the package root import: `@cellix/ui-video-player`
- Exports: `VideoPlayer`, `VideoPlayerProps`, `VideoPlayerHandle`, `VideoPlayerTextTrack`, `VideoPlayerCaptions`, `VideoPlayerSeekLimit`, `VideoPlayerSeekBlocked`, `VideoPlayerError`, `VideoPlayerErrorCategory`
- Shaka types are deliberately absent from the declaration output; internals use a structural view of the Shaka module (`shaka-loader.ts`)
- No subpath exports

## Core concepts

- One Shaka player per mounted component; it is destroyed on unmount and recreated when `src`, `sasToken`, `controls`, or `textTracks` change (`textTracks` is compared by value)
- `onReady` waits for `loadedmetadata`: Shaka applies its start position from that event, which can fire after `load()` resolves, and would otherwise overwrite a seek made in `onReady`
- Caption files are added after load; a failure is a non-fatal `captions` error. `captions` is applied at load and again whenever it changes, without reloading
- `VideoPlayerError.fatal` separates errors that stop playback (inline alert) from recoverable ones (callback only)
- Callbacks are read through refs so changing `onReady`/`onError` identity never reloads the video
- SAS tokens are only appended to URLs on the same origin as `src`, and never override an existing `sig` parameter, to avoid leaking tokens to third-party hosts
- Loads cancelled by unmounting or a source change (Shaka codes 7000/7003) are not reported as errors
- The seek limit listens to the video element, not Shaka: every way of seeking sets `currentTime` and fires `seeking`, which is refused past the limit (plus 1 second, so Shaka's small gap jumps at the limit are not refused). The limit moves forward on `timeupdate` only when the playhead advanced without a seek since the previous `timeupdate` from a position within the limit, so seeks never move it. It is kept per `src`, so a lower `allowedUntil` never lowers it, and it is a guide rather than an enforcement mechanism
- `controls` defaults to the Shaka UI overlay; when `false`, consumers drive playback with `VideoPlayerHandle`

## Package boundaries

- `src/` is the published component; `assets/`, `scripts/`, and `.storybook/` are development-only and excluded from `files`
- `scripts/azurite-placeholder.ts` uses Azurite's publicly documented development key; it must never be used against real storage
- Production SAS issuance belongs to `@cellix/service-blob-storage` and application packages, not here

## Dependencies / relationships

- Runtime dependency: `shaka-player` (UI build `dist/shaka-player.ui.js` and `dist/controls.css`, imported dynamically)
- Peer dependencies: `react`, `react-dom`
- Dev-only: `@azure/storage-blob` and `@cellix/local-dev` for Azurite seeding and Storybook SAS generation
- Intended consumers: `@ocom/ui-*` packages and Cellix frontend apps

## Testing strategy

- `tests/video-player.test.tsx` covers the public contract through the root import in jsdom with Shaka mocked: loading, handle, controls, SAS filtering, captions, seek limit, error mapping, and lifecycle
- Storybook stories run as real-browser tests (Playwright Chromium) against the committed DASH placeholder, proving Shaka actually plays the content and reports network failures
- The `LocalAzurite` story is excluded from automated runs because it needs a running, seeded Azurite

## Documentation obligations

- Keep `README.md` consumer-facing: install, usage, SAS and CORS requirements, error handling
- Keep TSDoc on `VideoPlayer`, its props, `VideoPlayerHandle`, and `VideoPlayerError` aligned with behavior
- Update this manifest, the README, and TSDoc together when props or error categories change

## Release-readiness standards

- `exports` exposes only the root entrypoint and the declaration output contains no Shaka types
- Contract tests and browser stories pass
- Shaka remains behind a dynamic import
- Follow-up before production use: a prefix/container-scoped read SAS in `@cellix/service-blob-storage` and an application-level playback query (tracked separately)
