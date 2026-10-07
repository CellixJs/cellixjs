# Context: Video

## Domain Structure:
- **Video** (aggregate root): a video in a community's library
  - Community (entity reference)
  - Source: where the original upload is stored, its content type, and size
  - Output: the container and prefix for encoded output, both manifests, duration, and rendition heights
  - Failure: code and message when encoding fails
- **VideoViewing** (aggregate root): how much of a video one member has watched (ADR 0037)
  - Community, video, and member ids
  - The video's duration, split into 5-second buckets, and the runs of buckets played
  - Playback credit, so reports cannot count video faster than twice real time
  - When 98% of the buckets had been played

## Lifecycle (ADR 0036)
`AWAITING_UPLOAD` → `UPLOADED` → `ENCODING` → `READY` or `FAILED`

- Created with `getNewInstance` while the member's browser uploads the original directly to blob storage.
- `markUploadCompleted` moves it to `UPLOADED`, where it waits for staff. Repeating it is a no-op.
- `startEncoding(destination)` moves it to `ENCODING` and records where the output goes. It is allowed from `UPLOADED`, from `FAILED` (retry, clearing the failure), and from `ENCODING` (another staff member takes over).
- `recordEncodingSucceeded` and `recordEncodingFailed` record the result from the staff encoder tool. Repeating a result replaces it.
- `requestPlayback` returns the manifest locations of a `READY` video.

## Watch completion (ADR 0037)
- `VideoViewing.getNewInstance(video, memberId, now)` starts the caller's own viewing of a ready video.
- `recordProgress(ranges, now)` counts each bucket at least half covered by the played ranges. Buckets already counted are ignored, so players can resend everything they have played. Credit builds at 2 seconds per second of real time, up to 120 seconds; when it runs out, the rest of the report is not counted.
- `completedAt` is set once 98% of the buckets are played, and never cleared.

## Permissions
| Permission | Member | Staff | System | Guest |
|---|---|---|---|---|
| `canManageVideos` (upload, rename, complete upload) | role's `canManageSiteContent` | no | as granted | no |
| `canEncodeVideos` (start encoding, record results) | no | staff role's `techAdminPermissions.canEncodeVideos` | as granted | no |
| `canViewVideos` (playback) | any member of the video's community | when they can encode | as granted | no |
| `isOwnVideoViewing` (record and see a viewing) | when the viewing is theirs | no | as granted | no |

Members who can manage videos can also see every viewing in their community.
