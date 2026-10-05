# @ocom/video-encoder-client

Encodes uploaded OwnerCommunity videos on a staff member's machine (ADR 0036). Shared by the `video-encoder` CLI and, later, a desktop app.

- `signInWithBrowser` signs a staff member in with authorization code + PKCE through a loopback redirect (RFC 8252).
- `createEncoderApiClient` calls the staff video encoding operations of the GraphQL API.
- `encodeVideo` starts encoding through the API, encodes locally with `@ocom/service-video-encoding`, uploads each output file through a write link issued by the API, and records the result. No storage credentials are needed on the machine.

Aborts and missing tools are not recorded, so the video stays `ENCODING` and can be encoded again.
