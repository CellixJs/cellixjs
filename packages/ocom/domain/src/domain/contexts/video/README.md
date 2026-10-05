# Context: Video

## Domain Structure:
- **Video** (aggregate root): a video in a community's library
  - Community (entity reference)
  - Source: where the original upload is stored, its content type, and size
  - Output: the container and prefix for encoded output, both manifests, duration, and rendition heights
  - Failure: code and message when encoding fails

## Lifecycle
`AWAITING_UPLOAD` → `PROCESSING` → `READY` or `FAILED`

- Created with `getNewInstance` while the client uploads the original directly to blob storage.
- `markUploadCompleted` moves it to `PROCESSING` once the upload is confirmed. Repeating it with the same destination is a no-op.
- `recordEncodingSucceeded` and `recordEncodingFailed` are system-only and record the worker's result. Redelivered results replace the previous one.
- `requestPlayback` returns the manifest locations of a `READY` video.

## Permissions
| Permission | Member | System | Guest / staff |
|---|---|---|---|
| `canManageVideos` (upload, rename, complete upload) | role's `canManageSiteContent` | as granted | no |
| `canViewVideos` (playback) | any member of the video's community | as granted | no |
| `isSystemAccount` (record encoding results) | no | as granted | no |
