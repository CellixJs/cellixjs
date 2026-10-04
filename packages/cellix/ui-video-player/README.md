# @cellix/ui-video-player

A React video player built on [Shaka Player](https://github.com/shaka-project/shaka-player). It streams DASH, HLS, or progressive video directly from Azure Blob Storage (or any HTTP origin) and adds a read-only SAS token to every request for you.

- Adaptive streaming (DASH `.mpd`, HLS `.m3u8`) and progressive files (`.mp4`, `.webm`)
- Optional Shaka control bar, or a bare `<video>` you control yourself
- Closed captions and subtitles from the manifest or from separate `.vtt`/`.srt`/`.ttml` files
- SAS tokens are only sent to the same origin as the source
- Errors are reported as a typed `VideoPlayerError` with a stable `category`
- Shaka and its styles are lazy-loaded, so they only add to bundles of pages that show video

## Install

```sh
npm install @cellix/ui-video-player react react-dom
```

## Usage

```tsx
import { VideoPlayer } from '@cellix/ui-video-player';

export function Intro({ sasToken }: { sasToken: string }) {
	return (
		<VideoPlayer
			src="https://myaccount.blob.core.windows.net/videos/intro/manifest.mpd"
			sasToken={sasToken}
			poster="https://myaccount.blob.core.windows.net/videos/intro/poster.jpg"
			title="Introduction"
			onError={(error) => console.warn(error.category, error.code)}
		/>
	);
}
```

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `src` | `string` | required | Manifest or media URL. Changing it loads the new source. |
| `sasToken` | `string` | none | Query string (with or without `?`) added to same-origin requests. Changing it reloads. |
| `textTracks` | `VideoPlayerTextTrack[]` | none | Extra caption or subtitle files. Changing the list reloads. |
| `captions` | `{ enabled: boolean; language?: string }` | none | Initial caption state. Changes apply without reloading. |
| `poster` | `string` | none | Image shown before playback. |
| `title` | `string` | none | Accessible name of the `<video>` element. |
| `autoPlay` / `muted` / `loop` | `boolean` | `false` | Browsers generally only autoplay when `muted`. |
| `controls` | `boolean` | `true` | `false` renders a bare `<video>`; use the handle from `onReady`. |
| `className` / `style` | | none | Applied to the outer container. |
| `onReady` | `(handle: VideoPlayerHandle) => void` | none | Called once the source, its metadata, and caption files have loaded. Safe to seek here. |
| `onError` | `(error: VideoPlayerError) => void` | none | Called on load, playback, or caption failures. |

### Custom controls

```tsx
const [player, setPlayer] = useState<VideoPlayerHandle>();

<VideoPlayer src={src} controls={false} onReady={setPlayer} />
<button onClick={() => player?.play()}>Play</button>
<button onClick={() => player?.seek(0)}>Restart</button>
```

### Captions

Captions come from two places, and viewers can switch them on, off, or between languages from the **⋮ > Captions** menu in the control bar:

- **In the manifest.** Text tracks in a DASH or HLS manifest, and CEA-608/708 captions embedded in the video, are picked up automatically.
- **Separate files.** Pass `textTracks` for `.vtt`, `.srt`, or `.ttml` files, for example stored next to the video in blob storage. `sasToken` is added to them too when they are on the same origin as `src`. Use absolute URLs.

Captions start off unless you pass `captions`:

```tsx
<VideoPlayer
	src={manifestUrl}
	sasToken={sasToken}
	textTracks={[{ src: `${folderUrl}/captions.es.vtt`, language: 'es', label: 'Español' }]}
	captions={{ enabled: true, language: 'en' }}
/>
```

- `language` matches regional variants, so `en` selects an `en-US` track. Without a `language`, the first track is shown. If no track matches, captions stay off.
- `kind` is `captions` by default (speech and sounds, for viewers who cannot hear the audio); use `subtitles` for translation-only tracks.
- A caption file that fails to load is reported through `onError` with category `captions` and `fatal: false`. The video keeps playing.

For prerecorded video with audio, WCAG 2.1 AA (success criterion 1.2.2) requires captions.

### Errors

`onError` receives a `VideoPlayerError`. When `error.fatal` is `true`, playback has stopped and the player also shows an inline `role="alert"` message. When it is `false` (a failed caption file, a retried request), playback continues.

| `category` | Meaning |
|---|---|
| `unsupported-browser` | The browser lacks Media Source Extensions or other required features. |
| `network` | A manifest or segment request failed, for example because the SAS token expired or CORS is not configured. |
| `manifest` | The manifest could not be parsed. |
| `media` | The browser could not decode or buffer the media. |
| `drm` | Content protection failed. |
| `captions` | A caption or subtitle track could not be loaded or parsed. |
| `unknown` | Anything else. |

`error.code` contains the Shaka Player error code when one is available. Loads cancelled by unmounting or changing `src` are not reported.

## Azure Blob Storage requirements

- **SAS scope.** A DASH or HLS stream is a manifest plus many segment files, so the token must cover all of them. A container-scoped or directory-scoped read-only SAS works; a SAS for a single blob only works for progressive files.
- **CORS.** The storage account must allow `GET`, `HEAD`, and `OPTIONS` from your app origin and expose `Content-Length`, `Content-Range`, and `Accept-Ranges`.
- **Content types.** Upload manifests as `application/dash+xml` or `application/vnd.apple.mpegurl`, segments with their media type (`video/mp4`, `video/webm`, and so on), and caption files as `text/vtt`.
- **Expiry.** Tokens are fixed when playback starts. Issue tokens that outlive the video, or remount with a fresh `sasToken` when a `network` error occurs.

## Bundler notes

Shaka Player and `shaka-player/dist/controls.css` are imported dynamically. Any bundler that handles CSS imports (Vite, webpack, and similar) works without extra setup.

## Development assets

The package source includes development-only assets that are not published:

- `pnpm run storybook` serves stories on port 6008, including a placeholder clip from `assets/placeholder` (Big Buck Bunny, CC BY 3.0) with English captions in the manifest and a separate Spanish caption file.
- `pnpm run seed:azurite` uploads that clip to a running Azurite emulator (container `videos`, prefix `placeholder/`), adds a read-only CORS rule, and prints the manifest URL and a 24 hour read SAS. The `LocalAzurite` story then streams from Azurite.
- `pnpm run generate:placeholder -- <source.mp4>` rebuilds the placeholder (requires `ffmpeg` and `shaka-packager`).
