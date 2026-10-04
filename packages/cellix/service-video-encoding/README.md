# @cellix/service-video-encoding

Encodes a video stored in Azure Blob Storage into adaptive-bitrate streaming output (H.264/AAC fMP4 segments with DASH and HLS manifests) and stores the result back in Blob Storage, ready to play in `@cellix/ui-video-player` or any DASH or HLS player.

## Requirements

The service shells out to three executables, which must be installed on the host that runs it:

| Tool | Notes |
|---|---|
| `ffmpeg` | Must include the `libx264` and `aac` encoders |
| `ffprobe` | Usually ships with ffmpeg |
| `packager` (shaka-packager) | v3, from <https://github.com/shaka-project/shaka-packager> |

The package is tested with ffmpeg 9.0 and shaka-packager v3.9.3.

Encoding is CPU-heavy, since every rung is a separate H.264 encode, and a long source can take many minutes. Run it on a host without short execution limits, such as a container job, not an Azure Functions consumption plan.

## Usage

```ts
import { ServiceBlobStorage } from '@cellix/service-blob-storage';
import { ServiceVideoEncoding } from '@cellix/service-video-encoding';

const blobStorage = await new ServiceBlobStorage({ accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME }).startUp();

const encoder = await new ServiceVideoEncoding({
	blobStorage,
	ffmpegPath: process.env.FFMPEG_PATH, // optional, defaults to `ffmpeg` on PATH
}).startUp();

const result = await encoder.encode({
	source: { containerName: 'uploads', blobName: 'raw/abc123.mov' },
	destination: { containerName: 'videos', prefix: 'abc123/' },
});

result.manifests.dash; // { containerName: 'videos', blobName: 'abc123/manifest.mpd' }
result.manifests.hls; //  { containerName: 'videos', blobName: 'abc123/master.m3u8' }
```

`startUp()` checks that every executable runs and that ffmpeg has the required encoders, and rejects with a `tool-unavailable` error if not, so a misconfigured host fails at boot rather than on its first job.

### Options

| Option | Default | Description |
|---|---|---|
| `blobStorage` | required | Anything with `downloadToFile` and `uploadFile`, such as a started `ServiceBlobStorage` |
| `ffmpegPath` | `ffmpeg` | ffmpeg executable |
| `ffprobePath` | `ffprobe` | ffprobe executable |
| `packagerPath` | `packager` | shaka-packager executable |
| `workingDirectory` | OS temp dir | Where per-job temporary directories are created. Needs space for the source plus about twice its encoded size. |

## What gets produced

Every video is encoded into this ladder, keeping only rungs no larger than the source (a source is never upscaled):

| Rung | Landscape size | Video bitrate |
|---|---|---|
| 1080p | 1920×1080 | 5000 kbps |
| 720p | 1280×720 | 2800 kbps |
| 480p | 854×480 | 1400 kbps |
| 360p | 640×360 | 800 kbps |

- Rungs are matched on the short side of the displayed frame, so portrait and rotated phone videos get the same quality levels in portrait orientation.
- A source smaller than 360p gets a single rung at its own size.
- Audio is one 128 kbps stereo AAC track shared by all rungs, omitted when the source is silent.
- Embedded text subtitles (SRT, ASS, mov_text, WebVTT) become WebVTT text tracks. Image-based subtitles (PGS, DVD) are skipped.
- Segments are 2 seconds long and keyframes are aligned across rungs, so players can switch quality at any segment.

Output layout under the destination prefix:

```
abc123/
  manifest.mpd          DASH manifest
  master.m3u8           HLS master playlist
  video/<rung>/         init.mp4, 1.m4s, 2.m4s, …, playlist.m3u8
  audio/                init.mp4, 1.m4s, …, playlist.m3u8
  text/<n>/             1.vtt, 2.vtt, …, playlist.m3u8
```

Manifests reference everything with relative URLs, so a single read SAS scoped to the prefix or container is enough for playback. The manifests are uploaded only after every other file succeeds. A failed job can leave segments behind, but never a manifest that points at missing files. Re-encoding to the same prefix overwrites the previous output.

## Progress and cancellation

```ts
const controller = new AbortController();

await encoder.encode(request, {
	signal: controller.signal,
	onProgress: ({ stage, percent }) => console.log(`${stage}: ${percent}%`),
});
```

Stages run in order: `downloading`, `probing`, `encoding`, `packaging`, `uploading`. Each reports `0` when it starts and `100` when it ends. `encoding` and `uploading` also report intermediate percentages. Aborting kills the running tool, cancels blob transfers, and rejects with an `aborted` error. `shutDown()` aborts every running job.

## Errors

Every expected failure rejects with a `VideoEncodingError`. Branch on its `code`:

| Code | Meaning | Retry? |
|---|---|---|
| `tool-unavailable` | ffmpeg, ffprobe, or packager missing or unusable | No, fix the host |
| `source-not-found` | Source blob does not exist | No |
| `unsupported-source` | Not a readable video, no video stream, or unknown duration | No |
| `encode-failed` | ffmpeg failed | Maybe |
| `packaging-failed` | shaka-packager failed | Maybe |
| `storage-failed` | A download or upload failed | Yes |
| `aborted` | Cancelled by signal or `shutDown()` | Depends on why |

The error `message` includes the tail of the tool's error output for diagnosis. `cause` carries the underlying error.

## Using it from a queue

`EncodeVideoRequest` contains only JSON data, so it can be used directly as a queue message payload. A queue-triggered worker typically calls `encode(payload)`, records the result's manifest addresses, and lets `storage-failed` errors propagate so the message is retried, while treating `source-not-found` and `unsupported-source` as permanent.

## Public exports

Import from the package root only:

- `ServiceVideoEncoding`
- `VideoEncodingError`
- `type VideoEncodingErrorCode`
- `type VideoEncoding`
- `type ServiceVideoEncodingOptions`
- `type EncodeVideoRequest`
- `type EncodeVideoOptions`
- `type EncodeVideoResult`
- `type EncodedRendition`
- `type EncodedTextTrack`
- `type VideoEncodingProgress`
- `type VideoEncodingStage`
