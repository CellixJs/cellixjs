# Cellix TDD Summary

Package: `@cellix/ui-video-player`

Package path: `packages/cellix/ui-video-player`

Summary path: `packages/cellix/ui-video-player/cellix-tdd-summary.md`

## Package framing

`@cellix/ui-video-player` is a greenfield framework UI package. It provides one React component, `VideoPlayer`, that wraps Shaka Player so Cellix frontends can stream DASH/HLS or progressive video directly from Azure Blob Storage with a read-only SAS token. Intended consumers are `@ocom/ui-*` packages and Cellix frontend apps. Issuing SAS tokens, GraphQL playback queries, and authorization are non-goals and belong to a follow-up (`@cellix/service-blob-storage` plus application packages).

## Consumer usage exploration

Primary flow: an application fetches `{ url, sasToken }` from its API and renders the player.

```tsx
import { VideoPlayer } from '@cellix/ui-video-player';

<VideoPlayer src={playback.url} sasToken={playback.sasToken} title="Introduction" onError={(error) => report(error.category)} />;
```

Secondary flow: custom controls drive playback through the handle passed to `onReady` with `controls={false}`.

Failure and edge cases that shaped the contract:

- unsupported browsers (no Media Source Extensions) must render a message, not crash
- expired SAS tokens or missing CORS show up as network failures; consumers need a stable category to decide whether to refresh the token
- the SAS token must not leak to third-party origins referenced from a manifest
- React StrictMode double-mounting and fast `src` changes must not report spurious "load interrupted" errors or leak players
- Shaka is large, so it must be lazy-loaded rather than added to every page bundle

## Contract gate summary

The package is new, so the contract required human review. The user approved the package name, scope (Phases 1-2), and the draft API in the planning step before implementation.

Proposed public exports:

- `VideoPlayer`: React component that loads and plays a source with Shaka Player.
- `VideoPlayerProps`: props contract for the component.
- `VideoPlayerHandle`: imperative play/pause/seek handle passed to `onReady`.
- `VideoPlayerError`: error class passed to `onError`, carrying `category` and Shaka `code`.
- `VideoPlayerErrorCategory`: union of stable failure categories.

Added in a follow-up iteration (captions): `VideoPlayerTextTrack` (separately loaded caption or subtitle file), `VideoPlayerCaptions` (initial caption state), the `captions` error category, and `VideoPlayerError.fatal`. These are additive and the package has no dependents yet.

Removed from the draft: `useVideoPlayer` hook. There is no current consumer that needs to own the `<video>` element, so it is not public until one exists.

## Public contract

- `VideoPlayer` renders a container with a `<video>` element, attaches a Shaka player, and loads `src`. `onReady(handle)` fires once loaded.
- `controls` (default `true`) mounts the Shaka UI overlay; `false` renders a bare video element.
- `onReady` fires only after the video has metadata and caption files have been added, so seeking from `onReady` is reliable.
- Captions: manifest text tracks are available automatically; `textTracks` adds files after load (failures are non-fatal `captions` errors); `captions` selects a track by language (regional variants match) or hides captions, and changes apply without reloading.
- `VideoPlayerError.fatal` is `true` when playback stopped (inline alert shown) and `false` for recoverable errors (callback only).
- `sasToken` is appended to every request on the same origin as `src`; cross-origin URLs and URLs that already have `sig` are unchanged.
- Failures render `role="alert"` and call `onError` with a `VideoPlayerError` whose `category` is one of `unsupported-browser`, `network`, `manifest`, `media`, `drm`, `unknown`.
- The player is destroyed on unmount and recreated when `src`, `sasToken`, or `controls` change; interrupted loads are not reported.
- Internal only: the Shaka loader, the structural Shaka types, the SAS appender, and error mapping helpers. No Shaka types appear in `dist/**/*.d.ts`.

## Test plan

All contract tests import from `@cellix/ui-video-player` (the root entrypoint) and live in `tests/video-player.test.tsx`, grouped under `describe('VideoPlayer')`:

