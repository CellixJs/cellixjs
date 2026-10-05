# @apps/video-encoder

Command-line tool staff use to encode uploaded community videos on their own machine ([ADR 0036](../docs/docs/decisions/0036-manual-video-encoding-by-staff.md)). It signs in as a staff user, asks the API for videos waiting to be encoded, encodes each one locally with ffmpeg and shaka-packager into adaptive-bitrate DASH and HLS, and uploads the output through write links the API issues per file. No storage credentials are needed on the machine.

Encoding requires the **Can Encode Videos** permission on your staff role (on by default for Tech Admin).

## Requirements

- Node.js 22 or later
- ffmpeg with the `libx264` and `aac` encoders, and ffprobe
- [shaka-packager](https://github.com/shaka-project/shaka-packager) v3, installed as `packager`

The tools are checked before a video is marked as encoding, so a machine without them never leaves a video stuck.

## Commands

```text
video-encoder login              Sign in through your browser
video-encoder logout             Forget the saved sign-in
video-encoder list               List uploaded videos waiting to be encoded
video-encoder encode <id>...     Encode the given videos
video-encoder encode --all       Encode every video waiting to be encoded
```

Any command that calls the API signs you in first if needed. The sign-in is saved and refreshed automatically, so a long encode does not need you to sign in again.

`encode --all` skips videos another staff member is already encoding. Press Ctrl+C to stop: the current encode is abandoned and the video can be encoded again later. A video that cannot be encoded (for example, a file with no video stream) is marked failed with the reason, which `list` shows.

## Running locally

Start the local stack with `pnpm run dev`, then from the repository root:

```bash
pnpm run dev:video-encoder login
pnpm run dev:video-encoder list
pnpm run dev:video-encoder encode --all
```

This points the encoder at this worktree's API and mock staff sign-in. Sign in as `tech.admin@ownercommunity.onmicrosoft.com` with password `password`.

## Configuration

`pnpm run build` produces a single file, `deploy/dist/index.mjs`, that runs with `node` anywhere. It is configured with environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `OCOM_ENCODER_ISSUER` | required | Staff OIDC issuer, for example `https://login.microsoftonline.com/<tenant-id>/v2.0` |
| `OCOM_ENCODER_CLIENT_ID` | required | The staff portal's app registration client ID |
| `OCOM_ENCODER_SCOPE` | `openid profile offline_access` | Add the API scope the staff portal requests |
| `OCOM_ENCODER_API_URL` | required | GraphQL endpoint |
| `OCOM_ENCODER_SESSION_FILE` | `~/.ocom-video-encoder/session.json` | Saved sign-in, readable only by you |
| `FFMPEG_PATH`, `FFPROBE_PATH`, `PACKAGER_PATH` | on `PATH` | Encoder executables |
| `ENCODING_WORKING_DIRECTORY` | OS temp dir | Scratch space while encoding |

Sign-in uses the staff portal's app registration with a loopback redirect, which requires a **Mobile and desktop applications** platform with redirect URI `http://localhost` on that registration.
