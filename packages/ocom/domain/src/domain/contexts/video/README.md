# Context: Video

## Domain Structure:
- **Video** (aggregate root): a video in a community's library
  - Community (entity reference)
  - Source: where the original upload is stored, its content type, and size
  - Output: the container and prefix for encoded output, both manifests, duration, and rendition heights
  - Failure: code and message when encoding fails

## Lifecycle (ADR 0036)
`AWAITING_UPLOAD` → `UPLOADED` → `ENCODING` → `READY` or `FAILED`

- Created with `getNewInstance` while the member's browser uploads the original directly to blob storage.
- `markUploadCompleted` moves it to `UPLOADED`, where it waits for staff. Repeating it is a no-op.
- `startEncoding(destination)` moves it to `ENCODING` and records where the output goes. It is allowed from `UPLOADED`, from `FAILED` (retry, clearing the failure), and from `ENCODING` (another staff member takes over).
- `recordEncodingSucceeded` and `recordEncodingFailed` record the result from the staff encoder tool. Repeating a result replaces it.
- `requestPlayback` returns the manifest locations of a `READY` video.

## Permissions
| Permission | Member | Staff | System | Guest |
|---|---|---|---|---|
| `canManageVideos` (upload, rename, complete upload) | role's `canManageSiteContent` | no | as granted | no |
| `canEncodeVideos` (start encoding, record results) | no | staff role's `techAdminPermissions.canEncodeVideos` | as granted | no |
| `canViewVideos` (playback) | any member of the video's community | when they can encode | as granted | no |
