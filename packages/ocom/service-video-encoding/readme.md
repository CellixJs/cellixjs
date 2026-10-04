# `@ocom/service-video-encoding`

OwnerCommunity adapter for `@cellix/service-video-encoding`.

Application code and apps import video encoding from this package rather than from the framework package directly, matching the other `@ocom/service-*` adapters. It re-exports:

- `ServiceVideoEncoding`: the framework service, registered by the video encoding worker
- `VideoEncodingError` and `VideoEncodingErrorCode`: for classifying failures as permanent or transient
- The request, options, progress, and result types

See `@cellix/service-video-encoding` for behaviour, requirements (ffmpeg with `libx264`, ffprobe, shaka-packager), and the output layout.