- `loading`: `onReady` waits for `loadedmetadata`; attach plus load of `src`, `onReady` handle play/pause/seek/element, forwarding of poster/autoPlay/muted/loop
- `controls`: overlay mounted by default around the video; no overlay when `controls={false}`
- `sasToken`: token appended to same-origin requests (existing query preserved, encoded signature intact); not sent cross-origin or over an existing `sig`; no filter without a token
- `textTracks`: files added after load with mapped kind/label/MIME type; a failing file is reported as non-fatal and other files still load
- `captions`: no selection when unconfigured; language match including regional variants; first track without a language; nothing for an unmatched language; hide when disabled; changes applied without reload; selecting a separately loaded file
- `errors`: recoverable runtime errors call `onError` without the alert; unsupported browser; load failures mapped per Shaka category (table-driven); runtime `error` events; non-Shaka failures mapped to `unknown`
- `lifecycle`: destroy on unmount (player and overlay paths), replacement on `src` change, interrupted loads ignored

`describe('VideoPlayerError')` covers the exported error class directly: `name`, `message`, `category`, `code`, and `cause`, including `code` being undefined for failures that did not come from Shaka.

Shaka is mocked in jsdom because jsdom has no Media Source Extensions. The Storybook stories (`Default`, `WithoutControls`, `Captions`, `SidecarCaptions`, `PlaybackError`) run in real Chromium against the committed DASH asset. They are not duplicates: they are the only proof that the real Shaka build plays the content, mounts its controls, renders caption cues, keeps a seek made from `onReady`, and classifies a real 404 as `network`.

## Changes made

- New package `packages/cellix/ui-video-player` (package.json, tsconfig, vitest, Storybook config, turbo tag)
- `VideoPlayer` component, `VideoPlayerError`, lazy Shaka loader with retry after a failed chunk load, same-origin SAS appender
- Placeholder asset: first 10s of Big Buck Bunny (CC BY 3.0) as VP9/Opus static DASH with the source's English WebVTT captions (~880 KB), a hand-written Spanish `sidecar/es.vtt`, and `scripts/generate-placeholder.sh` (constant bitrate to keep the assets small)
- Captions: `textTracks` and `captions` props, `captions` error category, `fatal` flag; `onReady` now waits for `loadedmetadata` because Shaka's start-time handler otherwise overwrote seeks made in `onReady` while the Shaka UI was shown (found while testing captions)
- `scripts/seed-azurite.ts`: uploads the asset to Azurite, merges a read-only CORS rule, prints the manifest URL and a container read SAS
- Storybook `main.ts` injects the Azurite manifest URL and a fresh SAS for the `LocalAzurite` story
- `knip.json` workspace entry for the package

## Documentation updates

- `manifest.md` created with purpose, scope, non-goals, boundaries, and testing strategy
- `README.md` written for standalone consumers: install, usage, props table, custom controls, error categories, Azure Blob SAS/CORS/content-type requirements, bundler notes, and local development commands
- TSDoc on `VideoPlayer` (remarks plus example), every prop, `VideoPlayerHandle`, `VideoPlayerError`, and `VideoPlayerErrorCategory`

## Release hardening notes

- Export surface is root-only and limited to five members; Shaka types do not leak into declarations.
- New package, so there is no semver impact and no downstream dependents yet.
- `shaka-player` is a runtime dependency, loaded via dynamic import.
- Publish readiness: the package is `private` and not ready for npm publication until the contract is reviewed by a human.
- Remaining risk: playback is only verified in Chromium; Safari's VP9/WebM DASH support is limited, so production content should also be packaged as H.264/AAC fMP4 or HLS.
- Follow-up work before production use: a prefix/container-scoped read SAS in `@cellix/service-blob-storage` (ADR 0032 update), an application playback query, storage-account CORS in Bicep, and SAS refresh for long videos.

## Validation performed

- `pnpm --filter @cellix/ui-video-player build` (biome lint plus `tsgo --build`): passed
- `pnpm --filter @cellix/ui-video-player test`: 69 tests passed (jsdom contract suite plus 5 Storybook stories in Playwright Chromium), no type errors
- End-to-end against local Azurite: `seed:azurite` uploaded 15 files; requests without the SAS got 403 and requests with it got 200 plus CORS headers. The `LocalAzurite` story was temporarily enabled as a browser test and passed (Shaka loaded the manifest and segments from Azurite with the SAS), then reverted to `!test`.
- Captions over Azurite: re-seeded (20 files including `.vtt` as `text/vtt`), then temporarily enabled `LocalAzurite` with the Spanish sidecar file and a seek to 5.6s; the cue rendered with no errors, then the story was reverted to `!test`
- `pnpm exec knip`: no issues
- `pnpm run test:arch`: all tasks passed except `@ocom/ui-community-route-root`, which timed out under parallel load and passed when rerun alone
- Not verified: Safari/Firefox playback and HLS sources; no HLS asset is committed.
